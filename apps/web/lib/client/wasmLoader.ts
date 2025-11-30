// Lazy loading and caching for WebAssembly modules

type WASMModule = 'ffmpeg' | 'pdflib';

interface WASMCache {
    module: any;
    loadedAt: number;
}

class WASMLoaderClass {
    private cache = new Map<WASMModule, WASMCache>();
    private loading = new Map<WASMModule, Promise<any>>();
    private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    async loadFFmpeg() {
        const cacheKey: WASMModule = 'ffmpeg';

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.loadedAt < this.CACHE_DURATION) {
            return cached.module;
        }

        // Check if currently loading
        if (this.loading.has(cacheKey)) {
            return this.loading.get(cacheKey);
        }

        // Start new load
        const loadPromise = this.initializeFFmpeg();
        this.loading.set(cacheKey, loadPromise);

        try {
            const ffmpeg = await loadPromise;
            this.cache.set(cacheKey, {
                module: ffmpeg,
                loadedAt: Date.now(),
            });
            this.loading.delete(cacheKey);
            return ffmpeg;
        } catch (error) {
            this.loading.delete(cacheKey);
            throw error;
        }
    }

    private async initializeFFmpeg() {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        const { toBlobURL } = await import('@ffmpeg/util');

        const ffmpeg = new FFmpeg();

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        // Set up logging
        ffmpeg.on('log', ({ message }) => {
            console.log('[FFmpeg]', message);
        });

        return ffmpeg;
    }

    async loadPDFLib() {
        const cacheKey: WASMModule = 'pdflib';

        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.loadedAt < this.CACHE_DURATION) {
            return cached.module;
        }

        if (this.loading.has(cacheKey)) {
            return this.loading.get(cacheKey);
        }

        const loadPromise = this.initializePDFLib();
        this.loading.set(cacheKey, loadPromise);

        try {
            const pdfLib = await loadPromise;
            this.cache.set(cacheKey, {
                module: pdfLib,
                loadedAt: Date.now(),
            });
            this.loading.delete(cacheKey);
            return pdfLib;
        } catch (error) {
            this.loading.delete(cacheKey);
            throw error;
        }
    }

    private async initializePDFLib() {
        const pdfLib = await import('pdf-lib');
        return pdfLib;
    }

    clearCache() {
        this.cache.clear();
        this.loading.clear();
    }

    getCacheStatus() {
        const status: Record<string, any> = {};
        this.cache.forEach((value, key) => {
            status[key] = {
                loaded: true,
                age: Date.now() - value.loadedAt,
                expires: this.CACHE_DURATION - (Date.now() - value.loadedAt),
            };
        });
        return status;
    }
}

export const WASMLoader = new WASMLoaderClass();
