import { Component, Inject, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogModule } from "@angular/material/dialog";
import { UserService } from "../../_services/user-service";
import { InviteService } from "../../_services/invite.service";
import { Brawler } from "../../_models/brawler";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog";

@Component({
    selector: 'app-invite-member',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule],
    templateUrl: './invite-member.html',
    styleUrls: ['./invite-member.scss']
})
export class InviteMemberComponent {
    private _userService = inject(UserService);
    private _inviteService = inject(InviteService);
    private _snackBar = inject(MatSnackBar);
    private _dialog = inject(MatDialog);

    searchTerm: string = '';
    users: Brawler[] = [];
    filteredUsers: Brawler[] = [];
    invitedUserIds: Set<number> = new Set();
    missionId: number;
    currentMembers: Set<number> = new Set();

    constructor(
        public dialogRef: MatDialogRef<InviteMemberComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { missionId: number, currentMembers: number[] }
    ) {
        this.missionId = data.missionId;
        this.currentMembers = new Set(data.currentMembers || []);
        this.loadUsers();
    }

    async loadUsers() {
        try {
            this.users = await this._userService.getAllBrawlers();
            this.filterUsers();
        } catch (error) {
            console.error('Failed to load users', error);
        }
    }

    onSearchChange() {
        this.filterUsers();
    }

    filterUsers() {
        const term = this.searchTerm.toLowerCase();
        this.filteredUsers = this.users.filter(user =>
            !this.currentMembers.has(user.id) &&
            user.display_name.toLowerCase().includes(term)
        );
    }

    async invite(user: Brawler) {
        if (this.invitedUserIds.has(user.id)) return;

        const dialogRef = this._dialog.open(ConfirmationDialogComponent, {
            width: '400px',
            panelClass: 'premium-dialog-panel',
            data: {
                title: 'Confirm Recruitment',
                message: `Send mission invite to ${user.display_name}?`,
                confirmText: 'Send Invite',
                cancelText: 'Cancel'
            }
        });

        dialogRef.afterClosed().subscribe(async result => {
            if (result) {
                try {
                    await this._inviteService.invite(this.missionId, user.id);
                    this.invitedUserIds.add(user.id);
                    this._snackBar.open(`Invitation sent to ${user.display_name}`, 'Close', { duration: 3000 });
                } catch (e: any) {
                    this._snackBar.open(e?.error?.message || 'Failed to send invite', 'Close', { duration: 3000 });
                }
            }
        });
    }

    isInvited(userId: number): boolean {
        return this.invitedUserIds.has(userId);
    }
}
