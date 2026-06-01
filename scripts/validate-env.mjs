import { existsSync, readFileSync } from 'node:fs';

const localEnv = readLocalEnv('.env.local');
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || localEnv.VITE_SUPABASE_ANON_KEY;
const isVercelBuild = Boolean(process.env.VERCEL);

if (isVercelBuild && !anonKey) {
  console.error(
    [
      'Missing VITE_SUPABASE_ANON_KEY for the Vercel build.',
      'Add it in Vercel Project Settings > Environment Variables for the correct scope',
      '(Production and/or Preview), then redeploy. Vite embeds VITE_* variables at build time.',
    ].join(' '),
  );
  process.exit(1);
}

function readLocalEnv(path) {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}
