// IndexedDB utilities for file persistence

const DB_NAME = 'MediaToolsDB';
const DB_VERSION = 1;
const STORE_NAME = 'activeFiles';

interface PersistedFile {
    id: string;
    file: File;
    metadata: any;
    timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

export async function saveFileToIndexedDB(file: File, metadata: any): Promise<void> {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const data: PersistedFile = {
            id: 'activeFile',
            file,
            metadata,
            timestamp: Date.now(),
        };

        await new Promise<void>((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        db.close();
    } catch (error) {
        console.error('Failed to save file to IndexedDB:', error);
        throw error;
    }
}

export async function loadFileFromIndexedDB(): Promise<{ file: File; metadata: any } | null> {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const data = await new Promise<PersistedFile | undefined>((resolve, reject) => {
            const request = store.get('activeFile');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        db.close();

        if (!data) return null;

        // Check if file is not too old (24 hours)
        const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000;
        if (isExpired) {
            await clearIndexedDB();
            return null;
        }

        return {
            file: data.file,
            metadata: data.metadata,
        };
    } catch (error) {
        console.error('Failed to load file from IndexedDB:', error);
        return null;
    }
}

export async function clearIndexedDB(): Promise<void> {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        await new Promise<void>((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        db.close();
    } catch (error) {
        console.error('Failed to clear IndexedDB:', error);
    }
}

export async function deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
