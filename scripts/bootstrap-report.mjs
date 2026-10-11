/**
 * How much of Bootstrap's CSS can NativeScript + MasonKit use?
 *
 *   npm run report:css
 *
 * Runs Bootstrap's compiled CSS through the same steps the app uses: the
 * compat plugin, then the parser `@nativescript/vite` hands the result to
 * core with. Then it counts:
 *
 * - rules that reach core, with and without the compat plugin;
 * - selectors core can't match (pseudo-elements);
 * - declarations whose property core or MasonKit registers. Properties are
 *   found by scanning both packages for `cssName: '...'`, so this measures
 *   what is understood, not how faithfully it renders.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import postcss from 'postcss';
import { bootstrapCompat } from '../postcss-bootstrap-compat.mjs';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(root, 'package.json'));
// The parser `@nativescript/vite` uses to turn app CSS into core's AST.
const { parse } = require('css');

const cssFile = process.argv[2] ?? require.resolve('bootstrap/dist/css/bootstrap.css');
const source = fs.readFileSync(cssFile, 'utf8');

const known = registeredProperties([
  path.join(root, 'node_modules/@nativescript/core'),
  path.join(root, 'node_modules/@triniwiz/nativescript-masonkit'),
]);

let sourceRules = 0;
postcss.parse(source).walkRules(() => {
  sourceRules++;
});

const raw = collect(parse(source, { silent: true }));
const compat = await postcss([bootstrapCompat()]).process(source, { from: cssFile });
const adapted = collect(parse(compat.css, { silent: true }));

const pct = (n, of) => `${((100 * n) / of).toFixed(1)}%`;

console.log(`Bootstrap: ${path.relative(root, cssFile)}`);
console.log(`Properties registered by core + MasonKit: ${known.size}\n`);

console.log(`Rules that reach NativeScript (Bootstrap ships ${sourceRules})`);
console.log(`  as shipped          ${raw.rules} (${pct(raw.rules, sourceRules)})`);
console.log(`  with the compat     ${adapted.rules}, including the copies it adds for dark mode and breakpoints`);
if (raw.errors.length) {
  console.log(`  (as shipped, parsing stops at: ${raw.errors[0]})`);
}

console.log('\nSelectors (with the compat plugin)');
console.log(`  total               ${adapted.selectors}`);
console.log(`  pseudo-elements     ${adapted.pseudoElements} (${pct(adapted.pseudoElements, adapted.selectors)}), never match`);
console.log(`  :nth-child() & co.  ${adapted.structural} (${pct(adapted.structural, adapted.selectors)}), never match (:first-/:last-/:only-child do, via core-fixes.ts)`);
console.log(`  :hover/:focus/...   ${adapted.states} (${pct(adapted.states, adapted.selectors)}), only match states the native view reports`);

const declarations = adapted.declarations;
const custom = declarations.filter((d) => d.startsWith('--')).length;
const styled = declarations.filter((d) => !d.startsWith('--'));
const understood = styled.filter((d) => known.has(d)).length;
console.log('\nDeclarations (with the compat plugin)');
console.log(`  custom properties   ${custom}, all usable through var()`);
console.log(`  other               ${styled.length}`);
console.log(`  understood          ${understood} (${pct(understood, styled.length)})`);

const missing = new Map();
for (const prop of styled) {
  if (!known.has(prop)) {
    missing.set(prop, (missing.get(prop) ?? 0) + 1);
  }
}
console.log('\nMost-used properties nothing registers');
for (const [prop, count] of [...missing].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
  console.log(`  ${String(count).padStart(5)}  ${prop}`);
}

function collect(ast) {
  const result = {
    rules: 0,
    selectors: 0,
    pseudoElements: 0,
    structural: 0,
    states: 0,
    declarations: [],
    errors: ast.stylesheet.parsingErrors.map((error) => error.message),
  };
  const visit = (nodes) => {
    for (const node of nodes ?? []) {
      if (node.type === 'rule') {
        result.rules++;
        for (const selector of node.selectors) {
          result.selectors++;
          if (selector.includes('::')) {
            result.pseudoElements++;
          } else if (/:(nth-|only-of|first-of|last-of|empty)/.test(selector)) {
            result.structural++;
          } else if (/:(hover|focus|focus-visible|focus-within|active|checked|disabled|invalid|valid)\b/.test(selector)) {
            result.states++;
          }
        }
        for (const decl of node.declarations ?? []) {
          if (decl.type === 'declaration') {
            result.declarations.push(decl.property.toLowerCase());
          }
        }
      } else if (node.rules) {
        visit(node.rules);
      }
    }
  };
  visit(ast.stylesheet.rules);
  return result;
}

function registeredProperties(dirs) {
  const names = new Set();
  const pattern = /cssName:\s*['"]([a-z-]+)['"]/g;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'platforms') {
          walk(file);
        }
      } else if (entry.name.endsWith('.js')) {
        for (const match of fs.readFileSync(file, 'utf8').matchAll(pattern)) {
          names.add(match[1]);
        }
      }
    }
  };
  dirs.forEach(walk);
  // Core reads these itself when it builds keyframe animations.
  for (const name of ['animation', 'animation-name', 'animation-duration', 'animation-delay', 'animation-timing-function', 'animation-iteration-count', 'animation-direction', 'animation-fill-mode']) {
    names.add(name);
  }
  return names;
}
