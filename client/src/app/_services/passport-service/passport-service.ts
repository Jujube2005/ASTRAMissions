import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { LoginModel, Passport, RegisterModel } from "../../_models/brawler/passport";
import { firstValueFrom } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class PassportService {
  private _key = 'passport'
  private _base_url = environment.baseUrl + '/api'
  private _http = inject(HttpClient)

  data = signal<undefined | Passport>(undefined)

  private loadPassportFormLocalStorage(): string | null {
    const jsonString = localStorage.getItem(this._key)
    if (!jsonString) return 'not found'
    try {
      const passport = JSON.parse(jsonString) as Passport
      this.data.set(passport)
    } catch (error) {
      return `${error}`
    }
    return null
  }
  
  private savePassportToLocalStorage(passport: Passport): void {
    const jsonString = JSON.stringify(passport)
    localStorage.setItem(this._key, jsonString)
    this.data.set(passport)
  }

  constructor() {
    this.loadPassportFormLocalStorage()
  }

  async get(login: LoginModel):Promise<null | string> {
    const api_url = this._base_url + '/authentication/login'
      return await this.fetchPassport(api_url, login)
  }

  private async fetchPassport(api_url: string, model: LoginModel | RegisterModel) {
    try {
      const resulf = this._http.post<Passport>(api_url, model)
      const passport = await firstValueFrom(resulf)
      this.data.set(passport)
      this.savePassportToLocalStorage(passport)
      
    } catch (error: any) {
      console.log(error);
      return error.error
      
    }
  }

  async reginster(register: RegisterModel):Promise<null | string> {
    const api_url = this._base_url + '/brawlers/register'
      return await this.fetchPassport(api_url, register)

}
}