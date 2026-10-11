/**
 * Bridges Bootstrap 6's CSS to what NativeScript's CSS engine understands.
 *
 * Everything else in Bootstrap's stylesheet (selectors, `var()`, `calc()`,
 * `color-mix()`, rem/em units, flexbox, `display: grid`, ...) is passed through
 * untouched and handled by core or MasonKit at runtime. Each transform below
 * exists because of a specific gap, and each one can be switched off to see
 * what that gap costs:
 *
 *   bootstrapCompat({ colors: false })
 *
 * | Option       | Gap it covers                                                  |
 * | ------------ | -------------------------------------------------------------- |
 * | `layers`     | `@layer` blocks stop `@nativescript/vite`'s CSS parser cold:    |
 * |              | nothing after the first one reaches the app.                    |
 * | `container`  | `@container` queries also stop the parser, and core has no      |
 * |              | container queries; they're approximated with `@media` (the      |
 * |              | viewport's width rather than the container's).                  |
 * | `atRules`    | `@starting-style` and `@property` stop the parser too, as does  |
 * |              | `@container` with `container: false`; they're removed.          |
 * | `root`       | Core has no `:root`/`:host`; the root view is `.ns-root`.       |
 * | `hidden`     | Core defines a `hidden` property (default `false`) on every     |
 * |              | view, and `[hidden]` matches any non-null value, so Reboot's    |
 * |              | `[hidden] { display: none }` would hide the whole app. It's    |
 * |              | narrowed to `[hidden=true]`.                                    |
 * | `has`        | Core can't parse `:has()`'s relative selectors (`:has(+ .x)`),  |
 * |              | and one bad part drops the whole selector: the input group's    |
 * |              | `:not(:last-child, …, :has(…))` never squared its inner corners.|
 * |              | Inside `:not()`, where `:has()` only narrows the exclusion, it's |
 * |              | dropped. Elsewhere it's left, and doesn't match.                |
 * | `lightDark`  | Core can't parse `light-dark()`; dark values move under the     |
 * |              | `.ns-dark` class core puts on the root view.                    |
 * | `fold`       | Custom properties defined once (Bootstrap's palette, type       |
 * |              | scale, ...) are substituted where they're used, so colors reach |
 * |              | core as plain `rgb()`. Core resolves `color-mix()` for          |
 * |              | `background-color`, but not inside shorthands like `border`.    |
 * | `body`       | There's no `<body>`; its rules go to this type (`Page`), so     |
 * |              | the page background, text color and font follow Bootstrap.      |
 * |              | `Page` is a core view and core reads `1rem` as 1, so rem on it  |
 * |              | is converted to dp.                                             |
 * | `colors`     | Core's `Color` can't parse `oklch()` and friends, or the space- |
 * |              | separated `rgb(0 0 0 / 15%)`.                                   |
 * | `fluid`      | Core only evaluates `calc()`, and MasonKit no functions, so     |
 * |              | `clamp(2rem, 1.5rem + 1.875vw, 2.5rem)` resolves to nothing.    |
 * |              | It's evaluated at each Bootstrap breakpoint and stepped with    |
 * |              | `@media` instead. A `clamp()` in em (`clamp(12px, 0.75em,       |
 * |              | 0.75em)`, the badge) is resolved with em as 16px, and anything  |
 * |              | else keeps its preferred value.                                 |
 * | `rem`        | Core's `calc()` can't mix rem with px: `calc(0.75rem - 1px)`    |
 * |              | (card inner radii, border offsets) stays unevaluated and        |
 * |              | MasonKit reads it as 0. rem in custom properties and inside     |
 * |              | `calc()` becomes px (16px root), so every calc has one unit.    |
 * | `borders`    | MasonKit keeps `border: 1px solid …` as one property rather    |
 * |              | than longhands, so a later `border-width: 0 0 1px` doesn't      |
 * |              | override it (flush list groups kept their side borders). The    |
 * |              | `border` and `border-<side>` shorthands are expanded.           |
 * | `inherit`    | Core has no `inherit`. For inherited properties (`color`,       |
 * |              | `font-*`, ...) it's `unset`, which core does support; a custom  |
 * |              | property set to `inherit` is dropped (core already looks it up  |
 * |              | on the parent). Other properties (the list group's corner radii |
 * |              | inside a card) carry their value down in a custom property.     |
 * | `currentColor` | Core can't parse `currentcolor` (spinners and placeholders are |
 * |              | drawn in it). Every `color` is mirrored into a custom property, |
 * |              | which inherits just as `color` does, and `currentcolor` reads   |
 * |              | it.                                                             |
 * | `animation`  | Core builds keyframe animations from the raw declarations, once |
 * |              | per rule, before `var()` is resolved, so spinners never spun.  |
 * |              | `var()`s in `animation` are filled in from rules with the same  |
 * |              | selector, and in `@keyframes` from variables with one value.    |
 * | `keywords`   | Values core reads differently: `background: none` leaves the    |
 * |              | background color unset (so a native button keeps its own)       |
 * |              | rather than `transparent`, `font-weight: bolder`/`lighter` are  |
 * |              | rejected, and MasonKit has `list-style-type`/`-position` but    |
 * |              | not the `list-style` shorthand, which is expanded.              |
 * | `media`      | Core's media queries don't know range syntax (`width >= 576px`) |
 * |              | and read `px` as physical pixels instead of CSS pixels.        |
 * | `logical`    | Neither core nor MasonKit registers logical properties          |
 * |              | (`margin-inline`, `padding-block-end`, ...), which Bootstrap's  |
 * |              | spacing utilities, containers and rows are written in. They're  |
 * |              | mapped to physical ones, left-to-right.                         |
 */

import { color, serializeRGB } from '@csstools/css-color-parser';
import { parseComponentValue } from '@csstools/css-parser-algorithms';
import { tokenize } from '@csstools/css-tokenizer';
import postcssLogical from 'postcss-logical';

const DEFAULTS = {
  layers: true,
  container: true,
  atRules: true,
  root: true,
  hidden: true,
  has: true,
  lightDark: true,
  fold: true,
  body: 'Page',
  colors: true,
  fluid: true,
  rem: true,
  borders: true,
  inherit: true,
  currentColor: true,
  animation: true,
  keywords: true,
  media: true,
  logical: true,
};

// At-rules core ignores but `@nativescript/vite`'s parser can't read past.
const UNPARSEABLE_AT_RULES = /^(container|starting-style|property)$/;

const ROOT_SELECTORS = ['.ns-root', '.ns-modal'];

// `body` as a type selector, not inside a class name like `.card-body`.
const BODY = /(^|[\s,>+~(])body(?![\w-])/g;

// Bootstrap's breakpoints, in CSS px. Fluid values are stepped at each one.
const BREAKPOINTS = [576, 768, 1024, 1280, 1536];
// The width fluid values take below the first breakpoint: a typical phone.
const BASE_WIDTH = 390;
// MasonKit's default root font size.
const REM = 16;

/** @returns {import('postcss').Plugin} */
export function bootstrapCompat(options = {}) {
  const opts = { ...DEFAULTS, ...options };
  return {
    postcssPlugin: 'bootstrap-compat',
    plugins: [transforms(opts), ...(opts.logical ? [postcssLogical()] : [])],
  };
}
bootstrapCompat.postcss = true;

function transforms(opts) {
  return {
    postcssPlugin: 'bootstrap-compat-transforms',
    // Vite inlines `@import`s before any user plugin runs, so `Once` sees
    // Bootstrap and the app's own rules as one stylesheet.
    Once(root, { AtRule }) {
      if (opts.container) {
        root.walkAtRules('container', (rule) => {
          // Drop the optional container name: `@container sidebar (...)`.
          rule.name = 'media';
          rule.params = rule.params.replace(/^[\w-]+\s+(?=\()/, '');
        });
      }
      if (opts.atRules) {
        root.walkAtRules(UNPARSEABLE_AT_RULES, (rule) => {
          rule.remove();
        });
      }
      if (opts.layers) {
        flattenLayers(root);
      }
      if (opts.root) {
        root.walkRules((rule) => {
          if (/:root|:host/.test(rule.selector)) {
            rule.selectors = unique(rule.selectors.flatMap(mapRootSelector));
          }
        });
      }
      if (opts.hidden) {
        root.walkRules((rule) => {
          rule.selector = rule.selector.replace(/\[hidden\]/g, '[hidden=true]');
        });
      }
      if (opts.has) {
        root.walkRules((rule) => {
          if (rule.selector.includes(':has(')) {
            // `not(`, not `:not(`: the colon stays where it is.
            rule.selector = replaceFunction(rule.selector, 'not', (args) => {
              const kept = splitArgs(args).filter((arg) => !arg.includes(':has('));
              return `not(${(kept.length ? kept : splitArgs(args)).join(', ')})`;
            });
          }
        });
      }
      if (opts.lightDark) {
        root.walkRules((rule) => {
          splitLightDark(rule);
        });
      }
      if (opts.fold) {
        foldConstants(root);
      }
      if (opts.body) {
        root.walkRules((rule) => {
          const selector = rule.selector.replace(BODY, `$1${opts.body}`);
          if (selector !== rule.selector) {
            rule.selector = selector;
            rule.walkDecls((decl) => {
              decl.value = remToDp(decl.value);
            });
          }
        });
      }
      if (opts.colors) {
        root.walkDecls((decl) => {
          decl.value = convertColors(decl.value);
        });
      }
      if (opts.fluid) {
        root.walkDecls((decl) => {
          stepFluidValue(decl, AtRule);
          if (/clamp\(/i.test(decl.value)) {
            decl.value = replaceFunction(decl.value, 'clamp', (args) => {
              const parts = splitArgs(args);
              const [min, preferred, max] = parts.map((arg) => evaluateLength(arg.replace(/(\d)em\b/g, '$1rem'), BASE_WIDTH));
              if ([min, preferred, max].every((n) => n !== undefined)) {
                return `${round(Math.min(Math.max(preferred, min), max))}px`;
              }
              return parts[1] ?? `clamp(${args})`;
            });
          }
        });
      }
      if (opts.rem) {
        root.walkDecls((decl) => {
          decl.value = decl.prop.startsWith('--')
            ? remToPx(decl.value)
            : replaceFunction(decl.value, 'calc', (args) => `calc(${remToPx(args)})`);
        });
      }
      if (opts.keywords) {
        root.walkDecls('background', (decl) => {
          if (decl.value.trim() === 'none') {
            decl.cloneBefore({ prop: 'background-color', value: 'transparent' });
            decl.replaceWith(decl.clone({ prop: 'background-image', value: 'none' }));
          }
        });
        root.walkDecls('list-style', (decl) => {
          for (const token of splitTokens(decl.value)) {
            const prop = /^(inside|outside)$/.test(token) ? 'list-style-position' : 'list-style-type';
            decl.cloneBefore({ prop, value: token });
          }
          decl.remove();
        });
        root.walkDecls('font-weight', (decl) => {
          decl.value = decl.value.replace(/\bbolder\b/, '700').replace(/\blighter\b/, '300');
        });
      }
      if (opts.media) {
        root.walkAtRules('media', (rule) => {
          rule.params = convertMediaQuery(rule.params);
        });
      }
    },
    // After `postcss-logical`, which turns `border-block-start` into `border-top`.
    OnceExit(root) {
      if (opts.borders) {
        root.walkDecls(/^border(-(top|right|bottom|left))?$/, expandBorder);
      }
      if (opts.inherit) {
        emulateInherit(root);
      }
      if (opts.currentColor) {
        emulateCurrentColor(root);
      }
      if (opts.animation) {
        resolveAnimationVariables(root);
      }
    },
  };
}

// Properties CSS inherits by default, where `inherit` and `unset` agree.
const INHERITED = /^(color|font(-[a-z]+)?|line-height|letter-spacing|text-(align|transform|indent)|white-space|word-spacing|visibility)$/;

const CORNERS = ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'];

/**
 * `prop: inherit` for a property core doesn't inherit becomes
 * `var(--ns-inherit-prop)`, and every rule that sets `prop` also sets that
 * custom property, which core does pass down. It's the nearest ancestor that
 * set `prop` rather than strictly the parent, which is what Bootstrap means
 * where it uses it.
 */
function emulateInherit(root) {
  const emulated = new Set();
  root.walkDecls((decl) => {
    if (decl.value.trim() !== 'inherit') {
      return;
    }
    if (decl.prop.startsWith('--')) {
      decl.remove();
    } else if (INHERITED.test(decl.prop)) {
      decl.value = 'unset';
    } else {
      emulated.add(decl.prop);
      decl.value = `var(--ns-inherit-${decl.prop})`;
    }
  });
  if (!emulated.size) {
    return;
  }
  root.walkDecls((decl) => {
    if (decl.prop.startsWith('--') || decl.value.includes('--ns-inherit-')) {
      return;
    }
    if (emulated.has(decl.prop)) {
      decl.cloneBefore({ prop: `--ns-inherit-${decl.prop}` });
    } else if (decl.prop === 'border-radius') {
      // `border-radius: a b c d` sets the corners clockwise from top-left.
      const [a, b = a, c = a, d = b] = splitTokens(decl.value);
      [a, b, c, d].forEach((value, i) => {
        if (emulated.has(CORNERS[i])) {
          decl.cloneBefore({ prop: `--ns-inherit-${CORNERS[i]}`, value });
        }
      });
    }
  });
}

function resolveAnimationVariables(root) {
  // Custom properties by selector, from rules outside `@media`.
  const bySelector = new Map();
  root.walkRules((rule) => {
    if (rule.parent.type !== 'root') {
      return;
    }
    rule.each((decl) => {
      if (decl.type === 'decl' && decl.prop.startsWith('--')) {
        for (const selector of rule.selectors) {
          const vars = bySelector.get(selector) ?? new Map();
          vars.set(decl.prop, decl.value);
          bySelector.set(selector, vars);
        }
      }
    });
  });
  const resolve = (value, selector) =>
    replaceFunction(value, 'var', (args) => {
      const [name, fallback] = splitArgs(args);
      return bySelector.get(selector)?.get(name) ?? fallback ?? `var(${args})`;
    });
  root.walkDecls(/^animation/, (decl) => {
    const rule = decl.parent;
    if (!decl.value.includes('var(') || rule.type !== 'rule') {
      return;
    }
    const values = rule.selectors.map((selector) => resolve(decl.value, selector));
    if (new Set(values).size === 1) {
      decl.value = values[0];
      return;
    }
    // `.spinner-border, .spinner-grow` share the rule but not the keyframes.
    rule.selectors.forEach((selector, i) => {
      rule.after(rule.clone({ selectors: [selector], nodes: [decl.clone({ value: values[i] })] }));
    });
    decl.remove();
  });

  // Keyframes have no element to resolve against; use variables with a single value.
  const values = new Map();
  root.walkDecls(/^--/, (decl) => {
    values.set(decl.prop, (values.get(decl.prop) ?? new Set()).add(decl.value));
  });
  root.walkAtRules('keyframes', (keyframes) => {
    keyframes.walkDecls((decl) => {
      decl.value = replaceFunction(decl.value, 'var', (args) => {
        const [name, fallback] = splitArgs(args);
        const set = values.get(name);
        return set?.size === 1 ? [...set][0] : (fallback ?? `var(${args})`);
      });
    });
  });
}

function emulateCurrentColor(root) {
  root.walkDecls((decl) => {
    if (/currentcolor/i.test(decl.value)) {
      decl.value = decl.value.replace(/\bcurrentcolor\b/gi, 'var(--ns-current-color)');
    }
  });
  root.walkDecls('color', (decl) => {
    if (decl.value !== 'unset') {
      decl.cloneBefore({ prop: '--ns-current-color' });
    }
  });
}

const BORDER_STYLES = /^(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/;

/** `border: 1px solid red` → `border-width: 1px; border-style: solid; border-color: red`. */
function expandBorder(decl) {
  const tokens = splitTokens(decl.value);
  const styleAt = tokens.findIndex((token) => BORDER_STYLES.test(token));
  let width;
  let style;
  let color;
  if (styleAt !== -1) {
    width = tokens.slice(0, styleAt).join(' ');
    style = tokens[styleAt];
    color = tokens.slice(styleAt + 1).join(' ');
  } else if (tokens.length === 1 && /^(0|[\d.]+[a-z]*)$/.test(tokens[0])) {
    width = tokens[0];
  } else {
    // A lone `var()` could be any part of the shorthand; leave it to core.
    return;
  }
  if (style === 'none' || style === 'hidden') {
    width = '0';
  }
  const side = decl.prop.slice('border'.length);
  if (width) {
    decl.cloneBefore({ prop: `border${side}-width`, value: width });
  }
  // MasonKit's `border-style` covers every side, and defaults to none.
  if (style && width !== '0') {
    decl.cloneBefore({ prop: 'border-style', value: style });
  }
  if (color) {
    decl.cloneBefore({ prop: `border${side}-color`, value: color });
  }
  decl.remove();
}

/** Splits a value on top-level whitespace. */
function splitTokens(value) {
  const tokens = [];
  let depth = 0;
  let current = '';
  for (const ch of value.trim()) {
    if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      depth--;
    }
    if (/\s/.test(ch) && depth === 0) {
      if (current) {
        tokens.push(current);
      }
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) {
    tokens.push(current);
  }
  return tokens;
}

/**
 * Replaces `@layer` blocks with their rules, ordered the way the cascade would
 * order them: layers in declaration order, then unlayered rules (which beat
 * every layer). App rules are unlayered, so they still override Bootstrap.
 */
function flattenLayers(root) {
  const order = [];
  const buckets = new Map();
  root.each((node) => {
    if (node.type !== 'atrule' || node.name !== 'layer') {
      return;
    }
    const names = node.params.split(',').map((name) => name.trim()).filter(Boolean);
    for (const name of names) {
      if (!buckets.has(name)) {
        order.push(name);
        buckets.set(name, []);
      }
    }
    // `@layer a, b;` only declares order. A nameless block is its own layer.
    if (node.nodes) {
      const name = names[0] ?? Symbol('anonymous');
      if (!buckets.has(name)) {
        order.push(name);
        buckets.set(name, []);
      }
      buckets.get(name).push(...node.nodes);
    }
    node.remove();
  });

  const layered = order.flatMap((name) => buckets.get(name));
  // Nested `@layer`s resolve inside their parent's slot.
  for (const node of layered) {
    if (node.type === 'atrule') {
      node.walkAtRules('layer', (inner) => {
        inner.nodes ? inner.replaceWith(inner.nodes) : inner.remove();
      });
    }
  }

  // Keep `@charset`/`@import` first; layered rules go before everything else.
  let anchor;
  root.each((node) => {
    if (node.type === 'atrule' && (node.name === 'charset' || node.name === 'import')) {
      anchor = node;
    } else if (node.type !== 'comment') {
      return false;
    }
  });
  if (anchor) {
    anchor.after(layered);
  } else {
    root.prepend(layered);
  }
}

/**
 * Replaces `var(--x)` with the value of `--x` wherever `--x` is declared just
 * once, on the root, and never overridden. App rules are in the same
 * stylesheet, so overriding a variable in `app.css` keeps it live.
 *
 * A folded value that still holds a `var()` (`--bs-link-color:
 * var(--bs-primary-fg)`) now resolves where it's used rather than on the root,
 * which is how `light-dark()` behaves on the web: it's what lets a
 * `data-bs-theme="dark"` subtree pick up dark values.
 */
function foldConstants(root) {
  const declarations = new Map();
  root.walkDecls(/^--/, (decl) => {
    const list = declarations.get(decl.prop) ?? [];
    list.push(decl);
    declarations.set(decl.prop, list);
  });

  const constants = new Map();
  for (const [name, list] of declarations) {
    const [decl] = list;
    const rule = decl.parent;
    if (
      list.length === 1 &&
      rule.type === 'rule' &&
      rule.parent.type === 'root' &&
      rule.selectors.every((selector) => ROOT_SELECTORS.includes(selector))
    ) {
      constants.set(name, decl);
    }
  }

  const resolved = new Map();
  const resolve = (name, seen = new Set()) => {
    if (resolved.has(name)) {
      return resolved.get(name);
    }
    if (seen.has(name)) {
      return undefined;
    }
    seen.add(name);
    const value = substitute(constants.get(name).value, seen);
    resolved.set(name, value);
    return value;
  };
  const substitute = (value, seen) =>
    replaceFunction(value, 'var', (args) => {
      const [name] = splitArgs(args);
      const folded = constants.has(name) ? resolve(name, new Set(seen)) : undefined;
      return folded ?? `var(${args})`;
    });

  root.walkDecls((decl) => {
    if (decl.value.includes('var(')) {
      decl.value = substitute(decl.value, new Set());
    }
  });
}

/** `1rem` → `16`: core views read rem as a bare number. */
function remToDp(value) {
  return value.replace(/(?<![\w.-])(-?\d*\.?\d+)r?em\b/g, (_match, n) => `${round(parseFloat(n) * REM)}`);
}

/** `0.75rem` → `12px`. MasonKit reads px as CSS px. */
function remToPx(value) {
  return value.replace(/(?<![\w.-])(-?\d*\.?\d+)rem\b/g, (_match, n) => `${round(parseFloat(n) * REM)}px`);
}

/**
 * `clamp(min, <rem> + <vw>, max)` becomes its value at a phone's width, plus
 * one `@media (min-width: …)` copy of the rule per breakpoint.
 */
function stepFluidValue(decl, AtRule) {
  if (!/clamp\(/i.test(decl.value) || !/vw/i.test(decl.value)) {
    return;
  }
  const at = (width) =>
    replaceFunction(decl.value, 'clamp', (args) => {
      const [min, preferred, max] = splitArgs(args).map((arg) => evaluateLength(arg, width));
      if ([min, preferred, max].some((n) => n === undefined)) {
        return `clamp(${args})`;
      }
      return `${round(Math.min(Math.max(preferred, min), max) / REM)}rem`;
    });

  const base = at(BASE_WIDTH);
  if (base === decl.value) {
    return;
  }
  const rule = decl.parent;
  let previous = base;
  let anchor = rule;
  for (const width of BREAKPOINTS) {
    const value = at(width);
    if (value === previous) {
      continue;
    }
    previous = value;
    const step = rule.clone({ nodes: [] });
    step.append(decl.clone({ value }));
    const media = new AtRule({ name: 'media', params: `(min-width: ${width})` });
    media.append(step);
    anchor.after(media);
    anchor = media;
  }
  decl.value = base;
}

/** Evaluates `1.5rem + 1.875vw`-style sums to CSS px at `width`. */
function evaluateLength(expression, width) {
  const terms = expression.trim().replace(/\s+([+-])\s+/g, ' $1').split(' ');
  let total = 0;
  for (const term of terms) {
    const match = /^([+-]?\d*\.?\d+)(rem|px|vw)?$/.exec(term);
    if (!match) {
      return undefined;
    }
    const n = parseFloat(match[1]);
    total += match[2] === 'rem' ? n * REM : match[2] === 'vw' ? (n * width) / 100 : n;
  }
  return total;
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

function mapRootSelector(selector) {
  if (!/:root|:host/.test(selector)) {
    return [selector];
  }
  return ROOT_SELECTORS.map((root) => selector.replace(/:root|:host/g, root));
}

/**
 * `light-dark(a, b)` resolves to `a` on the rule itself; a copy of the rule
 * holding `b` follows it, scoped to dark mode. Both modes are also available
 * per subtree through Bootstrap's own `data-bs-theme="dark|light"` attribute.
 */
function splitLightDark(rule) {
  const decls = rule.nodes.filter((node) => node.type === 'decl' && /light-dark\(/i.test(node.value));
  if (!decls.length) {
    return;
  }

  const dark = rule.clone({ nodes: [] });
  const light = rule.clone({ nodes: [] });
  dark.selectors = unique(rule.selectors.flatMap((s) => themeSelectors(s, 'dark', true)));
  light.selectors = unique(rule.selectors.flatMap((s) => themeSelectors(s, 'light', false)));

  for (const decl of decls) {
    dark.append(decl.clone({ value: pickLightDark(decl.value, 1) }));
    light.append(decl.clone({ value: pickLightDark(decl.value, 0) }));
    decl.value = pickLightDark(decl.value, 0);
  }
  // Light last, so `data-bs-theme="light"` inside a dark app wins.
  rule.after(light);
  rule.after(dark);
}

function themeSelectors(selector, theme, system) {
  const attribute = `[data-bs-theme=${theme}]`;
  const root = /^\.ns-(root|modal)/;
  if (root.test(selector)) {
    return [...(system ? [selector.replace(root, '$&.ns-dark')] : []), attribute];
  }
  const selectors = [`${attribute} ${selector}`];
  if (system) {
    selectors.unshift(`.ns-dark ${selector}`);
  }
  // A single compound, e.g. `.navbar`, can carry the attribute itself.
  if (!/[\s>+~]/.test(selector.trim())) {
    selectors.push(`${selector}${attribute}`);
  }
  return selectors;
}

function pickLightDark(value, index) {
  return replaceFunction(value, 'light-dark', (args) => splitArgs(args)[index] ?? '');
}

const MODERN_COLOR = /^(oklch|oklab|lab|lch|hwb|color)$/i;
const LEGACY_COLOR = /^(rgba?|hsla?)$/i;

/**
 * Turns colors core can't parse into `rgb()`/`rgba()`. Colors that depend on a
 * `var()` stay as `color-mix()`, which core resolves at runtime after `var()`
 * substitution.
 */
function convertColors(value) {
  if (!/\(/.test(value)) {
    return value;
  }
  let result = replaceFunction(value, /oklch|oklab|lab|lch|hwb|color|rgba?|hsla?/i, (args, name) => {
    const source = `${name}(${args})`;
    if (/var\(/i.test(args)) {
      // Relative colors (`oklch(from var(--x) calc(l * .9) c h)`) can only be
      // resolved once the variable is known. Core hands anything containing
      // `color-mix(` to @csstools' parser at runtime, which understands them,
      // so an identity mix routes them there.
      return /^\s*from\s/i.test(args) ? `color-mix(in oklch, ${source} 100%, transparent)` : source;
    }
    if (MODERN_COLOR.test(name) || (LEGACY_COLOR.test(name) && !args.includes(','))) {
      return toRgb(source) ?? source;
    }
    return source;
  });
  result = replaceFunction(result, 'color-mix', (args) => {
    const source = `color-mix(${args})`;
    return /var\(/i.test(args) ? source : (toRgb(source) ?? source);
  });
  return result;
}

function toRgb(source) {
  const parsed = color(parseComponentValue(tokenize({ css: source })));
  return parsed ? serializeRGB(parsed).toString() : undefined;
}

/**
 * Bootstrap writes breakpoints as `(width >= 576px)`. Core only reads
 * `(min-width: …)`/`(max-width: …)`, and compares `px` to physical pixels,
 * so the value is written unitless (dp) to keep CSS-pixel breakpoints.
 */
function convertMediaQuery(params) {
  return params.replace(
    /\(\s*(width|height)\s*(>=|<=|>|<)\s*(\d*\.?\d+)px\s*\)/g,
    (_match, feature, op, raw) => {
      const value = parseFloat(raw);
      switch (op) {
        case '>=':
          return `(min-${feature}: ${value})`;
        case '>':
          return `(min-${feature}: ${value + 0.02})`;
        case '<=':
          return `(max-${feature}: ${value})`;
        default:
          return `(max-${feature}: ${value - 0.02})`;
      }
    },
  ).replace(/\(\s*(min|max)-(width|height)\s*:\s*(\d*\.?\d+)px\s*\)/g, '($1-$2: $3)');
}

/**
 * Calls `fn(args, name)` for every `name(...)` call in `value` (outermost
 * first, not recursing into the replacement) and splices in its result.
 */
function replaceFunction(value, name, fn) {
  const pattern = new RegExp(
    `(?<![\\w-])(${typeof name === 'string' ? name : name.source})\\(`,
    'gi',
  );
  let out = '';
  let last = 0;
  let match;
  while ((match = pattern.exec(value))) {
    const open = match.index + match[0].length - 1;
    const close = findClosingParen(value, open);
    if (close === -1) {
      break;
    }
    out += value.slice(last, match.index) + fn(value.slice(open + 1, close), match[1]);
    last = close + 1;
    pattern.lastIndex = last;
  }
  return out + value.slice(last);
}

function findClosingParen(value, open) {
  let depth = 0;
  for (let i = open; i < value.length; i++) {
    if (value[i] === '(') {
      depth++;
    } else if (value[i] === ')' && --depth === 0) {
      return i;
    }
  }
  return -1;
}

/** Splits a function's arguments on top-level commas. */
function splitArgs(args) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '(') {
      depth++;
    } else if (args[i] === ')') {
      depth--;
    } else if (args[i] === ',' && depth === 0) {
      parts.push(args.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(args.slice(start).trim());
  return parts;
}

function unique(values) {
  return [...new Set(values)];
}
