import player from "play-sound";

const audio = player();

/**
 * Reproduce un audio.
 * En Render (cloud) se simula la reproducción.
 * En local, intenta reproducir rutas locales. URLs HTTPS
 * solo se loguean porque play-sound no soporta streaming.
 */
export const playAudio = async (url: string) => {
  try {
    // Caso producción cloud (Render)
    if (process.env.NODE_ENV === "production") {
      console.log(`🔊 [CLOUD] Reproducción simulada → ${url}`);
      return;
    }

    console.log(`🔊 Intentando reproducir audio → ${url}`);

    // Si es URL HTTPS (Cloudinary), solo se loguea
    if (url.startsWith("http://") || url.startsWith("https://")) {
      console.log("⚠️ Modo local: No se puede reproducir audio por URL HTTPS. Solo rutas locales.");
      return;
    }

    // Reproducción local real (solo sonidos guardados en disco)
    audio.play(url, (err: any) => {
      if (err) console.error("❌ Error al reproducir audio:", err);
    });
  } catch (error) {
    console.error("❌ Error en playAudio:", error);
  }
};