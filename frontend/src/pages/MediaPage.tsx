import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import MediaDashboard from "../components/media/MediaDashboard";
import "../styles/dashboard.css";

export default function MediaPage() {
  const stats = { pending: 0, inProgress: 0, completed: 0, archived: 0, activeAlarms: 0 };
  return (
    <div className="dashboard">
      <Sidebar stats={stats} />
      <main className="dashboard-main">
        <Header />
        <div className="work-area">
          <h3 className="list-title">Administrador Multimedia</h3>
          <MediaDashboard />
        </div>
      </main>
    </div>
  );
}