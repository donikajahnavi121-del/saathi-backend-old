import crypto from 'crypto';
import { ENV } from '../config/env.js';

// Derive or format 32-byte key from ENV.ENCRYPTION_KEY
function getEncryptionKey(): Buffer {
  const keyHex = ENV.ENCRYPTION_KEY;
  if (keyHex.length === 64) {
    return Buffer.from(keyHex, 'hex');
  }
  // Hash to ensure 32 bytes
  return crypto.createHash('sha256').update(keyHex).digest();
}

/**
 * AES-256-GCM field-level encryption.
 * Encodes IV + Auth Tag + Ciphertext into a single string: iv:tag:encrypted
 */
export function encryptField(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard GCM IV length is 12 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * AES-256-GCM field-level decryption.
 */
export function decryptField(cipherString: string): string {
  if (!cipherString) return '';
  try {
    const parts = cipherString.split(':');
    if (parts.length !== 3) {
      // In case string was not encrypted (legacy or mock)
      return cipherString;
    }
    const [ivHex, tagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // If decryption fails, return placeholder or original safely
    return '[Encrypted]';
  }
}

/**
 * Hashes an arbitrary string using SHA-256 (used for API keys and phone lookup index)
 */
export function hashSha256(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

/**
 * Masks a phone number according to Saathi privacy rules:
 * E.g. "+91 98765 43210" or "9876543210" -> "+91 98••• ••210"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Normalize digits
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 10) return '+91 ••••• •••••';

  // Last 10 digits
  const last10 = cleaned.slice(-10);
  const prefix = last10.slice(0, 2);
  const suffix = last10.slice(-3);

  return `+91 ${prefix}••• ••${suffix}`;
}
