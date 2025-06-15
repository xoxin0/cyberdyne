import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { Statuses } from '../../common/statuses.enum';
import { TuiAlertService } from '@taiga-ui/core';

@Component({
  selector: 'app-admin-page',
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AdminPageComponent implements OnInit, OnDestroy {
  public users: IUser[] = [];
  public statuses: Statuses[] = [...Object.values(Statuses)];

  private readonly _authService: AuthService = inject(AuthService);
  private readonly _jsonServerService: JsonServerService = inject(JsonServerService);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly alerts = inject(TuiAlertService);
  private _destroy$: Subject<void> = new Subject<void>();

  protected showNotificationSuccessfully(): void {
    this.alerts
      .open('Статус успешно изменен', {label: 'Готово!'})
      .subscribe();
  }

  protected showNotificationNotSuccessfully(): void {
    this.alerts
      .open('Ошибка при изменении статуса', {label: 'Ошибка!'})
      .subscribe();
  }

  public ngOnInit(): void {
    this.loadUsers();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private loadUsers(): void {
    this._jsonServerService.getAllUsers()
      .pipe(
        map(users => users.filter(user =>
          user.id !== 1 &&
          user.organization &&
          user.organization.trim() !== ''
        )),

        takeUntil(this._destroy$)
      ).subscribe(filteredUsers => {
        this.users = filteredUsers;
        this._cdr.markForCheck();
    });
  }

  public onStatusChange(userId: number, newStatus: string): void {
    const userIndex: number = this.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], status: newStatus };
      this._cdr.markForCheck();
    }

    this._jsonServerService.updateUserStatus(userId, newStatus).pipe(
      takeUntil(this._destroy$)
    ).subscribe({
      next: (): void => {
        this.showNotificationSuccessfully();
        this._cdr.markForCheck();
      },
      error: (): void => {
        this.showNotificationNotSuccessfully();
        this.loadUsers();
      }
    });
  }

  public getCurrentStatus(user: IUser): string {
    return user.status || Statuses.IN_PROCESSING;
  }

  public logout(): void {
    this._authService.logout();
  }
}
