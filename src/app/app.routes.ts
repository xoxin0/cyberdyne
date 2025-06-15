import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(
        (m) => m.RegisterComponent
      )
  },
  {
    path: 'user-page',
    loadComponent: () =>
      import('./components/user-page/user-page.component').then(
        (m) => m.UserPageComponent
      )
  },
  {
    path: 'admin-page',
    loadComponent: () =>
      import('./components/admin-page/admin-page.component').then(
        (m) => m.AdminPageComponent
      )
  },
  { path: '**', redirectTo: 'login' }
];
