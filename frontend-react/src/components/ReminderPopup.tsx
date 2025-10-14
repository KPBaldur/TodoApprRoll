import { useReminders } from '../context/ReminderContext';

export default function ReminderPopup() {
  const { active, snooze, stop } = useReminders();
  if (!active) return null;

  return (
    <div className="reminder-popup">
      <div className="card">
        <h2>⏰ {active.title}</h2>
        <p>Tu recordatorio se activó.</p>

        <div className="row">
          <button onClick={() => snooze(5)}>Pausar 5’</button>
          <button onClick={() => snooze(10)}>Pausar 10’</button>
          <button onClick={stop}>Detener</button>
        </div>
      </div>
    </div>
  );
}