import { Component, computed, inject, Signal } from '@angular/core'
import { getAvatarUrl } from '../_helpers/util'
import { PassportService } from '../_services/passport-service'
import { MatDialog } from '@angular/material/dialog'
import { UploadImg } from '../_dialogs/upload-img/upload-img'
import { UserService } from '../_services/user-service'
import { AchievementService } from '../_services/achievement-service'
import { Achievement } from '../_models/achievement'
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-profile',
  imports: [DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  avatar_url: Signal<string>
  achievements: Achievement[] = []
  
  private _passport = inject(PassportService)
  private _dialog = inject(MatDialog)
  private _user = inject(UserService)
  private _achievement = inject(AchievementService)

  constructor() {
    this.avatar_url = computed(() => this._passport.avatar())
    this.loadAchievements()
  }

  // *เพิ่ม
  async loadAchievements() {
    try {
      this.achievements = await this._achievement.getAchievements()
    } catch (e) {
      console.error('Failed to load achievements', e)
    }
  }

  openDialog() {
    const ref = this._dialog.open(UploadImg)
    ref.afterClosed().subscribe(async file => {
      if (file) {
        const error = await this._user.uploadAvatarImg(file)
        if (error)
          console.error(error)
      }
    })
  }
}
