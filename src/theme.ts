import { Badge, Button, Card, createTheme, Modal, Paper, Table, type MantineColorsTuple } from '@mantine/core';

// Every ramp below is derived (HSL lightness/saturation curve, not hand-picked) from a single
// anchor color pulled from the wireframe set, so shade[anchorIndex] reproduces that anchor's
// hue almost exactly while the rest of the ramp stays perceptually smooth and WCAG-checked
// against its actual usage (button text, dimmed text on white, etc.) — see
// scratchpad/build-palette-2.mjs for the derivation + contrast numbers.

// Brand / primary — burnt-orange accent (wireframe --accent). Anchor #C15B2C @ shade 6.
const brand: MantineColorsTuple = [
  '#F8F3F1',
  '#F2E4DE',
  '#ECCBBC',
  '#E6AE94',
  '#DF8D68',
  '#D66E3E',
  '#BF5A2C',
  '#9B4C27',
  '#773D22',
  '#552D1B',
];

// Success — "good"/paid/completed green. Anchor #3E7D4C @ shade 6.
const success: MantineColorsTuple = [
  '#F3F7F4',
  '#E2EEE5',
  '#C7E0CD',
  '#A7D3B1',
  '#83C391',
  '#61B273',
  '#4E9D5F',
  '#428050',
  '#366340',
  '#29482F',
];

// Danger — not in the wireframe (no error color was ever needed there); added for real product
// use (destructive actions, validation). Kept a true red (hue 0) so it doesn't get mistaken for
// the brand's warm orange.
const danger: MantineColorsTuple = [
  '#F8F2F2',
  '#F0E0E0',
  '#E7C1C1',
  '#DD9C9C',
  '#D37474',
  '#C64D4D',
  '#B03A3A',
  '#8F3333',
  '#6F2A2A',
  '#4F2121',
];

// Steel — secondary/info accent (wireframe --line-strong). Used for "active work" states
// (In Progress) distinct from the neutral gray and the brand orange. Anchor #2E6088 @ shade 6.
const steel: MantineColorsTuple = [
  '#F2F5F8',
  '#E0E9F0',
  '#C1D6E6',
  '#9DC0DD',
  '#74A8D2',
  '#4E90C5',
  '#3B7CAF',
  '#33668E',
  '#2B506E',
  '#213B4F',
];

// Slate — replaces Mantine's default neutral gray with a gray tinted toward the same blue
// family as steel/navy, so borders/dimmed text/subtle backgrounds read as one cohesive system
// instead of a generic gray bolted onto a colored brand. Anchor #5B6B76 @ shade 6.
const slate: MantineColorsTuple = [
  '#F4F5F6',
  '#E6E8EA',
  '#CFD5D9',
  '#B4BEC5',
  '#97A5AF',
  '#7A8D99',
  '#667884',
  '#55636D',
  '#444E55',
  '#32393E',
];

// Navy — replaces Mantine's default dark-mode surface scale. The wireframe's dark theme is a
// tinted navy "cyanotype" rather than generic charcoal; this carries that into real dark-mode
// surfaces (shade 9 = app background, 7 = card/panel surface, 6 = borders).
const navy: MantineColorsTuple = [
  '#CBDAEB',
  '#A6BFDD',
  '#7A9FCD',
  '#4E7FBC',
  '#386194',
  '#2A496F',
  '#213957',
  '#192A41',
  '#121E2E',
  '#0C151F',
];

const SANS = '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 4 },
  autoContrast: true,
  colors: { brand, success, danger, steel, slate, gray: slate, navy, dark: navy },
  defaultRadius: 'md',
  fontFamily: SANS,
  fontFamilyMonospace: 'ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", Consolas, monospace',
  headings: {
    // Same family as the body (not a condensed display face) — one typeface, weight/size carry
    // the hierarchy, matching how Linear/Notion/Vercel-style dashboards read as "software" rather
    // than a printed shop sign.
    fontFamily: SANS,
    fontWeight: '650',
  },
  shadows: {
    xs: '0 1px 2px rgba(16, 24, 32, 0.06)',
    sm: '0 1px 3px rgba(16, 24, 32, 0.08), 0 1px 2px rgba(16, 24, 32, 0.04)',
    md: '0 4px 12px rgba(16, 24, 32, 0.10), 0 2px 4px rgba(16, 24, 32, 0.06)',
    lg: '0 12px 24px rgba(16, 24, 32, 0.12), 0 4px 8px rgba(16, 24, 32, 0.06)',
    xl: '0 20px 40px rgba(16, 24, 32, 0.16), 0 8px 16px rgba(16, 24, 32, 0.08)',
  },
  components: {
    // Every Paper/Card in the app (stat tiles, panels, board columns, modals) gets a soft
    // elevation shadow instead of relying on `withBorder` alone — flat bordered boxes read as a
    // wireframe; a hairline border + shadow together reads as an actual raised surface.
    Paper: Paper.extend({ defaultProps: { shadow: 'xs', radius: 'md' } }),
    Card: Card.extend({ defaultProps: { shadow: 'xs', radius: 'md', padding: 'lg' } }),
    Modal: Modal.extend({ defaultProps: { radius: 'md', shadow: 'xl', overlayProps: { backgroundOpacity: 0.45, blur: 2 } } }),
    Button: Button.extend({ defaultProps: { radius: 'sm' } }),
    Badge: Badge.extend({ defaultProps: { radius: 'sm' } }),
    Table: Table.extend({ defaultProps: { verticalSpacing: 'sm', horizontalSpacing: 'md' } }),
  },
});
