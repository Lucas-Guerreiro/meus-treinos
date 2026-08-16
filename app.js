// ESTADO GLOBAL DO APLICATIVO
let state = {
  treinos: [],
  treinoAtivo: null,
  historico: [],
  exercicioAtivoIndex: 0,
  seriesConcluidas: [], // Array de arrays de booleanos: [[false, false], [false, false, false]]
  timerInterval: null,
  timerSegundosRestantes: 0,
  timerSegundosTotais: 0,
  audioAlertaExecutando: null
};

// EXERCÍCIOS ADICIONADOS DURANTE A CRIAÇÃO DE TREINO
let exerciciosTemporariosCadastro = [];

// DATA DE HOJE FORMATADA
function formatarDataDeHoje() {
  const opcoes = { weekday: 'long', day: 'numeric', month: 'short' };
  const hoje = new Date();
  let dataFormatada = hoje.toLocaleDateString('pt-BR', opcoes);
  // Capitaliza a primeira letra
  return dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
}

// INICIALIZAÇÃO DO APP
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('current-date').innerText = formatarDataDeHoje();
  
  carregarDados();
  
  // Se não houver treinos, cria treinos padrão para o usuário testar de imediato
  if (state.treinos.length === 0) {
    criarTreinosPadrao();
  }

  inicializarBiblioteca();
  inicializarEventos();
  renderizarDashboard();
  
  // Ativa Lucide Icons
  lucide.createIcons();

  // Recupera o treino ativo se houver sessão recente (menos de 2 horas)
  recuperarEstadoTreinoAtivo();

  // Registrar Service Worker para suporte PWA offline completo na academia
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado com sucesso:', reg.scope))
      .catch(err => console.error('Erro ao registrar Service Worker:', err));
  }
});

// CARREGAR DADOS DO LOCALSTORAGE
function carregarDados() {
  const treinosSalvos = localStorage.getItem('meus-treinos-data');
  const historicoSalvo = localStorage.getItem('meus-treinos-historico');
  
  if (treinosSalvos) {
    state.treinos = JSON.parse(treinosSalvos);
  }
  if (historicoSalvo) {
    state.historico = JSON.parse(historicoSalvo);
  }
}

// SALVAR DADOS NO LOCALSTORAGE
function salvarDados() {
  localStorage.setItem('meus-treinos-data', JSON.stringify(state.treinos));
  localStorage.setItem('meus-treinos-historico', JSON.stringify(state.historico));
}

// CRIAR TREINOS PADRÃO (PRIMEIRA EXECUÇÃO)
function criarTreinosPadrao() {
  const treinoA = {
    id: 'treino-padrao-a',
    nome: 'Treino A - Superior (Foco Peito/Tríceps)',
    descricao: 'Treino focado em empurrar. Hipertrofia.',
    exercicios: [
      {
        id: 'supino_reto',
        nome: 'Supino Reto com Barra',
        grupo: 'Peito',
        series: 4,
        repeticoes: '10',
        carga: 40,
        descanso: 60
      },
      {
        id: 'supino_inclinado_halteres',
        nome: 'Supino Inclinado com Halteres',
        grupo: 'Peito',
        series: 4,
        repeticoes: '12',
        carga: 18,
        descanso: 60
      },
      {
        id: 'desenvolvimento_halteres',
        nome: 'Desenvolvimento com Halteres',
        grupo: 'Ombros',
        series: 3,
        repeticoes: '10',
        carga: 12,
        descanso: 75
      },
      {
        id: 'tricep_pulley',
        nome: 'Tríceps na Polia (Corda)',
        grupo: 'Braços',
        series: 3,
        repeticoes: '12',
        carga: 20,
        descanso: 45
      }
    ]
  };

  const treinoB = {
    id: 'treino-padrao-b',
    nome: 'Treino B - Inferior (Pernas)',
    descricao: 'Foco em quadríceps e posterior.',
    exercicios: [
      {
        id: 'agachamento_livre',
        nome: 'Agachamento Livre com Barra',
        grupo: 'Pernas',
        series: 4,
        repeticoes: '8',
        carga: 50,
        descanso: 90
      },
      {
        id: 'leg_press_45',
        nome: 'Leg Press 45°',
        grupo: 'Pernas',
        series: 3,
        repeticoes: '12',
        carga: 120,
        descanso: 60
      },
      {
        id: 'cadeira_extensora',
        nome: 'Cadeira Extensora',
        grupo: 'Pernas',
        series: 3,
        repeticoes: '15',
        carga: 35,
        descanso: 45
      },
      {
        id: 'abdominal_infra',
        nome: 'Abdominal Infra no Chão',
        grupo: 'Core',
        series: 3,
        repeticoes: '15',
        carga: 0,
        descanso: 45
      }
    ]
  };

  state.treinos = [treinoA, treinoB];
  salvarDados();
}

// INICIALIZAR EVENTOS DO APP
function inicializarEventos() {
  // Navegação de abas principais
  document.getElementById('nav-btn-dashboard').addEventListener('click', () => showView('view-dashboard'));
  document.getElementById('nav-btn-biblioteca').addEventListener('click', () => showView('view-biblioteca'));
  document.getElementById('nav-btn-treino-ativo').addEventListener('click', () => {
    if (state.treinoAtivo) showView('view-treino-ativo');
  });

  // Ações do Dashboard
  document.getElementById('btn-novo-treino-view').addEventListener('click', () => abrirCadastroTreino());
  document.getElementById('btn-importar-treino-view').addEventListener('click', () => {
    document.getElementById('import-text-input').value = '';
    showView('view-importar-treino');
  });

  // Ações do Formulário de Importação
  document.getElementById('btn-cancelar-importacao').addEventListener('click', () => showView('view-dashboard'));
  document.getElementById('btn-cancelar-importacao-alt').addEventListener('click', () => showView('view-dashboard'));
  document.getElementById('form-importar').addEventListener('submit', processarImportacaoTexto);

  // Ações do Cadastro de Treino
  document.getElementById('btn-cancelar-cadastro').addEventListener('click', () => showView('view-dashboard'));
  document.getElementById('btn-cancelar-cadastro-alt').addEventListener('click', () => showView('view-dashboard'));
  document.getElementById('btn-abrir-seletor-exercicio').addEventListener('click', abrirSeletorExercicio);
  document.getElementById('btn-fechar-seletor').addEventListener('click', fecharSeletorExercicio);
  document.getElementById('form-treino').addEventListener('submit', salvarTreino);

  // Busca na Biblioteca
  document.getElementById('busca-exercicio').addEventListener('input', filtrarBiblioteca);
  
  // Chips de filtro da biblioteca
  document.querySelectorAll('#filtro-grupos .filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('#filtro-grupos .filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      filtrarBiblioteca();
    });
  });

  // Busca e criação customizada no Seletor de Exercícios
  document.getElementById('busca-seletor').addEventListener('input', filtrarSeletor);
  document.getElementById('btn-criar-customizado').addEventListener('click', criarExercicioCustomizado);

  // Ações do Treino Ativo (Player)
  document.getElementById('btn-ex-anterior').addEventListener('click', anteriorExercicio);
  document.getElementById('btn-ex-proximo').addEventListener('click', proximoExercicio);
  document.getElementById('btn-toggle-como-fazer').addEventListener('click', toggleGuiaComoFazer);
  document.getElementById('btn-cancelar-treino-ativo').addEventListener('click', confirmarSaidaTreino);
  document.getElementById('btn-finalizar-treino').addEventListener('click', finalizarTreino);

  // Ações do Timer de Descanso
  document.getElementById('btn-timer-add-15').addEventListener('click', () => adicionarTempoDescanso(15));
  document.getElementById('btn-timer-pular').addEventListener('click', pularDescanso);
}

// NAVEGAÇÃO DE TELAS (Single Page Application)
function showView(viewId) {
  // Esconde todas
  document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  
  // Mostra a selecionada
  const activeView = document.getElementById(viewId);
  if (activeView) {
    activeView.classList.add('active');
  }

  // Ativa botão correspondente
  if (viewId === 'view-dashboard') {
    document.getElementById('nav-btn-dashboard').classList.add('active');
  } else if (viewId === 'view-biblioteca') {
    document.getElementById('nav-btn-biblioteca').classList.add('active');
  } else if (viewId === 'view-treino-ativo') {
    document.getElementById('nav-btn-treino-ativo').classList.add('active');
  }

  // Fecha o teclado se estiver aberto
  document.activeElement.blur();
  
  // Renderiza ícones
  lucide.createIcons();

  // Salva a aba em que o usuário está se ele tiver um treino ativo
  salvarEstadoTreinoAtivo(viewId);
}

// RENDERIZAR O DASHBOARD PRINCIPAL
function renderizarDashboard() {
  const treinosList = document.getElementById('treinos-list');
  const statsTotal = document.getElementById('stats-total-treinos');
  const statsHoje = document.getElementById('stats-concluidos-hoje');
  
  statsTotal.innerText = state.treinos.length;
  
  // Conta treinos concluídos hoje no histórico
  const hojeStr = new Date().toDateString();
  const concluidosHoje = state.historico.filter(h => new Date(h.dataConclusao).toDateString() === hojeStr).length;
  statsHoje.innerText = concluidosHoje;

  if (state.treinos.length === 0) {
    treinosList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="clipboard-list"></i>
        <p>Nenhum treino criado ainda. Clique em "Novo Treino" para começar!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  treinosList.innerHTML = '';
  
  state.treinos.forEach(treino => {
    const card = document.createElement('div');
    card.className = 'treino-card';
    
    // Lista curta de nomes dos exercícios
    const exTags = treino.exercicios.map(ex => `<span class="exercise-tag">${ex.nome} (${ex.grupo})</span>`).join('');
    
    card.innerHTML = `
      <div class="treino-card-header">
        <div class="treino-card-info">
          <h4>${treino.nome}</h4>
          <p>${treino.descricao || 'Sem descrição'}</p>
        </div>
        <div class="treino-actions-top">
          <button class="btn btn-circle btn-sm" onclick="editarTreino('${treino.id}')" title="Editar">
            <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn btn-circle btn-sm" onclick="deletarTreino('${treino.id}')" title="Excluir" style="color:var(--danger)">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </div>
      </div>
      <div class="treino-card-exercises">
        ${exTags}
      </div>
      <div class="treino-card-actions">
        <button class="btn btn-primary" onclick="iniciarTreino('${treino.id}')">
          <i data-lucide="play" style="width:16px;height:16px;"></i> Iniciar Treino
        </button>
      </div>
    `;
    treinosList.appendChild(card);
  });
  
  lucide.createIcons();
}

// INICIALIZAR BIBLIOTECA DE EXERCÍCIOS
function inicializarBiblioteca() {
  const container = document.getElementById('exercicios-lista-container');
  container.innerHTML = '';
  
  // EXERCICIOS_PADRAO vem de exercicios.js
  EXERCICIOS_PADRAO.forEach(ex => {
    const card = document.createElement('div');
    card.className = 'exercicio-item-card';
    card.dataset.id = ex.id;
    card.dataset.grupo = ex.grupo;
    card.dataset.nome = ex.nome.toLowerCase();
    
    const passosHtml = ex.passos.map(passo => `<li>${passo}</li>`).join('');
    
    card.innerHTML = `
      <div class="exercicio-item-header" onclick="toggleCardBiblioteca('${ex.id}')">
        <div class="exercicio-item-header-info">
          <span class="exercise-group-badge">${ex.grupo}</span>
          <h4>${ex.nome} (${ex.grupo})</h4>
        </div>
        <i data-lucide="chevron-down"></i>
      </div>
      <div class="exercicio-item-body">
        ${ex.imagem ? `
        <div class="exercise-illustration-container" style="margin-bottom: 12px;">
          <img src="${ex.imagem}" alt="${ex.nome}" class="exercise-illustration">
        </div>
        ` : ''}
        ${ex.videoUrl ? `
        <div class="media-actions" style="padding: 0 0 12px 0;">
          <a href="${ex.videoUrl}" target="_blank" class="btn btn-secondary btn-sm btn-video-demo">
            <i data-lucide="play-circle"></i> Assistir Vídeo Demonstrativo
          </a>
        </div>
        ` : ''}
        <div class="instruction-section">
          <h5><i data-lucide="navigation" style="width:12px;height:12px"></i> Como Executar</h5>
          <ol>${passosHtml}</ol>
        </div>
        <div class="instruction-section">
          <h5><i data-lucide="sparkles" style="width:12px;height:12px"></i> Dica de Ouro</h5>
          <p>${ex.dicas}</p>
        </div>
        <div class="warning-box">
          <h5><i data-lucide="alert-triangle" style="width:14px;height:14px"></i> Erros Comuns</h5>
          <p>${ex.erros}</p>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

// ABRIR/FECHAR DETALHES NA BIBLIOTECA
function toggleCardBiblioteca(id) {
  const cards = document.querySelectorAll('.exercicio-item-card');
  cards.forEach(card => {
    if (card.dataset.id === id) {
      card.classList.toggle('expanded');
    } else {
      card.classList.remove('expanded');
    }
  });
}

// FILTRAR BIBLIOTECA POR NOME E GRUPO MUSCULAR
function filtrarBiblioteca() {
  const query = document.getElementById('busca-exercicio').value.toLowerCase();
  const grupoAtivo = document.querySelector('#filtro-grupos .filter-chip.active').dataset.grupo;
  const cards = document.querySelectorAll('.exercicio-item-card');
  
  cards.forEach(card => {
    const nomeMatches = card.dataset.nome.includes(query);
    const grupoMatches = (grupoAtivo === 'todos') || (card.dataset.grupo === grupoAtivo);
    
    if (nomeMatches && grupoMatches) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// --- CADASTRO E EDIÇÃO DE TREINO ---

// ABRIR FORMULÁRIO DE CADASTRO
function abrirCadastroTreino(treinoId = null) {
  const titulo = document.getElementById('cadastro-titulo');
  const campoId = document.getElementById('cadastro-treino-id');
  const campoNome = document.getElementById('treino-nome');
  const campoDescricao = document.getElementById('treino-descricao');
  
  campoId.value = treinoId || '';
  campoNome.value = '';
  campoDescricao.value = '';
  exerciciosTemporariosCadastro = [];

  if (treinoId) {
    titulo.innerText = 'Editar Treino';
    const treinoObj = state.treinos.find(t => t.id === treinoId);
    if (treinoObj) {
      campoNome.value = treinoObj.nome;
      campoDescricao.value = treinoObj.descricao || '';
      // Clona os exercícios para a lista temporária
      exerciciosTemporariosCadastro = JSON.parse(JSON.stringify(treinoObj.exercicios));
    }
  } else {
    titulo.innerText = 'Criar Novo Treino';
  }

  renderizarExerciciosTemporarios();
  showView('view-cadastro-treino');
}

// RENDERIZAR EXERCÍCIOS SELECIONADOS NO FORMULÁRIO
function renderizarExerciciosTemporarios() {
  const container = document.getElementById('lista-exercicios-selecionados');
  container.innerHTML = '';
  
  if (exerciciosTemporariosCadastro.length === 0) {
    container.innerHTML = `
      <div class="empty-state-sm">
        <p>Nenhum exercício adicionado a este treino.</p>
      </div>
    `;
    return;
  }

  exerciciosTemporariosCadastro.forEach((ex, idx) => {
    const item = document.createElement('div');
    item.className = 'cadastro-exercise-card';
    item.innerHTML = `
      <div class="cadastro-exercise-header">
        <div>
          <span class="exercise-group-badge">${ex.grupo}</span>
          <h4>${ex.nome} (${ex.grupo})</h4>
        </div>
        <button type="button" class="btn btn-circle btn-sm" onclick="removerExCadastro(${idx})" style="color:var(--danger)" title="Remover Exercício">
          <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
        </button>
      </div>
      <div class="cadastro-exercise-inputs">
        <div class="input-mini">
          <label>Séries</label>
          <input type="number" min="1" value="${ex.series}" onchange="atualizarCampoExCadastro(${idx}, 'series', this.value)" required>
        </div>
        <div class="input-mini">
          <label>Reps</label>
          <input type="text" value="${ex.repeticoes}" onchange="atualizarCampoExCadastro(${idx}, 'repeticoes', this.value)" required placeholder="ex: 10">
        </div>
        <div class="input-mini">
          <label>Peso (kg)</label>
          <input type="number" min="0" value="${ex.carga}" onchange="atualizarCampoExCadastro(${idx}, 'carga', this.value)" required>
        </div>
        <div class="input-mini">
          <label>Desc. (s)</label>
          <input type="number" min="5" value="${ex.descanso}" onchange="atualizarCampoExCadastro(${idx}, 'descanso', this.value)" required>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

// ATUALIZAR CAMPOS DOS EXERCÍCIOS NO CADASTRO
function atualizarCampoExCadastro(index, campo, valor) {
  if (exerciciosTemporariosCadastro[index]) {
    if (campo === 'repeticoes') {
      exerciciosTemporariosCadastro[index][campo] = valor;
    } else {
      exerciciosTemporariosCadastro[index][campo] = parseInt(valor) || 0;
    }
  }
}

// REMOVER EXERCÍCIO DA LISTA TEMPORÁRIA
function removerExCadastro(index) {
  exerciciosTemporariosCadastro.splice(index, 1);
  renderizarExerciciosTemporarios();
}

// EXCLUIR TREINO DEFINITIVAMENTE
window.deletarTreino = function(treinoId) {
  if (confirm('Tem certeza que deseja excluir esta rotina de treino?')) {
    state.treinos = state.treinos.filter(t => t.id !== treinoId);
    
    // Se o treino deletado for o ativo, cancela o treino ativo
    if (state.treinoAtivo && state.treinoAtivo.id === treinoId) {
      cancelarTreinoAtivoSilencioso();
    }
    
    salvarDados();
    renderizarDashboard();
  }
};

// EDITAR TREINO
window.editarTreino = function(treinoId) {
  abrirCadastroTreino(treinoId);
};

// SALVAR TREINO NO STATE E LOCALSTORAGE
function salvarTreino(e) {
  e.preventDefault();
  
  const campoId = document.getElementById('cadastro-treino-id').value;
  const campoNome = document.getElementById('treino-nome').value.trim();
  const campoDescricao = document.getElementById('treino-descricao').value.trim();
  
  if (exerciciosTemporariosCadastro.length === 0) {
    alert('Por favor, adicione pelo menos um exercício ao treino.');
    return;
  }

  if (campoId) {
    // Modo Edição
    const index = state.treinos.findIndex(t => t.id === campoId);
    if (index !== -1) {
      state.treinos[index].nome = campoNome;
      state.treinos[index].descricao = campoDescricao;
      state.treinos[index].exercicios = [...exerciciosTemporariosCadastro];
    }
  } else {
    // Modo Criação
    const novoTreinoObj = {
      id: 'treino-' + Date.now(),
      nome: campoNome,
      descricao: campoDescricao,
      exercicios: [...exerciciosTemporariosCadastro]
    };
    state.treinos.push(novoTreinoObj);
  }

  salvarDados();
  renderizarDashboard();
  showView('view-dashboard');
}

// --- MODAL: SELETOR DE EXERCÍCIOS ---

// ABRIR SELETOR DE EXERCÍCIO
function abrirSeletorExercicio() {
  document.getElementById('busca-seletor').value = '';
  document.getElementById('custom-exercise-box').style.display = 'none';
  document.getElementById('modal-seletor-exercicio').style.display = 'flex';
  
  renderizarListaSeletor();
}

// FECHAR SELETOR DE EXERCÍCIO
function fecharSeletorExercicio() {
  document.getElementById('modal-seletor-exercicio').style.display = 'none';
}

// RENDERIZAR ITENS DO SELETOR DE EXERCÍCIO
function renderizarListaSeletor() {
  const container = document.getElementById('seletor-exercicios-container');
  const query = document.getElementById('busca-seletor').value.toLowerCase().trim();
  container.innerHTML = '';

  // Agrupa os exercícios padrão por grupo
  const grupos = {};
  EXERCICIOS_PADRAO.forEach(ex => {
    if (query && !ex.nome.toLowerCase().includes(query)) return;
    
    if (!grupos[ex.grupo]) {
      grupos[ex.grupo] = [];
    }
    grupos[ex.grupo].push(ex);
  });

  const chavesGrupos = Object.keys(grupos);

  if (chavesGrupos.length === 0) {
    container.innerHTML = `<p class="empty-state-sm">Nenhum exercício encontrado na biblioteca.</p>`;
    return;
  }

  chavesGrupos.forEach(grupoNome => {
    const grupoBox = document.createElement('div');
    grupoBox.className = 'grupo-seletor-box';
    grupoBox.innerHTML = `<h4>${grupoNome}</h4>`;
    
    const grid = document.createElement('div');
    grid.className = 'seletor-itens-grid';
    
    grupos[grupoNome].forEach(ex => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'seletor-item-btn';
      btn.innerHTML = `
        <span>${ex.nome} (${ex.grupo})</span>
        <i data-lucide="plus-circle"></i>
      `;
      btn.onclick = () => selecionarExDoBanco(ex);
      grid.appendChild(btn);
    });
    
    grupoBox.appendChild(grid);
    container.appendChild(grupoBox);
  });

  lucide.createIcons();
}

// FILTRAR SELETOR E GERENCIAR BOTAO CUSTOMIZADO
function filtrarSeletor() {
  renderizarListaSeletor();
  
  const query = document.getElementById('busca-seletor').value.trim();
  const customBox = document.getElementById('custom-exercise-box');
  
  if (query.length > 2) {
    // Se digitou algo, verifica se coincide exatamente com algum do banco
    const coincideExatamente = EXERCICIOS_PADRAO.some(ex => ex.nome.toLowerCase() === query.toLowerCase());
    
    if (!coincideExatamente) {
      customBox.querySelector('span').innerText = query;
      customBox.style.display = 'flex';
    } else {
      customBox.style.display = 'none';
    }
  } else {
    customBox.style.display = 'none';
  }
}

// ADICIONAR EXERCÍCIO DO BANCO AO TREINO ATUAL
function selecionarExDoBanco(ex) {
  const novoEx = {
    id: ex.id,
    nome: ex.nome,
    grupo: ex.grupo,
    series: 3,
    repeticoes: '10',
    carga: 10,
    descanso: 60
  };
  
  exerciciosTemporariosCadastro.push(novoEx);
  renderizarExerciciosTemporarios();
  fecharSeletorExercicio();
}

// CRIAR EXERCÍCIO PERSONALIZADO (FORA DO BANCO)
function criarExercicioCustomizado() {
  const nomeEx = document.getElementById('busca-seletor').value.trim();
  if (!nomeEx) return;

  const novoEx = {
    id: 'custom-' + Date.now(),
    nome: nomeEx,
    grupo: 'Personalizado',
    series: 3,
    repeticoes: '10',
    carga: 10,
    descanso: 60
  };

  exerciciosTemporariosCadastro.push(novoEx);
  renderizarExerciciosTemporarios();
  fecharSeletorExercicio();
}

// --- PLAYER DE TREINO - TREINO ATIVO ---

// INICIAR O PLAYER DO TREINO
window.iniciarTreino = function(treinoId) {
  const treino = state.treinos.find(t => t.id === treinoId);
  if (!treino) return;

  // Garante que o timer anterior foi fechado
  pularDescanso();

  state.treinoAtivo = treino;
  state.exercicioAtivoIndex = 0;
  
  // Cria array de estado das séries (todas não concluídas no início)
  state.seriesConcluidas = treino.exercicios.map(ex => {
    return Array(ex.series).fill(false);
  });

  // Habilita e atualiza a aba No Treino
  const navBtnAtivo = document.getElementById('nav-btn-treino-ativo');
  navBtnAtivo.classList.remove('disabled');
  
  document.getElementById('ativo-nome-treino').innerText = treino.nome;

  renderizarExercicioAtivo();
  showView('view-treino-ativo');
  salvarEstadoTreinoAtivo('view-treino-ativo');
};

// RENDERIZAR O EXERCÍCIO ATIVO ATUAL
function renderizarExercicioAtivo() {
  const ex = state.treinoAtivo.exercicios[state.exercicioAtivoIndex];
  
  document.getElementById('ativo-nome-exercicio').innerText = `${ex.nome} (${ex.grupo})`;
  document.getElementById('ativo-grupo-exercicio').innerText = ex.grupo;
  document.getElementById('ativo-parametros-exercicio').innerHTML = `${ex.series} séries &bull; ${ex.repeticoes} reps &bull; ${ex.carga}kg &bull; Desc. ${ex.descanso}s`;

  // Remove qualquer badge de técnica anterior se houver
  const badgeTecnicaAntigo = document.querySelector('.badge-tecnica');
  if (badgeTecnicaAntigo) {
    badgeTecnicaAntigo.remove();
  }
  
  if (ex.tecnica) {
    const badgeTecnica = document.createElement('span');
    badgeTecnica.className = 'badge-tecnica';
    badgeTecnica.innerText = `Técnica: ${ex.tecnica}`;
    
    // Insere no início das infos do exercício ativo
    const infoDiv = document.querySelector('.active-exercise-info');
    infoDiv.insertBefore(badgeTecnica, document.getElementById('ativo-nome-exercicio'));
  }
  
  // Atualiza contador superior
  document.getElementById('ativo-contador-exercicio').innerText = `Exercício ${state.exercicioAtivoIndex + 1} de ${state.treinoAtivo.exercicios.length}`;

  // Busca guia de execução no banco de dados
  const infoOriginal = EXERCICIOS_PADRAO.find(original => original.id === ex.id);
  const guiaContainer = document.getElementById('ativo-como-fazer-container');
  const mediaContainer = document.getElementById('ativo-media-container');
  
  if (infoOriginal) {
    let mediaHtml = '';
    if (infoOriginal.imagem) {
      mediaHtml += `
        <div class="exercise-illustration-container" style="margin-bottom: 12px;">
          <img src="${infoOriginal.imagem}" alt="${infoOriginal.nome}" class="exercise-illustration">
        </div>
      `;
    }
    if (infoOriginal.videoUrl) {
      mediaHtml += `
        <div class="media-actions" style="padding: 0 0 12px 0;">
          <a href="${infoOriginal.videoUrl}" target="_blank" class="btn btn-secondary btn-sm btn-video-demo">
            <i data-lucide="play-circle"></i> Assistir Vídeo Demonstrativo
          </a>
        </div>
      `;
    }
    mediaContainer.innerHTML = mediaHtml;
    mediaContainer.style.display = mediaHtml ? 'block' : 'none';

    guiaContainer.style.display = 'block';
    
    const passosLista = document.getElementById('ativo-passos-lista');
    passosLista.innerHTML = infoOriginal.passos.map(p => `<li>${p}</li>`).join('');
    document.getElementById('ativo-dica-txt').innerText = infoOriginal.dicas;
    document.getElementById('ativo-erros-txt').innerText = infoOriginal.erros;
  } else {
    // Para exercícios criados pelo usuário
    const buscaCustom = `https://www.youtube.com/results?search_query=execucao+correta+${encodeURIComponent(ex.nome)}`;
    mediaContainer.innerHTML = `
      <div class="media-actions" style="padding: 0 0 12px 0;">
        <a href="${buscaCustom}" target="_blank" class="btn btn-secondary btn-sm btn-video-demo">
          <i data-lucide="search"></i> Buscar no YouTube
        </a>
      </div>
    `;
    mediaContainer.style.display = 'block';
    guiaContainer.style.display = 'none';
  }

  // Reseta estado colapsado do guia
  guiaContainer.classList.add('collapsed');
  const helpIcon = document.querySelector('#btn-toggle-como-fazer i');
  if (helpIcon) helpIcon.setAttribute('data-lucide', 'help-circle');

  // Renderiza checklist de séries
  renderizarChecklistSeries();
  
  // Habilita/Desabilita botões de navegação
  const btnAnt = document.getElementById('btn-ex-anterior');
  const btnProx = document.getElementById('btn-ex-proximo');
  
  btnAnt.disabled = state.exercicioAtivoIndex === 0;
  btnProx.disabled = state.exercicioAtivoIndex === state.treinoAtivo.exercicios.length - 1;

  atualizarProgressoGeral();
  lucide.createIcons();
}

// EXIBIR OU COLAPSAR O GUIA DE POSTURA E EXECUÇÃO
function toggleGuiaComoFazer() {
  const container = document.getElementById('ativo-como-fazer-container');
  const btnIcon = document.querySelector('#btn-toggle-como-fazer i');
  
  container.classList.toggle('collapsed');
  
  if (container.classList.contains('collapsed')) {
    btnIcon.setAttribute('data-lucide', 'help-circle');
  } else {
    btnIcon.setAttribute('data-lucide', 'chevron-up');
  }
  lucide.createIcons();
}

// RENDERIZAR LISTA DE SÉRIES DO EXERCÍCIO ATIVO
function renderizarChecklistSeries() {
  const checklist = document.getElementById('ativo-series-checklist');
  checklist.innerHTML = '';

  const ex = state.treinoAtivo.exercicios[state.exercicioAtivoIndex];
  const estadoDasSeries = state.seriesConcluidas[state.exercicioAtivoIndex];

  for (let i = 0; i < ex.series; i++) {
    const serieConcluida = estadoDasSeries[i];
    
    const row = document.createElement('div');
    row.className = `series-row ${serieConcluida ? 'completed' : ''}`;
    row.innerHTML = `
      <div class="series-row-info">
        <span class="series-number">${i + 1}</span>
        <span class="series-details">${ex.carga} kg &times; ${ex.repeticoes} reps</span>
      </div>
      <button class="btn-check-serie" onclick="toggleSerie(${i})" title="${serieConcluida ? 'Desmarcar série' : 'Concluir série'}">
        <i data-lucide="check" style="width:16px;height:16px"></i>
      </button>
    `;
    checklist.appendChild(row);
  }
  
  lucide.createIcons();
}

// MARCAR OU DESMARCAR SÉRIE CONCLUÍDA
window.toggleSerie = function(serieIndex) {
  const exIndex = state.exercicioAtivoIndex;
  const ex = state.treinoAtivo.exercicios[exIndex];
  const estadoAtual = state.seriesConcluidas[exIndex][serieIndex];
  
  // Inverte
  state.seriesConcluidas[exIndex][serieIndex] = !estadoAtual;
  
  renderizarChecklistSeries();
  atualizarProgressoGeral();

  // Se marcou como concluído e o exercício tem tempo de descanso configurado maior que zero
  if (!estadoAtual && ex.descanso > 0) {
    iniciarTimerDescanso(ex.descanso);
  }

  salvarEstadoTreinoAtivo();
};

// ATUALIZAR BARRA DE PROGRESSO DO TREINO
function atualizarProgressoGeral() {
  if (!state.treinoAtivo) return;

  let totalSeries = 0;
  let concluidas = 0;

  state.seriesConcluidas.forEach(exSeries => {
    totalSeries += exSeries.length;
    concluidas += exSeries.filter(s => s === true).length;
  });

  const pct = totalSeries > 0 ? Math.round((concluidas / totalSeries) * 100) : 0;
  
  document.getElementById('ativo-barra-progresso').style.width = `${pct}%`;
  document.getElementById('ativo-txt-progresso-series').innerText = `${concluidas}/${totalSeries} séries`;
  document.getElementById('ativo-pct-progresso').innerText = `${pct}% concluído`;
}

// AVANÇAR EXERCÍCIO
function proximoExercicio() {
  if (state.exercicioAtivoIndex < state.treinoAtivo.exercicios.length - 1) {
    state.exercicioAtivoIndex++;
    renderizarExercicioAtivo();
    salvarEstadoTreinoAtivo();
  }
}

// VOLTAR EXERCÍCIO
function anteriorExercicio() {
  if (state.exercicioAtivoIndex > 0) {
    state.exercicioAtivoIndex--;
    renderizarExercicioAtivo();
    salvarEstadoTreinoAtivo();
  }
}

// CANCELAR O TREINO ATIVO E RETORNAR
function confirmarSaidaTreino() {
  if (confirm('Deseja realmente sair do treino? Seu progresso atual será perdido.')) {
    cancelarTreinoAtivoSilencioso();
    showView('view-dashboard');
  }
}

// CANCELA E LIMPA O ESTADO ATIVO DO CACHE
function cancelarTreinoAtivoSilencioso() {
  state.treinoAtivo = null;
  pularDescanso();
  
  // Desabilita a aba de treino
  const navBtnAtivo = document.getElementById('nav-btn-treino-ativo');
  navBtnAtivo.classList.add('disabled');
  navBtnAtivo.classList.remove('active');

  salvarEstadoTreinoAtivo();
}

// FINALIZAR TREINO COM HISTÓRICO
function finalizarTreino() {
  // Opcional: Avisar se não concluiu todas as séries
  let totalSeries = 0;
  let concluidas = 0;
  
  state.seriesConcluidas.forEach(exSeries => {
    totalSeries += exSeries.length;
    concluidas += exSeries.filter(s => s === true).length;
  });

  if (concluidas === 0) {
    alert('Marque pelo menos uma série como concluída antes de finalizar!');
    return;
  }

  if (concluidas < totalSeries) {
    if (!confirm('Você ainda não marcou todas as séries como concluídas. Deseja finalizar assim mesmo?')) {
      return;
    }
  }

  // Registra no histórico
  const registro = {
    id: 'hist-' + Date.now(),
    treinoId: state.treinoAtivo.id,
    treinoNome: state.treinoAtivo.nome,
    dataConclusao: new Date().toISOString(),
    seriesTotais: totalSeries,
    seriesConcluidas: concluidas
  };

  state.historico.push(registro);
  salvarDados();

  alert(`Treino finalizado com sucesso! Parabéns! 🏋️🔥\nVocê concluiu ${concluidas} séries.`);
  
  cancelarTreinoAtivoSilencioso();
  renderizarDashboard();
  showView('view-dashboard');
}

// --- CRONÔMETRO DE DESCANSO ---

// INICIAR O CRONÔMETRO DE DESCANSO
function iniciarTimerDescanso(segundos) {
  // Para qualquer timer rodando
  pularDescanso();

  state.timerSegundosTotais = segundos;
  state.timerSegundosRestantes = segundos;

  const overlay = document.getElementById('timer-rest-overlay');
  overlay.style.display = 'flex';
  
  const timerCard = overlay.querySelector('.timer-card');
  timerCard.classList.remove('timer-pulse-complete');
  
  atualizarVisualTimer();

  state.timerInterval = setInterval(() => {
    state.timerSegundosRestantes--;
    
    if (state.timerSegundosRestantes <= 0) {
      state.timerSegundosRestantes = 0;
      atualizarVisualTimer();
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      
      concluirTimerSom();
    } else {
      atualizarVisualTimer();
    }
  }, 1000);
}

// ATUALIZAR DIGITOS E BARRA DE PROGRESSO DO TIMER
function atualizarVisualTimer() {
  const minutos = Math.floor(state.timerSegundosRestantes / 60);
  const segundos = state.timerSegundosRestantes % 60;
  
  const digitos = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  document.getElementById('timer-display-digits').innerText = digitos;

  // Barra de progresso horizontal
  const pct = (state.timerSegundosRestantes / state.timerSegundosTotais) * 100;
  document.getElementById('timer-progress-bar').style.width = `${pct}%`;
}

// ADICIONAR +15 SEGUNDOS AO DESCANSO
function adicionarTempoDescanso(segundos) {
  // Se o timer já tiver concluído, reinicia com o tempo adicional
  if (!state.timerInterval) {
    iniciarTimerDescanso(segundos);
    return;
  }
  
  state.timerSegundosTotais += segundos;
  state.timerSegundosRestantes += segundos;
  atualizarVisualTimer();
}

// PULAR DESCANSO (FECHAR TIMER)
function pularDescanso() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  
  document.getElementById('timer-rest-overlay').style.display = 'none';
  pararAlertaSonoro();
}

// GERAR ALERTA SONORO AGRADÁVEL (WEB AUDIO API) AO TERMINAR O TIMER
function concluirTimerSom() {
  // Vibração (mobile)
  if ('vibrate' in navigator) {
    navigator.vibrate([300, 100, 300]);
  }

  // Piscar borda em verde
  const timerCard = document.querySelector('.timer-card');
  timerCard.classList.add('timer-pulse-complete');

  // Loop de beep-beep leve usando Web Audio API até o usuário pular ou fechar
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let beepCount = 0;
    
    const playBeep = () => {
      if (!document.getElementById('timer-rest-overlay').style.display || 
          document.getElementById('timer-rest-overlay').style.display === 'none') {
        return; // Parar se o timer foi fechado
      }
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = 587.33; // Nota D5
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      
      beepCount++;
      if (beepCount < 6) { // Toca até 6 bipes
        state.audioAlertaExecutando = setTimeout(playBeep, 450);
      }
    };

    playBeep();
  } catch (e) {
    console.warn("Navegador bloqueou áudio: ", e);
  }
}

// PARAR QUALQUER PLAYBACK DE BEEP
function pararAlertaSonoro() {
  if (state.audioAlertaExecutando) {
    clearTimeout(state.audioAlertaExecutando);
    state.audioAlertaExecutando = null;
  }
}

// --- IMPORTAÇÃO INTELIGENTE POR COPIA E COLA ---

function processarImportacaoTexto(e) {
  e.preventDefault();
  const texto = document.getElementById('import-text-input').value;
  if (!texto.trim()) return;

  const linhas = texto.split('\n');
  const treinosImportados = [];
  let treinoAtual = null;

  // Lista de padrões de dias da semana ou blocos de treino
  const diasRegex = /^(segunda|terca|quarta|quinta|sexta|sabado|domingo|seg|ter|qua|qui|sex|sab|dom|dia\s*\d+|treino\s*[a-z]|\bsemana\s*\d+)/i;
  
  // Lista de cabeçalhos de tabelas que devem ser ignorados
  const cabecalhosIgnorar = /^(exercicio|exercício|serie|série|tecnica|técnica|carga|descanso|repeticao|repetição|peso|tempo|macrociclo|microciclo)/i;

  linhas.forEach(linhaOriginal => {
    const linha = linhaOriginal.trim();
    if (!linha) return; // Ignora linha vazia

    // 1. Identificar se a linha define um novo Treino (dia ou bloco)
    if (diasRegex.test(linha)) {
      // Se já existia um treino atual com exercícios, salvamos ele antes de criar o próximo
      if (treinoAtual && treinoAtual.exercicios.length > 0) {
        treinosImportados.push(treinoAtual);
      }
      
      // Cria o novo treino com o nome do dia/bloco limpo
      treinoAtual = {
        id: 'treino-importado-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        nome: linha,
        descricao: 'Importado via Copia e Cola',
        exercicios: []
      };
      return;
    }

    // Ignora linhas que parecem ser cabeçalhos de planilha
    if (cabecalhosIgnorar.test(linha)) {
      return;
    }

    // Se ainda não temos um treino ativo e começaram a vir exercícios, cria um contêiner genérico
    if (!treinoAtual) {
      treinoAtual = {
        id: 'treino-importado-' + Date.now(),
        nome: 'Treino Importado',
        descricao: 'Exercícios importados por texto',
        exercicios: []
      };
    }

    // 2. Parser do Exercício na linha
    let nomeEx = '';
    let seriesEx = 3; // Padrão
    let repsEx = '10 a 12'; // Padrão
    let tecnicaEx = '';

    // Verifica se há separadores como Tabulação, Barra Vertical ou Ponto e Vírgula
    const partesTab = linha.split(/\t|\||;/);
    if (partesTab.length >= 2) {
      nomeEx = partesTab[0].trim();
      
      // Tenta extrair séries da segunda parte
      const seriesMatch = partesTab[1].match(/(\d+)/);
      if (seriesMatch) {
        seriesEx = parseInt(seriesMatch[1]);
      }
      
      // Se houver uma terceira parte, extrai como técnica
      if (partesTab.length >= 3) {
        tecnicaEx = partesTab[2].trim();
      }
    } else {
      // Se não há separador formal, tenta quebrar por traços ou hífens
      const partesHifen = linha.split('-');
      if (partesHifen.length >= 2) {
        nomeEx = partesHifen[0].trim();
        const seriesMatch = partesHifen[1].match(/(\d+)/);
        if (seriesMatch) {
          seriesEx = parseInt(seriesMatch[1]);
        }
        if (partesHifen.length >= 3) {
          tecnicaEx = partesHifen[2].trim();
        }
      } else {
        // Formato sem pontuação (Ex: "Supino reto 4 séries Drop set")
        // Regex para capturar: Nome (texto), Séries (dígito), Técnica (resto)
        const regexLivre = /^(.*?)\s+(\d+)\s*(?:x|series|séries|sets)?\s*(.*)$/i;
        const matchLivre = linha.match(regexLivre);
        if (matchLivre) {
          nomeEx = matchLivre[1].trim();
          seriesEx = parseInt(matchLivre[2]);
          tecnicaEx = matchLivre[3].trim();
        } else {
          // Se falhar, assume a linha inteira como nome do exercício
          nomeEx = linha;
        }
      }
    }

    // Limpezas extras
    nomeEx = nomeEx.replace(/^\d+[\.\-\s]*/, '').trim(); // Remove número no começo, ex "1. Supino" -> "Supino"
    if (!nomeEx) return;

    // 3. Mapear o exercício com a Biblioteca
    const exBiblioteca = encontrarExercicioPorNome(nomeEx);
    let exercicioObj = null;

    if (exBiblioteca) {
      // Herda propriedades ricas da biblioteca
      exercicioObj = {
        id: exBiblioteca.id,
        nome: exBiblioteca.nome,
        grupo: exBiblioteca.grupo,
        series: seriesEx,
        repeticoes: repsEx,
        carga: exBiblioteca.grupo === 'Core' ? 0 : 10, // Carga padrão
        descanso: (exBiblioteca.grupo === 'Pernas' || exBiblioteca.grupo === 'Costas') ? 90 : 60,
        tecnica: tecnicaEx || null
      };
    } else {
      // Cria exercício personalizado
      const grupoAdivinhado = adivinharGrupoMuscular(nomeEx);
      exercicioObj = {
        id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        nome: nomeEx,
        grupo: grupoAdivinhado,
        series: seriesEx,
        repeticoes: repsEx,
        carga: grupoAdivinhado === 'Core' ? 0 : 10,
        descanso: (grupoAdivinhado === 'Pernas' || grupoAdivinhado === 'Costas') ? 90 : 60,
        tecnica: tecnicaEx || null
      };
    }

    treinoAtual.exercicios.push(exercicioObj);
  });

  // Salva o último treino que estava sendo montado
  if (treinoAtual && treinoAtual.exercicios.length > 0) {
    treinosImportados.push(treinoAtual);
  }

  if (treinosImportados.length === 0) {
    alert('Nenhum exercício ou dia de treino pôde ser identificado. Verifique o formato do texto colado.');
    return;
  }

  // Adiciona ao estado global
  state.treinos = [...state.treinos, ...treinosImportados];
  salvarDados();
  renderizarDashboard();
  
  alert(`${treinosImportados.length} treino(s) criado(s) e adicionado(s) com sucesso! 🎉`);
  
  showView('view-dashboard');
}

// BUSCA APROXIMADA NA BIBLIOTECA
function encontrarExercicioPorNome(nomePesquisa) {
  const normalizar = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const nomePesquisaNorm = normalizar(nomePesquisa);
  
  // 1. Busca exata
  let match = EXERCICIOS_PADRAO.find(ex => normalizar(ex.nome) === nomePesquisaNorm);
  if (match) return match;
  
  // 2. Mapeamento de sinônimos/palavras-chave comuns
  const mapeamentoComum = {
    'pulley frente': 'puxada_frente',
    'pulley': 'puxada_frente',
    'puxada frente': 'puxada_frente',
    'puxada aberta': 'puxada_frente',
    'remada baixa': 'remada_baixa',
    'remada curvada': 'remada_curvada',
    'remada': 'remada_curvada',
    'agachamento frontal': 'agachamento_livre',
    'agachamento livre': 'agachamento_livre',
    'agachamento': 'agachamento_livre',
    'leg press': 'leg_press_45',
    'extensora': 'cadeira_extensora',
    'flexora': 'mesa_flexora',
    'supino reto': 'supino_reto',
    'supino inclinado': 'supino_inclinado_halteres',
    'crucifixo maquina': 'crucifixo_maquina',
    'crucifixo': 'crucifixo_maquina',
    'cross over': 'crucifixo_maquina',
    'pec deck': 'crucifixo_maquina',
    'elevacao lateral': 'elevacao_lateral',
    'desenvolvimento': 'desenvolvimento_halteres',
    'rosca direta': 'rosca_direta_halteres',
    'rosca simultanea': 'rosca_direta_halteres',
    'rosca': 'rosca_direta_halteres',
    'triceps corda': 'tricep_pulley',
    'triceps pulley': 'tricep_pulley',
    'triceps testa': 'tricep_pulley',
    'triceps': 'tricep_pulley',
    'abs': 'abdominal_infra',
    'abdominal': 'abdominal_infra',
    'prancha': 'abdominal_infra'
  };
  
  for (const [chave, idExercicio] of Object.entries(mapeamentoComum)) {
    if (nomePesquisaNorm.includes(chave) || chave.includes(nomePesquisaNorm)) {
      const exEncontrado = EXERCICIOS_PADRAO.find(ex => ex.id === idExercicio);
      if (exEncontrado) return exEncontrado;
    }
  }
  
  // 3. Busca parcial por inclusão simples
  match = EXERCICIOS_PADRAO.find(ex => {
    const nomeBancoNorm = normalizar(ex.nome);
    return nomeBancoNorm.includes(nomePesquisaNorm) || nomePesquisaNorm.includes(nomeBancoNorm);
  });
  
  return match || null;
}

// ADIVINHAR GRUPO MUSCULAR COM BASE NAS PALAVRAS DO NOME DO EXERCÍCIO
function adivinharGrupoMuscular(nome) {
  const n = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (n.includes('supino') || n.includes('peitoral') || n.includes('crucifixo') || n.includes('cross') || n.includes('chest') || n.includes('pullover')) {
    return 'Peito';
  }
  if (n.includes('puxada') || n.includes('remada') || n.includes('pulley') || n.includes('costas') || n.includes('back') || n.includes('dorsal') || n.includes('terra')) {
    return 'Costas';
  }
  if (n.includes('agachamento') || n.includes('leg') || n.includes('extensora') || n.includes('flexora') || n.includes('stiff') || n.includes('panturrilha') || n.includes('calf') || n.includes('bulgaro') || n.includes('afundo') || n.includes('adutora') || n.includes('abdutora') || n.includes('quadriceps') || n.includes('isquiotibiais')) {
    return 'Pernas';
  }
  if (n.includes('desenvolvimento') || n.includes('elevacao') || n.includes('ombro') || n.includes('lateral') || n.includes('frontal') || n.includes('deltoide') || n.includes('shoulder') || n.includes('manguito')) {
    return 'Ombros';
  }
  if (n.includes('rosca') || n.includes('biceps') || n.includes('triceps') || n.includes('forearm') || n.includes('antibraco') || n.includes('pulley') || n.includes('corda')) {
    return 'Braços';
  }
  if (n.includes('abdominal') || n.includes('infra') || n.includes('obliquo') || n.includes('prancha') || n.includes('core') || n.includes('lombar') || n.includes('abs')) {
    return 'Core';
  }
  return 'Personalizado';
}

// --- PERSISTÊNCIA DO ESTADO DE TREINO ATIVO E ABAS ---

// SALVAR ESTADO COMPLETO DO TREINO ATIVO
function salvarEstadoTreinoAtivo(abaDesejada = null) {
  if (!state.treinoAtivo) {
    localStorage.removeItem('meus-treinos-estado-ativo');
    return;
  }

  const estadoParaSalvar = {
    treinoAtivo: state.treinoAtivo,
    exercicioAtivoIndex: state.exercicioAtivoIndex,
    seriesConcluidas: state.seriesConcluidas,
    abaAtiva: abaDesejada || obterAbaAtiva(),
    timestamp: Date.now()
  };

  localStorage.setItem('meus-treinos-estado-ativo', JSON.stringify(estadoParaSalvar));
}

// OBTER QUAL ABA ESTÁ ATUALMENTE VISÍVEL
function obterAbaAtiva() {
  const activeView = document.querySelector('.app-view.active');
  return activeView ? activeView.id : 'view-dashboard';
}

// RECUPERAR ESTADO DE TREINO ATIVO DA SESSÃO ANTERIOR (SE TIVER MENOS DE 2 HORAS)
function recuperarEstadoTreinoAtivo() {
  const estadoSalvoRaw = localStorage.getItem('meus-treinos-estado-ativo');
  if (!estadoSalvoRaw) return;

  try {
    const estado = JSON.parse(estadoSalvoRaw);
    const duasHoras = 2 * 60 * 60 * 1000; // milissegundos

    if (Date.now() - estado.timestamp < duasHoras) {
      // Restaura o estado em memória
      state.treinoAtivo = estado.treinoAtivo;
      state.exercicioAtivoIndex = estado.exercicioAtivoIndex;
      state.seriesConcluidas = estado.seriesConcluidas;

      // Habilita a aba de treino ativo
      const navBtnAtivo = document.getElementById('nav-btn-treino-ativo');
      navBtnAtivo.classList.remove('disabled');

      // Se estava na aba de treino ativo, renderiza o exercício
      if (estado.abaAtiva === 'view-treino-ativo') {
        renderizarExercicioAtivo();
      }
      
      // Direciona para a aba correta
      showView(estado.abaAtiva);
    } else {
      // Excedeu 2 horas, remove do storage
      localStorage.removeItem('meus-treinos-estado-ativo');
    }
  } catch (e) {
    console.error("Erro ao recuperar estado do treino ativo:", e);
    localStorage.removeItem('meus-treinos-estado-ativo');
  }
}
