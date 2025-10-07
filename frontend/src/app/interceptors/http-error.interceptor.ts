import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse | any) => {
      const status = error?.status;
      const message =
        error?.error?.message ||
        error?.message ||
        'Error de red';

      toast.error(`Error ${status ?? ''}: ${message}`);

      return throwError(() => error);
    })
  );
};