class UsuarioRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async criar({ nome, email, senhaHash }) {
    const result = await this.pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3)
       RETURNING id, nome, email, criado_em`,
      [nome, email, senhaHash]
    );
    return result.rows[0];
  }

  async buscarPorEmail(email) {
    const result = await this.pool.query(`SELECT * FROM usuarios WHERE email = $1`, [email]);
    return result.rows[0] || null;
  }

  async buscarPorId(id) {
    const result = await this.pool.query(
      `SELECT id, nome, email, criado_em FROM usuarios WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async listarTodos() {
    const result = await this.pool.query(
      `SELECT id, nome, email, criado_em FROM usuarios ORDER BY id`
    );
    return result.rows;
  }

  async atualizar(id, { nome, email }) {
    const result = await this.pool.query(
      `UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3
       RETURNING id, nome, email, criado_em`,
      [nome, email, id]
    );
    return result.rows[0] || null;
  }

  async deletar(id) {
    const result = await this.pool.query(`DELETE FROM usuarios WHERE id = $1 RETURNING id`, [id]);
    return result.rows[0] || null;
  }
}

module.exports = UsuarioRepository;
