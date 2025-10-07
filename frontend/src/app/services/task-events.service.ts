import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskEventsService {
  private readonly _refresh$ = new Subject<void>();

  trigger() { this._refresh$.next(); }
  get refresh$(): Observable<void> { return this._refresh$.asObservable(); }
}