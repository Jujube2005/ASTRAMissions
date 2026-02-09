import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MissionService } from '../../_services/mission-service'
import { Mission } from '../../_models/mission'
import { CommonModule, Location } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { PassportService } from '../../_services/passport-service'
import { MissionChatComponent } from '../../_components/mission-chat/mission-chat'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { InviteMemberComponent } from '../../_dialogs/invite-member/invite-member'
import { MatIconModule } from '@angular/material/icon'
import { ThreeDTiltDirective } from '../../_directives/three-d-tilt.directive'
import { MissionSocketService } from '../../_services/mission-socket.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Subject, takeUntil } from 'rxjs'
import { ConfirmationDialogComponent } from '../../_dialogs/confirmation-dialog/confirmation-dialog'

@Component({
  selector: 'app-mission-specific-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, MissionChatComponent, MatIconModule, MatDialogModule, ThreeDTiltDirective],
  templateUrl: './mission-specific-manager.html',
  styleUrl: './mission-specific-manager.scss',
})
export class MissionSpecificManager implements OnInit, OnDestroy {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _missionService = inject(MissionService)
  private _location = inject(Location)
  private _cdr = inject(ChangeDetectorRef)
  private _passport = inject(PassportService)
  private _dialog = inject(MatDialog)
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

  get isChief(): boolean {
    const userId = this._passport.userId()
    return !!(this.mission && userId && this.mission.chief_id === userId)
  }

  private _socketService = inject(MissionSocketService)
  private _snackBar = inject(MatSnackBar)
  private _destroy$ = new Subject<void>()

  async ngOnInit() {
    this.missionId = Number(this._route.snapshot.paramMap.get('id'))
    if (this.missionId) {
      await this.loadData()

      this._socketService.messages$
        .pipe(takeUntil(this._destroy$))
        .subscribe(msg => {
          if (msg.mission_id === this.missionId && msg.type_ === 'system') {
            // Reload data on system messages (join/leave/status change)
            this.loadData();
          }
        });
    }
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  async loadData() {
    this.isLoading = true
    this.error = null
    this._cdr.detectChanges()

    this._loadingTimer = setTimeout(() => {
      if (this.isLoading) {
        console.warn('Loading timeout triggered')
        this.error = 'The connection was faulty. Please try again.'
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
      this._cdr.detectChanges(); // Ensure UI updates
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
    const dialogRef = this._dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      panelClass: 'premium-dialog-panel',
      data: {
        title: 'Start Mission?',
        message: 'Initiate mission protocols? This will lock the roster.',
        confirmText: 'Execute',
        cancelText: 'Abort'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this._missionService.startMission(this.missionId)
          await this.loadData()
        } catch (e: any) {
          this._snackBar.open(e?.error?.message || 'Failed', 'Close', { duration: 3000 })
        }
      }
    });
  }

  async completeMission() {
    const dialogRef = this._dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      panelClass: 'premium-dialog-panel',
      data: {
        title: 'Complete Mission?',
        message: 'Mark mission as accomplished? Awards will be distributed.',
        confirmText: 'Complete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this._missionService.completeMission(this.missionId)
          await this.loadData()
        } catch (e: any) {
          this._snackBar.open(e?.error?.message || 'Failed', 'Close', { duration: 3000 })
        }
      }
    });
  }

  async deleteMission() {
    const dialogRef = this._dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      panelClass: 'premium-dialog-panel',
      data: {
        title: 'Delete Mission?',
        message: 'Permanently scrub this mission from records? This cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this._missionService.delete(this.missionId)
          this._router.navigate(['/chief'])
        } catch (e: any) {
          this._snackBar.open(e?.error?.message || 'Failed', 'Close', { duration: 3000 })
        }
      }
    });
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
      this._snackBar.open(e?.error?.message || 'Failed to save', 'Close', { duration: 3000 })
    }
  }

  async kick(memberId: number) {
    const dialogRef = this._dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      panelClass: 'premium-dialog-panel',
      data: {
        title: 'Kick Operative?',
        message: 'Remove this agent from the mission roster?',
        confirmText: 'Remove',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this._missionService.kickCrew(this.missionId, memberId)
          this._snackBar.open('Member kicked successfully', 'Close', { duration: 3000 })
          await this.loadData()
        } catch (e: any) {
          this._snackBar.open(e?.error?.message || 'Failed to kick', 'Close', { duration: 3000 })
        }
      }
    });
  }



  async leaveMission() {
    const dialogRef = this._dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      panelClass: 'premium-dialog-panel',
      data: {
        title: 'Abort Mission?',
        message: 'Are you sure you want to leave this mission?',
        confirmText: 'Leave',
        cancelText: 'Stay'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this._missionService.leaveMission(this.missionId)
          this._router.navigate(['/chief']) // Redirect to My Missions
        } catch (e: any) {
          this._snackBar.open(e?.error?.message || 'Leave failed', 'Close', { duration: 3000 })
        }
      }
    });
  }

  openInviteDialog() {
    this._dialog.open(InviteMemberComponent, {
      width: '400px',
      panelClass: 'premium-dialog-panel',
      data: {
        missionId: this.missionId,
        currentMembers: this.crew.map(c => c.id).concat(this.mission?.chief_id)
      }
    })
  }
}

