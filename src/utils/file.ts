import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Generates a filesystem-safe filename from a URL.
 * @param url The source URL of the document.
 * @param prefix An optional prefix (e.g., tenderId) for the filename.
 * @returns A sanitized, unique filename.
 */
export function getSafeFilename(url: string, prefix: string = ''): string {
  const parsed = new URL(url);
  const basename = path.basename(parsed.pathname) || 'document.pdf';
  const safeName = basename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  return `${prefix}${Date.now()}_${safeName}`;
}

/**
 * Saves a Buffer to the local disk safely, creating the directory if missing.
 * @param buffer The file data buffer.
 * @param filename The destination filename.
 * @returns The absolute path where the file was saved.
 */
export function saveFile(buffer: Buffer, filename: string): string {
  const downloadDir = env.DOWNLOAD_DIR || './downloads';
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  
  const filePath = path.join(downloadDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * Computes the SHA-256 hash of a file using streams to prevent memory exhaustion.
 * @param filePath The local file path.
 * @returns A promise that resolves to the hex representation of the SHA-256 hash.
 */
export function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data: Buffer) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err: Error) => reject(err));
  });
}
