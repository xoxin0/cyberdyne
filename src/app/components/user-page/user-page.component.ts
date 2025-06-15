import {
  Component,
  inject,
  OnInit,
  AfterViewInit
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { IUser } from '../../interfaces/IUser';
import { NgIf } from '@angular/common';
import { JsonServerService } from '../../services/json-server.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-page',
  imports: [
    NgIf,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss'
})

export class UserPageComponent implements OnInit, AfterViewInit {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _router: Router = inject(Router);
  private readonly _jsonServerService: JsonServerService = inject(JsonServerService);
  protected readonly currentUser: IUser | null = this._authService.getCurrentUser();
  public name: string | undefined = '';
  public onApplicationForm: boolean = false;
  public isSubmitted: boolean = false;

  public applicationForm = new FormGroup({
    fullName: new FormControl<string>(this.currentUser?.fullName!, { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[a-zA-Zа-яА-ЯёЁ\s]+$/)] }),
    email: new FormControl<string>(this.currentUser?.email!, { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl<string | number>(this.currentUser?.phone!, { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)] }),
    organization: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<string>('В обработке', { nonNullable: true}),
    password: new FormControl<string>(this.currentUser?.password!, { nonNullable: true}),
    toggle: new FormControl<boolean>(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.currentUser?.organization !== undefined) {
      this.isSubmitted = true;
      this.onApplicationForm = true;
    }

    if (this.currentUser?.fullName) {
      this.name = this.currentUser?.fullName.split(' ')[1]
    } else {
      this._router.navigate(['/login'])
    }
  }

  ngAfterViewInit(): void {
    this.checkStatus();
  }

  public sendApplication(): void {
    if (this.applicationForm.invalid) {
      alert('Заполните корректно');
      return;
    }

    if (this.currentUser?.organization !== undefined) {
      alert('Вы уже подали заявку');
      return;
    }

    this._jsonServerService.sendApplication(this.applicationForm.getRawValue(), this.currentUser?.id!)
      .subscribe();

    this.isSubmitted = true;
  }

  public turnApplicationForm(): void {
    this.onApplicationForm = !this.onApplicationForm;
  }

  public logout(): void {
    this._authService.logout();
  }

  private checkStatus(): void {
    const status: string = document.querySelector('.status')?.textContent!;
    const statusTitleElement: Element = document.querySelector('.status-title')!;
    const statusTitleElementH1: Element = document.querySelector('.status-title-h1')!;

    switch (status) {
      case 'В обработке':
        document.querySelector('.status')?.classList.add('processing');
        statusTitleElement.textContent = 'Ваша заявка находится в обработке';
        break;

      case 'На согласовании':
        document.querySelector('.status')?.classList.add('on-agreed');
        statusTitleElement.textContent = 'Заявка передана на согласование';
        statusTitleElementH1.textContent = 'Ожидайте';
        break;

      case 'Пропуск готов':
        document.querySelector('.status')?.classList.add('ready');
        statusTitleElement.textContent = 'Ваш пропуск готов к получению';
        break;

      case 'Отклонено':
        document.querySelector('.status')?.classList.add('rejected');
        statusTitleElement.textContent = 'Заявка отклонена';
        statusTitleElementH1.textContent = 'Попробуйте в другой раз(';
        break;

      default:
        document.querySelector('.status')?.classList.add('issued');
        statusTitleElement.textContent = 'Пропуск выдан';
        statusTitleElementH1.textContent = 'Приятного время провождения!';
    }
  }
}
