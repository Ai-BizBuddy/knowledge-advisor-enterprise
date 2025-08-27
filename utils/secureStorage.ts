/**
 * Secure Storage Utilities
 *
 * Provides secure alternatives to localStorage for sensitive data
 */

import { environmentChecks } from './environmentValidation';

interface StorageOptions {
  encrypt?: boolean;
  expiration?: number; // milliseconds
  prefix?: string;
}

interface StorageItem<T> {
  data: T;
  timestamp: number;
  expiration?: number;
  encrypted: boolean;
}

/**
 * Simple encryption/decryption for client-side data
 * Note: This is not cryptographically secure, just obfuscation
 */
class SimpleEncryption {
  private key: string;

  constructor() {
    // Generate a key based on browser fingerprint
    this.key = this.generateKey();
  }

  private generateKey(): string {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'server-key';
    }

    const fingerprint = [
      navigator.userAgent || '',
      navigator.language || '',
      typeof screen !== 'undefined' ? screen.width : 0,
      typeof screen !== 'undefined' ? screen.height : 0,
      new Date().getTimezoneOffset(),
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  encrypt(data: string): string {
    if (!data) return data;

    let result = '';
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      const keyChar = this.key.charCodeAt(i % this.key.length);
      result += String.fromCharCode(char ^ keyChar);
    }

    return btoa(result);
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData;

    try {
      const data = atob(encryptedData);
      let result = '';

      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        const keyChar = this.key.charCodeAt(i % this.key.length);
        result += String.fromCharCode(char ^ keyChar);
      }

      return result;
    } catch {
      return '';
    }
  }
}

/**
 * Secure Storage class for sensitive data
 */
class SecureStorage {
  private encryption: SimpleEncryption;
  private prefix: string;

  constructor(prefix = 'secure_') {
    this.encryption = new SimpleEncryption();
    this.prefix = prefix;
  }

  /**
   * Stores data securely with optional encryption and expiration
   */
  setItem<T>(key: string, value: T, options: StorageOptions = {}): void {
    if (!environmentChecks.isClient()) return;

    const { encrypt = true, expiration, prefix = this.prefix } = options;

    const item: StorageItem<T> = {
      data: value,
      timestamp: Date.now(),
      expiration,
      encrypted: encrypt,
    };

    try {
      let serialized = JSON.stringify(item);

      if (encrypt) {
        serialized = this.encryption.encrypt(serialized);
      }

      sessionStorage.setItem(`${prefix}${key}`, serialized);
    } catch (error) {
      console.error('SecureStorage: Failed to store item', error);
    }
  }

  /**
   * Retrieves data securely with automatic expiration check
   */
  getItem<T>(key: string, options: StorageOptions = {}): T | null {
    if (!environmentChecks.isClient()) return null;

    const { prefix = this.prefix } = options;

    try {
      let serialized = sessionStorage.getItem(`${prefix}${key}`);
      if (!serialized) return null;

      // Try to decrypt if it looks encrypted
      if (serialized.includes('=') && !serialized.includes('{')) {
        serialized = this.encryption.decrypt(serialized);
      }

      const item: StorageItem<T> = JSON.parse(serialized);

      // Check expiration
      if (item.expiration && Date.now() - item.timestamp > item.expiration) {
        this.removeItem(key, options);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('SecureStorage: Failed to retrieve item', error);
      // Clean up corrupted data
      this.removeItem(key, options);
      return null;
    }
  }

  /**
   * Removes item from storage
   */
  removeItem(key: string, options: StorageOptions = {}): void {
    if (!environmentChecks.isClient()) return;

    const { prefix = this.prefix } = options;

    try {
      sessionStorage.removeItem(`${prefix}${key}`);
    } catch (error) {
      console.error('SecureStorage: Failed to remove item', error);
    }
  }

  /**
   * Clears all items with the prefix
   */
  clear(options: StorageOptions = {}): void {
    if (!environmentChecks.isClient()) return;

    const { prefix = this.prefix } = options;

    try {
      const keys = Object.keys(sessionStorage).filter((key) =>
        key.startsWith(prefix),
      );

      keys.forEach((key) => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('SecureStorage: Failed to clear storage', error);
    }
  }

  /**
   * Gets all stored keys with the prefix
   */
  getKeys(options: StorageOptions = {}): string[] {
    if (!environmentChecks.isClient()) return [];

    const { prefix = this.prefix } = options;

    try {
      return Object.keys(sessionStorage)
        .filter((key) => key.startsWith(prefix))
        .map((key) => key.replace(prefix, ''));
    } catch (error) {
      console.error('SecureStorage: Failed to get keys', error);
      return [];
    }
  }

  /**
   * Checks if storage is available and working
   */
  isAvailable(): boolean {
    if (!environmentChecks.isClient()) return false;

    try {
      const testKey = '__secure_storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Safe localStorage wrapper that falls back to memory storage
 */
class SafeLocalStorage {
  private memoryStorage: Map<string, string> = new Map();
  private useMemory = false;

  constructor() {
    // Test if localStorage is available
    try {
      if (typeof window !== 'undefined') {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      }
    } catch {
      this.useMemory = true;
      console.warn('localStorage not available, using memory storage');
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (this.useMemory) {
        this.memoryStorage.set(key, value);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage error:', error);
      // Fallback to memory
      this.memoryStorage.set(key, value);
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.useMemory) {
        return this.memoryStorage.get(key) || null;
      } else {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('Storage error:', error);
      return this.memoryStorage.get(key) || null;
    }
  }

  removeItem(key: string): void {
    try {
      if (this.useMemory) {
        this.memoryStorage.delete(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Storage error:', error);
      this.memoryStorage.delete(key);
    }
  }

  clear(): void {
    try {
      if (this.useMemory) {
        this.memoryStorage.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Storage error:', error);
      this.memoryStorage.clear();
    }
  }
}

// Export instances
export const secureStorage = new SecureStorage();
export const safeLocalStorage = new SafeLocalStorage();

// Export for custom configurations
export { SafeLocalStorage, SecureStorage };

// Export types
export type { StorageItem, StorageOptions };
