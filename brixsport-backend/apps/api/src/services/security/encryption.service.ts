import { logger } from '@utils/logger';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { redisService } from '../redis.service';
import { supabaseService } from '../supabase.service';

export interface EncryptedData {
  data: string;
  iv: string;
  authTag?: string;
  algorithm: string;
  keyId?: string;
}

export interface EncryptionKey {
  id: string;
  key: string;
  type: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface EncryptionService {
  encrypt(data: string, keyId?: string): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData, keyId?: string): Promise<string>;
  generateKey(type?: string): Promise<{ id: string; key: string }>;
  hash(data: string, algorithm?: string): Promise<string>;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
  compare(data: string, hash: string): Promise<boolean>;
  // New methods for production-ready implementation
  getKey(keyId: string): Promise<EncryptionKey | null>;
  saveKey(key: EncryptionKey): Promise<void>;
  rotateKeys(): Promise<void>;
  clearKeyCache(keyId: string): Promise<void>;
}

export const encryptionService: EncryptionService = {
  encrypt: async (data: string, keyId?: string): Promise<EncryptedData> => {
    try {
      logger.debug('Encrypting data');
      
      // Get encryption key
      let key: string;
      if (keyId) {
        const keyRecord = await encryptionService.getKey(keyId);
        if (!keyRecord || !keyRecord.isActive) {
          throw new Error(`Encryption key not found or inactive: ${keyId}`);
        }
        key = keyRecord.key;
      } else {
        // Use default key
        const defaultKeyRecord = await encryptionService.getKey('default');
        if (!defaultKeyRecord || !defaultKeyRecord.isActive) {
          // Generate a default key if none exists
          const newKey = await encryptionService.generateKey('default');
          key = newKey.key;
        } else {
          key = defaultKeyRecord.key;
        }
      }
      
      const algorithm = 'aes-256-cbc';
      
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
      
      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      logger.debug('Data encrypted');
      
      return {
        data: encrypted,
        iv: iv.toString('hex'),
        algorithm,
        keyId: keyId || 'default'
      };
    } catch (error: any) {
      logger.error('Encryption error', error);
      throw error;
    }
  },
  
  decrypt: async (encryptedData: EncryptedData, keyId?: string): Promise<string> => {
    try {
      logger.debug('Decrypting data');
      
      // Get encryption key
      let key: string;
      if (keyId) {
        const keyRecord = await encryptionService.getKey(keyId);
        if (!keyRecord || !keyRecord.isActive) {
          throw new Error(`Encryption key not found or inactive: ${keyId}`);
        }
        key = keyRecord.key;
      } else {
        // Use default key
        const defaultKeyRecord = await encryptionService.getKey('default');
        if (!defaultKeyRecord || !defaultKeyRecord.isActive) {
          throw new Error('Default encryption key not found or inactive');
        }
        key = defaultKeyRecord.key;
      }
      
      const algorithm = encryptedData.algorithm || 'aes-256-cbc';
      
      // Convert hex values back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
      
      // Decrypt the data
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      logger.debug('Data decrypted');
      
      return decrypted;
    } catch (error: any) {
      logger.error('Decryption error', error);
      throw error;
    }
  },
  
  generateKey: async (type: string = 'default'): Promise<{ id: string; key: string }> => {
    try {
      logger.debug('Generating encryption key', { type });
      
      const key = crypto.randomBytes(32).toString('hex');
      const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const keyRecord: EncryptionKey = {
        id: keyId,
        key: key,
        type: type,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      // Save the key
      await encryptionService.saveKey(keyRecord);
      
      logger.debug('Encryption key generated and saved', { keyId, type });
      
      return { id: keyId, key: key };
    } catch (error: any) {
      logger.error('Key generation error', error);
      throw error;
    }
  },
  
  hash: async (data: string, algorithm: string = 'sha256'): Promise<string> => {
    try {
      logger.debug('Hashing data');
      
      const hash = crypto.createHash(algorithm).update(data).digest('hex');
      
      logger.debug('Data hashed');
      
      return hash;
    } catch (error: any) {
      logger.error('Hashing error', error);
      throw error;
    }
  },
  
  hashPassword: async (password: string): Promise<string> => {
    try {
      logger.debug('Hashing password');
      
      const saltRounds = 12; // Increased from 10 for better security
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      logger.debug('Password hashed');
      
      return hashedPassword;
    } catch (error: any) {
      logger.error('Password hashing error', error);
      throw error;
    }
  },
  
  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    try {
      logger.debug('Comparing password with hash');
      
      const isMatch = await bcrypt.compare(password, hash);
      
      logger.debug('Password comparison completed', { isMatch });
      
      return isMatch;
    } catch (error: any) {
      logger.error('Password comparison error', error);
      return false;
    }
  },
  
  compare: async (data: string, hash: string): Promise<boolean> => {
    try {
      logger.debug('Comparing data with hash');
      
      // For bcrypt-style comparison, we would use bcrypt.compare
      // For simple hash comparison, we hash the data and compare
      const dataHash = await encryptionService.hash(data);
      const isMatch = dataHash === hash;
      
      logger.debug('Hash comparison completed', { isMatch });
      
      return isMatch;
    } catch (error: any) {
      logger.error('Hash comparison error', error);
      return false;
    }
  },
  
  // New methods for production-ready implementation
  getKey: async (keyId: string): Promise<EncryptionKey | null> => {
    try {
      logger.debug('Getting encryption key', { keyId });
      
      // Try to get from Redis cache first
      const cacheKey = `encryption:key:${keyId}`;
      const cachedKey = await redisService.get(cacheKey);
      
      if (cachedKey) {
        logger.debug('Encryption key retrieved from cache', { keyId });
        return JSON.parse(cachedKey);
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('EncryptionKeys')
        .select('*')
        .eq('id', keyId)
        .single();
      
      if (error) {
        logger.warn('Encryption key not found in database', { keyId, error: error.message });
        return null;
      }
      
      // Cache the key in Redis for 10 minutes
      await redisService.set(cacheKey, JSON.stringify(data), 600);
      
      logger.debug('Encryption key retrieved from database and cached', { keyId });
      return data;
    } catch (error: any) {
      logger.error('Error getting encryption key', { keyId, error: error.message });
      throw error;
    }
  },
  
  saveKey: async (key: EncryptionKey): Promise<void> => {
    try {
      logger.debug('Saving encryption key', { keyId: key.id });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('EncryptionKeys')
        .insert({
          id: key.id,
          key: key.key,
          type: key.type,
          createdAt: key.createdAt,
          expiresAt: key.expiresAt,
          isActive: key.isActive
        });
      
      if (error) {
        logger.error('Error saving encryption key to database', { keyId: key.id, error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache the key in Redis for 10 minutes
      const cacheKey = `encryption:key:${key.id}`;
      await redisService.set(cacheKey, JSON.stringify(key), 600);
      
      logger.debug('Encryption key saved to database and cached', { keyId: key.id });
    } catch (error: any) {
      logger.error('Error saving encryption key', { keyId: key.id, error: error.message });
      throw error;
    }
  },
  
  rotateKeys: async (): Promise<void> => {
    try {
      logger.info('Rotating encryption keys');
      
      // Get all active keys
      const { data: activeKeys, error } = await (supabaseService as any).supabase
        .from('EncryptionKeys')
        .select('*')
        .eq('isActive', true);
      
      if (error) {
        logger.error('Error fetching active keys for rotation', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Deactivate all current keys
      for (const key of activeKeys) {
        await (supabaseService as any).supabase
          .from('EncryptionKeys')
          .update({ isActive: false })
          .eq('id', key.id);
        
        // Clear cache for this key
        await encryptionService.clearKeyCache(key.id);
      }
      
      // Generate new default key
      await encryptionService.generateKey('default');
      
      logger.info('Encryption keys rotated successfully');
    } catch (error: any) {
      logger.error('Error rotating encryption keys', { error: error.message });
      throw error;
    }
  },
  
  clearKeyCache: async (keyId: string): Promise<void> => {
    try {
      logger.debug('Clearing encryption key cache', { keyId });
      
      const cacheKey = `encryption:key:${keyId}`;
      await redisService.del(cacheKey);
      
      logger.debug('Encryption key cache cleared', { keyId });
    } catch (error: any) {
      logger.error('Error clearing encryption key cache', { keyId, error: error.message });
      throw error;
    }
  }
};