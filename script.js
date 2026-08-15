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

  function carregarOcupacao(data) {
    const salvo = localStorage.getItem(chaveOcupacao(data));
    if (salvo) return JSON.parse(salvo);

    // Ocupação inicial simulada: algumas salas já reservadas por outros professores
    const ocupadas = {};
    salas.forEach((sala) => {
      horarios.forEach((horario) => {
        ocupadas[`${sala.id}|${horario}`] = Math.random() < 0.25;
      });
    });
    localStorage.setItem(chaveOcupacao(data), JSON.stringify(ocupadas));
    return ocupadas;
  }

  function salvarOcupacao(data, ocupacao) {
    localStorage.setItem(chaveOcupacao(data), JSON.stringify(ocupacao));
  }

  function carregarMinhasReservas() {
    const salvo = localStorage.getItem(chaveReservas());
    return salvo ? JSON.parse(salvo) : [];
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

  function renderizarGrade() {
    const data = dataInput.value;
    const ocupacao = carregarOcupacao(data);
    const minhasReservas = carregarMinhasReservas();

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

  function renderizarMinhasReservas() {
    const minhasReservas = carregarMinhasReservas();
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

  btnConfirmarFinal.addEventListener('click', () => {
    if (!selecaoAtual) return;

    const ocupacao = carregarOcupacao(selecaoAtual.data);
    ocupacao[selecaoAtual.chave] = true;
    salvarOcupacao(selecaoAtual.data, ocupacao);

    const minhasReservas = carregarMinhasReservas();
    minhasReservas.push({
      data: selecaoAtual.data,
      chave: selecaoAtual.chave,
      horario: selecaoAtual.horario,
      salaNome: selecaoAtual.sala.nome,
    });
    salvarMinhasReservas(minhasReservas);

    dialogConfirmacao.close();
    renderizarGrade();
    renderizarMinhasReservas();
  });

  dataInput.addEventListener('change', renderizarGrade);

  // Inicialização
  dataInput.value = new Date().toISOString().split('T')[0];
  renderizarGrade();
  renderizarMinhasReservas();
}