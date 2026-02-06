import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MissionService } from '../../_services/mission-service'
import { Mission } from '../../_models/mission'
import { CommonModule, Location } from '@angular/common'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-mission-specific-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mission-specific-manager.html',
  styleUrl: './mission-specific-manager.scss',
})
export class MissionSpecificManager implements OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _missionService = inject(MissionService)
  private _location = inject(Location)
  private _cdr = inject(ChangeDetectorRef)
  private _loadingTimer: any = null

  missionId: number = 0
  mission: Mission | undefined
  crew: any[] = []
  isLoading = false
  error: string | null = null
  
  // Edit form
  isEditing = false
  editName = ''
  editDescription = ''

  async ngOnInit() {
    this.missionId = Number(this._route.snapshot.paramMap.get('id'))
    if (this.missionId) {
      await this.loadData()
    }
  }

  async loadData() {
    this.isLoading = true
    this.error = null
    this._cdr.detectChanges()

    this._loadingTimer = setTimeout(() => {
      if (this.isLoading) {
        console.warn('Loading timeout triggered')
        this.error = 'การเชื่อมต่อช้าผิดปกติ โปรดลองใหม่อีกครั้ง'
        this.isLoading = false
        this._cdr.detectChanges()
      }
    }, 7000)

    try {
      const [mission, crew] = await Promise.all([
        this._missionService.getMission(this.missionId),
        this._missionService.getCrew(this.missionId)
      ])
      
      this.mission = mission
      this.crew = crew
      
      this.editName = this.mission.name
      this.editDescription = this.mission.description || ''
    } catch (e: any) {
      console.error('Load data error:', e)
      this.error = e?.message || 'Failed to load mission data'
    } finally {
      if (this._loadingTimer) {
        clearTimeout(this._loadingTimer)
        this._loadingTimer = null
      }
      this.isLoading = false
      this._cdr.detectChanges()
    }
  }

  goBack() {
    this._location.back()
  }

  async startMission() {
    if (!confirm('Start mission?')) return
    try {
      await this._missionService.startMission(this.missionId)
      await this.loadData()
    } catch (e: any) {
      alert(e?.error?.message || 'Failed')
    }
  }
  
  async completeMission() {
      if (!confirm('Complete mission?')) return
      try {
        await this._missionService.completeMission(this.missionId)
        await this.loadData()
      } catch (e: any) {
        alert(e?.error?.message || 'Failed')
      }
  }

  async deleteMission() {
    if (!confirm('Delete this mission?')) return
    try {
      await this._missionService.delete(this.missionId)
      this._router.navigate(['/chief'])
    } catch (e: any) {
      alert(e?.error?.message || 'Failed')
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing
    if (!this.isEditing && this.mission) {
        // Reset
        this.editName = this.mission.name
        this.editDescription = this.mission.description || ''
    }
  }

  async saveEdit() {
    if (!this.mission) return
    const payload = {
      name: this.editName.trim(),
      description: this.editDescription.trim() || undefined
    }
    try {
      await this._missionService.edit(this.missionId, payload)
      this.isEditing = false
      await this.loadData()
    } catch (e: any) {
      alert(e?.error?.message || 'Failed to save')
    }
  }

  async kick(memberId: number) {
    if (!confirm('Kick this member?')) return
    try {
      await this._missionService.kickCrew(this.missionId, memberId)
      await this.loadData()
    } catch (e: any) {
      alert(e?.error?.message || 'Failed to kick')
    }
  }

  async makeChief(memberId: number) {
    if (!confirm('Transfer ownership to this member? You will become a crew member.')) return
    try {
      await this._missionService.transferOwnership(this.missionId, memberId)
      alert('Ownership transferred')
      this._router.navigate(['/chief'])
    } catch (e: any) {
      alert(e?.error?.message || 'Failed')
    }
  }
}

