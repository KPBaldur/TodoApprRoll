import dotenv from "dotenv";
import { app } from "./app";
import { logger } from "./utils/logger";

dotenv.config();

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  logger.info(`TodoApp Roll v3.0 backend escuchando en http://localhost:${port}`);
});