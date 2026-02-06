// *เพิ่ม

import { Component, inject } from '@angular/core'
import { MissionService } from '../_services/mission-service'
import { MissionSummary } from '../_models/mission-summary'
import { AsyncPipe } from '@angular/common'
import { BehaviorSubject } from 'rxjs'

@Component({
  selector: 'app-mission-summary',
  imports: [AsyncPipe],
  templateUrl: './mission-summary.html',
  styleUrl: './mission-summary.scss',
})
export class MissionSummaryComponent {
  private _mission = inject(MissionService)

  private _summarySubject = new BehaviorSubject<MissionSummary | null>(null)
  readonly summary$ = this._summarySubject.asObservable()

  constructor() {
    this.loadSummary()
  }

  private async loadSummary() {
    try {
      const summary = await this._mission.getMissionSummary()
      this._summarySubject.next(summary)
    } catch (e) {
      console.error(e)
    }
  }
}
