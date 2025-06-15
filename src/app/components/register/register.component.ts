import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  map,
  of,
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';

import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { JsonServerService } from '../../services/json-server.service';
import { AuthService } from '../../services/auth.service';
import { TuiAlertService } from '@taiga-ui/core';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class RegisterComponent implements OnDestroy {
  public registerForm = new FormGroup({
    fullName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[a-zA-Zа-яА-ЯёЁ\s]+$/)] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl<string | number>('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  private readonly _router: Router = inject(Router);
  private readonly _jsonServerService: JsonServerService = inject(JsonServerService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly alerts = inject(TuiAlertService);
  private _destroy$: Subject<void> = new Subject<void>();

  protected showNotificationInvalidForm(): void {
    this.alerts
      .open('Некорректные данные', {label: 'Ошибка!'})
      .subscribe();
  }

  protected showNotificationExistingEmail(): void {
    this.alerts
      .open('Такой email уже зарегистрирован', {label: 'Ошибка!'})
      .subscribe();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onRegister(): void {
    if (this.registerForm.invalid) {
      this.showNotificationInvalidForm();
      return;
    }

    this._jsonServerService.getAllUsers().pipe(
      map(users => users.filter(user => user.email === this.registerForm.value.email)),

      switchMap(existingUsers => {
        if (existingUsers.length > 0) {
          this.showNotificationExistingEmail();
          return of(null);
        } else {
          return this._jsonServerService.addUser(this.registerForm.getRawValue());
        }
      }),

      takeUntil(this._destroy$)
    ).subscribe(result => {
        if (result) {
          this._router.navigate(['/user-page']);
          this._authService.login(result);
        }

        this._cdr.markForCheck();
      });
  }

  public goLogin(): void {
    this._router.navigate(['/login']);
  }
}
