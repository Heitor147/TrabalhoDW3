class UsuarioController {
  constructor(usuarioService) {
    this.usuarioService = usuarioService;
  }

  cadastrar = async (request, reply) => {
    const usuario = await this.usuarioService.cadastrar(request.body);
    return reply.status(201).send(usuario);
  };

  login = async (request, reply) => {
    const resultado = await this.usuarioService.login(request.body);
    return reply.status(200).send(resultado);
  };

  listarTodos = async (request, reply) => {
    const usuarios = await this.usuarioService.listarTodos();
    return reply.status(200).send(usuarios);
  };

  buscarPorId = async (request, reply) => {
    const usuario = await this.usuarioService.buscarPorId(request.params.id);
    return reply.status(200).send(usuario);
  };

  atualizar = async (request, reply) => {
    const usuario = await this.usuarioService.atualizar(request.params.id, request.body);
    return reply.status(200).send(usuario);
  };

  deletar = async (request, reply) => {
    await this.usuarioService.deletar(request.params.id);
    return reply.status(204).send();
  };
}

module.exports = UsuarioController;
