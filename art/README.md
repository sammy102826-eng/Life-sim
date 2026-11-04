# Born to Run illustration library

Open `gallery.html` for a self-contained contact sheet. Individual editable SVG files are in `icons/`.

The library exports **191 illustrations**: 61 cars, 40 homes, 40 jewelry/collectible items, 32 portrait examples, and 18 additional objects/category icons. The game also generates portraits for actual characters using their saved identity and age category.

## In-game coverage

- Car, house and collectible shopping cards.
- Owned assets, purchase screens and asset details.
- Family/friends, deceased relationships and pets.
- Player header, classroom peers, teachers, campus classmates/professors, coworkers and bosses.
- Boats, aircraft, pet adoption, investments and Other category navigation.

Artwork uses original local SVG primitives with a consistent palette, dark outlines and rounded backgrounds. Vehicle/home shapes reflect general types and styles; they are not exact manufacturer models. Portrait appearance is selected by a deterministic identity hash, not inferred from a character’s name or nationality.

## Source and regeneration

- `src/illustrations.js`: reusable deterministic SVG generator.
- `src/graphics.js`: integrates artwork into existing game screens.
- `scripts/build-art-gallery.cjs`: exports the gallery and individual SVG files.

Run from the repository:

```sh
npm run art:build
```

No network or image service is needed. Runtime graphics are generated locally; exported gallery files are optional for playing the game. Rendering never consumes `Math.random`, so it cannot change gameplay outcomes. SVG markup is not stored in save files; portraits regenerate from existing character IDs.

The illustrations are decorative alongside existing names and descriptions, hidden from assistive technology, and noninteractive. Buttons keep their normal text labels. Dark/light themes and narrow-screen layouts retain readable prices beside the thumbnails.

`preview.png`, `homes-preview.png`, `portraits-preview.png`, and `mobile-preview.png` are browser-rendered review screenshots. Rebuilding the gallery regenerates SVG/HTML files, not these screenshots.

## Verification

**59 Chromium tests passed, 0 failed, 0 skipped.** Added checks validate full catalog coverage, deterministic generation without gameplay randomness, stable portraits after save/load, valid standalone SVG files, offline illustrated purchase/inventory/detail flows, and single-line mobile prices. Existing mobile accessibility and gameplay regressions also pass. Visual previews were inspected in Chromium; physical-device and manual screen-reader certification remain outside the completed checks.
