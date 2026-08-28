// ---------------------------------
// Modal de login (index.html / reservas.html)
// ---------------------------------
const modal = document.getElementById('modal');
const openBtn = document.getElementById('openFormBtn');
const closeBtn = document.getElementById('closeFormBtn');

if (modal && openBtn && closeBtn) {
  openBtn.addEventListener('click', () => {
    modal.showModal();
  });
  closeBtn.addEventListener('click', () => {
    modal.close();
  });
}

// ---------------------------------
// Botão de voltar ao topo (footer)
// ---------------------------------
const btnTopo = document.getElementById('btnTopo');

if (btnTopo) {
  btnTopo.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---------------------------------
// Reserva de salas estilo cinema (reservas.html)
// ---------------------------------
const grade = document.getElementById('gradeSalas');
const API_BASE = window.location.port === '3000' ? '/api' : 'http://localhost:3000/api';

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
    const resposta = await fetch(`${API_BASE}/reservas?usuario_id=1`);
    if (!resposta.ok) throw new Error('Não foi possível consultar suas reservas no banco.');
    return resposta.json();
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
        const reservaExistente = minhasReservas.find((r) => r.data === data && r.chave === chave);

        const celula = document.createElement('button');
        celula.type = 'button';
        celula.className = 'celula-sala';
        celula.dataset.chave = chave;

        if (reservaExistente) {
          celula.classList.add('minha-reserva');
          celula.textContent = 'Sua reserva';
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
        listaReservas.appendChild(item);
      });
  }

  btnConfirmar.addEventListener('click', () => {
    if (!selecaoAtual) return;
    resumoDialog.textContent = `${selecaoAtual.sala.nome} · ${selecaoAtual.horario} · ${formatarData(selecaoAtual.data)}`;
    dialogConfirmacao.showModal();
  });

  btnCancelarDialog.addEventListener('click', () => {
    dialogConfirmacao.close();
  });

  btnConfirmarFinal.addEventListener('click', async () => {
    if (!selecaoAtual) return;
    btnConfirmarFinal.disabled = true;
    try {
      const resposta = await fetch(`${API_BASE}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salaSlug: selecaoAtual.sala.id,
          data: selecaoAtual.data,
          horario: selecaoAtual.horario,
          usuarioId: 1,
          finalidade: 'Reserva de sala',
          participantes: 1,
          status: 'APROVADA',
        }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.error || 'Não foi possível salvar a reserva.');
      dialogConfirmacao.close();
      await renderizarGrade();
      await renderizarMinhasReservas();
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
}
