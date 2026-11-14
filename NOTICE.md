# Attribution and sources

## Chain of authorship

| Creator | Contribution | Link |
| --- | --- | --- |
| 上善无形（上善） | Original whale girl character (DeepSeek only) | https://space.bilibili.com/4456176 |
| ZipZipPipe | Original designs of every character in this pack (《AI娘化》) | https://www.pixiv.net/artworks/148186519 · https://space.bilibili.com/4168597 |
| ZipZipPipe-character-pack | Chibi sprite adaptation for PA Cafe | this repository |

## Licence basis (checked 2026-11-14)

- Pixiv work 148186519 《AI娘化》 by ZipZipPipe (17 images, posted 2026-08-08). The author's caption says the images are posted so that everyone can take and use them, that the author must be credited, and that commercial use is not allowed. It also says the DeepSeek girl is a derivative of the whale girl by the user 上善 and follows the CC BY-NC-SA 4.0 licence signed by that creator.
- The caption is not itself a Creative Commons licence for the characters other than DeepSeek. This pack treats it as permission to adapt with attribution, non-commercially, and releases its own adaptation under CC BY-NC-SA 4.0, which keeps both conditions. If the author states different terms, those terms win.
- The original images are not redistributed here; only the adapted sprites are.

## What was changed

Each character was redrawn as a chibi game sprite (about 2.3 heads tall) with AI image generation (the codex CLI's built-in image tool), using the original image as the reference: one standing model, four 8-frame walking strips and four 3-frame seated strips. Hand-held props were left out. `tools/pack.mjs` then cut the figures apart, scaled them uniformly and aligned them to the PA Cafe sheet layouts; nothing was drawn or retouched by hand. Prompts are in `tools/gen.mjs` and `tools/roster.json`.

Which AI product each original image personifies was read from the emblems in the artwork, not from an author-supplied list; `raven` (page 9 of the work) could not be identified and has a descriptive name. Corrections are welcome.

## Suggested credit line

> 角色原設計：ZipZipPipe《AI娘化》（https://www.pixiv.net/artworks/148186519）；DeepSeek 鯨魚娘原始形象：上善无形。Q 版改編：ZipZipPipe-character-pack。授權：CC BY-NC-SA 4.0。
