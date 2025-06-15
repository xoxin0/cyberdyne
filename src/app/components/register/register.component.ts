import {
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

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})

export class RegisterComponent implements OnDestroy {
  private readonly _router = inject(Router);
  private readonly _jsonServerService = inject(JsonServerService);
  private readonly _authService = inject(AuthService);
  private destroy$: Subject<void> = new Subject<void>();

  public registerForm = new FormGroup({
    fullName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[a-zA-Zа-яА-ЯёЁ\s]+$/)] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl<string | number>('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onRegister(): void {
    if (this.registerForm.invalid) {
      alert('Введите корректные данные');
      return;
    }

    this._jsonServerService.getAllUsers().pipe(
      map(users => users.filter(user => user.email === this.registerForm.value.email)),

      switchMap(existingUsers => {
        if (existingUsers.length > 0) {
          alert('Email уже зарегистрирован');
          return of(null);
        } else {
          return this._jsonServerService.addUser(this.registerForm.getRawValue());
        }
      }),

      takeUntil(this.destroy$)
    ).subscribe(result => {
        if (result) {
          this._router.navigate(['/user-page']);
          this._authService.login(result);
        }
      });
  }

  public goLogin(): void {
    this._router.navigate(['/login']);
  }
}
