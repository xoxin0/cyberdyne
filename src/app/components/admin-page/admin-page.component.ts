import {
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import {
  map,
  Subject,
  takeUntil
} from 'rxjs';

import { IUser } from '../../interfaces/IUser';
import { AuthService } from '../../services/auth.service';
import { JsonServerService } from '../../services/json-server.service';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-admin-page',
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})

export class AdminPageComponent implements OnInit, OnDestroy {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _jsonServerService: JsonServerService = inject(JsonServerService);

  private destroy$: Subject<void> = new Subject<void>();
  public users: IUser[] = [];

  public statuses: string[] = ['В обработке', 'На согласовании', 'Пропуск готов', 'Отклонено', 'Пропуск выдан'];

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers(): void {
    this._jsonServerService.getAllUsers().pipe(
      map(users => users.filter(user =>
        user.id !== 1 &&
        user.organization &&
        user.organization.trim() !== ''
      )),

      takeUntil(this.destroy$)
    ).subscribe(filteredUsers => {
      this.users = filteredUsers;
    });
  }

  public onStatusChange(userId: number, newStatus: string): void {
    const userIndex: number = this.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], status: newStatus };
    }

    this._jsonServerService.updateUserStatus(userId, newStatus).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedUser: IUser): void => {
        console.debug('Статус пользователя обновлен:', updatedUser);
      },
      error: (error): void => {
        console.error('Ошибка при обновлении статуса:', error);
        this.loadUsers();
      }
    });
  }

  public getCurrentStatus(user: IUser): string {
    return user.status || this.statuses[0];
  }

  public logout(): void {
    this._authService.logout();
  }
}
