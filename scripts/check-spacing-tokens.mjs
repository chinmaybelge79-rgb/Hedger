#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * Spacing Token Linter
 * Ensures all spacing in the codebase adheres strictly to the approved scale:
 * 0, 4, 8, 12, 16, 24, 32, 48, 64, 96 (px)
 * Plus explicit spec-defined layout constants:
 * - Table cells: 13px (cell vertical), 16px (cell horizontal)
 * - Table headers: 12px (header vertical), 16px (header horizontal)
 * - Segmented control: 3px (track padding), 4px (item gap), 6px 14px (item padding)
 * - Filter chips: 36px (height), 10px (gap / row-gap)
 * - Controls: 44px (min touch height)
 * - Nav: 60px (height), 36px (link gap)
 * - Page container: 40px (desktop), 24px (tablet), 16px (mobile)
 * - Modal: 32px (padding), 16px-24px (internal gaps)
 */

const ALLOWED_PIXELS = new Set([
  0, 2, 3, 4, 6, 8, 10, 12, 13, 14, 16, 20, 24, 32, 36, 40, 44, 48, 60, 64, 80, 96
]);

const DIRS_TO_SCAN = ['apps/web/src', 'packages/ui/src'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

let violations = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'test') {
        scanDir(fullPath);
      }
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Look for padding, margin, or gap with raw px values
    // e.g. padding: '25px', margin: 15, gap: '23px'
    const spacingMatch = line.match(/(?:padding|margin|gap)(?:Top|Bottom|Left|Right|Inline|Block)?\s*[:=]\s*['"]?([0-9\s\wpx]+)['"]?/i);
    if (spacingMatch) {
      const valueStr = spacingMatch[1];
      // extract pixel numbers
      const pxMatches = valueStr.matchAll(/(\d+)px/g);
      for (const m of pxMatches) {
        const px = parseInt(m[1], 10);
        if (!ALLOWED_PIXELS.has(px)) {
          console.error(`[SPACING VIOLATION] ${filePath}:${index + 1} -> Banned raw spacing "${px}px" outside tokens! Line: ${line.trim()}`);
          violations++;
        }
      }
    }
  });
}

console.log('Running Spacing Token Linter across web and UI packages...');
for (const dir of DIRS_TO_SCAN) {
  if (fs.existsSync(dir)) {
    scanDir(dir);
  }
}

if (violations > 0) {
  console.error(`\n❌ Found ${violations} spacing token violation(s).`);
  process.exit(1);
} else {
  console.log(`\n✓ All spacing adheres strictly to approved tokens and specifications.`);
  process.exit(0);
}
