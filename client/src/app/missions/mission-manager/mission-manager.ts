import { Component, inject } from '@angular/core'
import { MissionService } from '../../_services/mission-service'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { Mission } from '../../_models/mission'
import { NewMission } from '../../_dialogs/new-mission/new-mission'
import { AddMission } from '../../_models/add-mission'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { AsyncPipe, DatePipe } from '@angular/common'
import { BehaviorSubject } from 'rxjs'
import { PassportService } from '../../_services/passport-service'
import { NotificationService } from '../../_services/notification-service'
import { Router } from '@angular/router'
import { ThreeDTiltDirective } from '../../_directives/three-d-tilt.directive'

@Component({
  selector: 'app-mission-manager',
  imports: [MatIconModule, MatButtonModule, MatDialogModule, DatePipe, AsyncPipe, ThreeDTiltDirective],
  templateUrl: './mission-manager.html',
  styleUrl: './mission-manager.scss',
})
export class MissionManager {
  private _mission = inject(MissionService)
  private _dialog = inject(MatDialog)
  public passport = inject(PassportService)
  private _missionsSubject = new BehaviorSubject<Mission[]>([])
  readonly myMissions$ = this._missionsSubject.asObservable()
  private _notification = inject(NotificationService)
  private _router = inject(Router)
  joinAlerts = new Set<number>()

  constructor() {
    this.loadMyMission()
    this._notification.notifications$.subscribe((n: any) => {
      if (n.type === 'JoinMission' && n.metadata?.mission_id) {
        this.joinAlerts.add(Number(n.metadata.mission_id))
      }
    })
  }

  private async loadMyMission() {
    try {
      const [owned, joined] = await Promise.all([
        this._mission.getMyMissions(),
        this._mission.getJoinedMissions()
      ])

      // Add a flag or just merge. Mission model has chief_id, so we can check ownership dynamically.
      // But distinct lists might be better?
      // User requested "Show combined".

      // Let's filter out duplicates if any (though shouldn't be if logic is correct: created != joined)
      const missionMap = new Map<number, Mission>()
      owned.forEach((m: Mission) => missionMap.set(m.id, m))
      joined.forEach((m: Mission) => missionMap.set(m.id, m))

      const allMissions = Array.from(missionMap.values())

      // Sort by updated_at desc
      allMissions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

      this._missionsSubject.next(allMissions)
    } catch (e) {
      console.error('Failed to load missions', e)
    }
  }

  navigateToMission(id: number) {
    this.joinAlerts.delete(id)
    this._router.navigate(['/chief/mission', id])
  }

  hasJoinAlert(id: number) {
    return this.joinAlerts.has(id)
  }

  clearJoinAlert(id: number) {
    this.joinAlerts.delete(id)
  }

  openDialog() {
    const ref = this._dialog.open(NewMission)
    ref.afterClosed().subscribe(async (addMission: AddMission) => {
      if (addMission) {
        try {
          await this._mission.add(addMission)
          await this.loadMyMission() // Refresh list from server to get accurate data
          this._notification.showLocalNotification({
            title: 'Protocol Initialized',
            message: 'Mission deployment successful',
            type: 'success',
            metadata: {}
          })
        } catch (e: any) {
          console.error('Failed to create mission', e)
          alert(e?.error?.message ?? e?.error ?? 'Failed to initialize mission')
        }
      }
    })
  }

  // *เพิ่ม
  openEditDialog(mission: Mission) {
    const ref = this._dialog.open(NewMission, {
      data: {
        name: mission.name,
        description: mission.description,
        category: mission.category,
        max_crew: mission.max_crew
      }
    })
    ref.afterClosed().subscribe(async (updatedData: AddMission) => {
      if (updatedData) {
        try {
          await this._mission.edit(mission.id, updatedData)
          // Update local state
          const currentMissions = this._missionsSubject.value
          const index = currentMissions.findIndex(m => m.id === mission.id)
          if (index !== -1) {
            currentMissions[index] = { ...currentMissions[index], ...updatedData }
            this._missionsSubject.next([...currentMissions])
          }
        } catch (e: any) {
          alert(e?.error?.message ?? e?.error ?? 'Edit failed')
        }
      }
    })
  }

  // *เพิ่ม
  async deleteMission(mission_id: number) {
    if (!confirm('Are you sure you want to delete this mission?')) return

    try {
      await this._mission.delete(mission_id)
      // Update local state
      const currentMissions = this._missionsSubject.value.filter(m => m.id !== mission_id)
      this._missionsSubject.next(currentMissions)
    } catch (e: any) {
      alert(e?.error?.message ?? e?.error ?? 'Delete failed')
    }
  }

  // hasJoinAlert(mission_id: number): boolean {
  //   return this.joinAlerts.has(mission_id)
  // }

  // clearJoinAlert(mission_id: number) {
  //   this.joinAlerts.delete(mission_id)
  // }

  // *เพิ่ม
  async startMission(mission_id: number) {
    if (!confirm('Start this mission?')) return
    try {
      await this._mission.startMission(mission_id)
      await this.loadMyMission()
    } catch (e: any) {
      alert(e?.error?.message ?? e?.error ?? 'Start mission failed')
    }
  }

  // *เพิ่ม
  async completeMission(mission_id: number) {
    if (!confirm('Complete this mission?')) return
    try {
      await this._mission.completeMission(mission_id)
      await this.loadMyMission()
    } catch (e: any) {
      alert(e?.error?.message ?? e?.error ?? 'Complete mission failed')
    }
  }
}
