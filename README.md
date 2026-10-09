# sunflower-bg

Animated dot-matrix sunflowers for a page or hero background, in one dependency-free script.

**Live demo:** https://mar1e-fran.github.io/sunflower-bg/

Every page load grows a new pair of sunflowers. They're drawn live on a canvas as a grid of dithered dots in five tones of one color. They sway gently, stay out of the way of your content, and pause when off screen.

## Use it

Copy `sunflower-bg.js` into your site, or load it straight from GitHub Pages:

```html
<script src="https://mar1e-fran.github.io/sunflower-bg/sunflower-bg.js" defer></script>
```

### Behind the whole page

```html
<style>
  html { background: #000; }
  sunflower-bg.page-bg { position: fixed; inset: 0; z-index: -1; }
</style>

<sunflower-bg class="page-bg"></sunflower-bg>
```

Put the background color on `html`, not `body`. Otherwise the body's background covers the flowers.

### Behind one section

```html
<section style="position: relative; min-height: 100vh; background: #000;">
  <sunflower-bg></sunflower-bg>
  <h1 style="position: relative">Your heading</h1>
</section>
```

The element fills its nearest positioned ancestor, sits behind content and ignores clicks. Its background is transparent.

## Options

| Attribute | What it does | Default |
|---|---|---|
| `color` | Dot color, drawn in five tones of it | `#fff` |
| `accent` | Optional second color for sepals, leaves and drifting patches | tones of `color` |
| `pitch` | Grid spacing in px; smaller means finer detail | `6` |
| `speed` | Animation speed; `0` keeps it still | `1` |
| `layout` | `auto`, `sides` or `stack` | `auto` |

`layout="auto"` puts the flowers at the sides on wide screens and at the top and bottom on tall ones, so the middle stays clear for text.

To grow new flowers from your own code:

```js
document.querySelector('sunflower-bg').reseed();
```

## React / Next.js

Put `sunflower-bg.js` in `public/`, load it once (for example `<Script src="/sunflower-bg.js" />` in Next.js), then render `<sunflower-bg className="page-bg" />`.

## Accessibility and performance

- If a visitor has reduced motion turned on, it shows a still image.
- It pauses while scrolled off screen or in a hidden tab.
- The canvas is `aria-hidden`, so screen readers skip it.
