const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../../shared/errors/AppError');

class UsuarioService {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async cadastrar({ nome, email, senha }) {
    if (!nome || !email || !senha) {
      throw new AppError('Nome, e-mail e senha são obrigatórios', 400);
    }

    if (senha.length < 6) {
      throw new AppError('A senha deve ter no mínimo 6 caracteres', 400);
    }

    // Regra de negócio: não cadastrar usuário com e-mail já existente
    const existente = await this.usuarioRepository.buscarPorEmail(email);
    if (existente) {
      throw new AppError('Já existe um usuário cadastrado com este e-mail', 409);
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    return this.usuarioRepository.criar({ nome, email, senhaHash });
  }

  async login({ email, senha }) {
    if (!email || !senha) {
      throw new AppError('E-mail e senha são obrigatórios', 400);
    }

    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      throw new AppError('E-mail ou senha inválidos', 401);
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      throw new AppError('E-mail ou senha inválidos', 401);
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
    };
  }

  async buscarPorId(id) {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }
    return usuario;
  }

  async listarTodos() {
    return this.usuarioRepository.listarTodos();
  }

  async atualizar(id, { nome, email }) {
    await this.buscarPorId(id);
    return this.usuarioRepository.atualizar(id, { nome, email });
  }

  async deletar(id) {
    await this.buscarPorId(id);
    return this.usuarioRepository.deletar(id);
  }
}

module.exports = UsuarioService;
