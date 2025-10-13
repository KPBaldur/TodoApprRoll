type Props = { onToggleSidebar?: () => void }

export default function Header({ onToggleSidebar }: Props) {
  return (
    <div className="app-header-inner" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button aria-label="Abrir menú" className="menu-toggle" onClick={onToggleSidebar}>☰</button>
      <h1 className="app-title">TodoApp</h1>
    </div>
  );
}