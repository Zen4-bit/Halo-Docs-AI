'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { terminateAllPools } from '@/lib/client/workerPool';

interface FileMetadata {
    name: string;
    type: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    lastModified: number;
}

interface ActiveFileState {
    file: File | null;
    fileId: string | null; // Unique ID for cache namespacing
    arrayBuffer: ArrayBuffer | null;
    objectURL: string | null;
    metadata: FileMetadata | null;
    isLoading: boolean;
    previousFile: {
        file: File;
        fileId: string;
        metadata: FileMetadata;
    } | null;
}

interface ActiveFileContextType extends ActiveFileState {
    setActiveFile: (file: File, acceptedTypes?: string[]) => Promise<void>;
    clearActiveFile: () => void;
    restorePreviousFile: () => Promise<void>;
    cloneBuffer: () => ArrayBuffer | null;
    validateFileType: (file: File, acceptedTypes: string[]) => boolean;
}

const ActiveFileContext = createContext<ActiveFileContextType | undefined>(undefined);

// Generate unique file ID for cache namespacing
function generateFileId(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}_${Date.now()}`;
}

export function ActiveFileProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ActiveFileState>({
        file: null,
        fileId: null,
        arrayBuffer: null,
        objectURL: null,
        metadata: null,
        isLoading: false,
        previousFile: null,
    });

    // Track all created object URLs for cleanup
    const objectURLsRef = useRef<Set<string>>(new Set());

    const extractMetadata = async (file: File): Promise<FileMetadata> => {
        const metadata: FileMetadata = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
        };

        if (file.type.startsWith('image/')) {
            try {
                const img = await createImageBitmap(file);
                metadata.width = img.width;
                metadata.height = img.height;
                img.close();
            } catch (error) {
                console.error('Failed to extract image dimensions:', error);
            }
        } else if (file.type.startsWith('video/')) {
            try {
                const video = document.createElement('video');
                const tempURL = URL.createObjectURL(file);

                await new Promise<void>((resolve, reject) => {
                    video.onloadedmetadata = () => {
                        metadata.width = video.videoWidth;
                        metadata.height = video.videoHeight;
                        metadata.duration = video.duration;
                        resolve();
                    };
                    video.onerror = () => reject(new Error('Failed to load video'));
                    video.src = tempURL;
                });

                URL.revokeObjectURL(tempURL);
            } catch (error) {
                console.error('Failed to extract video metadata:', error);
            }
        }

        return metadata;
    };

    const validateFileType = useCallback((file: File, acceptedTypes: string[]): boolean => {
        if (!acceptedTypes || acceptedTypes.length === 0) return true;

        return acceptedTypes.some(type => {
            if (type.endsWith('/*')) {
                // Handle wildcards like 'image/*'
                const prefix = type.slice(0, -2);
                return file.type.startsWith(prefix);
            } else if (type.startsWith('.')) {
                // Handle extensions like '.pdf'
                return file.name.toLowerCase().endsWith(type.toLowerCase());
            } else {
                // Exact MIME type match
                return file.type === type;
            }
        });
    }, []);

    const cleanupResources = useCallback(() => {
        // Revoke all tracked object URLs
        objectURLsRef.current.forEach(url => {
            try {
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Failed to revoke object URL:', error);
            }
        });
        objectURLsRef.current.clear();

        // Clear worker caches (workers will handle their own cleanup)
        try {
            terminateAllPools();
        } catch (error) {
            console.error('Failed to clear worker pools:', error);
        }
    }, []);

    const setActiveFile = useCallback(async (file: File, acceptedTypes?: string[]) => {
        // Validate file type if restrictions provided
        if (acceptedTypes && !validateFileType(file, acceptedTypes)) {
            const acceptedStr = acceptedTypes.join(', ');
            throw new Error(`Invalid file type. Expected: ${acceptedStr}, Got: ${file.type || 'unknown'}`);
        }

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // Store previous file for restore functionality
            const previousFile = state.file && state.fileId && state.metadata ? {
                file: state.file,
                fileId: state.fileId,
                metadata: state.metadata,
            } : null;

            // Full cleanup of previous resources
            cleanupResources();

            // Generate unique file ID
            const fileId = generateFileId(file);

            // Extract metadata
            const metadata = await extractMetadata(file);

            // Create ArrayBuffer and Object URL
            const arrayBuffer = await file.arrayBuffer();
            const objectURL = URL.createObjectURL(file);
            objectURLsRef.current.add(objectURL);

            // Update state with new file
            setState({
                file,
                fileId,
                arrayBuffer,
                objectURL,
                metadata,
                isLoading: false,
                previousFile,
            });

            // File set successfully
        } catch (error) {
            console.error('Failed to set active file:', error);
            setState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    }, [state.file, state.fileId, state.metadata, cleanupResources, validateFileType]);

    const restorePreviousFile = useCallback(async () => {
        if (!state.previousFile) {
            throw new Error('No previous file to restore');
        }

        const { file, fileId, metadata } = state.previousFile;

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // Cleanup current resources
            cleanupResources();

            // Create new ArrayBuffer and Object URL from previous file
            const arrayBuffer = await file.arrayBuffer();
            const objectURL = URL.createObjectURL(file);
            objectURLsRef.current.add(objectURL);

            setState({
                file,
                fileId,
                arrayBuffer,
                objectURL,
                metadata,
                isLoading: false,
                previousFile: null, // Clear previous after restore
            });

            // Previous file restored
        } catch (error) {
            console.error('Failed to restore previous file:', error);
            setState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    }, [state.previousFile, cleanupResources]);

    const clearActiveFile = useCallback(() => {
        // Full cleanup
        cleanupResources();

        // Clear state
        setState({
            file: null,
            fileId: null,
            arrayBuffer: null,
            objectURL: null,
            metadata: null,
            isLoading: false,
            previousFile: null,
        });

        // Active file cleared
    }, [cleanupResources]);

    const cloneBuffer = useCallback((): ArrayBuffer | null => {
        if (!state.arrayBuffer) return null;
        // Create a new ArrayBuffer copy for worker transfer
        return state.arrayBuffer.slice(0);
    }, [state.arrayBuffer]);

    const value: ActiveFileContextType = {
        ...state,
        setActiveFile,
        clearActiveFile,
        restorePreviousFile,
        cloneBuffer,
        validateFileType,
    };

    return (
        <ActiveFileContext.Provider value={value}>
            {children}
        </ActiveFileContext.Provider>
    );
}

export function useActiveFile() {
    const context = useContext(ActiveFileContext);
    if (context === undefined) {
        throw new Error('useActiveFile must be used within ActiveFileProvider');
    }
    return context;
}
