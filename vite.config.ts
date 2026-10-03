import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Preserve readable source data; compact only generated deployment artifacts.
export default defineConfig({
  plugins: [react(), {
    name: 'compact-public-data',
    async writeBundle(options) {
      const directory = resolve(options.dir || 'dist', 'data');
      for (const file of await readdir(directory)) {
        if (!file.endsWith('.json')) continue;
        const path = resolve(directory, file);
        await writeFile(path, JSON.stringify(JSON.parse(await readFile(path, 'utf8'))));
      }
    },
  }],
  base: process.env.BASE_PATH || '/',
});
