# Alterações implementadas

## Arquivos novos

- `gestao.html`: módulo complementar de solicitações, aprovação, calendário, cadastros e delegação. Foi criado separado para preservar a tela de reserva já funcional.
- `gestao.js`: regra do módulo complementar. Os dados ficam no `localStorage` do navegador para demonstrar os fluxos sem alterar a lógica existente em `script.js`.
- `painel.html`: tela pública para TV, sem login, que mostra as atividades aprovadas do turno atual por andar e sala.
- `server.js`: API Node.js que serve o sistema e grava/consulta reservas no MySQL.
- `database.sql`: schema MySQL para usuários, salas, recursos, responsáveis por setor e reservas.
- `.env.example`: modelo de configuração local da conexão MySQL, sem senha versionada.

## Arquivos existentes

- `index.html`: o menu agora oferece **Gestão de Salas** e **Painel Público**.
- `reservas.html`: recebeu os mesmos dois links no menu. A grade de reserva rápida e seu funcionamento não foram modificados.
- `script.js` e `style.css`: não foram alterados.

### Alteração posterior: persistência MySQL

- `script.js`: a grade de reservas deixou de gerar ocupações aleatórias. Agora consulta `GET /api/ocupacao` e, ao confirmar, envia `POST /api/reservas`; o horário só muda para ocupado após a API confirmar a gravação no banco. A lista de reservas também vem de `GET /api/reservas`.
- `script.js` (correção): a grade permanece visível quando a página é aberta pelo Live Server ou como arquivo local. Nessas situações ela usa a API em `http://localhost:3000/api`; se o banco estiver indisponível, exibe os horários livres, mas a confirmação informa a falha em vez de gravar localmente.
- `server.js` (correção): as datas retornam em `YYYY-MM-DD`, formato compatível com o seletor da tela, e a API aceita consultas do Live Server por CORS.
- `scripts/corrigir-acentuacao.js`: migração pontual para recuperar os nomes iniciais gravados com `?` na primeira importação do schema pelo PowerShell. A correção usa `utf8mb4` diretamente pelo driver MySQL.
- `package.json`: recebeu os comandos para iniciar a API Node (`npm start`) e suas dependências.
- `database.sql` foi aplicado no MySQL local em 27/08/2026. A API foi testada contra o banco: uma reserva aprovada apareceu no endpoint de ocupação e o registro técnico foi removido após o teste.

Os links foram incluídos para que as novas funções façam parte da navegação do sistema principal, sem substituir a tela de reserva que já estava funcional.

## Limitação para produção

`localStorage` é adequado apenas ao protótipo: não oferece autenticação nem proteção real entre usuários. Para a regra “cada pessoa só pode alterar a própria reserva” ser segura em produção, o mesmo fluxo deve ser ligado a uma API, banco de dados e autenticação no servidor.
