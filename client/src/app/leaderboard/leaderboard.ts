// *เพิ่ม

import { Component, OnInit, inject } from '@angular/core'
import { CommonModule, AsyncPipe } from '@angular/common'
import { UserService } from '../_services/user-service'
import { Brawler } from '../_models/brawler'
import { BehaviorSubject } from 'rxjs'

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss'
})
export class LeaderboardComponent implements OnInit {
  private _userService = inject(UserService)
  leaderboard$ = new BehaviorSubject<Brawler[]>([])

  async ngOnInit() {
    try {
      const data = await this._userService.getLeaderboard()
      this.leaderboard$.next(data)
    } catch (e) {
      console.error('Failed to load leaderboard', e)
    }
  }
}
