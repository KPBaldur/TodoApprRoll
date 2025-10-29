import player from "play-sound";

const audio = player();

//Reproduce un audio desde una URL o ruta local. (En Render / Cloud solo logueará la acción)

export const playAudio = async (url: string) => {
    try {
        if (process.env.NODE_ENV === "production") {
            console.log(` [CLOUD] Reproduccion somulada: ${url}`);
            return;
        } 

        console.log(` Reproduciendo audio: ${url}`);
        audio.play(url, (err: any) => {
            if (err) console.error("Error al reproducir audio:", err);
        });
    } catch (error) {
        console.error("Error en playAudio:", error);
    }
};