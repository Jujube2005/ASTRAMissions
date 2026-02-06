import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { environment } from '../../environments/environment'
import { Achievement } from '../_models/achievement'
import { lastValueFrom } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class AchievementService {
  private _http = inject(HttpClient)

  getAchievements(): Promise<Achievement[]> {
    return lastValueFrom(this._http.get<Achievement[]>(`${environment.baseUrl}/api/achievements`))
  }
}
