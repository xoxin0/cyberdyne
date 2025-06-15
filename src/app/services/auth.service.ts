import {
  inject,
  Injectable
} from '@angular/core';

import { IUser } from '../interfaces/IUser';
import { LocalStorageService } from './local-storage.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private readonly _localStorageService = inject(LocalStorageService);
  private readonly _router = inject(Router);

  public login(user: IUser): void {
    this._localStorageService.saveData('currentUser', JSON.stringify(user));
    this._localStorageService.saveData('isLoggedIn', 'true');
  }

  public getCurrentUser(): IUser | null {
    const savedUser: string | null = this._localStorageService.getData('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  public isAuthenticated(): boolean {
    const isLoggedIn: string | null = this._localStorageService.getData('isLoggedIn');
    const currentUser: IUser | null = this.getCurrentUser();
    return isLoggedIn === 'true' && !!currentUser;
  }

  public logout(): void {
    this._localStorageService.removeData('currentUser');
    this._localStorageService.removeData('isLoggedIn');

    this._router.navigate(['/login']);
  }
}
