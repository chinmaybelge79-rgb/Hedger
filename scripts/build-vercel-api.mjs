import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function buildVercelApi() {
  console.log('[build-vercel-api] Bundling Hedger API server for Vercel Serverless Function...');

  const outDir = path.resolve(rootDir, 'api');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Ensure api/package.json exists with type module
  fs.writeFileSync(
    path.join(outDir, 'package.json'),
    JSON.stringify({ type: 'module', private: true }, null, 2)
  );

  await esbuild.build({
    entryPoints: [path.resolve(rootDir, 'apps/api/src/server.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: path.join(outDir, 'index.js'),
    external: ['pg-native'],
    sourcemap: false,
    minify: false,
    banner: {
      js: `// Hedger Vercel Serverless Production API Bundle
import { createRequire } from 'module';
const require = createRequire(import.meta.url);`
    }
  });

  console.log('[build-vercel-api] Successfully bundled api/index.js');
}

buildVercelApi().catch((err) => {
  console.error('[build-vercel-api] Failed to bundle:', err);
  process.exit(1);
});
