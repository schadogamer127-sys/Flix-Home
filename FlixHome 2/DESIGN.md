# Material design, 0.5.1

The reference review covered all 26 entries on the supplied inspiration board,
then four user-prepared light/dark home/settings mockups. Reference images are
not redistributed. Recurring ideas: warm ceramic light surfaces, smoked dark
surfaces, fine rims, soft local illumination and clear layer separation.

- Background: one fixed full-screen image per theme.
- Clock: fixed SVG paths from 5×7 square matrices, no enclosing panel.
- Tiles: local precomputed glow, separate surface artwork, opaque transparent
  logo and label. Only the selected tile receives a coloured focus rim.
- Inputs: separate rounded pills, outline icons, readable connection status.
- Settings: dense surfaces, grouped rows, icons and separate state labels.
- Theme control: persistent Hell/Dunkel labels, selected thumb plus an
  independent focus outline.

Artwork is generated offline by tools/build-artwork.cjs; the TV does not run
blur filters or a render loop. Navigation is immediate and intentionally static
for this revision. The once-per-second clock updates only changed glyph paths.
The TV runs locally without an external service or continuously running PC.
