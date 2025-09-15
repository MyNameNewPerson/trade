import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private readonly encryptionKey: Buffer;

  constructor() {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    // Use SHA-256 to derive a proper 32-byte key from any JWT_SECRET
    this.encryptionKey = createHash('sha256').update(jwtSecret).digest();
  }

  /**
   * Encrypts sensitive data like Telegram bot tokens
   */
  encrypt(text: string): string {
    if (!text) return text;
    
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(EncryptionService.ALGORITHM, this.encryptionKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return IV + encrypted data (hex encoded)
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypts sensitive data like Telegram bot tokens
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) {
      // Return as-is for backward compatibility with unencrypted tokens
      return encryptedText;
    }
    
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = createDecipheriv(EncryptionService.ALGORITHM, this.encryptionKey, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      // Return original for backward compatibility
      return encryptedText;
    }
  }

  /**
   * Check if a value is encrypted (contains IV separator)
   */
  isEncrypted(value: string): boolean {
    return !!(value && value.includes(':') && value.split(':').length === 2);
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();