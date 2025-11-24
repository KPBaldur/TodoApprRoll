import { useEffect, useRef, useState } from "react";

type Props = { url?: string | null };

export default function AudioPreviewPlayer({ url }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  // Limpieza si el componente se desmonta o cambia de audio
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch { }
      }
      audioRef.current = null;
      setPlaying(false);
    };
  }, [url]);

  const play = async () => {
    if (!url) return;

    try {
      // Si ya hay algo sonando, detenerlo primero
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch { }
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      await audio.play();
      setPlaying(true);

      audio.onended = () => {
        setPlaying(false);
        audioRef.current = null;
      };
    } catch (e) {
      setPlaying(false);
      alert("No se pudo reproducir el audio.");
    }
  };

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch { }
      audioRef.current = null;
      setPlaying(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button
        type="button"
        onClick={play}
        className="audio-preview-btn"
        disabled={!url || playing}
        title="Probar sonido"
      >
        🔊 Probar sonido
      </button>

      {playing && (
        <button
          type="button"
          onClick={stop}
          className="audio-preview-btn"
          title="Detener"
        >
          ⏹️
        </button>
      )}
    </div>
  );
}
