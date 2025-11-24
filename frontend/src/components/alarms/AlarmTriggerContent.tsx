import { useEffect, useRef, useState } from "react";
import type { Alarm } from "../../services/alarmService";

type Props = { alarm: Alarm };

export default function AlarmTriggerContent({ alarm }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Quitar autoplay: sólo limpiar al montar/desmontar
    audioRef.current = null;
    return () => {
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch { }
      }
      setPlaying(false);
      audioRef.current = null;
    };
  }, [alarm]);

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch { }
      setPlaying(false);
    }
  };

  return (
    <div className="alarm-trigger-body">
      {/* El audio se inicia al pulsar “Reproducir” (sin alertas de autoplay) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="image-preview-card" style={{ minHeight: 280 }}>
          {alarm.image?.url ? (
            <img src={alarm.image.url} alt={alarm.image.name || "Imagen de alarma"} />
          ) : (
            <div style={{ fontSize: 48 }}>⏰</div>
          )}
          <div className="file-name">{alarm.image?.name || "Sin imagen"}</div>
        </div>

        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <h4 style={{ margin: 0 }}>Alarma: {alarm.name}</h4>
          <p className="muted" style={{ margin: 0 }}>
            Esto es una prueba del popup de alarma.{" "}
            {alarm.audio?.name ? `Audio: ${alarm.audio.name}` : "Sin audio"}
          </p>

          <div className="audio-preview-actions">
            <button
              type="button"
              className="btn btn-green"
              onClick={() => {
                if (alarm.audio?.url) {
                  const audio = new Audio(alarm.audio.url);
                  audioRef.current = audio;
                  audio.play().then(() => setPlaying(true)).catch(() => {
                    setPlaying(false);
                    alert("No se pudo reproducir el audio.");
                  });
                  audio.onended = () => setPlaying(false);
                }
              }}
              disabled={!alarm.audio?.url || playing}
              title="Reproducir audio"
            >
              🔊 Reproducir
            </button>

            <button
              type="button"
              className="btn btn-muted"
              onClick={stopAudio}
              disabled={!playing}
              title="Detener audio"
            >
              ⏹️ Detener
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}