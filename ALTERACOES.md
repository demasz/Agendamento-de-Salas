# Alterações implementadas

## Arquivos novos

- `gestao.html`: módulo complementar de solicitações, aprovação, calendário, cadastros e delegação. Foi criado separado para preservar a tela de reserva já funcional.
- `gestao.js`: regra do módulo complementar. Os dados ficam no `localStorage` do navegador para demonstrar os fluxos sem alterar a lógica existente em `script.js`.
- `painel.html`: tela pública para TV, sem login, que mostra as atividades aprovadas do turno atual por andar e sala.

## Arquivos existentes

- `index.html`: o menu agora oferece **Gestão de Salas** e **Painel Público**.
- `reservas.html`: recebeu os mesmos dois links no menu. A grade de reserva rápida e seu funcionamento não foram modificados.
- `script.js` e `style.css`: não foram alterados.

Os links foram incluídos para que as novas funções façam parte da navegação do sistema principal, sem substituir a tela de reserva que já estava funcional.

## Limitação para produção

`localStorage` é adequado apenas ao protótipo: não oferece autenticação nem proteção real entre usuários. Para a regra “cada pessoa só pode alterar a própria reserva” ser segura em produção, o mesmo fluxo deve ser ligado a uma API, banco de dados e autenticação no servidor.
