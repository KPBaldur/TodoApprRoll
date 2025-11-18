import React, { useState } from "react";

type Props = { url?: string | null };

export default function AudioPreviewPlayer({ url }: Props) {
  const [playing, setPlaying] = useState(false);

  const play = async () => {
    if (!url) return;
    try {
      setPlaying(true);
      const audio = new Audio(url);
      await audio.play();
      audio.onended = () => setPlaying(false);
    } catch (e) {
      setPlaying(false);
      alert("No se pudo reproducir el audio.");
    }
  };

  return (
    <button
      type="button"
      onClick={play}
      className="px-3 py-1 rounded bg-blue-600 text-white hover:opacity-90"
      disabled={!url || playing}
      title="Probar sonido"
    >
      {playing ? "Reproduciendo..." : "🔊 Probar sonido"}
    </button>
  );
}