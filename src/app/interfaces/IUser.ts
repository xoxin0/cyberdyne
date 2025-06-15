export interface IUser {
  id?: number;
  fullName: string;
  email: string;
  phone: string | number;
  password: string;
  organization?: string;
  status?: string;
  toggle?: boolean;
}
