require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const crypto = require('crypto');

const app = express();
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agendamento_sala', waitForConnections: true,
  connectionLimit: 10, charset: 'utf8mb4'
});
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(__dirname));

const slots = new Set(['08:00 - 10:00','10:15 - 12:15','13:30 - 15:30','15:45 - 17:45','19:00 - 21:00','21:15 - 23:00']);
const fail = (res, code, message) => res.status(code).json({ error: message });
const hashSenha = (senha) => crypto.scryptSync(senha, 'senac-agendamento-demo', 64).toString('hex');
const papeisGestao = new Set(['ADMIN', 'GESTOR']);

async function usuarioAtivo(id) {
  if (!Number.isInteger(id)) return null;
  const [[usuario]] = await pool.execute(
    'SELECT id, nome, papel FROM usuarios WHERE id = ? AND ativo = TRUE',
    [id]
  );
  return usuario || null;
}

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true }); }
  catch { fail(res, 503, 'Banco de dados indisponível.'); }
});

app.post('/api/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const senha = String(req.body.senha || '');
  if (!email || !senha) return fail(res, 400, 'Informe e-mail e senha.');
  const [[usuario]] = await pool.execute(
    'SELECT id, nome, email, papel, senha_hash FROM usuarios WHERE email = ? AND ativo = TRUE',
    [email]
  );
  const senhaValida = Boolean(usuario?.senha_hash) && crypto.timingSafeEqual(
    Buffer.from(hashSenha(senha), 'hex'), Buffer.from(usuario.senha_hash, 'hex')
  );
  if (!senhaValida) return fail(res, 401, 'E-mail ou senha invÃ¡lidos.');
  res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel });
});

app.post('/api/usuarios', async (req, res) => {
  const nome = String(req.body.nome || '').trim().replace(/\s+/g, ' ');
  const email = String(req.body.email || '').trim().toLowerCase();
  const senha = String(req.body.senha || '');

  if (nome.length < 3 || nome.length > 120) return fail(res, 400, 'Informe seu nome completo.');
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 160) return fail(res, 400, 'Informe um e-mail válido.');
  if (senha.length < 6) return fail(res, 400, 'A senha deve ter pelo menos 6 caracteres.');

  try {
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nome, email, senha_hash, papel, ativo)
       VALUES (?, ?, ?, 'PROFESSOR', TRUE)`,
      [nome, email, hashSenha(senha)]
    );
    res.status(201).json({ id: result.insertId, nome, email, papel: 'PROFESSOR' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return fail(res, 409, 'Este e-mail já possui uma conta. Faça o login.');
    console.error(error);
    fail(res, 500, 'Não foi possível criar a conta agora.');
  }
});

app.get('/api/ocupacao', async (req, res) => {
  const { data } = req.query;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || '')) return fail(res, 400, 'Data inválida.');
  const [rows] = await pool.execute(`SELECT s.slug, r.horario, r.solicitante_id
    FROM reservas r JOIN salas s ON s.id = r.sala_id
    WHERE r.data_reserva = ? AND r.status = 'APROVADA'`, [data]);
  res.json(rows.map(r => ({ chave: `${r.slug}|${r.horario}`, solicitanteId: r.solicitante_id })));
});

app.get('/api/reservas', async (req, res) => {
  const userId = Number(req.query.usuario_id);
  if (!Number.isInteger(userId)) return fail(res, 400, 'Usuário inválido.');
  const [rows] = await pool.execute(`SELECT r.id, DATE_FORMAT(r.data_reserva, '%Y-%m-%d') AS data, r.horario, CONCAT(s.slug, '|', r.horario) AS chave, s.slug, s.nome AS salaNome,
    r.finalidade, r.status FROM reservas r JOIN salas s ON s.id = r.sala_id
    WHERE r.solicitante_id = ? ORDER BY r.data_reserva, r.horario`, [userId]);
  res.json(rows);
});

app.post('/api/reservas', async (req, res) => {
  const { salaSlug, data, horario, usuarioId, finalidade = 'Reserva de sala', participantes = 1 } = req.body;
  if (!salaSlug || !/^\d{4}-\d{2}-\d{2}$/.test(data || '') || !slots.has(horario) || !Number.isInteger(usuarioId)) return fail(res, 400, 'Dados da reserva inválidos.');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[solicitante]] = await conn.execute('SELECT id FROM usuarios WHERE id = ? AND ativo = TRUE FOR UPDATE', [usuarioId]);
    if (!solicitante) { await conn.rollback(); return fail(res, 403, 'Seu acesso não está ativo.'); }
    const [[sala]] = await conn.execute('SELECT id, capacidade FROM salas WHERE slug = ? AND ativa = TRUE FOR UPDATE', [salaSlug]);
    if (!sala) { await conn.rollback(); return fail(res, 404, 'Sala não encontrada.'); }
    if (Number(participantes) > sala.capacidade) { await conn.rollback(); return fail(res, 400, 'Quantidade de participantes excede a capacidade da sala.'); }
    const [result] = await conn.execute(`INSERT INTO reservas (sala_id, solicitante_id, data_reserva, horario, finalidade, participantes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDENTE')`, [sala.id, usuarioId, data, horario, finalidade, participantes]);
    await conn.commit(); res.status(201).json({ id: result.insertId, status: 'PENDENTE' });
  } catch (error) { await conn.rollback(); console.error(error); fail(res, 500, 'Não foi possível gravar a reserva.'); }
  finally { conn.release(); }
});

app.get('/api/gestao/pendentes', async (req, res) => {
  const gestor = await usuarioAtivo(Number(req.query.usuario_id));
  if (!gestor || !papeisGestao.has(gestor.papel)) return fail(res, 403, 'Apenas administradores e gestores podem aprovar reservas.');
  const [rows] = await pool.query(`SELECT r.*, s.nome AS sala_nome, s.andar_bloco, u.nome AS solicitante
    FROM reservas r JOIN salas s ON s.id=r.sala_id JOIN usuarios u ON u.id=r.solicitante_id
    WHERE r.status='PENDENTE' ORDER BY r.criada_em`);
  res.json(rows);
});
app.patch('/api/gestao/reservas/:id', async (req, res) => {
  const status = req.body.status;
  const gestor = await usuarioAtivo(Number(req.body.usuarioId));
  if (!gestor || !papeisGestao.has(gestor.papel)) return fail(res, 403, 'Apenas administradores e gestores podem aprovar reservas.');
  if (!['APROVADA','RECUSADA','CANCELADA'].includes(status)) return fail(res, 400, 'Status inválido.');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[reserva]] = await conn.execute('SELECT * FROM reservas WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!reserva) { await conn.rollback(); return fail(res, 404, 'Reserva não encontrada.'); }
    if (reserva.status !== 'PENDENTE') { await conn.rollback(); return fail(res, 409, 'Esta solicitação já foi decidida.'); }
    if (status === 'APROVADA') {
      const [[ocupada]] = await conn.execute(`SELECT id FROM reservas
        WHERE sala_id = ? AND data_reserva = ? AND horario = ? AND status = 'APROVADA' FOR UPDATE`,
        [reserva.sala_id, reserva.data_reserva, reserva.horario]);
      if (ocupada) { await conn.rollback(); return fail(res, 409, 'Este horário já foi aprovado para outra reserva.'); }
    }
    await conn.execute('UPDATE reservas SET status = ? WHERE id = ?', [status, reserva.id]);
    await conn.commit();
  } catch (error) { await conn.rollback(); console.error(error); return fail(res, 500, 'Não foi possível atualizar a solicitação.'); }
  finally { conn.release(); }
  res.json({ ok: true });
});

app.patch('/api/reservas/:id/cancelar', async (req, res) => {
  const usuario = await usuarioAtivo(Number(req.body.usuarioId));
  if (!usuario) return fail(res, 403, 'Seu acesso não está ativo.');
  const [result] = await pool.execute(`UPDATE reservas SET status = 'CANCELADA'
    WHERE id = ? AND solicitante_id = ? AND status IN ('PENDENTE', 'APROVADA')`, [req.params.id, usuario.id]);
  if (!result.affectedRows) return fail(res, 404, 'Reserva não encontrada ou não pode mais ser cancelada.');
  res.json({ ok: true });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, async () => { console.log(`Sistema: http://localhost:${port}`); try { await pool.query('SELECT 1'); console.log('MySQL conectado.'); } catch { console.log('MySQL ainda indisponível. Confira .env e o serviço.'); } });
