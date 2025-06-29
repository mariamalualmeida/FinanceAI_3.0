const CACHE_NAME = 'financeai-pwa-v2.8.0';
const OFFLINE_CACHE = 'financeai-offline-v2.8.0';

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

// API routes that can work offline
const OFFLINE_FALLBACK_PAGES = [
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('Service Worker: Caching offline pages');
        return cache.addAll(OFFLINE_FALLBACK_PAGES);
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      // Ensure all clients are controlled by this service worker
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If online, return the response and update cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, serve from cache or fallback
          return caches.match(request)
            .then((response) => {
              return response || caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      handleApiRequest(request)
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Handle API requests with offline fallback
async function handleApiRequest(request) {
  try {
    // Try to fetch from network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const responseClone = response.clone();
      const cache = await caches.open(OFFLINE_CACHE);
      await cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    // If network fails, try to serve from cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for specific endpoints
    const url = new URL(request.url);
    
    if (url.pathname.includes('/api/conversations')) {
      return new Response(
        JSON.stringify({ 
          offline: true, 
          message: 'Dados salvos localmente. Sincronizará quando voltar online.' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (url.pathname.includes('/api/messages')) {
      return new Response(
        JSON.stringify([]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For other API requests, return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline mode', 
        message: 'Esta funcionalidade requer conexão com internet' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle background sync for uploading files when back online
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'upload-files') {
    event.waitUntil(
      syncPendingUploads()
    );
  }
  
  if (event.tag === 'sync-conversations') {
    event.waitUntil(
      syncPendingConversations()
    );
  }
});

// Sync pending file uploads
async function syncPendingUploads() {
  try {
    // Get pending uploads from IndexedDB
    const pendingUploads = await getPendingUploads();
    
    for (const upload of pendingUploads) {
      try {
        const formData = new FormData();
        formData.append('file', upload.file);
        formData.append('conversationId', upload.conversationId);
        
        const response = await fetch('/api/upload-financial-document', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          // Remove from pending uploads
          await removePendingUpload(upload.id);
          console.log('File uploaded successfully:', upload.fileName);
        }
      } catch (error) {
        console.error('Failed to upload file:', upload.fileName, error);
      }
    }
  } catch (error) {
    console.error('Error syncing uploads:', error);
  }
}

// Sync pending conversations
async function syncPendingConversations() {
  try {
    // Implementation for syncing conversations when back online
    console.log('Syncing pending conversations...');
  } catch (error) {
    console.error('Error syncing conversations:', error);
  }
}

// Helper functions for IndexedDB operations (simplified)
async function getPendingUploads() {
  // This would connect to IndexedDB to get pending uploads
  return [];
}

async function removePendingUpload(id) {
  // This would remove the upload from IndexedDB
  console.log('Removing pending upload:', id);
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova análise financeira disponível',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver análise',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('FinanceAI', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Log service worker messages
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Script loaded');