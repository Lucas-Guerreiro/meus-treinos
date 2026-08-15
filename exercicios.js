const EXERCICIOS_PADRAO = [
  // PEITO
  {
    id: "supino_reto",
    nome: "Supino Reto com Barra",
    grupo: "Peito",
    imagem: "assets/supino_reto.jpg",
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+supino+reto+barra",
    passos: [
      "Deite-se no banco plano com os pés firmes no chão.",
      "Segure a barra com as mãos um pouco mais largas que a largura dos ombros (pegada pronada).",
      "Retraia as escápulas (junte as asas das costas) e mantenha uma leve curvatura natural na lombar.",
      "Retire a barra do suporte e desça-a de forma controlada até tocar levemente a parte média do peito.",
      "Empurre a barra verticalmente de volta para a posição inicial, expirando o ar."
    ],
    dicas: "Mantenha os cotovelos a um ângulo aproximado de 45° a 60° em relação ao seu tronco para proteger as articulações dos ombros.",
    erros: "Bater a barra no peito para pegar impulso, tirar os calcanhares do chão ou abrir demais os cotovelos (90°)."
  },
  {
    id: "supino_inclinado_halteres",
    nome: "Supino Inclinado com Halteres",
    grupo: "Peito",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+supino+inclinado+halteres",
    passos: [
      "Ajuste o banco para uma inclinação entre 30° e 45°.",
      "Sente-se apoiando os halteres nas coxas e deite-se, empurrando os halteres para cima.",
      "Desça os halteres de forma controlada lateralmente ao peito até sentir un bom alongamento.",
      "Empurre os halteres para cima e ligeiramente para dentro, sem deixá-los bater no topo.",
      "Mantenha o abdômen contraído durante todo o movimento."
    ],
    dicas: "A inclinação foca na porção superior do peitoral (clavicular). Mantenha o movimento sob controle na descida (fase excêntrica).",
    erros: "Inclinar demais o banco (acima de 45° transfere o esforço para os ombros) ou descer desalinhado."
  },
  {
    id: "crucifixo_maquina",
    nome: "Pec Deck / Crucifixo Máquina",
    grupo: "Peito",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+crucifixo+maquina+pec+deck",
    passos: [
      "Ajuste a altura do banco para que as alças fiquem alinhadas com a parte média do seu peito.",
      "Sente-se com as costas bem apoiadas e segure os pegadores com os cotovelos levemente flexionados.",
      "Feche os braços à frente do corpo contraindo o peitoral, segurando a contração por 1 segundo no final.",
      "Abra os braços lentamente até a posição inicial, sentindo o alongamento do peito."
    ],
    dicas: "Foque em aproximar os bíceps um do outro no final do movimento para contração máxima.",
    erros: "Deixar o peso bater no retorno ou usar os ombros para empurrar projetando-os para frente."
  },

  // COSTAS
  {
    id: "puxada_frente",
    nome: "Puxada Aberta na Polia",
    grupo: "Costas",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+puxada+frente+polia",
    passos: [
      "Ajuste o suporte de pernas para ficar firme. Segure a barra com uma pegada pronada bem aberta.",
      "Sente-se e incline ligeiramente o tronco para trás (cerca de 10° a 15°).",
      "Puxe a barra para baixo em direção à parte superior do peito, conduzindo o movimento com os cotovelos.",
      "Aproxime as escápulas no final do movimento.",
      "Retorne a barra lentamente até a extensão quase completa dos braços."
    ],
    dicas: "Imagine que suas mãos são apenas ganchos e você está puxando o peso usando a força das costas e dos cotovelos.",
    erros: "Puxar a barra atrás da nuca (causa lesões no ombro) ou usar o impulso do corpo jogando o tronco muito para trás."
  },
  {
    id: "remada_curvada",
    nome: "Remada Curvada com Barra",
    grupo: "Costas",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+remada+curvada+barra",
    passos: [
      "Fique em pé com os pés na largura dos ombros. Segure a barra com pegada pronada.",
      "Flexione levemente os joelhos e incline o tronco para frente a partir do quadril (cerca de 45°), mantendo a coluna reta.",
      "Puxe a barra em direção ao abdômen inferior (perto do umbigo), espremendo as costas.",
      "Mantenha os cotovelos apontando para trás e próximos ao corpo.",
      "Desça a barra lentamente até a posição inicial."
    ],
    dicas: "Mantenha a lombar firme e travada. O abdômen deve ficar contraído para proteger sua coluna.",
    erros: "Curvar a coluna vertebral (arredondar as costas) ou usar impulso das pernas para levantar a carga."
  },
  {
    id: "remada_baixa",
    nome: "Remada Baixa Sentada (Triângulo)",
    grupo: "Costas",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+remada+baixa+sentada+triangulo",
    passos: [
      "Sente-se no aparelho, apoie os pés nas plataformas com os joelhos levemente flexionados.",
      "Segure o puxador triângulo, mantenha as costas retas e o peito estufado.",
      "Puxe o triângulo em direção ao abdômen inferior, levando os cotovelos bem para trás.",
      "Mantenha os ombros abaixados e retraia as escápulas ao final do movimento.",
      "Estenda os braços controlando o peso, sem soltar o tronco para a frente."
    ],
    dicas: "Evite movimentar excessivamente o tronco para frente e para trás. Deixe que as costas façam o trabalho.",
    erros: "Projetar os ombros para cima e tensionar o trapézio, ou arredondar a lombar ao esticar os braços."
  },

  // PERNAS
  {
    id: "agachamento_livre",
    nome: "Agachamento Livre com Barra",
    grupo: "Pernas",
    imagem: "assets/agachamento_livre.jpg",
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+agachamento+livre+barra",
    passos: [
      "Posicione a barra sobre a musculatura do trapézio (não no pescoço) e tire-a do suporte.",
      "Afaste os pés na largura dos ombros, apontando os dedos levemente para fora (cerca de 15° a 30°).",
      "Inicie o movimento empurrando o quadril para trás e flexionando os joelhos, como se fosse sentar em uma cadeira.",
      "Desça até que as coxas fiquem pelo menos paralelas ao chão (ou mais, se mantiver a lombar neutra).",
      "Suba empurrando o chão com toda a sola do pé, mantendo o joelho alinhado com as pontas dos pés."
    ],
    dicas: "Mantenha o peito aberto e olhe para frente. Contraia o abdômen profundamente antes de iniciar cada descida.",
    erros: "Deixar os joelhos desabarem para dentro (valgo dinâmico) ou tirar os calcanhares do chão durante a descida."
  },
  {
    id: "leg_press_45",
    nome: "Leg Press 45°",
    grupo: "Pernas",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+leg+press+45",
    passos: [
      "Sente-se no aparelho e apoie as costas e a cabeça completamente no encosto.",
      "Posicione os pés na plataforma na largura dos ombros. Destrave a rota da trava de segurança.",
      "Flexione os joelhos trazendo a plataforma em direção ao peito de forma lenta, até um ângulo próximo de 90°.",
      "Empurre a plataforma de volta, focando a força nos calcanhares.",
      "Pare a extensão um pouco antes de esticar totalmente os joelhos (evite travar as articulações)."
    ],
    dicas: "A posição dos pés mais alta foca mais em glúteos/isquiotibiais; mais baixa foca mais nos quadríceps.",
    erros: "Tirar o quadril do banco durante a descida (coloca extrema pressão na lombar) ou travar totalmente os joelhos no topo."
  },
  {
    id: "cadeira_extensora",
    nome: "Cadeira Extensora",
    grupo: "Pernas",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+cadeira+extensora",
    passos: [
      "Ajuste o encosto para que a dobra do seu joelho fique exatamente no limite do assento.",
      "Ajuste o rolo de espuma para ficar logo acima da articulação do tornozelo.",
      "Segure firme nos apoios laterais e estenda as pernas totalmente até o topo.",
      "Segure 1 segundo na contração máxima e desça o peso de forma controlada."
    ],
    dicas: "Mantenha o quadril bem colado no banco puxando os pegadores laterais para cima durante a execução.",
    erros: "Usar impulso excessivo (chutar o peso) ou não ajustar o encosto corretamente deixando o quadril solto."
  },
  {
    id: "mesa_flexora",
    nome: "Mesa Flexora",
    grupo: "Pernas",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+mesa+flexora",
    passos: [
      "Deite-se de bruços na mesa, alinhando a articulação do joelho com o eixo de rotação da máquina.",
      "Posicione o rolo de espuma logo acima do calcanhar.",
      "Flexione as pernas puxando o rolo em direção aos glúteos de forma vigorosa.",
      "Retorne lentamente alongando os isquiotibiais (posteriores de coxa)."
    ],
    dicas: "Pressione o quadril firmemente contra o estofado durante todo o movimento para evitar compensações da lombar.",
    erros: "Tirar o quadril/pélvis do banco ao dobrar os joelhos ou fazer movimentos curtos."
  },

  // OMBROS
  {
    id: "desenvolvimento_halteres",
    nome: "Desenvolvimento com Halteres",
    grupo: "Ombros",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+desenvolvimento+halteres",
    passos: [
      "Sente-se em um banco com encosto reto ou levemente inclinado. Apoie bem a coluna.",
      "Suba os halteres até a altura das orelhas, com os cotovelos apontando levemente para frente (plano escapular).",
      "Empurre os halteres para cima em un arco suave até que seus braços estejam estendidos sobre a cabeça.",
      "Desça os halteres lentamente até que fiquem na linha do queixo ou orelhas."
    ],
    dicas: "Evite deixar os cotovelos totalmente abertos para os lados; trazê-los um pouco para dentro protege a articulação do ombro.",
    erros: "Arquear excessivamente a lombar afastando as costas do banco, ou bater os halteres no topo."
  },
  {
    id: "elevacao_lateral",
    nome: "Elevação Lateral com Halteres",
    grupo: "Ombros",
    imagem: "assets/elevacao_lateral.jpg",
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+elevacao+lateral+halteres",
    passos: [
      "Fique em pé com o tronco ligeiramente inclinado para frente (cerca de 5°) e os joelhos destravados.",
      "Segure os halteres à frente das coxas com os cotovelos levemente flexionados.",
      "Eleve os braços lateralmente até que os cotovelos cheguem à altura dos ombros.",
      "Durante a subida, mantenha os cotovelos ligeiramente acima dos punhos.",
      "Desça os halteres de forma controlada, resistindo à gravidade."
    ],
    dicas: "Pense em empurrar os halteres 'para os lados e para longe' do corpo, em vez de apenas levantá-los.",
    erros: "Usar impulso balançando o corpo (roubo) ou subir as mãos acima da linha dos cotovelos."
  },

  // BRAÇOS (BÍCEPS E TRÍCEPS)
  {
    id: "rosca_direta_halteres",
    nome: "Rosca Direta Alternada (Halteres)",
    grupo: "Braços",
    imagem: "assets/rosca_direta.jpg",
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+rosca+direta+alternada+halteres",
    passos: [
      "Fique em pé com os pés na largura dos ombros, segurando um halter em cada mão com os braços esticados ao lado do corpo.",
      "Mantenha os cotovelos colados ao lado do tronco durante todo o movimento.",
      "Eleve um halter flexionando o braço e girando o punho para cima (supinação) na metade do caminho.",
      "Contraia o bíceps no topo por um instante e desça de forma controlada.",
      "Repita o movimento com o outro braço, alternando-os."
    ],
    dicas: "Para contração máxima, garanta que a palma da mão termine apontando diretamente para o seu ombro.",
    erros: "Mover os cotovelos para frente ou para trás para ajudar a subir o peso, ou balançar as costas."
  },
  {
    id: "tricep_pulley",
    nome: "Tríceps na Polia (Corda ou Barra)",
    grupo: "Braços",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+triceps+corda+polia",
    passos: [
      "Fique de frente para a polia alta. Segure a corda com pegada neutra (palmas viradas uma para a outra).",
      "Posicione os cotovelos ao lado do corpo e flexione os joelhos levemente. Incline o tronco de leve para frente.",
      "Estenda os braços para baixo até que fiquem totalmente retos.",
      "Se estiver usando a corda, afaste as pontas no final do movimento para contração extra do tríceps.",
      "Retorne lentamente até que o antebraço ultrapasse um pouco a linha horizontal de 90°."
    ],
    dicas: "Os cotovelos devem atuar como uma dobradiça fixa. Não os mova para frente e para trás.",
    erros: "Deixar os cotovelos se afastarem das costelas ou usar o peso do corpo para empurrar a carga para baixo."
  },

  // CORE (ABDOMINAIS)
  {
    id: "abdominal_infra",
    nome: "Abdominal Infra no Chão",
    grupo: "Core",
    imagem: null,
    videoUrl: "https://www.youtube.com/results?search_query=execucao+correta+abdominal+infra+chao",
    passos: [
      "Deite-se de costas em um colchonete, com as mãos sob o quadril para apoiar a lombar ou estendidas ao lado.",
      "Mantenha as pernas juntas e estendidas (ou ligeiramente flexionadas se for iniciante).",
      "Contraia o abdômen e eleve as pernas juntas até formarem um ângulo de 90° com o quadril.",
      "Desça as pernas devagar até quase tocar o chão, mantendo a lombar pressionada contra o solo."
    ],
    dicas: "O foco é movimentar a bacia e usar o abdômen inferior. Se sentir a lombar arquear ou doer, diminua a amplitude ou flexione mais os joelhos.",
    erros: "Deixar la lombar descolar do chão durante a descida das pernas, ou descer as pernas rápido demais."
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EXERCICIOS_PADRAO };
}
