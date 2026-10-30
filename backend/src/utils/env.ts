import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads key-value pairs from .env files into process.env if not already set.
 */
export function loadEnvFiles() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), 'backend/.env'),
  ];

  for (const envFile of envPaths) {
    if (fs.existsSync(envFile)) {
      try {
        const content = fs.readFileSync(envFile, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1);
            }
            if (value && (!process.env[key] || process.env[key]?.trim() === '')) {
              process.env[key] = value;
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }
}

