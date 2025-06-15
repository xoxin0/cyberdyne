import {
  inject,
  Injectable
} from '@angular/core';

import { Observable } from 'rxjs';
import { IUser } from '../interfaces/IUser';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class JsonServerService {
  private readonly URL = 'http://localhost:3000/users';
  private readonly _http: HttpClient = inject(HttpClient);

  public getAllUsers(): Observable<IUser[]> {
    return this._http.get<IUser[]>(this.URL);
  }

  public getUserById(id: number): Observable<IUser> {
    return this._http.get<IUser>(`${this.URL}/${id}`);
  }

  public addUser(user: IUser): Observable<IUser> {
    return this._http.post<IUser>(this.URL, user);
  }

  public getAdmin(): Observable<IUser> {
    return this._http.get<IUser>(`${this.URL}/1`);
  }

  public sendApplication(application: IUser, id: number): Observable<IUser> {
    return this._http.patch<IUser>(`${this.URL}/${id}`, application);
  }

  public updateUserStatus(userId: number, status: string): Observable<IUser> {
    return this._http.patch<IUser>(`${this.URL}/${userId}`, { status });
  }
}
