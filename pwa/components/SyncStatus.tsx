import React, { useState, useEffect } from 'react';

export function SyncStatus() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncOfflineData();
      }
    }, 30000); // Sync every 30 seconds when online

    return () => clearInterval(interval);
  }, []);

  const syncOfflineData = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      // Check for offline data to sync
      const offlineItems = Object.keys(localStorage).filter(key => 
        key.startsWith('offline-')
      );

      if (offlineItems.length > 0) {
        // Process offline items
        for (const key of offlineItems) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            
            if (key.includes('upload')) {
              // Sync offline uploads
              const formData = new FormData();
              const file = dataURItoBlob(data.data);
              formData.append('file', file, data.filename);
              if (data.conversationId) {
                formData.append('conversationId', data.conversationId);
              }

              await fetch('/api/lite/upload', {
                method: 'POST',
                body: formData,
              });
            }
            
            // Remove synced item
            localStorage.removeItem(key);
          } catch (error) {
            console.error('Sync failed for item:', key, error);
          }
        }
      }
      
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  if (!syncing && !lastSync) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
      {syncing ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
          <span>Sincronizando...</span>
        </>
      ) : (
        <span>Última sync: {lastSync?.toLocaleTimeString()}</span>
      )}
    </div>
  );
}