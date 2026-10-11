# NativeScript Desktop Starter (Bootstrap)

A NativeScript-Vue starter that runs on Windows, iOS and Android. Layout uses
[MasonKit](https://github.com/triniwiz/nativescript-mason) (Flexbox, CSS Grid
and HTML-style elements), and styling uses
[Bootstrap 6](https://getbootstrap.com/)'s own compiled CSS.

It's the [Tailwind starter](https://github.com/triniwiz/nativescript-desktop-starter-template)
with Tailwind swapped for Bootstrap. See [COMPATIBILITY.md](COMPATIBILITY.md)
for how much of Bootstrap works unchanged and what had to be bridged.

## Prerequisites

> NativeScript for Windows is in alpha. Expect rough edges.

To run on Windows you need the following. `npx ns doctor windows` checks them.

| Requirement | Notes |
| --- | --- |
| Windows 10 1809 (build 17763) or later | The app targets `net10.0-windows10.0.26100.0`, with a minimum of `10.0.17763.0`. |
| [Node.js](https://nodejs.org) LTS | Provides `npm` and `npx`. |
| [.NET 10 SDK](https://dotnet.microsoft.com/download) | The build runs `dotnet build`. Check it with `dotnet --version`. |
| Developer Mode | Settings → Privacy & security → For developers. Windows needs it to install and launch the unsigned debug build. |

For iOS and Android, follow the [NativeScript environment setup](https://docs.nativescript.org/setup/).

You don't need to install the NativeScript CLI globally. It's a dev dependency, and the npm scripts run it.

## Getting started

```bash
git clone <this repo> my-app
cd my-app
npm install
npm run windows   # or: npm run ios / npm run android
```

`npm run windows` builds the app, installs and launches it, then syncs your
changes into it as you save. `npm run clean` removes the build output.

Use npm. `package.json` relies on npm `overrides`.

## Project layout

| Path | What it's for |
| --- | --- |
| `src/app.ts` | App entry. Loads `core-fixes.ts` and registers MasonKit's elements. |
| `src/app.css` | Imports Bootstrap, then your own styles, including stand-ins for the check, radio and switch marks. |
| `src/core-fixes.ts` | Runtime workarounds Bootstrap needs from core and MasonKit (see [COMPATIBILITY.md](COMPATIBILITY.md)). |
| `src/components/AppShell.vue` | Sidebar from the `lg` breakpoint up, a navbar with a menu below it. Draws edge to edge, under the status bar and home indicator. |
| `src/navigation.ts` | The screen list and the current screen. Set `currentScreen` to navigate. |
| `src/dialog.ts` | `showDialog({ title, body })`: a Bootstrap `.dialog` over a backdrop, drawn by the app shell. Resolves `true` when confirmed. |
| `src/icons.ts`, `src/components/Icon.vue` | [Bootstrap Icons](https://icons.getbootstrap.com) as SVG backgrounds that take the text colour. Add an icon by importing it in `icons.ts`. |
| `src/components/Home.vue` | The home screen. |
| `src/components/Playground.vue` | Buttons, flex utilities, CSS Grid, chips, alerts, theming and forms. |
| `src/components/Components.vue` | Harder components (groups, checks, tables, accordion, dialog, ...), each badged Works / Partial / Broken. |
| `postcss-bootstrap-compat.mjs` | Adapts the parts of Bootstrap's CSS that NativeScript can't read yet. Each transform can be switched off. |
| `scripts/bootstrap-report.mjs` | `npm run report:css`: how much of Bootstrap's CSS core and MasonKit understand. |

## Tips

- **Bootstrap 6 class names:** v6 renamed a lot from v5. Buttons are
  `btn btn-solid theme-primary` (also `btn-outline`, `btn-subtle`,
  `btn-text`), text colours are `fg-*`, font sizes are `fs-sm` … `fs-6xl`, and
  breakpoints are prefixes: `md:col-6`, `lg:d-flex`, `md:g-col-4`.
- **Elements:** you can write `<div>`, `<section>`, `<h1>`, `<p>`, `<span>`,
  `<button>`, `<input>` and so on. The core NativeScript versions of
  `<button>`, `<span>` and `<label>` are available as `<nbutton>`, `<nspan>`
  and `<nlabel>`.
- **Responsive layouts:** Bootstrap's `sm:`, `md:`, `lg:`, `xl:` and `2xl:`
  breakpoints work, and reflow as the window is resized. `@container`
  queries (used by `.grid`'s `g-col-*` breakpoints) follow the window's
  width rather than the container's.
- **Dark mode:** follows the system. Put `data-bs-theme="dark"` or `"light"`
  on any element to pin that subtree to one theme.
- **Platform styles:** NativeScript puts `.ns-ios`, `.ns-android`,
  `.ns-windows`, `.ns-phone` and `.ns-tablet` on the root view, so
  `.ns-windows .card { … }` targets one platform.
- **Bootstrap's JavaScript doesn't run:** its plugins (dropdowns, modals,
  collapse, …) need a DOM. Drive those states from Vue instead, e.g.
  `:class="{ active: open }"`. That's also why `bootstrap` is a dev
  dependency: only its CSS is bundled.
- **Markup:** prefer `<nav>`/`<div>` over `<ol>`/`<li>` for Bootstrap
  components (MasonKit draws list markers natively), and there are no
  `<table>`, `<dialog>` or `<details>` elements: use `showDialog()` for
  dialogs. The Components screen shows what each component needs.
- **Attributes don't restyle:** core doesn't re-match `[data-bs-theme]` or
  `[open]` when the value changes. Key the element on it
  (`:key="theme"`) so Vue rebuilds it.
- **Icons:** `<Icon name="house" />`. Put icons in a `<div class="btn">` or
  `<div class="nav-link">` rather than a `<button>`: a MasonKit button is a
  text view and doesn't draw element children yet.
- **Inline styles:** use classes or a bound `:style="{ … }"`. A static
  `style="…"` string isn't applied on Android.
- **`v-model` on `<input>`:** Vue compiles it to a DOM-only helper. Bind
  explicitly: `:value="name" @input="name = $event.target.value"`.

## Troubleshooting

- **Something's missing from your setup:** `npx ns doctor windows` lists what it can't find and how to fix it.
- **The app builds but won't launch** ("deployment failed"): turn on Developer Mode.
- **A stale or broken build:** run `npm run clean`, then `npm run windows` again.
- **A Bootstrap class does nothing:** run `npm run report:css` to see whether
  its property is one NativeScript understands, and check
  [COMPATIBILITY.md](COMPATIBILITY.md).

## Temporary workarounds

These can be removed once the fixes are released:

- `@nativescript/core` and `@nativescript/vite` are installed through pkg.pr.new from
  [NativeScript/NativeScript#11468](https://github.com/NativeScript/NativeScript/pull/11468),
  which is the `feat/windows` branch plus percentage sizes inside MasonKit layouts.
- `@nativescript/windows` is pinned to an exact alpha, because a caret range
  would also match older, incompatible betas.
- `bootstrap` is pinned to `6.0.0-alpha.1`, the first v6 release.
- `masonkit-hmr.mjs` stops MasonKit from loading twice during HMR.
- `src/core-fixes.ts` and parts of `postcss-bootstrap-compat.mjs`; see
  [COMPATIBILITY.md](COMPATIBILITY.md) for which fix each one waits on.
- **MasonKit:** the starter needs the fixes on MasonKit's `fix/bootstrap-compat`
  branch (see COMPATIBILITY.md), released after 1.0.0-beta.111. With 111 from
  npm, Android buttons and badges lose their labels, the shell doesn't scroll
  on Android, the sidebar doesn't reach the screen edges on iOS, checks and
  radios draw as green native controls, masks (`.btn-close`, the placeholder
  wave) draw as solid boxes, and on Android screens you've left keep drawing
  over the current one.
