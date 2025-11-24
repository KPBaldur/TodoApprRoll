import { useEffect, useState } from "react";
import { fetchTasks, createTask, deleteTask, updateTask } from "../services/tasks";
import "../styles/tasks.css";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");

  const loadTasks = async () => {
    try {
      const data = await fetchTasks({});
      setTasks(data);
    } catch (err) {
      console.error("Error al cargar tareas", err);
    }
  };

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    await createTask({ title: newTask, priority: "medium" });
    setNewTask("");
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    loadTasks();
  };

  const toggleStatus = async (task: any) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateTask(task.id, { status: newStatus });
    loadTasks();
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <section className="tasks-section">
      <header className="tasks-header">
        <h2>Mis Tareas</h2>
        <div className="add-task">
          <input
            type="text"
            value={newTask}
            placeholder="Nueva tarea..."
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button onClick={handleAdd}>Agregar</button>
        </div>
      </header>

      <ul className="tasks-list">
        {tasks.map((t) => (
          <li key={t.id} className={`task-item ${t.status}`}>
            <span onClick={() => toggleStatus(t)}>{t.title}</span>
            <button onClick={() => handleDelete(t.id)}>🗑</button>
          </li>
        ))}
      </ul>
    </section>
  );
}