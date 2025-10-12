import { useState } from 'react'

export default function Toast() {
  const [msg, setMsg] = useState<string | null>(null);
  // Placeholder minimal: expose window.toast(msg) for simplicity
  (window as any).toast = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500) }

  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px 14px', borderRadius: 8, zIndex: 2000 }}>
      {msg}
    </div>
  )
}