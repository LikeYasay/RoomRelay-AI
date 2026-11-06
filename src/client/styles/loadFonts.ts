import { SOURCE_SANS_3_WOFF2_BASE64 } from './fontData'

/**
 * Registers the embedded Source Sans 3 font. It is bundled with the app, so there are no
 * external font requests. If the browser cannot load it (for example a strict content
 * security policy), the CSS font stack falls back to Segoe UI or the system font.
 */
export function loadBrandFont(): void {
    if (typeof FontFace === 'undefined' || !document.fonts) return
    const face = new FontFace('Source Sans 3', `url(data:font/woff2;base64,${SOURCE_SANS_3_WOFF2_BASE64})`, {
        style: 'normal',
        weight: '200 900',
        display: 'swap',
    })
    // TypeScript 5.5's DOM typings omit FontFaceSet.add, although every modern browser supports it.
    ;(document.fonts as unknown as { add(face: FontFace): void }).add(face)
    face.load().catch(() => {
        // Keep the fallback fonts; nothing else to do.
    })
}
