// Middleware de autenticación
export const authMiddleware = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  
  res.status(401).json({
    success: false,
    message: 'Acceso no autorizado'
  });
};

// Middleware opcional para verificar admin
export const adminMiddleware = (req, res, next) => {
  if (req.session.isAuthenticated && req.session.user?.role === 'admin') {
    return next();
  }
  
  res.status(403).json({
    success: false,
    message: 'Se requieren permisos de administrador'
  });
};
