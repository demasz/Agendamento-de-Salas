const API_BASE = window.location.port === '3000' ? '/api' : 'http://localhost:3000/api';
const CHAVE_SESSAO = 'senac-usuario-logado';
const modal = document.getElementById('modal');
const openBtn = document.getElementById('openFormBtn');
const logoutBtn = document.getElementById('logoutBtn');
const closeBtn = document.getElementById('closeFormBtn');
const loginForm = modal?.querySelector('form');
const toggleCadastro = document.getElementById('toggleCadastro');
const campoNome = document.getElementById('campoNome');
const campoConfirmacaoSenha = document.getElementById('campoConfirmacaoSenha');
const formTitle = document.getElementById('formTitle');
const formDescription = document.getElementById('formDescription');
const mensagemAcesso = document.getElementById('mensagemAcesso');
let destinoPendente = null;
let modoCadastro = false;

function usuarioLogado() {
  try { return JSON.parse(localStorage.getItem(CHAVE_SESSAO)); } catch { return null; }
}

function alterarModoAcesso(cadastro) {
  modoCadastro = cadastro;
  if (!loginForm) return;
  const nome = loginForm.elements.nome;
  const confirmacaoSenha = loginForm.elements.confirmacaoSenha;
  campoNome.hidden = !cadastro;
  campoConfirmacaoSenha.hidden = !cadastro;
  nome.required = cadastro;
  confirmacaoSenha.required = cadastro;
  loginForm.elements.senha.autocomplete = cadastro ? 'new-password' : 'current-password';
  formTitle.textContent = cadastro ? 'Criar conta' : 'Acessar conta';
  formDescription.textContent = cadastro
    ? 'Preencha seus dados para realizar o primeiro acesso.'
    : 'Informe seus dados para continuar.';
  toggleCadastro.textContent = cadastro
    ? 'Já possui uma conta? Acessar'
    : 'É seu primeiro acesso? Crie sua conta';
  mensagemAcesso.textContent = '';
}

function fecharLogin() {
  modal.close();
  loginForm?.reset();
  alterarModoAcesso(false);
}

function atualizarNavegacao() {
  const autenticado = Boolean(usuarioLogado());
  if (openBtn) openBtn.hidden = autenticado;
  if (logoutBtn) logoutBtn.hidden = !autenticado;
}

function abrirLogin(destino = null) {
  destinoPendente = destino;
  alterarModoAcesso(false);
  if (modal && !modal.open) modal.showModal();
}

if (modal && openBtn && closeBtn) {
  openBtn.addEventListener('click', () => {
    abrirLogin();
  });
  closeBtn.addEventListener('click', () => {
    fecharLogin();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(CHAVE_SESSAO);
    destinoPendente = null;
    atualizarNavegacao();
  });
}

if (toggleCadastro) {
  toggleCadastro.addEventListener('click', () => alterarModoAcesso(!modoCadastro));
}

document.querySelectorAll('nav a').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (usuarioLogado()) return;
    event.preventDefault();
    abrirLogin({ href: link.href, target: link.target });
  });
});

if (loginForm) {
  const loginMensagem = mensagemAcesso;
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const botao = loginForm.querySelector('[type="submit"]');
    const email = loginForm.email.value.trim();
    const senha = loginForm.senha.value;
    const nome = loginForm.elements.nome.value.trim();
    const confirmacaoSenha = loginForm.elements.confirmacaoSenha.value;
    if (modoCadastro && senha !== confirmacaoSenha) {
      loginMensagem.textContent = 'As senhas informadas não são iguais.';
      loginForm.elements.confirmacaoSenha.focus();
      return;
    }
    if (!loginForm.reportValidity()) return;
    botao.disabled = true;
    loginMensagem.textContent = modoCadastro ? 'Criando conta...' : 'Validando acesso...';
    try {
      const resposta = await fetch(`${API_BASE}${modoCadastro ? '/usuarios' : '/login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modoCadastro ? { nome, email, senha } : { email, senha })
      });
      const usuario = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(usuario.error || 'NÃ£o foi possÃ­vel entrar.');
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
      fecharLogin();
      atualizarNavegacao();
      if (destinoPendente) {
        const { href, target } = destinoPendente;
        destinoPendente = null;
        if (target === '_blank') window.open(href, '_blank'); else window.location.href = href;
      }
    } catch (erro) {
      const falhaDeConexao = erro instanceof TypeError && /failed to fetch/i.test(erro.message);
      loginMensagem.textContent = falhaDeConexao
        ? 'Não foi possível conectar ao servidor. Inicie o sistema com “npm start” e acesse http://localhost:3000.'
        : erro.message;
    } finally {
      botao.disabled = false;
    }
  });
}

atualizarNavegacao();

const btnTopo = document.getElementById('btnTopo');

if (btnTopo) {
  btnTopo.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const grade = document.getElementById('gradeSalas');
if (grade) {
  const salas = [
    { id: 'sala-101', nome: 'Sala 101' },
    { id: 'sala-102', nome: 'Sala 102' },
    { id: 'lab-informatica', nome: 'Lab. Informática' },
    { id: 'auditorio', nome: 'Auditório' },
    { id: 'sala-105', nome: 'Sala 105' },
  ];

  const horarios = [
    '08:00 - 10:00',
    '10:15 - 12:15',
    '13:30 - 15:30',
    '15:45 - 17:45',
    '19:00 - 21:00',
    '21:15 - 23:00',
  ];

  const dataInput = document.getElementById('dataReserva');
  const resumoTexto = document.getElementById('resumoTexto');
  const btnConfirmar = document.getElementById('btnConfirmar');
  const listaReservas = document.getElementById('listaReservas');
  const dialogConfirmacao = document.getElementById('dialogConfirmacao');
  const resumoDialog = document.getElementById('resumoDialog');
  const btnConfirmarFinal = document.getElementById('btnConfirmarFinal');
  const btnCancelarDialog = document.getElementById('btnCancelarDialog');
  const painelAprovacoes = document.getElementById('painelAprovacoes');
  const listaPendentes = document.getElementById('listaPendentes');
  const avisoPendentes = document.getElementById('avisoPendentes');

  let selecaoAtual = null;

  function chaveOcupacao(data) {
    return `senac-ocupacao-${data}`;
  }

  function chaveReservas() {
    return 'senac-minhas-reservas';
  }

  async function carregarOcupacao(data) {
    const resposta = await fetch(`${API_BASE}/ocupacao?data=${encodeURIComponent(data)}`);
    if (!resposta.ok) throw new Error('Não foi possível consultar a ocupação no banco.');
    const registros = await resposta.json();
    return Object.fromEntries(registros.map((registro) => [registro.chave, registro]));
  }

  function salvarOcupacao(data, ocupacao) {
    localStorage.setItem(chaveOcupacao(data), JSON.stringify(ocupacao));
  }

  async function carregarMinhasReservas() {
    const usuario = usuarioLogado();
    if (!usuario?.id) return [];
    const resposta = await fetch(`${API_BASE}/reservas?usuario_id=${encodeURIComponent(usuario.id)}`);
    if (!resposta.ok) throw new Error('Não foi possível consultar suas reservas no banco.');
    return resposta.json();
  }

  function podeAprovar() {
    return ['ADMIN', 'GESTOR'].includes(usuarioLogado()?.papel);
  }

  async function carregarPendentes() {
    const usuario = usuarioLogado();
    if (!podeAprovar() || !usuario?.id) return [];
    const resposta = await fetch(`${API_BASE}/gestao/pendentes?usuario_id=${encodeURIComponent(usuario.id)}`);
    if (!resposta.ok) throw new Error('Não foi possível carregar as solicitações pendentes.');
    return resposta.json();
  }

  function textoStatus(status) {
    return ({ PENDENTE: 'Aguardando aprovação', APROVADA: 'Aprovada', RECUSADA: 'Recusada', CANCELADA: 'Cancelada' })[status] || status;
  }

  function salvarMinhasReservas(reservas) {
    localStorage.setItem(chaveReservas(), JSON.stringify(reservas));
  }

  function criarCelula(texto, classe) {
    const el = document.createElement('div');
    el.className = classe;
    el.textContent = texto;
    return el;
  }

  function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function limparResumo() {
    resumoTexto.textContent = 'Selecione um horário livre na grade acima.';
    btnConfirmar.disabled = true;
    selecaoAtual = null;
  }

  function selecionarCelula(celula, sala, horario, data) {
    document.querySelectorAll('.celula-sala.selecionada').forEach((c) => c.classList.remove('selecionada'));
    celula.classList.add('selecionada');

    selecaoAtual = { sala, horario, data, chave: celula.dataset.chave };
    resumoTexto.textContent = `${sala.nome} · ${horario} · ${formatarData(data)}`;
    btnConfirmar.disabled = false;
  }

  async function renderizarGrade() {
    const data = dataInput.value;
    let ocupacao;
    let minhasReservas;
    try {
      [ocupacao, minhasReservas] = await Promise.all([carregarOcupacao(data), carregarMinhasReservas()]);
    } catch (erro) {
      ocupacao = {};
      minhasReservas = [];
      resumoTexto.textContent = 'Grade disponível. A confirmação depende da conexão com o banco de dados.';
    }

    grade.innerHTML = '';
    grade.style.setProperty('--colunas', salas.length);

    grade.appendChild(criarCelula('', 'celula-cabecalho'));
    salas.forEach((sala) => {
      grade.appendChild(criarCelula(sala.nome, 'celula-cabecalho'));
    });

    horarios.forEach((horario) => {
      grade.appendChild(criarCelula(horario, 'celula-cabecalho celula-horario'));

      salas.forEach((sala) => {
        const chave = `${sala.id}|${horario}`;
        const reservaExistente = minhasReservas.find((r) => r.data === data && r.chave === chave && ['PENDENTE', 'APROVADA'].includes(r.status));

        const celula = document.createElement('button');
        celula.type = 'button';
        celula.className = 'celula-sala';
        celula.dataset.chave = chave;

        if (reservaExistente) {
          celula.classList.add('minha-reserva');
          if (reservaExistente.status === 'PENDENTE') celula.classList.add('pendente');
          celula.textContent = reservaExistente.status === 'PENDENTE' ? 'Pendente' : 'Sua reserva';
          celula.disabled = true;
        } else if (ocupacao[chave]) {
          celula.classList.add('ocupada');
          celula.textContent = 'Ocupada';
          celula.disabled = true;
        } else {
          celula.classList.add('livre');
          celula.textContent = 'Livre';
          celula.addEventListener('click', () => selecionarCelula(celula, sala, horario, data));
        }

        grade.appendChild(celula);
      });
    });

    limparResumo();
  }

  async function renderizarMinhasReservas() {
    let minhasReservas;
    try {
      minhasReservas = await carregarMinhasReservas();
    } catch (erro) {
      listaReservas.innerHTML = '<li class="reserva-vazia">Não foi possível carregar as reservas.</li>';
      return;
    }
    listaReservas.innerHTML = '';

    if (minhasReservas.length === 0) {
      const vazio = document.createElement('li');
      vazio.className = 'reserva-vazia';
      vazio.textContent = 'Você ainda não tem reservas.';
      listaReservas.appendChild(vazio);
      return;
    }

    minhasReservas
      .slice()
      .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
      .forEach((reserva) => {
        const item = document.createElement('li');
        item.className = 'item-reserva';

        const nomeSala = document.createElement('span');
        nomeSala.className = 'item-reserva-sala';
        nomeSala.textContent = reserva.salaNome;

        const detalhe = document.createElement('span');
        detalhe.className = 'item-reserva-detalhe';
        detalhe.textContent = `${formatarData(reserva.data)} · ${reserva.horario}`;

        item.appendChild(nomeSala);
        item.appendChild(detalhe);
        const status = document.createElement('span');
        status.className = `item-reserva-status ${reserva.status.toLowerCase()}`;
        status.textContent = textoStatus(reserva.status);
        item.appendChild(status);
        if (['PENDENTE', 'APROVADA'].includes(reserva.status)) {
          const acoes = document.createElement('div');
          acoes.className = 'acoes-reserva';
          const cancelar = document.createElement('button');
          cancelar.type = 'button';
          cancelar.className = 'btn-cancelar';
          cancelar.textContent = 'Cancelar solicitação';
          cancelar.addEventListener('click', () => cancelarReserva(reserva.id));
          acoes.appendChild(cancelar);
          item.appendChild(acoes);
        }
        listaReservas.appendChild(item);
      });
  }

  async function cancelarReserva(id) {
    const usuario = usuarioLogado();
    if (!usuario?.id) return;
    try {
      const resposta = await fetch(`${API_BASE}/reservas/${id}/cancelar`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: usuario.id })
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.error || 'Não foi possível cancelar a solicitação.');
      await Promise.all([renderizarGrade(), renderizarMinhasReservas(), renderizarPendentes()]);
    } catch (erro) {
      resumoTexto.textContent = erro.message;
    }
  }

  async function decidirSolicitacao(id, status) {
    const usuario = usuarioLogado();
    if (!usuario?.id) return;
    try {
      const resposta = await fetch(`${API_BASE}/gestao/reservas/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: usuario.id, status })
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.error || 'Não foi possível atualizar a solicitação.');
      await Promise.all([renderizarGrade(), renderizarMinhasReservas(), renderizarPendentes()]);
    } catch (erro) {
      avisoPendentes.textContent = erro.message;
    }
  }

  async function renderizarPendentes() {
    if (!painelAprovacoes || !listaPendentes || !avisoPendentes) return;
    painelAprovacoes.hidden = !podeAprovar();
    if (!podeAprovar()) return;
    try {
      const pendentes = await carregarPendentes();
      listaPendentes.innerHTML = '';
      avisoPendentes.textContent = pendentes.length ? `${pendentes.length} aguardando sua decisão.` : 'Nenhuma solicitação pendente.';
      pendentes.forEach((reserva) => {
        const item = document.createElement('li');
        item.className = 'item-reserva';
        const titulo = document.createElement('span');
        titulo.className = 'item-reserva-sala';
        titulo.textContent = `${reserva.sala_nome} · ${reserva.solicitante}`;
        const detalhe = document.createElement('span');
        detalhe.className = 'item-reserva-detalhe';
        detalhe.textContent = `${formatarData(String(reserva.data_reserva).slice(0, 10))} · ${reserva.horario} · ${reserva.participantes} participante(s)`;
        const acoes = document.createElement('div');
        acoes.className = 'acoes-reserva';
        const aprovar = document.createElement('button');
        aprovar.type = 'button';
        aprovar.textContent = 'Aprovar';
        aprovar.addEventListener('click', () => decidirSolicitacao(reserva.id, 'APROVADA'));
        const recusar = document.createElement('button');
        recusar.type = 'button';
        recusar.className = 'btn-recusar';
        recusar.textContent = 'Recusar';
        recusar.addEventListener('click', () => decidirSolicitacao(reserva.id, 'RECUSADA'));
        acoes.append(aprovar, recusar);
        item.append(titulo, detalhe, acoes);
        listaPendentes.appendChild(item);
      });
    } catch (erro) {
      avisoPendentes.textContent = erro.message;
    }
  }

  btnConfirmar.addEventListener('click', () => {
    if (!selecaoAtual) return;
    if (!usuarioLogado()?.id) {
      abrirLogin();
      return;
    }
    resumoDialog.textContent = `${selecaoAtual.sala.nome} · ${selecaoAtual.horario} · ${formatarData(selecaoAtual.data)}`;
    dialogConfirmacao.showModal();
  });

  btnCancelarDialog.addEventListener('click', () => {
    dialogConfirmacao.close();
  });

  btnConfirmarFinal.addEventListener('click', async () => {
    if (!selecaoAtual) return;
    const usuario = usuarioLogado();
    if (!usuario?.id) {
      dialogConfirmacao.close();
      abrirLogin();
      return;
    }
    btnConfirmarFinal.disabled = true;
    try {
      const resposta = await fetch(`${API_BASE}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salaSlug: selecaoAtual.sala.id,
          data: selecaoAtual.data,
          horario: selecaoAtual.horario,
          usuarioId: usuario.id,
          finalidade: 'Reserva de sala',
          participantes: 1,
        }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.error || 'Não foi possível salvar a reserva.');
      dialogConfirmacao.close();
      await renderizarGrade();
      await renderizarMinhasReservas();
      await renderizarPendentes();
      resumoTexto.textContent = 'Solicitação enviada. Aguarde a aprovação de um administrador.';
    } catch (erro) {
      resumoDialog.textContent = erro.message;
    } finally {
      btnConfirmarFinal.disabled = false;
    }
  });

  dataInput.addEventListener('change', renderizarGrade);

  // Inicialização
  dataInput.value = new Date().toISOString().split('T')[0];
  renderizarGrade();
  renderizarMinhasReservas();
  renderizarPendentes();
}
