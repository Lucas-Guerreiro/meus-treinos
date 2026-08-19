// ESTADO GLOBAL DO APLICATIVO
let state = {
  treinos: [],
  treinoAtivo: null,
  historico: [],
  exercicioAtivoIndex: 0,
  seriesProgresso: [], // Array de arrays de objetos: [[{concluida: false, carga: 10, repeticoes: 10}]]
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

  // Inicializa a sincronização em nuvem do Firebase se estiver configurada
  iniciarSincronizacaoNuvem();

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
    
    // Migração de exercícios personalizados para o banco padrão
    let alterado = false;
    state.treinos.forEach(treino => {
      treino.exercicios.forEach(ex => {
        if (ex.id.startsWith('custom-') && ex.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === 'levantamento terra romeno') {
          ex.id = 'levantamento_terra_romeno';
          ex.nome = 'Levantamento Terra Romeno';
          ex.grupo = 'Pernas';
          alterado = true;
        }
      });
    });
    if (alterado) {
      // Salva local e na nuvem
      setTimeout(() => salvarDados(), 500);
    }
  }
  if (historicoSalvo) {
    state.historico = JSON.parse(historicoSalvo);
  }
}

// SALVAR DADOS NO LOCALSTORAGE E SINCRONIZAR NA NUVEM
function salvarDados() {
  localStorage.setItem('meus-treinos-data', JSON.stringify(state.treinos));
  localStorage.setItem('meus-treinos-historico', JSON.stringify(state.historico));

  // Sincroniza em nuvem no Firestore se o Firebase estiver inicializado
  if (dbFirebase) {
    const userUuid = localStorage.getItem('meus-treinos-user-uuid');
    if (!userUuid) return;

    try {
      const batch = dbFirebase.batch();
      
      // Sincroniza treinos com índice de ordenação
      state.treinos.forEach((treino, idx) => {
        const docRef = dbFirebase.collection('usuarios').doc(userUuid).collection('treinos').doc(treino.id);
        batch.set(docRef, { ...treino, ordem: idx });
      });

      // Sincroniza histórico
      state.historico.forEach(reg => {
        const docRef = dbFirebase.collection('usuarios').doc(userUuid).collection('historico').doc(reg.id);
        batch.set(docRef, reg);
      });

      batch.commit().catch(err => console.error("Erro no batch commit do Firebase:", err));
    } catch (e) {
      console.error("Falha ao preparar batch de sincronização do Firebase:", e);
    }
  }
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
  document.getElementById('import-pdf-input').addEventListener('change', processarUploadPDF);

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
  document.getElementById('btn-timer-sub-15').addEventListener('click', () => adicionarTempoDescanso(-15));
  document.getElementById('btn-timer-add-15').addEventListener('click', () => adicionarTempoDescanso(15));
  document.getElementById('btn-timer-pular').addEventListener('click', pularDescanso);

  // Ações do Modal Mover Exercício
  document.getElementById('btn-fechar-mover').addEventListener('click', fecharModalMover);

  // Ações do Modal Selecionar Dia
  document.getElementById('btn-cadastro-escolher-dia').addEventListener('click', () => abrirModalSelecionarDia('cadastro'));
  document.getElementById('btn-fechar-selecionar-dia').addEventListener('click', fecharModalSelecionarDia);

  // Ações de Nuvem/Firebase Sincronização
  document.getElementById('btn-nuvem-config-view').addEventListener('click', abrirModalNuvemConfig);
  document.getElementById('btn-fechar-nuvem-config').addEventListener('click', fecharModalNuvemConfig);
  document.getElementById('form-nuvem-config').addEventListener('submit', conectarNuvemFirebase);
  document.getElementById('btn-desconectar-nuvem').addEventListener('click', desconectarNuvemFirebase);
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
    
    // Lista vertical detalhada de exercícios com ação de mover rápido
    const exItems = treino.exercicios.map(ex => `
      <div class="dashboard-exercise-item">
        <span>${ex.nome} (${ex.grupo})</span>
        <button class="btn-mover-ex-quick" onclick="abrirModalMoverExercicio('${treino.id}', '${ex.id}', '${ex.nome.replace(/'/g, "\\'")}')" title="Mover exercício para outro dia/treino">
          <i data-lucide="arrow-right-left" style="width:12px;height:12px;"></i>
        </button>
      </div>
    `).join('');
    
    card.innerHTML = `
      <div class="treino-card-header">
        <div class="treino-card-info">
          <div class="treino-card-title-row">
            <h4>${treino.nome}</h4>
            <button class="btn-renomear-treino-quick" onclick="renomearTreinoRapido('${treino.id}')" title="Mudar dia / Renomear treino">
              <i data-lucide="calendar-range" style="width:12px;height:12px;"></i>
            </button>
          </div>
          <p>${treino.descricao || 'Sem descrição'}</p>
        </div>
        <div class="treino-actions-top">
          <button class="btn btn-circle btn-sm" onclick="reordenarTreino('${treino.id}', -1)" title="Mover para Cima">
            <i data-lucide="arrow-up" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn btn-circle btn-sm" onclick="reordenarTreino('${treino.id}', 1)" title="Mover para Baixo">
            <i data-lucide="arrow-down" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn btn-circle btn-sm" onclick="editarTreino('${treino.id}')" title="Editar">
            <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
          </button>
          <button class="btn btn-circle btn-sm" onclick="deletarTreino('${treino.id}')" title="Excluir" style="color:var(--danger)">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </div>
      </div>
      <div class="dashboard-exercise-list">
        ${exItems || '<p class="empty-state-sm" style="padding:10px;margin:0;">Nenhum exercício neste treino.</p>'}
      </div>
      <div class="treino-card-actions">
        <button class="btn btn-primary" onclick="iniciarTreino('${treino.id}')" ${treino.exercicios.length === 0 ? 'disabled' : ''}>
          <i data-lucide="play" style="width:16px;height:16px;"></i> Iniciar Treino
        </button>
      </div>
    `;
    treinosList.appendChild(card);
  });
  
  renderizarHistoricoDashboard();
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
    // Se o Firebase estiver ativo, deleta o documento correspondente na nuvem
    if (dbFirebase) {
      const userUuid = localStorage.getItem('meus-treinos-user-uuid');
      dbFirebase.collection('usuarios').doc(userUuid).collection('treinos').doc(treinoId).delete()
        .catch(err => console.error("Erro ao deletar treino da nuvem:", err));
    }

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
  
  // Cria array de estado detalhado das séries (conclusão, carga e reps iniciais)
  state.seriesProgresso = treino.exercicios.map(ex => {
    return Array.from({ length: ex.series }, () => ({
      concluida: false,
      carga: ex.carga,
      repeticoes: ex.repeticoes
    }));
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
  document.getElementById('ativo-parametros-exercicio').innerHTML = `
    ${ex.series} séries &bull; ${ex.repeticoes} reps &bull; ${ex.carga}kg &bull; 
    <span>Desc. <strong id="btn-editar-descanso-ativo" style="color:var(--warning); cursor:pointer; text-decoration:underline;" title="Clique para ajustar descanso">${ex.descanso}s</strong></span>
  `;

  // Permite ajustar o descanso diretamente no card do player
  const btnEditarDescanso = document.getElementById('btn-editar-descanso-ativo');
  if (btnEditarDescanso) {
    btnEditarDescanso.onclick = () => {
      const novoDescanso = prompt('Ajustar tempo de descanso (em segundos):', ex.descanso);
      if (novoDescanso !== null) {
        const segs = parseInt(novoDescanso);
        if (!isNaN(segs) && segs >= 0) {
          ex.descanso = segs;
          salvarDados();
          salvarEstadoTreinoAtivo();
          renderizarExercicioAtivo();
        } else {
          alert('Por favor, insira um número válido maior ou igual a 0.');
        }
      }
    };
  }

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
  const estadoDasSeries = state.seriesProgresso[state.exercicioAtivoIndex];

  for (let i = 0; i < ex.series; i++) {
    const dadosSerie = estadoDasSeries[i];
    
    const row = document.createElement('div');
    row.className = `series-row ${dadosSerie.concluida ? 'completed' : ''}`;
    row.innerHTML = `
      <div class="series-row-info">
        <span class="series-number">${i + 1}</span>
        <div class="series-inputs">
          <input type="number" class="input-serie-carga" value="${dadosSerie.carga}" min="0" onchange="atualizarCargaSerie(${i}, this.value)" ${dadosSerie.concluida ? 'disabled' : ''} title="Ajustar peso">
          <span class="series-x">kg &times;</span>
          <input type="text" class="input-serie-reps" value="${dadosSerie.repeticoes}" onchange="atualizarRepsSerie(${i}, this.value)" ${dadosSerie.concluida ? 'disabled' : ''} title="Ajustar repetições">
          <span class="series-reps-lbl">reps</span>
        </div>
      </div>
      <button class="btn-check-serie" onclick="toggleSerie(${i})" title="${dadosSerie.concluida ? 'Desmarcar' : 'Concluir'}">
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
  const dadosSerie = state.seriesProgresso[exIndex][serieIndex];
  const estadoAtual = dadosSerie.concluida;
  
  // Inverte
  dadosSerie.concluida = !estadoAtual;
  
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

  state.seriesProgresso.forEach(exSeries => {
    totalSeries += exSeries.length;
    concluidas += exSeries.filter(s => s.concluida === true).length;
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

// FINALIZAR TREINO COM HISTÓRICO DETALHADO DE CARGAS/REPS
function finalizarTreino() {
  let totalSeries = 0;
  let concluidas = 0;
  
  state.seriesProgresso.forEach(exSeries => {
    totalSeries += exSeries.length;
    concluidas += exSeries.filter(s => s.concluida === true).length;
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

  // Monta histórico de exercícios e cargas executadas de fato
  const exerciciosRealizados = state.treinoAtivo.exercicios.map((ex, exIdx) => {
    const seriesDoEx = state.seriesProgresso[exIdx];
    return {
      nome: ex.nome,
      grupo: ex.grupo,
      series: seriesDoEx.map(s => ({
        concluida: s.concluida,
        carga: s.carga,
        repeticoes: s.repeticoes
      }))
    };
  });

  // Registra no histórico
  const registro = {
    id: 'hist-' + Date.now(),
    treinoId: state.treinoAtivo.id,
    treinoNome: state.treinoAtivo.nome,
    dataConclusao: new Date().toISOString(),
    exercicios: exerciciosRealizados
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

// ADICIONAR OU SUBTRAIR SEGUNDOS AO DESCANSO
function adicionarTempoDescanso(segundos) {
  // Se o timer já tiver concluído, só reinicia com tempo positivo
  if (!state.timerInterval) {
    if (segundos > 0) {
      iniciarTimerDescanso(segundos);
    }
    return;
  }
  
  state.timerSegundosTotais = Math.max(5, state.timerSegundosTotais + segundos);
  state.timerSegundosRestantes = Math.max(0, state.timerSegundosRestantes + segundos);
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

    // Normaliza os diferentes tipos de traços (meia-risca, travessão, hífen) para um hífen simples
    const linhaNormalizada = linha.replace(/[—–]/g, '-');

    // Verifica se há separadores como Tabulação, Barra Vertical ou Ponto e Vírgula
    const partesTab = linhaNormalizada.split(/\t|\||;/);
    if (partesTab.length >= 2) {
      nomeEx = partesTab[0].trim();
      
      // Tenta extrair o padrão "2x12-15" ou "2×12-15" na segunda parte
      const padraoReps = partesTab[1].match(/(\d+)\s*[xX×]\s*([a-zA-Z0-9\-\s\/\+s]+)/);
      if (padraoReps) {
        seriesEx = parseInt(padraoReps[1]);
        repsEx = padraoReps[2].trim();
      } else {
        // Fallback de tentar ler apenas número de séries
        const seriesMatch = partesTab[1].match(/(\d+)/);
        if (seriesMatch) {
          seriesEx = parseInt(seriesMatch[1]);
        }
      }
      
      // Se houver uma terceira parte, extrai como técnica
      if (partesTab.length >= 3) {
        tecnicaEx = partesTab[2].trim();
      }
    } else {
      // Se não há separador formal, tenta quebrar por traços ou hífens
      const partesHifen = linhaNormalizada.split('-');
      if (partesHifen.length >= 2) {
        nomeEx = partesHifen[0].trim();
        
        // Tenta extrair o padrão "2x12-15" ou "2×12-15" na segunda parte
        const padraoReps = partesHifen[1].match(/(\d+)\s*[xX×]\s*([a-zA-Z0-9\-\s\/\+s]+)/);
        if (padraoReps) {
          seriesEx = parseInt(padraoReps[1]);
          repsEx = padraoReps[2].trim();
        } else {
          const seriesMatch = partesHifen[1].match(/(\d+)/);
          if (seriesMatch) {
            seriesEx = parseInt(seriesMatch[1]);
          }
        }
        
        if (partesHifen.length >= 3) {
          tecnicaEx = partesHifen[2].trim();
        }
      } else {
        // Formato sem pontuação (Ex: "Supino reto 4x10" ou "Supino reto 4 séries Drop set")
        // Tenta achar o padrão "4x10" ou "4x12-15" no final da linha
        const regexFimX = /^(.*?)\s+(\d+)\s*[xX×]\s*([a-zA-Z0-9\-\s\/\+s]+)$/i;
        const matchFimX = linhaNormalizada.match(regexFimX);
        if (matchFimX) {
          nomeEx = matchFimX[1].trim();
          seriesEx = parseInt(matchFimX[2]);
          repsEx = matchFimX[3].trim();
        } else {
          // Regex para capturar: Nome (texto), Séries (dígito), Técnica (resto)
          const regexLivre = /^(.*?)\s+(\d+)\s*(?:x|series|séries|sets)?\s*(.*)$/i;
          const matchLivre = linhaNormalizada.match(regexLivre);
          if (matchLivre) {
            nomeEx = matchLivre[1].trim();
            seriesEx = parseInt(matchLivre[2]);
            tecnicaEx = matchLivre[3].trim();
          } else {
            // Se falhar, assume a linha inteira como nome do exercício
            nomeEx = linhaNormalizada;
          }
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

// PROCESSAR UPLOAD DE ARQUIVO PDF E EXTRAIR TEXTO
async function processarUploadPDF(e) {
  const file = e.target.files[0];
  if (!file) return;

  const statusMsg = document.getElementById('pdf-status-message');
  const txtArea = document.getElementById('import-text-input');

  statusMsg.innerText = "Lendo arquivo PDF... 📄";
  statusMsg.style.color = "var(--primary)";

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Configura a URL do worker do PDF.js
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    } else {
      throw new Error("Biblioteca PDF.js não carregada.");
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const items = textContent.items;
      if (!items || items.length === 0) continue;
      
      // Agrupar itens por coordenada Y (linha) com tolerância de 6px
      const rows = [];
      items.forEach(item => {
        const y = item.transform[5];
        const x = item.transform[4];
        const text = item.str;
        
        let foundRow = rows.find(r => Math.abs(r.y - y) < 6);
        if (foundRow) {
          foundRow.items.push({ x, text });
        } else {
          rows.push({ y, items: [{ x, text }] });
        }
      });
      
      // Ordena linhas de cima para baixo (Y decrescente)
      rows.sort((a, b) => b.y - a.y);
      
      // Ordena palavras da esquerda para a direita (X crescente) e junta com espaço
      const pageLines = rows.map(r => {
        r.items.sort((a, b) => a.x - b.x);
        return r.items.map(i => i.text).join(' ');
      });
      
      fullText += pageLines.join('\n') + "\n\n";
    }

    if (fullText.trim()) {
      txtArea.value = fullText.trim();
      statusMsg.innerText = `Sucesso: PDF carregado (${pdf.numPages} pág.)! Revise o texto abaixo.`;
      statusMsg.style.color = "var(--primary)";
    } else {
      statusMsg.innerText = "Erro: Não foi possível extrair nenhum texto deste PDF.";
      statusMsg.style.color = "var(--danger)";
    }
  } catch (err) {
    console.error("Erro ao ler PDF:", err);
    statusMsg.innerText = "Falha ao ler PDF. Verifique se o arquivo não está protegido.";
    statusMsg.style.color = "var(--danger)";
  }

  // Limpa o input para permitir selecionar o mesmo arquivo novamente
  e.target.value = '';
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
    seriesProgresso: state.seriesProgresso,
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
      
      // Suporte a migração do estado antigo
      if (estado.seriesProgresso) {
        state.seriesProgresso = estado.seriesProgresso;
      } else if (estado.seriesConcluidas) {
        // Migração automática
        state.seriesProgresso = estado.seriesConcluidas.map((exSeries, exIdx) => {
          const ex = estado.treinoAtivo.exercicios[exIdx];
          return exSeries.map(concluida => ({
            concluida: concluida,
            carga: ex ? ex.carga : 10,
            repeticoes: ex ? ex.repeticoes : '10'
          }));
        });
      }

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

// ATUALIZAR VALORES DE CARGA POR SÉRIE INDIVIDUAL NO PLAYER
window.atualizarCargaSerie = function(serieIndex, valor) {
  const exIndex = state.exercicioAtivoIndex;
  if (state.seriesProgresso[exIndex] && state.seriesProgresso[exIndex][serieIndex]) {
    state.seriesProgresso[exIndex][serieIndex].carga = parseFloat(valor) || 0;
    salvarEstadoTreinoAtivo();
  }
};

// ATUALIZAR VALORES DE REPETIÇÕES POR SÉRIE INDIVIDUAL NO PLAYER
window.atualizarRepsSerie = function(serieIndex, valor) {
  const exIndex = state.exercicioAtivoIndex;
  if (state.seriesProgresso[exIndex] && state.seriesProgresso[exIndex][serieIndex]) {
    state.seriesProgresso[exIndex][serieIndex].repeticoes = valor.toString().trim() || '10';
    salvarEstadoTreinoAtivo();
  }
};

// RENDERIZAR O HISTÓRICO DE TREINOS CONCLUÍDOS NO DASHBOARD
function renderizarHistoricoDashboard() {
  const container = document.getElementById('historico-lista-container');
  if (!container) return;
  
  if (state.historico.length === 0) {
    container.innerHTML = `
      <div class="empty-state-sm" style="padding: 24px;">
        <p>Nenhum treino finalizado recentemente.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  // Mostra apenas os últimos 5 treinos concluídos em ordem decrescente de data
  const historicoOrdenado = [...state.historico].reverse().slice(0, 5);
  
  historicoOrdenado.forEach((reg, idx) => {
    const card = document.createElement('div');
    card.className = 'historico-card';
    
    const dataFormatada = new Date(reg.dataConclusao).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Cria a lista de exercícios realizados com suas respectivas séries
    let exListHtml = '';
    if (reg.exercicios) {
      exListHtml = reg.exercicios.map(ex => {
        const seriesHtml = ex.series.filter(s => s.concluida).map((s, sIdx) => `${s.carga}kg x ${s.repeticoes}`).join(' | ');
        return `
          <div class="historico-ex-row">
            <span class="historico-ex-nome">${ex.nome}</span>
            <span class="historico-ex-series">${seriesHtml || '<span style="color:var(--danger)">Sem séries concluídas</span>'}</span>
          </div>
        `;
      }).join('');
    } else {
      // Legado (treinos anteriores à atualização de histórico detalhado)
      exListHtml = `
        <div class="historico-ex-row">
          <span class="historico-ex-nome" style="color:var(--text-muted)">Dados detalhados indisponíveis.</span>
          <span class="historico-ex-series">${reg.seriesConcluidas}/${reg.seriesTotais} séries</span>
        </div>
      `;
    }
    
    const cardId = `hist-card-${idx}`;
    card.innerHTML = `
      <div class="historico-card-header" onclick="document.getElementById('${cardId}').classList.toggle('collapsed')">
        <div class="historico-card-title">
          <strong>${reg.treinoNome}</strong>
          <span>${dataFormatada}</span>
        </div>
        <i data-lucide="chevron-down" style="width:16px;height:16px;color:var(--text-muted)"></i>
      </div>
      <div class="historico-card-body collapsed" id="${cardId}">
        ${exListHtml}
      </div>
    `;
    container.appendChild(card);
  });
}

// --- LOGICA DE MOVIMENTAÇÃO DE EXERCÍCIOS E RENOMEAÇÃO DE DIAS ---

let dadosMoverTemporarios = {
  treinoOrigemId: null,
  exercicioId: null
};

// ABRIR MODAL PARA MOVER EXERCÍCIO
window.abrirModalMoverExercicio = function(treinoOrigemId, exercicioId, nomeEx) {
  dadosMoverTemporarios.treinoOrigemId = treinoOrigemId;
  dadosMoverTemporarios.exercicioId = exercicioId;

  const treinoOrigem = state.treinos.find(t => t.id === treinoOrigemId);
  if (!treinoOrigem) return;

  document.getElementById('mover-nome-exercicio').innerText = nomeEx;
  document.getElementById('mover-treino-origem').innerText = treinoOrigem.nome;

  const destinosContainer = document.getElementById('mover-destinos-container');
  destinosContainer.innerHTML = '';

  // Lista os outros treinos disponíveis (destinos)
  const outrosTreinos = state.treinos.filter(t => t.id !== treinoOrigemId);

  if (outrosTreinos.length === 0) {
    destinosContainer.innerHTML = `
      <p class="empty-state-sm">Você precisa ter mais de um treino cadastrado para mover exercícios.</p>
      <button type="button" class="btn btn-secondary btn-sm" onclick="fecharModalMover(); abrirCadastroTreino();">
        Criar Novo Treino
      </button>
    `;
  } else {
    outrosTreinos.forEach(treinoDestino => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'seletor-item-btn';
      btn.innerHTML = `
        <span>Mover para <strong>${treinoDestino.nome}</strong></span>
        <i data-lucide="chevron-right"></i>
      `;
      btn.onclick = () => moverExercicioConfirmado(treinoDestino.id);
      destinosContainer.appendChild(btn);
    });
  }

  document.getElementById('modal-mover-exercicio').style.display = 'flex';
  lucide.createIcons();
};

// FECHAR MODAL DE MOVER
window.fecharModalMover = function() {
  document.getElementById('modal-mover-exercicio').style.display = 'none';
  dadosMoverTemporarios = { treinoOrigemId: null, exercicioId: null };
};

// EXECUTAR A MOVIMENTAÇÃO DO EXERCÍCIO
function moverExercicioConfirmado(treinoDestinoId) {
  const { treinoOrigemId, exercicioId } = dadosMoverTemporarios;
  if (!treinoOrigemId || !exercicioId || !treinoDestinoId) return;

  const treinoOrigem = state.treinos.find(t => t.id === treinoOrigemId);
  const treinoDestino = state.treinos.find(t => t.id === treinoDestinoId);

  if (!treinoOrigem || !treinoDestino) return;

  // Acha o index do exercício
  const exIndex = treinoOrigem.exercicios.findIndex(ex => ex.id === exercicioId);
  if (exIndex === -1) return;

  // Remove do treino de origem
  const [exercicioParaMover] = treinoOrigem.exercicios.splice(exIndex, 1);

  // Adiciona ao treino de destino
  treinoDestino.exercicios.push(exercicioParaMover);

  // Se o treino de origem for o treino ativo que está rodando, cancela para evitar inconsistências no player
  if (state.treinoAtivo && (state.treinoAtivo.id === treinoOrigemId || state.treinoAtivo.id === treinoDestinoId)) {
    cancelarTreinoAtivoSilencioso();
    alert('O treino ativo foi encerrado devido à modificação dos exercícios da rotina atual.');
  }

  salvarDados();
  renderizarDashboard();
  fecharModalMover();
  
  // Feedback visual rápido
  alert(`Exercício "${exercicioParaMover.nome}" movido com sucesso para "${treinoDestino.nome}"! 🔄`);
}

// EDICAO RAPIDA DE DIA OU NOME DO TREINO (ABRE O SELETOR VISUAL)
window.renomearTreinoRapido = function(treinoId) {
  abrirModalSelecionarDia('dashboard', treinoId);
};

// --- SELETOR DE DIA E REORDENAÇÃO DE TREINOS ---

let dadosSelecionarDiaTemporarios = {
  origem: null, // 'dashboard' ou 'cadastro'
  treinoId: null
};

// ABRIR SELETOR DE DIAS
window.abrirModalSelecionarDia = function(origem, treinoId = null) {
  dadosSelecionarDiaTemporarios.origem = origem;
  dadosSelecionarDiaTemporarios.treinoId = treinoId;
  
  document.getElementById('modal-selecionar-dia').style.display = 'flex';
};

// FECHAR SELETOR DE DIAS
window.fecharModalSelecionarDia = function() {
  document.getElementById('modal-selecionar-dia').style.display = 'none';
  dadosSelecionarDiaTemporarios = { origem: null, treinoId: null };
};

// CONFIRMAÇÃO DE SELEÇÃO DO DIA
window.selecionarDiaConfirmado = function(diaNome) {
  const { origem, treinoId } = dadosSelecionarDiaTemporarios;
  
  if (origem === 'cadastro') {
    document.getElementById('treino-nome').value = diaNome;
  } else if (origem === 'dashboard' && treinoId) {
    const treino = state.treinos.find(t => t.id === treinoId);
    if (treino) {
      treino.nome = diaNome;
      
      // Se for o ativo, atualiza o nome do header
      if (state.treinoAtivo && state.treinoAtivo.id === treinoId) {
        state.treinoAtivo.nome = diaNome;
        document.getElementById('ativo-nome-treino').innerText = diaNome;
        salvarEstadoTreinoAtivo();
      }
      
      salvarDados();
      renderizarDashboard();
    }
  }
  
  fecharModalSelecionarDia();
};

// DIGITAR NOME PERSONALIZADO
window.selecionarDiaPersonalizado = function() {
  const { origem, treinoId } = dadosSelecionarDiaTemporarios;
  let valorAtual = '';
  
  if (origem === 'cadastro') {
    valorAtual = document.getElementById('treino-nome').value;
  } else if (origem === 'dashboard' && treinoId) {
    const treino = state.treinos.find(t => t.id === treinoId);
    if (treino) valorAtual = treino.nome;
  }
  
  const personalizado = prompt('Digite o nome ou dia do treino personalizado:', valorAtual);
  if (personalizado !== null) {
    const nomeLimpo = personalizado.trim();
    if (nomeLimpo) {
      selecionarDiaConfirmado(nomeLimpo);
    } else {
      alert('O nome do treino não pode estar vazio.');
    }
  }
};

// REORDENAR TREINOS NO DASHBOARD (SUBSTITUTO ROBUSTO E FÁCIL PARA ARRASTAR NO MOBILE)
window.reordenarTreino = function(treinoId, direcao) {
  const index = state.treinos.findIndex(t => t.id === treinoId);
  if (index === -1) return;

  const novoIndex = index + direcao;
  // Verifica limites
  if (novoIndex < 0 || novoIndex >= state.treinos.length) return;

  // Troca posições no array
  const temp = state.treinos[index];
  state.treinos[index] = state.treinos[novoIndex];
  state.treinos[novoIndex] = temp;

  salvarDados();
  renderizarDashboard();
};

// --- LOGICA DE BANCO DE DADOS EM NUVEM (FIREBASE FIRESTORE) ---

let dbFirebase = null;
let unsubscribesFirebase = [];

// INICIALIZAR SDK DO FIREBASE
function inicializarFirebase(config) {
  if (typeof firebase === 'undefined') {
    console.error("Firebase SDK não está carregado. Verifique a conexão com a CDN.");
    return false;
  }
  
  try {
    let app;
    if (!firebase.apps.length) {
      app = firebase.initializeApp(config);
    } else {
      app = firebase.app();
    }
    
    dbFirebase = firebase.firestore(app);
    
    // Habilita persistência offline (suporte offline nativo do Firestore no PWA)
    dbFirebase.enablePersistence().catch(err => {
      if (err.code === 'failed-precondition') {
        console.warn("Firestore: Persistência falhou (múltiplas abas abertas).");
      } else if (err.code === 'unimplemented') {
        console.warn("Firestore: O navegador não suporta persistência offline.");
      }
    });
    
    return true;
  } catch (err) {
    console.error("Erro ao inicializar Firebase:", err);
    return false;
  }
}

// CONFIGURAÇÃO PADRÃO DO FIREBASE (FORNECIDA PELO USUÁRIO)
const FIREBASE_CONFIG_PADRAO = {
  apiKey: "AIzaSyANtV5wO1q_Ms-IoW01Un3lqSmfd0JMgRc",
  authDomain: "meus-treinos-7c285.firebaseapp.com",
  projectId: "meus-treinos-7c285",
  storageBucket: "meus-treinos-7c285.firebasestorage.app",
  messagingSenderId: "103228129670",
  appId: "1:103228129670:web:52f52f0203ae2a9bb0ac07"
};

// INICIAR CONEXÃO E SINCRONIZAÇÃO EM NUVEM
async function iniciarSincronizacaoNuvem() {
  let configRaw = localStorage.getItem('meus-treinos-firebase-config');
  let config;
  let primeiraInicializacao = false;

  if (!configRaw) {
    // Inicializa com a configuração padrão fornecida pelo usuário
    config = FIREBASE_CONFIG_PADRAO;
    localStorage.setItem('meus-treinos-firebase-config', JSON.stringify(config));
    primeiraInicializacao = true;
  } else {
    try {
      config = JSON.parse(configRaw);
    } catch (e) {
      config = FIREBASE_CONFIG_PADRAO;
    }
  }

  try {
    const sucesso = inicializarFirebase(config);
    if (!sucesso) {
      atualizarUIStatusNuvem(false);
      return;
    }

    atualizarUIStatusNuvem(true);

    // Se for a primeira inicialização com a nova chave, migra os dados locais para a nuvem
    if (primeiraInicializacao) {
      // UUID exclusivo do usuário para isolamento de dados
      let userUuid = localStorage.getItem('meus-treinos-user-uuid');
      if (!userUuid) {
        userUuid = 'user-' + Date.now() + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('meus-treinos-user-uuid', userUuid);
      }
      await migrarDadosLocaisParaNuvem();
    }

    // Cancela escutas anteriores se houver
    unsubscribesFirebase.forEach(unsub => unsub());
    unsubscribesFirebase = [];

    // UUID exclusivo do usuário para isolamento de dados
    let userUuid = localStorage.getItem('meus-treinos-user-uuid');
    if (!userUuid) {
      userUuid = 'user-' + Date.now() + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('meus-treinos-user-uuid', userUuid);
    }

    // Escuta em tempo real para sincronização da coleção de Treinos
    const unsubTreinos = dbFirebase.collection('usuarios').doc(userUuid).collection('treinos')
      .onSnapshot(snapshot => {
        const treinosNovos = [];
        snapshot.forEach(doc => {
          treinosNovos.push({ id: doc.id, ...doc.data() });
        });
        
        // Sincroniza se vierem dados válidos do Firestore
        if (treinosNovos.length > 0 || snapshot.metadata.fromCache) {
          state.treinos = treinosNovos.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
          localStorage.setItem('meus-treinos-data', JSON.stringify(state.treinos));
          renderizarDashboard();
        }
      }, err => {
        console.error("Firestore erro ao ler treinos:", err);
      });

    // Escuta em tempo real para sincronização da coleção de Histórico
    const unsubHistorico = dbFirebase.collection('usuarios').doc(userUuid).collection('historico')
      .onSnapshot(snapshot => {
        const historicoNovo = [];
        snapshot.forEach(doc => {
          historicoNovo.push({ id: doc.id, ...doc.data() });
        });
        
        if (historicoNovo.length > 0 || snapshot.metadata.fromCache) {
          state.historico = historicoNovo.sort((a, b) => new Date(a.dataConclusao) - new Date(b.dataConclusao));
          localStorage.setItem('meus-treinos-historico', JSON.stringify(state.historico));
          renderizarDashboard();
        }
      }, err => {
        console.error("Firestore erro ao ler historico:", err);
      });

    unsubscribesFirebase.push(unsubTreinos, unsubHistorico);

  } catch (e) {
    console.error("Erro na rotina de sincronização em nuvem:", e);
    atualizarUIStatusNuvem(false);
  }
}

// ATUALIZAR STATUS VISUAL DO BOTÃO DE NUVEM
function atualizarUIStatusNuvem(conectado) {
  const btnNuvem = document.getElementById('btn-nuvem-config-view');
  const iconCloud = document.getElementById('icon-cloud-status');
  const statusBox = document.getElementById('status-nuvem-box');
  const btnDesconectar = document.getElementById('btn-desconectar-nuvem');

  if (conectado) {
    iconCloud.classList.add('conectado');
    if (statusBox) {
      statusBox.className = 'status-nuvem-box conectado';
      statusBox.innerHTML = `
        <i data-lucide="cloud-lightning" style="width: 16px; height: 16px;"></i>
        <span>Sincronização em Nuvem Ativa</span>
      `;
    }
    if (btnDesconectar) btnDesconectar.style.display = 'block';
  } else {
    iconCloud.classList.remove('conectado');
    if (statusBox) {
      statusBox.className = 'status-nuvem-box desconectado';
      statusBox.innerHTML = `
        <i data-lucide="cloud-off" style="width: 16px; height: 16px;"></i>
        <span>Salvando Localmente (Sem Nuvem)</span>
      `;
    }
    if (btnDesconectar) btnDesconectar.style.display = 'none';
  }
  lucide.createIcons();
}

// ABRIR CONFIGURAÇÃO DE NUVEM
window.abrirModalNuvemConfig = function() {
  const configRaw = localStorage.getItem('meus-treinos-firebase-config');
  const txtArea = document.getElementById('nuvem-config-json');
  
  if (configRaw) {
    txtArea.value = JSON.stringify(JSON.parse(configRaw), null, 2);
    atualizarUIStatusNuvem(true);
  } else {
    txtArea.value = JSON.stringify(FIREBASE_CONFIG_PADRAO, null, 2);
    atualizarUIStatusNuvem(false);
  }

  document.getElementById('modal-nuvem-config').style.display = 'flex';
  lucide.createIcons();
};

// FECHAR CONFIGURAÇÃO DE NUVEM
window.fecharModalNuvemConfig = function() {
  document.getElementById('modal-nuvem-config').style.display = 'none';
};

// CONECTAR AO FIREBASE E SALVAR CONFIGURAÇÃO
window.conectarNuvemFirebase = async function() {
  const txtArea = document.getElementById('nuvem-config-json');
  const valor = txtArea.value.trim();

  if (!valor) {
    alert("Por favor, insira o código JSON de configuração do seu Firebase.");
    return;
  }

  try {
    let configObj = null;
    
    if (valor.includes('{') && valor.includes('}')) {
      const extrairJson = valor.substring(valor.indexOf('{'), valor.lastIndexOf('}') + 1);
      const jsonLimpo = extrairJson
        .replace(/([a-zA-Z0-9]+):/g, '"$1":') 
        .replace(/'/g, '"') 
        .replace(/,\s*}/g, '}') 
        .replace(/\/\/.*$/gm, ''); 
      
      configObj = JSON.parse(jsonLimpo);
    } else {
      configObj = JSON.parse(valor);
    }

    if (!configObj.apiKey || !configObj.projectId) {
      throw new Error("Chaves apiKey ou projectId ausentes na configuração.");
    }

    // Tenta inicializar
    const sucesso = inicializarFirebase(configObj);
    if (sucesso) {
      localStorage.setItem('meus-treinos-firebase-config', JSON.stringify(configObj));
      
      // Força a migração dos dados que já existiam localmente para a nuvem
      alert("Configuração válida! Iniciando migração dos dados locais para a nuvem...");
      await migrarDadosLocaisParaNuvem();
      
      // Inicia escutas ativas
      iniciarSincronizacaoNuvem();
      alert("Conectado à nuvem Firebase com sucesso! Seus treinos agora sincronizam automaticamente. 🎉");
      fecharModalNuvemConfig();
    } else {
      alert("Não foi possível inicializar o Firebase. Verifique se o JSON colado está completo e correto.");
    }
  } catch (e) {
    console.error(e);
    alert("Formato de configuração inválido. Cole exatamente o objeto 'firebaseConfig' gerado pelo painel do Firebase.");
  }
};

// DESCONECTAR E VOLTAR AO MODO LOCAL
window.desconectarNuvemFirebase = function() {
  if (confirm("Deseja realmente desconectar da nuvem? O aplicativo voltará a salvar apenas na memória local deste aparelho.")) {
    // Para todas as escutas
    unsubscribesFirebase.forEach(unsub => unsub());
    unsubscribesFirebase = [];
    
    dbFirebase = null;
    localStorage.removeItem('meus-treinos-firebase-config');
    
    // Atualiza interface
    atualizarUIStatusNuvem(false);
    renderizarDashboard();
    
    alert("Desconectado da nuvem com sucesso!");
    fecharModalNuvemConfig();
  }
};

// MIGRAR DADOS DO LOCALSTORAGE PARA O FIREBASE FIRESTORE
async function migrarDadosLocaisParaNuvem() {
  if (!dbFirebase) return;
  const userUuid = localStorage.getItem('meus-treinos-user-uuid');
  if (!userUuid) return;

  try {
    const batch = dbFirebase.batch();

    // Migra treinos
    state.treinos.forEach((treino, idx) => {
      const docRef = dbFirebase.collection('usuarios').doc(userUuid).collection('treinos').doc(treino.id);
      batch.set(docRef, { ...treino, ordem: idx });
    });

    // Migra histórico
    state.historico.forEach(reg => {
      const docRef = dbFirebase.collection('usuarios').doc(userUuid).collection('historico').doc(reg.id);
      batch.set(docRef, reg);
    });

    await batch.commit();
    console.log("Migração de dados locais concluída com sucesso no Firestore.");
  } catch (e) {
    console.error("Falha ao migrar dados locais para a nuvem:", e);
  }
}
