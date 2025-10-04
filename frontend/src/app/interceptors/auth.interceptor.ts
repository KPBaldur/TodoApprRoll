import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const token = inject(AuthService).getToken();
  const cloned = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(cloned);
};