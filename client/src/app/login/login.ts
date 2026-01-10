import { Component, inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PasswordMatchValidator, passwordValidatorv } from '../_helpers/password-validator.ts/password-validator.ts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAnchor } from "@angular/material/button";
import { MatCardModule } from '@angular/material/card';
import { PassportService } from '../_services/passport-service/passport-service.js';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule, ReactiveFormsModule, MatAnchor,],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})

export class Login {
  private usernameMinLength = 4
  private usernameMaxLength = 10

  private passwordMinLength = 8
  private passwordMaxLength = 10

  private displayNameMinLength = 3

  mode: 'login' | 'register' = 'login'
  form: FormGroup

   errorMsg = {
    username: signal(''),
    password: signal(''),
    cf_password:  signal(''),
    display_name: signal(''),
  } 

  private _router = inject(Router)
  private _passport = inject(PassportService)

  constructor() {
    this.form = new FormGroup({
      username: new FormControl(null, [
        Validators.required, 
        Validators.minLength(this.usernameMinLength), 
        Validators.maxLength(this.usernameMaxLength)
      ]),
      password: new FormControl(null, [
        Validators.required, 
        passwordValidatorv(this.passwordMinLength, this.passwordMaxLength)
      ]),
      confirm_password: new FormControl(''), 
      display_name: new FormControl('')
    })
  }

  toggleMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login'
    this.updateFrom()
  }

  updateFrom() {
    if (this.mode === 'login') {
        this.form.removeControl('confirm_password');
        this.form.removeControl('display_name');
        this.form.clearValidators();
    } else {
        this.form.addControl('confirm_password', new FormControl(null, [Validators.required]));
        this.form.addControl('display_name', new FormControl(null, [Validators.required, Validators.minLength(this.displayNameMinLength)]));
        this.form.addValidators(PasswordMatchValidator('password', 'confirm_password'));
        this.form.get('password')?.valueChanges.subscribe(() => {
            this.form.get('confirm_password')?.updateValueAndValidity();
        });
    }
    this.form.updateValueAndValidity();
}

  updateErrorMsg(ctrlName: string): void {
    const control = this.form.controls[ctrlName]
    if (!control) return
    switch (ctrlName) {
      case 'username':
        if (control.hasError('required')) this.errorMsg.username.set('required')

        else if (control.hasError('minlength'))
          this.errorMsg.username.set('must be at least 4 characters long')

        else if (control.hasError('maxlength'))
          this.errorMsg.username.set('must be 16 characters or fewer')

        else this.errorMsg.username.set('')
        
      break

    case 'password':
      if (control.hasError('required'))
          this.errorMsg.password.set('required')
        else if (control.hasError('invalidLength'))
          this.errorMsg.password.set('must be at least 8 characters long')
        else if (control.hasError('invalidMaxLength'))
          this.errorMsg.password.set('must be 16 characters or fewer')
        else if (control.hasError('invalidLowerCase'))
          this.errorMsg.password.set('must contain minimum of 1 lower-case letter [a-z].')
        else if (control.hasError('invalidUpperCase'))
          this.errorMsg.password.set('must contain minimum of 1 capital letter [A-Z].')
        else if (control.hasError('invalidNumeric'))
          this.errorMsg.password.set('must contain minimum of 1 numeric character [0-9].')
        else if (control.hasError('invalidSpecialCase'))
          this.errorMsg.password.set('must contain minimum of 1 special character: !@#$%^&*(),.?":{}|<>')
        else this.errorMsg.password.set('')
      break
    case 'cf_password':
      if (control.hasError('required'))
          this.errorMsg.cf_password.set('required')
        else if (control.hasError('mismatch'))
          this.errorMsg.cf_password.set('do not match password')
        else
          this.errorMsg.cf_password.set('')
      break
    case 'display_name':
      if (control.hasError('required')) {
          this.errorMsg.display_name.set('Display name is required');
        }
        else if (control.hasError('minlength')) {
          this.errorMsg.display_name.set(`must be at least ${this.usernameMinLength} characters long`);
        }
        else if (control.hasError('maxlength')) {
          this.errorMsg.display_name.set(`must be ${this.usernameMaxLength} characters or fewer`);
        }
        else { 
          this.errorMsg.display_name.set('');
        }
      break
    }
  }

  async onSubmit() {
    if (this.mode === 'login') {
      const errMsg = await this._passport.get(this.form.value)
      if (!errMsg) this._router.navigate(['/'])
    } else {
      const errMsg = await this._passport.reginster(this.form.value)
      if (!errMsg) this._router.navigate(['/'])
      }
  }
}
