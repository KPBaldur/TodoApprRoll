import { EventEmitter } from "events";

const eventBus = new EventEmitter();

// Aumentamos el límite de listeners para evitar warnings
eventBus.setMaxListeners(50);

export default eventBus;
