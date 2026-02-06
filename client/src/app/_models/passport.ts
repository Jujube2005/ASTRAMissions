export interface Passport {
    token: string,
    display_name: string,
    avatar_url?: string
}

export interface RegisterModel {
    username: string
    password: string
    display_name: string
    email?: string
}
export interface LoginModel {
    username: string
    password: string
}