import React from 'react'

/**
 * Decorative "pixel grid" background for the signed-out pages, drawn in RoomRelay AI's
 * navy and teal. It is plain inline SVG generated here: no external script, image or
 * request, and nothing animates. It is hidden from assistive technology.
 */

const CELL = 48
const COLS = 36
const ROWS = 22
const WIDTH = COLS * CELL
const HEIGHT = ROWS * CELL

// Small seeded generator so the pattern is the same on every load (no flicker between renders).
function mulberry32(seed: number): () => number {
    let a = seed
    return () => {
        a += 0x6d2b79f5
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

interface Block {
    x: number
    y: number
    fill: string
    opacity: number
}

function buildBlocks(): Block[] {
    const rand = mulberry32(2305075)
    const blocks: Block[] = []
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const r = rand()
            if (r > 0.17) continue
            // More blocks toward the edges and fewer toward the middle, so the form area stays calm.
            const dx = Math.abs(col - COLS / 2) / (COLS / 2)
            const dy = Math.abs(row - ROWS / 2) / (ROWS / 2)
            if (rand() > 0.25 + Math.max(dx, dy) * 0.9) continue
            const teal = rand() > 0.4
            blocks.push({
                x: col * CELL,
                y: row * CELL,
                fill: teal ? '#2fb3a5' : '#5d7fa8',
                opacity: Number((0.06 + rand() * 0.2).toFixed(2)),
            })
        }
    }
    return blocks
}

const BLOCKS = buildBlocks()

export function PixelBackground() {
    return (
        <div className="pixel-bg" aria-hidden="true">
            <svg
                className="pixel-bg__svg"
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="xMidYMid slice"
                focusable="false"
            >
                <defs>
                    <pattern id="pixel-grid-lines" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
                        <path d={`M${CELL} 0H0V${CELL}`} fill="none" stroke="#7fd3c9" strokeOpacity="0.08" strokeWidth="1" />
                    </pattern>
                </defs>
                <rect width={WIDTH} height={HEIGHT} fill="url(#pixel-grid-lines)" />
                {BLOCKS.map((b) => (
                    <rect
                        key={`${b.x}-${b.y}`}
                        x={b.x + 1}
                        y={b.y + 1}
                        width={CELL - 2}
                        height={CELL - 2}
                        fill={b.fill}
                        fillOpacity={b.opacity}
                    />
                ))}
            </svg>
        </div>
    )
}
