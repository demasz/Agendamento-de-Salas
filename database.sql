CREATE DATABASE IF NOT EXISTS agendamento_sala
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agendamento_sala;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  papel ENUM('ADMIN','GESTOR','PROFESSOR','COLABORADOR') NOT NULL DEFAULT 'PROFESSOR',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(60) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  andar_bloco VARCHAR(120) NOT NULL,
  descricao TEXT NULL,
  capacidade INT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS recursos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS sala_recursos (
  sala_id INT NOT NULL,
  recurso_id INT NOT NULL,
  PRIMARY KEY (sala_id, recurso_id),
  FOREIGN KEY (sala_id) REFERENCES salas(id),
  FOREIGN KEY (recurso_id) REFERENCES recursos(id)
);

CREATE TABLE IF NOT EXISTS gestor_setores (
  usuario_id INT NOT NULL,
  setor VARCHAR(120) NOT NULL,
  PRIMARY KEY (usuario_id, setor),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS reservas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo_serie CHAR(36) NULL,
  sala_id INT NOT NULL,
  solicitante_id INT NOT NULL,
  data_reserva DATE NOT NULL,
  horario VARCHAR(30) NOT NULL,
  finalidade VARCHAR(160) NOT NULL,
  participantes INT NOT NULL,
  observacoes TEXT NULL,
  status ENUM('PENDENTE','APROVADA','RECUSADA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reservas_grade (sala_id, data_reserva, horario, status),
  INDEX idx_reservas_solicitante (solicitante_id, data_reserva),
  FOREIGN KEY (sala_id) REFERENCES salas(id),
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
);

INSERT IGNORE INTO usuarios (id, nome, email, papel) VALUES
  (1, 'Professor demonstração', 'professor@senac.local', 'PROFESSOR'),
  (2, 'Administradora demonstração', 'admin@senac.local', 'ADMIN');
INSERT IGNORE INTO salas (slug, nome, andar_bloco, descricao, capacidade) VALUES
  ('sala-101', 'Sala 101', '1º andar - Bloco A', 'Sala de aula', 35),
  ('sala-102', 'Sala 102', '1º andar - Bloco A', 'Sala de aula', 30),
  ('lab-informatica', 'Lab. Informática', '1º andar - Bloco B', 'Laboratório de informática', 25),
  ('auditorio', 'Auditório', 'Térreo - Bloco B', 'Eventos e palestras', 120),
  ('sala-105', 'Sala 105', '1º andar - Bloco A', 'Sala de aula', 40);
