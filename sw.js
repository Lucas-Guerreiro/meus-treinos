const CACHE_NAME = 'meus-treinos-cache-v8';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './exercicios.js',
  './manifest.json',
  './assets/logo.jpg',
  './assets/supino_reto.jpg',
  './assets/agachamento_livre.jpg',
  './assets/rosca_direta.jpg',
  './assets/elevacao_lateral.jpg',
  './assets/supino_inclinado.jpg',
  './assets/puxada_frente.jpg',
  './assets/desenvolvimento_halteres.jpg',
  './assets/triceps_polia.jpg',
  './assets/crucifixo_maquina.jpg',
  './assets/remada_curvada.jpg',
  './assets/remada_baixa.jpg',
  './assets/leg_press.jpg',
  './assets/cadeira_extensora.jpg',
  './assets/mesa_flexora.jpg',
  './assets/abdominal_infra.jpg'
];

// Instalação do Service Worker e caching de recursos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Realizando cache dos recursos estáticos');
      // Tenta fazer o cache dos assets locais obrigatórios
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepção de requisições - Estratégia Stale-While-Revalidate para máximo suporte offline
self.addEventListener('fetch', event => {
  // Ignora requisições de esquemas não suportados (ex: chrome-extension ou file://)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Atualiza o cache em segundo plano se houver conexão
        fetch(event.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {
          // Falha silenciosa se estiver offline
        });
        
        return cachedResponse;
      }

      // Se não estiver no cache, busca na rede
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Armazena no cache recursos dinâmicos (como Lucide CDN ou Google Fonts)
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
