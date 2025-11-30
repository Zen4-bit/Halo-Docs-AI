/**
 * Secure API Key Storage Utility
 * Stores Google API key encrypted in localStorage
 */

const STORAGE_KEY = 'halo_ai_api_key';
const ENCRYPTION_KEY = 'halo-ai-secure-key-v1'; // In production, use a more secure method

/**
 * Simple XOR encryption for localStorage
 * Note: This is basic obfuscation. For production, consider using Web Crypto API
 */
function encryptKey(key: string): string {
  const encrypted = key.split('').map((char, i) => {
    const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
  }).join('');
  
  return btoa(encrypted); // Base64 encode
}

function decryptKey(encrypted: string): string {
  try {
    const decoded = atob(encrypted); // Base64 decode
    const decrypted = decoded.split('').map((char, i) => {
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    }).join('');
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return '';
  }
}

/**
 * Save API key to encrypted localStorage
 */
export function saveApiKey(apiKey: string): void {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key cannot be empty');
  }
  
  const encrypted = encryptKey(apiKey);
  localStorage.setItem(STORAGE_KEY, encrypted);
}

/**
 * Get API key from encrypted localStorage
 */
export function getApiKey(): string | null {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) {
    return null;
  }
  
  return decryptKey(encrypted);
}

/**
 * Remove API key from localStorage
 */
export function removeApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if API key exists
 */
export function hasApiKey(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Get masked API key for display (shows last 4 characters)
 */
export function getMaskedApiKey(): string | null {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.length < 4) {
    return null;
  }
  
  return `...${apiKey.slice(-4)}`;
}
