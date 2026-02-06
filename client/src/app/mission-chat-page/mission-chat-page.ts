import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MissionChatComponent } from '../_components/mission-chat/mission-chat';
import { MissionService } from '../_services/mission-service';

@Component({
  selector: 'app-mission-chat-page',
  standalone: true,
  imports: [CommonModule, MissionChatComponent, RouterLink],
  template: `
    <div class="p-4" style="max-width: 800px; margin: 0 auto;">
      <div style="margin-bottom: 20px;">
        <a routerLink="/joined-missions" style="color: #007acc; text-decoration: none; cursor: pointer;">&larr; Back to Joined Missions</a>
      </div>
      <h2 style="margin-bottom: 10px; color: #fff;">Mission Chat</h2>
      @if (missionId) {
        <app-mission-chat [missionId]="missionId" [chiefId]="chiefId"></app-mission-chat>
      }
    </div>
  `
})
export class MissionChatPage implements OnInit {
  route = inject(ActivatedRoute);
  missionService = inject(MissionService);
  missionId?: number;
  chiefId?: number;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.missionId = +id;
      try {
        const mission = await this.missionService.getMission(this.missionId);
        this.chiefId = mission.chief_id;
      } catch (e) {
        console.error('Failed to get mission info', e);
      }
    }
  }
}
