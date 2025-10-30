"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.erroHandler = erroHandler;
function erroHandler(err, req, res, next) {
    console.error("Error: ", err);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
}
