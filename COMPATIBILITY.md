# Bootstrap 6 on NativeScript + MasonKit

How much of Bootstrap's compiled CSS (`bootstrap@6.0.0-alpha.1`,
`dist/css/bootstrap.css`) runs on NativeScript with MasonKit, what had to be
bridged, and which upstream fixes would remove each bridge.

Verified on the iOS simulator (iPad Pro 13-inch and iPhone 17 Pro, iOS 26.4)
and the Android emulator (Pixel 9 Pro, API 36): light and dark mode, a live
appearance switch, rotation across a breakpoint, the app shell folding below
`lg`, edge-to-edge layout, scrolling, taps, and HMR CSS updates. Windows wasn't
run. The **Components** screen in the app shows each component with a Works /
Partial / Broken badge.

## In numbers

`npm run report:css` produces these:

| | |
| --- | --- |
| Rules that reach core, as shipped | **78 of 4,430 (1.8%)**: parsing stops at the first `@layer` |
| Rules that reach core, with the compat plugin | all of them |
| Declarations whose property core or MasonKit understands | **93.3%** (6,859 of 7,355, not counting custom properties) |
| Selectors that can never match | 4.4% (`::before`/`::after`, `:nth-child()`) |

The remaining 6.7% is mostly web-only: `outline` (127), `transition*` (113),
`cursor`, `pointer-events`, `content`, `user-select`. The report lists them
all.

## What works unchanged

- **Selectors:** classes, types, attributes, descendant/child combinators,
  `:is()`, `:where()`, `:not()`, and Bootstrap 6's escaped breakpoint classes
  (`.md\:col-6`).
- **Custom properties:** `var()` with fallbacks and inheritance, `calc()`, and
  runtime `color-mix()` (core hands it to `@csstools`).
- **Layout:** Flexbox, CSS Grid (`.grid`, `g-col-*` spans) and the 12-column
  row/col grid with gutters, all laid out by Taffy.
- **Units and media:** rem/em on MasonKit elements, and `@media` re-evaluated
  on resize (container `max-width`s switch when the iPad rotates across `xl`).
- **Components** in the playground render as on the web: `.btn` in every
  style and theme, cards, list groups, nav pills, badges, chips, alerts,
  progress, avatars, form labels and `.form-control`.
- **Theming:** `theme-*` and `data-bs-theme` subtrees.

## What's bridged at build time

`postcss-bootstrap-compat.mjs` adapts the stylesheet. Every transform is a
switch (`bootstrapCompat({ fluid: false })`), so you can see what each gap
costs.

| Transform | Gap | Where it could be fixed |
| --- | --- | --- |
| `layers` | `@layer` stops `@nativescript/vite`'s parser (reworkcss `css`): everything after the first block is lost. Core also skips rules inside `@layer`. | vite: parse with css-tree. Core: treat `@layer` like `@media` in `_populateRules`, with layer ordering. |
| `container` | `@container` also stops the parser, and core has no container queries. Approximated with `@media` (viewport width). | Core/MasonKit: container queries. MasonKit knows each box's size. |
| `atRules` | `@starting-style`, `@property` stop the parser. | vite parser. |
| `root` | No `:root`/`:host` in core. Mapped to `.ns-root, .ns-modal`. | Core: match `:root` against the root view. |
| `hidden` | Core defines `hidden` on every view (default `false`), and `[hidden]` matches any non-null value, so Reboot's `[hidden] { display: none }` hides the whole app. Narrowed to `[hidden=true]`. | Core: treat boolean properties like HTML boolean attributes in `[attr]` matching. |
| `has` | Core can't parse `:has()` with a relative selector (`:has(+ .x)`), and one bad part drops the whole selector: the input group's `:not(:last-child, …, :has(…))` never squared its inner corners. Inside `:not()`, where `:has()` only narrows the exclusion, it's dropped. | Core: `:has()`. |
| `lightDark` | Core can't parse `light-dark()`. Each use is split into a light value plus a `.ns-dark` / `[data-bs-theme]` copy. | Core: evaluate `light-dark()` against the root's appearance class. |
| `fold` | Core resolves `color-mix()` for `background-color`, but not inside shorthands like `border: 1px solid color-mix(...)`, so card borders came out black. Root variables defined once (the palette) are substituted at build time, and colors fold to `rgb()`. | Core: resolve colour functions in shorthand expansion. |
| `body` | No `<body>`. Its rules target `Page`. `Page` is a core view and core reads `1rem` as `1`, so rem there is converted to dp. Without it, every inheriting text was 1 dp tall. | Core: rem/em in its own length and font-size converters. |
| `colors` | Core's `Color` can't parse `oklch()` (Bootstrap 6's whole palette) or `rgb(0 0 0 / 15%)`. Converted to `rgb()`. Relative colours that depend on a `var()` (`oklch(from var(--x) calc(l * .9) c h)`, used for hover/active states) are wrapped in an identity `color-mix()` so they reach `@csstools` at runtime. | Core: route every colour function through `@csstools/css-color-parser`, not only `color-mix()`. |
| `fluid` | Core only evaluates values containing `calc(`, and MasonKit evaluates no functions, so `clamp(2rem, 1.5rem + 1.875vw, 2.5rem)` (all of Bootstrap's `fs-*` and heading sizes) resolves to nothing. Evaluated at each breakpoint and stepped with `@media`. A `clamp()` in `em` (the badge's font size) is resolved with `em` as 16px. | MasonKit: evaluate `clamp()`/`min()`/`max()`/`calc()` with rem/em/vw, since it already knows the root font size and viewport. |
| `rem` | Core evaluates `calc()` with `@csstools/css-calc`, which can't combine rem and px: `calc(0.75rem - 1px)` (the card's inner radius) comes back unevaluated and MasonKit reads it as 0, so a card's header and list group painted square corners over its rounded border. rem in custom properties and inside `calc()` becomes px. | MasonKit: evaluate `calc()` itself with its rem/viewport context (see below). |
| `borders` | MasonKit registers `border` as a property of its own, not a shorthand for longhands, so a later `border-width: 0 0 1px` doesn't override `border: 1px solid …`. Flush list groups kept side borders that doubled the card's. `border` and `border-<side>` are expanded into width/style/color. | MasonKit: expand `border`/`border-<side>` into longhands, as it does `border-width`. |
| `inherit` | Core has no `inherit` keyword. On inherited properties it becomes `unset` (equivalent there); `--x: inherit` is dropped (core looks variables up on the parent anyway). For the rest (a list group item's corner radii, `border-color`, `flex-wrap`) each declared value is mirrored into a `--ns-inherit-<prop>` custom property, which core does pass down. | Core: `inherit` for every property. |
| `currentColor` | Core can't parse `currentcolor`; spinners and placeholders are drawn in it and were invisible. Every `color` is mirrored into `--ns-current-color`, which inherits like `color`, and `currentcolor` reads it. | Core: `currentcolor`. |
| `animation` | Core builds keyframe animations from a rule's raw declarations, once, before `var()` is resolved, so spinners didn't spin; a `var()` inside `@keyframes` (the placeholder pulse) also broke the layout of everything after it. Variables are filled in from rules with the same selector, and in keyframes from variables with a single value. | Core: resolve variables in animations per element. |
| `keywords` | `background: none` sets `background-color` to unset rather than `transparent`, so a native button keeps its own background (`.nav-link` pills). `font-weight: bolder` is rejected. MasonKit has `list-style-type`/`-position` but not the `list-style` shorthand. | Core: `background` shorthand initial values; relative font weights. MasonKit: `list-style`. |
| `media` | Core's media parser doesn't know range syntax `(width >= 576px)`, which every Bootstrap 6 breakpoint uses, so they never matched. It also compares `px` to physical pixels, so a 2× screen hit each breakpoint at half the width. Rewritten to `(min-width: 576)` (dp). | Core: range syntax; CSS px in media queries. |
| `logical` | Neither core nor MasonKit registers logical properties. Bootstrap 6 writes spacing utilities, `.container` padding and `.row` gutters with them (about 1,400 declarations; coverage goes from 66% to 92.5% with this alone). Mapped left-to-right with `postcss-logical`. | MasonKit: `margin-inline`, `padding-block-*`, `inset-*`, `border-*-radius` logical forms, ideally direction-aware. |

## What's patched at runtime

`src/core-fixes.ts`:

1. **Forward-referenced custom properties crash core.** Bootstrap declares
   `--a: var(--b)` before `--b` throughout. `settleCssVariables` stores the
   `unsetValue` sentinel for `--a` on its first pass, and the next pass calls
   `.trim()` on it (`TypeError: cssVariableValue?.trim is not a function`).
   That aborts styling of the root view, so the app renders blank. The patch
   reads non-string values as `null` (guaranteed-invalid, as on the web).
   *Fix in core:* don't store `unsetValue` as a variable value, or guard
   `_evaluateCssVariableExpression`.
2. **`gap: 0.5rem` became 0.5 dp.** MasonKit's `row-gap`/`column-gap` go
   through core's `PercentLength.parse`, which reads rem with `parseFloat`.
   The patch teaches core's length parsers rem (and em as rem) using
   MasonKit's `cssUnits.rootFontSize`. *Fix in MasonKit:* use its own
   rem-aware `tokenToDevicePx` for the gap properties, as for other lengths.

3. **No structural pseudo-classes.** Core treats `:first-child` and
   `:last-child` as states a view reports, like `:active`, and none ever does.
   Bootstrap uses them 292 times: the ends of list groups, button and input
   groups, and cards. The patch keeps `first-child`, `last-child` and
   `only-child` set as pseudo-class states on each parent's children when
   views are added or removed, plus the `-of-type` forms (by element type).
   *Fix in core:* match them structurally. `:nth-child()` is still
   unsupported.
4. **Shadows came out opaque black.** MasonKit hands `box-shadow` to the
   platform as a string, and the native parsers don't read `color-mix()` or
   relative colours. The patch resolves them to `rgba()` first. Fixed in
   MasonKit (see above); drop the patch once that's released.
5. **Spinners didn't spin.** Core applies the first keyframe interval as a
   jump and holds the last keyframe, so keyframes without a 0% or 100%
   keyframe never animate: `spinner-border` (`to { transform: rotate(360deg) }`)
   jumped to 360° every iteration, and `spinner-grow` (which stops at 50%)
   never faded back out. The patch adds the missing ends and fills them with
   the view's own values when the animation plays, as CSS does. *Fix in
   core:* use the element's values for missing 0%/100% keyframes.

`src/app.css` also gives `.btn-icon` a `min-width`. Browsers carry
`min-height` through `aspect-ratio: 1` to the width; Taffy doesn't, so square
icon buttons collapsed to slivers.

## Fixed in MasonKit

On MasonKit's `fix/bootstrap-compat` branch, after 1.0.0-beta.111. The starter
needs a release with these; with 111 from npm the Android and iOS problems
below come back.

| Problem | Fix | Tests |
| --- | --- | --- |
| Toggling an accordion re-wrapped every header at its min-content width and the text overflowed. mason-core wrote a text node's layout during a sizing probe, and the parents' final layouts then came from the cache. | `crates/mason-core/src/tree_inline.rs`: only a real layout pass stores the node's layout. | `accordion_text_relayout_repro.rs` |
| Android: a `white-space: nowrap` button or badge drew no label (every Bootstrap `.btn` and `.badge`). nowrap text is laid out a million pixels wide, and centring put it far off-screen. Regressed in `4dca7cef` (Button became a Mason text view), found by bisecting. | `TextView.kt`: a layout wider than its box is shifted as if laid out at the box width. | `ButtonNoWrapInstrumentedTest` |
| Android: nothing scrolled in the app shell. A `<div>` root measured its content at unbounded height, so the flex column inside grew to its content; and a nested `<scroll>` ignored `visible` = `auto`. | `Scroll.kt`: only a vertical scroll container measures unbounded. `Element.kt`: nested `<scroll>` honours `visibleOverflowScrolls`. | full instrumented suite |
| iOS: a MasonKit root ignored `iosOverflowSafeArea` and never raised `layoutChanged`, so nothing could draw under the status bar or home indicator. | `common.ts` `setRootNativeViewFrame`, used by `View` and `Scroll` roots: core's safe-area overflow, a recompute at the expanded size, and `layoutChanged`. | on device |
| Colour functions (`color-mix()`, `oklch()`, relative colours) in string properties (`box-shadow`, `border`, `filter`, gradients) fell back to opaque black. | `css-colors.ts`, applied to every string property in `style.ts`. | `css-colors.spec.ts` |
| Checks, radios and switches were always drawn as native controls (in green), whatever the CSS said, and `<input>` reported no `:checked` state. | `appearance: none` (iOS, Android) draws a checkbox or radio as a plain box, which takes Bootstrap's background, border and radius. Inputs keep a `:checked` pseudo-class in step with taps and code. | `input.spec.ts`, `InputAppearanceTest`, `InputAppearanceTests` |
| Android: a view that went `display: none` after it had been laid out kept drawing at its old frame. The setter hid it, but a value written from JS only reached the style buffer. Kept screens drew over each other. | `Style.kt`: syncing `display` from JS sets the view's visibility too, as iOS already did at layout. | on device |
| A border whose sides differ (a list group's later items have no top border) dropped the curve at each rounded corner: the per-side split stopped at the inner corner, so the curve was in neither side's share. | `Border.kt`, `Border.swift`, Windows `RoundedMask.h`: the split runs on through the corner, and same-coloured sides fill as one ring. | on device (Windows not built here) |
| No CSS masking: `.btn-close`, `.placeholder-wave` and anything else using `mask-image` drew as a solid box. | `mask-image`, `-size`, `-position`, `-repeat`, `-origin`, `-clip`, `-mode` and `-composite` on iOS (`Mask.swift`, as `layer.mask`) and Android (`Mask.kt`, a `DST_IN` layer in each view's `draw`), with the `mask` shorthand split in JS. Gradient masks include conic and repeating ones. | `css-shorthands.spec.ts`, `MaskTests` (24), `MaskParsingTest` (18), `MaskInstrumentedTest` (11) |
| Keyframes dropped `mask-position`: core keeps only CssAnimationProperties in keyframes and its native Animation plays a fixed set, so `.placeholder-wave` stood still. | `mask-position` and `mask-size` are CssAnimationProperties, and `css-keyframes.ts` plays them every frame on core's timeline (delay, iterations, timing functions, fill mode, cancel), next to core's own animations. | `css-keyframes.spec.ts` |
| No `clip-path`, `mask-border` or `-webkit-mask-*`, and `border-image` was stored but never drawn. | `clip-path` basic shapes and boxes (anti-aliased, and clipped-out areas don't take touches); `mask-border` and `border-image` through one 9-slice painter; the `-webkit-mask*` names in JS. iOS `ClipPath.swift`, `NineSlice.swift`; Android `ClipPath.kt`, `NineSlice.kt`. | `ClipPathTests` (19), `NineSliceTests` (14), `ClipPathParsingTest` (17), `NineSliceTest` (23), `ClipPathInstrumentedTest` (17) |
| SVG backgrounds supported only straight, filled paths: no icon set rendered. | Full SVG path grammar (curves, arcs, relative commands), shapes, strokes, transforms, `currentColor` and `fill-rule` on iOS and Android; Windows hands SVG to `SvgImageSource` (not built here). | `SvgParserTest` (39), `SvgParserTests` (42) |

## MasonKit behaviour found by the Components screen

- **Radios aren't grouped:** checking one doesn't uncheck the others with the
  same `name`. The demo groups them with Vue state.
- **`<ol>`/`<li>`** keep their list markers whatever `list-style` says (the
  markers are drawn natively by the list), and `<li>` text is clipped in a
  flex row. `list-style-type` isn't inherited either. Breadcrumbs and
  pagination work with `<nav>`/`<div>` markup.
- **Block elements shrink below their content** in a flex column (they're
  scroll containers, so their automatic minimum size is 0). The app shell
  marks its navbar and menu `flex-shrink-0`.
- **A root element inside a core `Page`** sizes to its content's width, not
  the page's, in a column layout. The app shell gives its root `w-100 h-100`.
- **A `<button>` doesn't draw element children** (an icon `<div>`), on iOS or
  Android: it's a text view. The shell uses `<div class="nav-link">`.
- **A static `style="…"` attribute isn't applied on Android**; classes and a
  bound `:style` object are.
- **`em` padding is resolved against the wrong basis** when the element's own
  `font-size` is in `em` (the badge grew to several times its size). The shim
  resolves the badge's `clamp()` to px, which avoids it.
- **The spinner's ring** is drawn with a square inner edge on iOS.

## What doesn't carry over

- **Pseudo-elements** (`::before`, `::after`, `::placeholder`): 210 selectors,
  plus 13 using `:nth-child()` and similar.
  This affects numbered list groups and striped tables. The check, radio and
  switch marks are drawn as background images in `src/app.css` instead.
- **`[class*=btn-]` and friends:** core turns any attribute selector on
  `class` into a plain class match, ignoring the operator, so button groups
  keep each button's corners.
- **Native HTML:** there are no `<table>`, `<dialog>` or `<details>` elements,
  so tables, dialogs and accordions use other markup and Vue state. Dialogs
  come from `showDialog()` (`src/dialog.ts`): the app shell draws the
  backdrop (an element, with `::backdrop`'s values and `backdrop-filter`)
  and the `.dialog` over everything.
- **Changing an attribute doesn't restyle**, so `[data-bs-theme]` and
  `[open]` rules don't follow changes. Those elements are keyed on the value
  so Vue rebuilds them.
- **Changing a class restyles the whole subtree:** core re-matches every
  descendant's selectors, which takes most of a second on a screen of
  Bootstrap views. The app shell keeps visited screens and shows or hides
  them with an inline `display`, not `d-none`.
- **Masking gaps:** `url(#id)` references to an SVG `<mask>` or `<clipPath>`
  (there are no inline SVG elements), and Windows. On iOS a masked or clipped
  element's outset shadow is hidden. Only `mask-position` and `mask-size`
  animate among MasonKit's own properties.
- **Interaction states:** `:hover` and `:focus-visible` rules only apply when
  the native view reports that state. `prefers-reduced-motion` queries never
  match, so motion-gated rules are skipped.
- **Transitions:** `transition*` isn't supported.
- **Web-only properties:** `outline`, `cursor`, `pointer-events`,
  `user-select` and `content`.
- **Bootstrap's JavaScript:** it needs a DOM and throws on import
  (`document is not defined`), so Bootstrap is a dev dependency and only its
  CSS is bundled. Component state comes from Vue.
- **`v-model` on `<input>`:** it compiles to Vue's DOM-only `vModelText`, so
  the build fails. Bind `:value` and `@input` instead.
- **Approximations:** container queries use the window width; fluid type
  steps at breakpoints instead of scaling continuously; rem in custom
  properties, `calc()`, core views and gaps assumes a 16 dp root; emulated
  `inherit` takes the nearest ancestor that set the property, not strictly
  the parent.

## Would rem support in MasonKit fix things?

MasonKit already resolves rem for most properties. The rem problems left
come from places MasonKit hands off to core or doesn't evaluate:

- `row-gap`/`column-gap` use core's `PercentLength.parse`, which reads
  `0.5rem` as 0.5. Using MasonKit's own `tokenToDevicePx` there fixes it.
- `calc()`, `clamp()`, `min()` and `max()` reach MasonKit either unevaluated
  (core only evaluates `calc(`, and can't mix rem with px) or not at all, and
  collapse to 0. If MasonKit evaluated them itself, with its root font size
  and viewport, the `rem`, `fluid` and part of the `body` transforms could
  go.

Rem support doesn't help with the other edge problems. `:first-child` and
`inherit` are core's, and the `border` shorthand is MasonKit's (see above).

## Suggested upstream fixes, by payoff

1. **Core:** the `settleCssVariables` crash. Any stylesheet with
   forward-referencing custom properties renders blank.
2. **`@nativescript/vite`:** a parser that survives `@layer` and
   `@container`. Without one, modern CSS frameworks are cut off at the first
   one.
3. **MasonKit:** logical properties. This is the single biggest declaration
   gap.
4. **MasonKit:** evaluate `calc()`/`clamp()`/`min()`/`max()` with rem/vw,
   resolve rem in `gap`, expand `border` and `list-style` into longhands,
   inherit `list-style-*`, draw a button's element children, group radios,
   and apply static inline styles on Android.
5. **Core:** `:first-child`/`:last-child`/`:nth-child()`, `inherit`,
   `currentcolor`, `:has()`, and `[class*=…]` matching. Restyle on attribute
   changes, and only the descendants a class change can affect. Implicit 0%/100%
   keyframes.
6. **Core:** `@layer`, `:root` and `light-dark()`. Media range syntax with
   CSS px.
7. **Core:** colour functions beyond `color-mix()`, including inside
   shorthands. `[hidden]` boolean matching and `background: none`.
