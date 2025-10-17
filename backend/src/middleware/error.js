export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ->`, err?.message || err);

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({ success: false, message });
}

export default errorHandler;