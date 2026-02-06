import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../_services/notification-service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss'
})
export class Toast implements OnInit {
  notifications: Notification[] = [];
  notificationService = inject(NotificationService);

  ngOnInit() {
    this.notificationService.notifications$.subscribe(notification => {
      this.notifications.push(notification);
      setTimeout(() => {
        this.remove(notification);
      }, 5000);
    });
  }

  remove(notification: Notification) {
    this.notifications = this.notifications.filter(n => n !== notification);
  }
}
