require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
  });

  await connection.execute('UPDATE usuarios SET nome = ? WHERE id = 1', ['Professor demonstra\u00e7\u00e3o']);
  await connection.execute('UPDATE usuarios SET nome = ? WHERE id = 2', ['Administradora demonstra\u00e7\u00e3o']);
  await connection.execute('UPDATE salas SET nome=?, andar_bloco=?, descricao=? WHERE slug=?', ['Sala 101', '1\u00ba andar - Bloco A', 'Sala de aula', 'sala-101']);
  await connection.execute('UPDATE salas SET nome=?, andar_bloco=?, descricao=? WHERE slug=?', ['Sala 102', '1\u00ba andar - Bloco A', 'Sala de aula', 'sala-102']);
  await connection.execute('UPDATE salas SET nome=?, andar_bloco=?, descricao=? WHERE slug=?', ['Lab. Inform\u00e1tica', '1\u00ba andar - Bloco B', 'Laborat\u00f3rio de inform\u00e1tica', 'lab-informatica']);
  await connection.execute('UPDATE salas SET nome=?, andar_bloco=?, descricao=? WHERE slug=?', ['Audit\u00f3rio', 'T\u00e9rreo - Bloco B', 'Eventos e palestras', 'auditorio']);
  await connection.execute('UPDATE salas SET nome=?, andar_bloco=?, descricao=? WHERE slug=?', ['Sala 105', '1\u00ba andar - Bloco A', 'Sala de aula', 'sala-105']);
  await connection.end();
  console.log('Dados iniciais corrigidos para UTF-8.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
