"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playAudio = void 0;
const play_sound_1 = __importDefault(require("play-sound"));
const audio = (0, play_sound_1.default)();
//Reproduce un audio desde una URL o ruta local. (En Render / Cloud solo logueará la acción)
const playAudio = async (url) => {
    try {
        if (process.env.NODE_ENV === "production") {
            console.log(` [CLOUD] Reproduccion somulada: ${url}`);
            return;
        }
        console.log(` Reproduciendo audio: ${url}`);
        audio.play(url, (err) => {
            if (err)
                console.error("Error al reproducir audio:", err);
        });
    }
    catch (error) {
        console.error("Error en playAudio:", error);
    }
};
exports.playAudio = playAudio;
