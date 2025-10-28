import bcrypt from "bcrypt";
import prisma from "../services/prismaService";
import { generateAccessToken } from "../utils/token";
import { Request, Response } from "express";
import { createSession } from "../services/token.service";



export const register = async (req: Request, res: Response) => {
    const cout = await prisma.user.count();
    if (cout > 0)
        return res.status(400).json({ message: "Registro deshabilitado. Sistema unipersonal" });
    
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ message: "Username y password son requeridos." });

    try {
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser)
      return res.status(400).json({ message: "El usuario ya existe." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passHash: hashed },
    });

    // 🔥 Creamos la sesión usando el user.id real
    const session = await createSession(user.id);

    res.status(201).json({
      message: "Usuario creado exitosamente.",
      session,
    });
  } catch (err) {
    console.error("Error en el registro:", err);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado." });

    const valid = await bcrypt.compare(password, user.passHash);
    if (!valid)
      return res.status(401).json({ message: "Password incorrecto." });

    // 🔥 Creamos la sesión y devolvemos ambos tokens
    const session = await createSession(user.id);

    res.json({
      message: "Inicio de sesión exitoso.",
      session,
    });
  } catch (err) {
    console.error("Error en el login:", err);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
