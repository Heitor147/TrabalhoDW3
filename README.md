# API de Conversão de Moedas

Trabalho prático de Desenvolvimento Web 3 — API RESTful para gestão de carteiras multi-moeda, conversão de valores e histórico de câmbio.

## Domínio

O sistema permite que usuários criem carteiras que guardam saldo em múltiplas moedas simultaneamente. Uma carteira pode ser compartilhada entre vários usuários, cada um com um papel: **dono** (controle total, incluindo exclusão e visibilidade), **operador** (cria e aprova operações), **comentador** (sugere operações, que ficam pendentes até aprovação) e **leitor** (apenas visualiza).

Toda conversão de moeda usa a taxa de câmbio vigente no momento da execução, e essa taxa fica **congelada** no histórico da operação — ainda que a taxa de mercado mude depois, é possível comparar o valor da operação antiga com a cotação atual através do endpoint de comparação.

## Arquitetura

- **Vertical Slice**: código organizado por funcionalidade (`src/features/*`), não por camada técnica.
- **Camadas por Classe com Injeção de Dependência**: Controller → Service → Repository, sempre recebendo dependências via construtor. A montagem (`new`) só acontece nos arquivos `*.routes.js`.
- **Tratamento de erro centralizado**: Services lançam `AppError`, capturado por um Error Handler Global no Fastify.
- **Transações atômicas**: operações que envolvem débito/crédito de saldo em duas moedas usam `BEGIN`/`COMMIT`/`ROLLBACK` no Postgres, garantindo que nunca fiquem "pela metade".

## Stack

Node.js, Fastify, PostgreSQL (`pg`), bcryptjs (hash de senha), jsonwebtoken (autenticação), `@fastify/swagger` + `@fastify/swagger-ui` (documentação).

## Pré-requisitos

- Node.js 18 ou superior
- Uma instância PostgreSQL (local ou cloud, ex: [Neon](https://neon.tech))

## Instalação

1. Clone o repositório e instale as dependências:

```bash
git clone <url-do-repositorio>
cd api-conversao-moedas
npm install
```

2. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```bash
cp .env.example .env
```

3. Preencha as variáveis no `.env`:

```
DATABASE_URL=postgresql://usuario:senha@host/nome_do_banco
JWT_SECRET=uma_string_secreta_bem_grande_e_aleatoria
PORT=3000
```

4. Rode o script `database.sql` no seu banco Postgres para criar todas as tabelas:

```bash
psql "$DATABASE_URL" -f database.sql
```

Ou copie e cole o conteúdo do `database.sql` diretamente no editor SQL do seu provedor (ex: painel do Neon, DBeaver).

## Rodando o projeto

```bash
npm start
```

O servidor sobe em `http://localhost:3000`.

A documentação interativa (Swagger) fica disponível em:

```
http://localhost:3000/docs
```

## Autenticação

A maioria das rotas exige um token JWT. Fluxo básico:

1. `POST /usuarios` — cadastra um novo usuário.
2. `POST /usuarios/login` — retorna um token JWT.
3. Nas próximas requisições, envie o header:

```
Authorization: Bearer <token>
```

## Fluxo resumido de uso

1. Cadastre moedas: `POST /moedas` (ex: USD, EUR, CAD).
2. Cadastre um usuário e faça login.
3. Crie uma carteira: `POST /carteiras` (você vira dono automaticamente).
4. Cadastre uma taxa de câmbio: `POST /taxas`.
5. Execute uma operação de conversão entre moedas diferentes: `POST /carteiras/:carteiraId/operacoes`.
6. Adicione outros usuários à carteira com papéis diferentes: `POST /carteiras/:id/membros`.
7. Um comentador pode sugerir operações (`POST /carteiras/:carteiraId/operacoes/sugestoes`), que um operador ou dono aprova (`PATCH /operacoes/:id/aprovar`) ou rejeita (`PATCH /operacoes/:id/rejeitar`).
8. Compare a taxa de uma operação antiga com a atual: `GET /operacoes/:id/comparar-taxa-atual`.

Todos os endpoints, seus parâmetros e formatos de body/resposta estão documentados no Swagger (`/docs`).
