export type Repeat =
  | { kind: 'interval'; minutes: number }
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'once'; isoAt: string }; // fecha/hora exacta ISO

export type RState = 'IDLE' | 'SCHEDULED' | 'RINGING' | 'SNOOZED' | 'DISABLED';

export interface Reminder {
  id: string;
  title: string;
  enabled: boolean;
  repeat: Repeat;
  createdAt: string;
  updatedAt: string;

  // runtime (no persistir en backend en MVP):
  _state?: RState;
  _anchor?: number;       // ms epoch (para intervalos)
  _nextAt?: number;       // ms epoch del siguiente disparo
  _snoozeUntil?: number;  // ms epoch (si está en pausa)
}