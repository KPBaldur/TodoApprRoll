export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'working' | 'completed';
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  subtasks?: Subtask[];
  alarm?: Alarm;
}

export interface Subtask {
  id: string;
  title: string;
  completed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AlarmSchedule {
  type: 'once' | 'daily' | 'weekly' | 'interval';
  // once
  dateTime?: string; // ISO
  // daily/weekly
  time?: string; // HH:mm
  dayOfWeek?: number; // 0-6 (domingo-sábado)
  // interval
  intervalMinutes?: number;
}

export interface Alarm {
  enabled?: boolean;
  soundUrl?: string;
  imageUrl?: string;
  schedule?: AlarmSchedule;
  nextTriggerAt?: string | null;
}