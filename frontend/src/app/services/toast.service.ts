import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  type: 'success' | 'error' | 'info';
  text: string;
  id: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _messages = new Subject<ToastMessage>();
  public messages$ = this._messages.asObservable();
  private _counter = 0;

  success(text: string) { this.push('success', text); }
  error(text: string) { this.push('error', text); }
  info(text: string) { this.push('info', text); }

  private push(type: ToastMessage['type'], text: string) {
    this._messages.next({ type, text, id: ++this._counter });
  }
}