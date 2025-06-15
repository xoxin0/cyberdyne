import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  WritableSignal,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Subject,
  takeUntil,
  tap
} from 'rxjs';

import {
  NgClass,
  NgIf
} from '@angular/common';

import { IUser } from '../../interfaces/IUser';
import { JsonServerService } from '../../services/json-server.service';
import { AuthService } from '../../services/auth.service';
import { Statuses } from '../../common/statuses.enum';
import { TuiAlertService } from '@taiga-ui/core';

@Component({
  selector: 'app-user-page',
  imports: [
    NgIf,
    ReactiveFormsModule,
    FormsModule,
    NgClass
  ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class UserPageComponent implements OnInit, OnDestroy {
  public onApplicationForm$$: WritableSignal<boolean> = signal(false);
  public isSubmitted$$: WritableSignal<boolean> = signal(false);

  private readonly _authService: AuthService = inject(AuthService);
  private readonly _jsonServerService: JsonServerService = inject(JsonServerService);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly alerts = inject(TuiAlertService);
  private _destroy$: Subject<void> = new Subject<void>();

  protected showNotificationInvalidForm(): void {
    this.alerts
      .open('Некорректные данные', {label: 'Ошибка!'})
      .subscribe();
  }

  protected showNotificationSecondSubmission(): void {
    this.alerts
      .open('Вы уже отправляли заявку', {label: 'Ожидайте'})
      .subscribe();
  }

  protected currentUser: IUser | null = this._authService.getCurrentUser();
  protected readonly Statuses = Statuses;

  public applicationForm = new FormGroup({
    fullName: new FormControl<string>(
      this.currentUser?.fullName!,
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^[a-zA-Zа-яА-ЯёЁ\s]+$/)
        ]
      }
    ),

    email: new FormControl<string>(
      this.currentUser?.email!,
      {
        nonNullable: true,
        validators: [
          Validators.required, Validators.email
        ]
      }
    ),

    phone: new FormControl<string | number>(
      this.currentUser?.phone!,
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^\+?[1-9]\d{1,14}$/)
        ]
      }
    ),

    organization: new FormControl<string>(
      '',
      {
        nonNullable: true,
        validators: [Validators.required]
      }
    ),

    status: new FormControl<string>(
      Statuses.IN_PROCESSING,
      { nonNullable: true }
    ),

    password: new FormControl<string>(
      this.currentUser?.password!,
      { nonNullable: true }
    ),

    toggle: new FormControl<boolean>(
      false,
      { nonNullable: true }
    ),
  });

  public ngOnInit(): void {
    this._jsonServerService.getUserById(this.currentUser?.id!)
      .pipe(
        takeUntil(this._destroy$),

        tap(currUser => {
          this.currentUser = { ...currUser };
          this._cdr.markForCheck();
        })
    ).subscribe(() => {
        if (this.currentUser?.organization) {
          this.isSubmitted$$.set(true);
          this.onApplicationForm$$.set(true);

        }
    });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public sendApplication(): void {
    if (this.applicationForm.invalid) {
      this.showNotificationInvalidForm();
      return;
    }

    if (this.currentUser?.organization) {
      this.showNotificationSecondSubmission();
      return;
    }

    this._jsonServerService.sendApplication(this.applicationForm.getRawValue(), this.currentUser?.id!)
      .pipe(
        tap(currUser => {
          this.currentUser = { ...currUser };
          this._cdr.markForCheck();
        }),

        takeUntil(this._destroy$)
      ).subscribe();

    this.isSubmitted$$.set(true);
  }

  public turnApplicationForm(): void {
    this.onApplicationForm$$.set(!this.onApplicationForm$$());
    this._cdr.markForCheck();
  }

  public logout(): void {
    this._authService.logout();
    this._cdr.markForCheck();
  }
}
