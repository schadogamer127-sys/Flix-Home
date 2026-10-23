# Minimal Glass · Digital Retro · Ambient Focus — 0.6.1

The latest user specification replaces earlier material experiments.

| Layer | Dark | Light |
|---|---|---|
| Canvas | #000000 | #F3EFE6 |
| Primary text | #F5F2EC | #302B25 |
| Tile fill | white at 3.5% | white at 30% |
| Neutral rim | white at 20% | white at 65% |
| Settings material | rgba(20,20,22,.50) | white at 45% |

The background is flat and immutable during navigation. All ordinary card drop
shadows, broad pools, diagonal reflections and environmental effects are absent.
Cards are 268×220 with 20 px gaps and 28 px radii; title, inputs and footer share
an x=104 alignment. The pixel clock renders at native SVG coordinates with no
background tile or stroke. Seconds are subordinate.

One active card receives its own brand rim and narrow precomputed halo. Inactive
cards retain neutral material. Opening a menu clears the card focus. The panel
uses equal 64 px rows and neutral warm focus, with no app-coloured menu glows.
A low-resolution one-shot canvas softens the panel's backing content; it is not
a live blur and is refreshed only on opening. No continuous graphics loop.

The initial 0.6.0 pass used static focus and clock. The owner then explicitly
requested the folding clock again and reported the halo too weak on TV. 0.6.1
strengthens the narrow halo and folds only changed pixel glyphs for 280 ms.
Reduced motion disables that effect. No card scaling, spring, focus fade queue,
background motion or full-screen colour animation is used.

Reference images are not redistributed. Brand provenance is in
app/ASSET-SOURCES.md. Browser previews are identified as such. Home-button
interception, autostart and other TV system integration remain separate work.
