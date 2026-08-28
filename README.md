# Agendamento-de-Salas
Desenvolvido como um projeto acadêmico, o sistema de Agendamento de Salas do Senac foi criado para simplificar e organizar a reserva de espaços educacionais. Com uma interface moderna, intuitiva e acessível, a plataforma permite que alunos e professores consultem horários disponíveis e realizem suas reservas de forma rápida e descomplicada.

## Executar com banco de dados

1. Confirme que o serviço **MySQL Server** está em execução.
2. Crie o arquivo `.env` a partir de `.env.example` e informe as credenciais locais.
3. Execute `database.sql` no MySQL Workbench (uma única vez).
4. No terminal do projeto, execute `npm start`.
5. Acesse `http://localhost:3000/reservas.html`.

A grade de reservas consulta o MySQL. Ao confirmar uma reserva, a API verifica conflito de horário, grava no banco e devolve a ocupação atualizada.
