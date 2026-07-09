const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');

async function autenticar(request, reply) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token de autenticação não informado', 401);
  }

  const [, token] = authHeader.split(' '); // formato esperado: "Bearer <token>"

  if (!token) {
    throw new AppError('Formato de token inválido', 401);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    request.usuarioId = payload.id;
  } catch (erro) {
    throw new AppError('Token inválido ou expirado', 401);
  }
}

module.exports = autenticar;
