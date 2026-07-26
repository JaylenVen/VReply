# Design QA — VReply 极简首页背景

- Source visual truth: `C:\Users\28022\.codex\generated_images\019f9eed-c41a-70c1-bcc2-b1e7b6d0e4d5\call_Ogy7EIPcwQSBNCnpHiTrpES9.png`
- Normalized source: `C:\Users\28022\.codex\visualizations\2026\07\26\019f9eed-c41a-70c1-bcc2-b1e7b6d0e4d5\vreply-minimal-background-build\01-selected-option-normalized.png`
- Implementation screenshot: `C:\Users\28022\.codex\visualizations\2026\07\26\019f9eed-c41a-70c1-bcc2-b1e7b6d0e4d5\vreply-minimal-background-build\02-implementation-desktop-final.png`
- Combined comparison: `C:\Users\28022\.codex\visualizations\2026\07\26\019f9eed-c41a-70c1-bcc2-b1e7b6d0e4d5\vreply-minimal-background-build\03-source-implementation-comparison.png`
- Mobile screenshot: `C:\Users\28022\.codex\visualizations\2026\07\26\019f9eed-c41a-70c1-bcc2-b1e7b6d0e4d5\vreply-minimal-background-build\04-implementation-mobile.png`
- Viewports: desktop 1010 × 986 CSS px; mobile 390 × 844 CSS px.
- Pixel dimensions and density: source 1270 × 1239, normalized source 1010 × 986, desktop implementation 1010 × 986, mobile capture 390 × 843; device pixel ratio 1.
- State: 首页默认状态，英语已选中，链接输入为空。
- Full-view comparison evidence: the combined image compares the selected option and the live implementation at the same desktop dimensions. Both use a near-black, low-contrast velvet field with a restrained warm haze and no door, beam, horizon line, or illustrative object.
- Focused comparison evidence: the requested change occupies the full canvas, so the normalized full-frame comparison is also the focused background comparison. The implementation keeps the real product UI rather than reproducing incidental UI drift introduced by the generated concept image.

## Findings

- No actionable P0, P1, or P2 issues remain.
- Typography and copy: the existing logo, hero type, labels, placeholder, action text, and `V2.5.6` badge are unchanged.
- Spacing and layout rhythm: the existing desktop and mobile foreground composition is unchanged; neither viewport has horizontal overflow.
- Colors and visual tokens: the selected near-black palette is preserved. The final background is darkened and desaturated to match the chosen option instead of competing with the gold accent.
- Image quality and fidelity: the 1440 × 1024 WebP is sharp at both tested viewports. It contains no text, UI, logo, door silhouette, light beam, stripe, or hard edge.
- Motion treatment: the background has one image layer, no pseudo-element glow layers, `transform: none`, and `transition-duration: 0s`. Moving the pointer across the page leaves the background transform unchanged.
- Interaction and accessibility: English/Spanish switching works, the YouTube link field accepts input and can be cleared, and the original accessible labels remain intact.
- Responsive check: the 390 × 844 layout keeps the header, hero, intake card, and `V2.5.6` badge visible with no horizontal overflow.
- Runtime check: the browser console reported no warnings or errors.

## Open Questions

- None.

## Implementation Checklist

- Replace the yellow-lit door background with the selected minimalist black-velvet direction.
- Remove the closed/open background image pair and the door-opening crossfade.
- Remove animated glow pseudo-elements and the liquid-aurora animation.
- Keep the existing foreground UI and version badge unchanged.
- Verify desktop, mobile, language switching, URL input, pointer movement, overflow, and console output.

## Comparison History

1. The selected concept established a near-black velvet field with only a faint warm haze.
2. The first implementation pass removed the door and beam but rendered the warm texture slightly too prominently at the audit viewport.
3. The final pass reduced brightness and saturation, bringing the live background into the selected option’s low-contrast range without changing foreground layout or interaction.

## Follow-up Polish

- No P3 follow-up is required for the requested scope.

final result: passed
