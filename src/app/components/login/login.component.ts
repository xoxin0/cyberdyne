import {
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';
import {
  map,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';

import { NgIf } from '@angular/common';
import { JsonServerService } from '../../services/json-server.service';
import { AuthService } from '../../services/auth.service';
import { IUser } from '../../interfaces/IUser';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIf
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent implements OnDestroy, OnInit {
  private readonly _router = inject(Router);
  private readonly _jsonServerService = inject(JsonServerService);
  private readonly _authService = inject(AuthService);
  private readonly ADMIN_DATA: IUser = {
    fullName: '',
    email: '',
    phone: '',
    password: ''
  };
  private destroy$ = new Subject<void>();

  public loginForm = new FormGroup({
    email: new FormControl<string>('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
    password: new FormControl<string>('', {nonNullable: true, validators: [Validators.required, Validators.minLength(6)]},)
  })

  ngOnInit(): void {
    this._jsonServerService.getAdmin()
      .pipe(
      map(admin => (
        this.ADMIN_DATA.email = admin.email,
        this.ADMIN_DATA.password = admin.password
      )),
      takeUntil(this.destroy$)
    ).subscribe( (admin) => {
        if (
          admin === this.ADMIN_DATA.email &&
          admin === this.ADMIN_DATA.password
        ) {
          this._router.navigate(['/admin-page'])
        } else if (this._authService.isAuthenticated()) {
          this._router.navigate(['/user-page']);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onLogin(): void {
    if (this.loginForm.invalid) {
      alert('Введите корректные данные');
      return;
    }

    this._jsonServerService.getAllUsers().pipe(
      tap(users => users.filter(user => user.email === this.loginForm.value.email)),

      switchMap(existingUsers => {
        if (existingUsers.length > 0) {
          const user = existingUsers.find((user: IUser): boolean => (
            user.email === this.loginForm.value.email &&
            user.password === this.loginForm.value.password
          ));

          if (user && user.password === this.ADMIN_DATA.password) {
            this._router.navigate(['/admin-page']);
            this._authService.login(user);
          } else if (user && user.password === this.loginForm.value.password) {
            this._router.navigate(['/user-page']);
            this._authService.login(user);
          } else {
            alert('Неверный email или пароль');
          }
        }

        return of(null);
      }),

      takeUntil(this.destroy$)
    ).subscribe();
  }
}
