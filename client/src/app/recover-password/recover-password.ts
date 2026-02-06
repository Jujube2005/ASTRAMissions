import { Component, inject, signal } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { RouterModule } from '@angular/router'
import { PassportService } from '../_services/passport-service'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './recover-password.html',
  styleUrl: './recover-password.scss',
})
export class RecoverPassword {
  form: FormGroup
  errorMsg = signal('')
  serverError = signal('')
  successMsg = signal('')
  isLoading = false

  private _passport = inject(PassportService)

  constructor() {
    this.form = new FormGroup({
      username: new FormControl(null, [Validators.required, Validators.minLength(4), Validators.maxLength(10)])
    })
  }

  updateErrorMsg() {
    const ctrl = this.form.get('username')
    if (ctrl?.hasError('required')) {
      this.errorMsg.set('Username is required')
    } else if (ctrl?.hasError('minlength')) {
      this.errorMsg.set('Username must be at least 4 characters')
    } else if (ctrl?.hasError('maxlength')) {
      this.errorMsg.set('Username must be at most 10 characters')
    } else {
      this.errorMsg.set('')
    }
  }

  async onSubmit() {
    if (this.form.invalid) return

    this.isLoading = true
    this.serverError.set('')
    this.successMsg.set('')

    const username = this.form.get('username')?.value
    const error = await this._passport.recoverPassword(username)

    this.isLoading = false
    if (error) {
      this.serverError.set(error)
    } else {
      this.successMsg.set('If an account exists with this username, a reset link has been sent.')
      this.form.reset()
    }
  }
}
