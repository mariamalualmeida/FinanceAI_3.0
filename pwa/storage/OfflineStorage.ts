export class OfflineStorage {
  private dbName = 'financeai-pwa';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('conversations')) {
          db.createObjectStore('conversations', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('conversationId', 'conversationId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('offlineMessages')) {
          db.createObjectStore('offlineMessages', { keyPath: 'id' });
        }
      };
    });
  }

  async storeConversations(conversations: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['conversations'], 'readwrite');
    const store = transaction.objectStore('conversations');
    
    for (const conv of conversations) {
      await store.put(conv);
    }
  }

  async getConversations(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async storeMessages(conversationId: string, messages: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    
    for (const message of messages) {
      await store.put({ ...message, conversationId });
    }
  }

  async getMessages(conversationId: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('conversationId');
      const request = index.getAll(conversationId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async storeOfflineMessage(message: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offlineMessages'], 'readwrite');
    const store = transaction.objectStore('offlineMessages');
    await store.put(message);
  }

  async getOfflineMessages(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineMessages'], 'readonly');
      const store = transaction.objectStore('offlineMessages');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearOfflineMessages(): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offlineMessages'], 'readwrite');
    const store = transaction.objectStore('offlineMessages');
    await store.clear();
  }
}