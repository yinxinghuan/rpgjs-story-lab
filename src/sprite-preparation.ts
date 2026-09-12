/** Deterministic, provider-independent sprite preparation. No I/O or image APIs.
 * Accepts only a declared pale neutral matte. This is not semantic segmentation.
 * Callers must retain the original and review the result before admission.
 */
export type PixelRaster = {
    width: number;
    height: number;
    rgba: Uint8ClampedArray;
};
export type SpritePreparationSpec = {
    columns: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    foot: {
        x: number;
        y: number;
    };
    kind: 'actor' | 'states';
    backgroundMode: 'pale-neutral' | 'alpha';
    /** Explicitly reviewed background points, in source-image coordinates.
     * Never infer these from pale clothing or apply them to another source. */
    matteSeeds?: Array<{x: number; y: number}>;
    sourceAnchors?: Array<{
        x: number;
        y: number;
    }>;
    neutralMin: number;
    chromaMax: number;
};
export type PreparedSprite = {
    raster: PixelRaster;
    frames: Array<{
        column: number;
        row: number;
        sourceBox: [
            number,
            number,
            number,
            number
        ];
        sourceAnchor: {
            x: number;
            y: number;
        };
        offset: {
            x: number;
            y: number;
        };
    }>;
    metrics: {
        removed: number;
        edgeCorrected: number;
        corePreserved: number;
    };
    algorithm: 'neutral-matte-unmix-1';
};
const LIMIT = 1572864;
function reject(message: string): never { throw Error('SPRITE_PREPARATION_' + message); }
function integer(n: number, min: number, max: number) { return Number.isInteger(n) && n >= min && n <= max; }
export function prepareSpritePixels(input: PixelRaster, spec: SpritePreparationSpec): PreparedSprite {
    const { width: w, height: h, rgba: src } = input, n = w * h;
    if (!integer(w, 1, 1536) || !integer(h, 1, 1536) || n > LIMIT || !(src instanceof Uint8ClampedArray) || src.length !== n * 4)
        reject('SIZE');
    if (!integer(spec.columns, 1, 12) || !integer(spec.rows, 1, 12) || w % spec.columns || h % spec.rows || !integer(spec.cellWidth, 1, 1536) || !integer(spec.cellHeight, 1, 1536) || spec.columns * spec.cellWidth > 1536 || spec.rows * spec.cellHeight > 1536 || spec.columns * spec.cellWidth * spec.rows * spec.cellHeight > LIMIT)
        reject('GRID');
    if (spec.backgroundMode !== 'pale-neutral' && spec.backgroundMode !== 'alpha') reject('BACKGROUND_MODE');
    if (!integer(spec.neutralMin, 180, 255) || !integer(spec.chromaMax, 0, 35))
        reject('MATTE');
    if (!integer(spec.foot.x, 0, spec.cellWidth - 1) || !integer(spec.foot.y, 1, spec.cellHeight))
        reject('FOOT');
    const count = spec.columns * spec.rows, sw = w / spec.columns, sh = h / spec.rows;
    if (spec.kind !== 'actor' && spec.kind !== 'states')
        reject('KIND');
    if (spec.kind === 'states' && !spec.sourceAnchors)
        reject('STATE_ANCHORS_REQUIRED');
    if (spec.sourceAnchors && (spec.sourceAnchors.length !== count || spec.sourceAnchors.some(a => !integer(a.x, 0, sw) || !integer(a.y, 0, sh))))
        reject('ANCHORS');
    const background = new Uint8Array(n), queue = new Int32Array(n);
    let head = 0, tail = 0;
    function eligible(p: number) { const i = p * 4, min = Math.min(src[i], src[i + 1], src[i + 2]), max = Math.max(src[i], src[i + 1], src[i + 2]); return src[i + 3] === 0 || (spec.backgroundMode === 'pale-neutral' && src[i + 3] === 255 && min >= spec.neutralMin && max - min <= spec.chromaMax); }
    function visit(p: number) { if (!background[p] && eligible(p)) {
        background[p] = 1;
        queue[tail++] = p;
    } }
    if (spec.matteSeeds !== undefined) {
        if (!Array.isArray(spec.matteSeeds) || spec.matteSeeds.length > 64 || spec.backgroundMode !== 'pale-neutral' || spec.matteSeeds.some(p => !p || !integer(p.x, 0, w - 1) || !integer(p.y, 0, h - 1) || !eligible(p.y * w + p.x)))
            reject('MATTE_SEEDS');
        for (const p of spec.matteSeeds) visit(p.y * w + p.x);
    }
    for (let x = 0; x < w; x++) {
        visit(x);
        visit((h - 1) * w + x);
    }
    for (let y = 1; y < h - 1; y++) {
        visit(y * w);
        visit(y * w + w - 1);
    }
    while (head < tail) {
        const p = queue[head++], x = p % w;
        if (x)
            visit(p - 1);
        if (x < w - 1)
            visit(p + 1);
        if (p >= w)
            visit(p - w);
        if (p + w < n)
            visit(p + w);
    }
    if (!tail)
        reject('NO_CONNECTED_MATTE');
    const core = new Uint8Array(n);
    let corePreserved = 0;
    for (let y = 2; y < h - 2; y++)
        for (let x = 2; x < w - 2; x++) {
            const p = y * w + x;
            if (background[p] || src[p * 4 + 3] === 0)
                continue;
            let interior = true;
            for (let dy = -2; dy <= 2 && interior; dy++)
                for (let dx = -2; dx <= 2; dx++) {
                    const q = p + dy * w + dx;
                    if (Math.floor((x + dx) / sw) !== Math.floor(x / sw) || Math.floor((y + dy) / sh) !== Math.floor(y / sh) || background[q] || src[q * 4 + 3] === 0) {
                        interior = false;
                        break;
                    }
                }
            if (interior) {
                core[p] = 1;
                corePreserved++;
            }
        }
    const clean = new Uint8ClampedArray(src), offsets: Array<{
        x: number;
        y: number;
        d: number;
    }> = [];
    for (let y = -5; y <= 5; y++)
        for (let x = -5; x <= 5; x++)
            if (x || y)
                offsets.push({ x, y, d: x * x + y * y });
    offsets.sort((a, b) => a.d - b.d);
    let edgeCorrected = 0;
    for (let p = 0; p < n; p++) {
        const i = p * 4;
        if (background[p]) {
            clean.fill(0, i, i + 4);
            continue;
        }
        if (spec.backgroundMode === 'alpha' || core[p] || src[i + 3] < 255)
            continue;
        const x = p % w, y = Math.floor(p / w), cellX = Math.floor(x / sw) * sw, cellY = Math.floor(y / sh) * sh;
        let fg = -1, bg = -1;
        for (const o of offsets) {
            const nx = x + o.x, ny = y + o.y;
            if (nx < cellX || ny < cellY || nx >= cellX + sw || ny >= cellY + sh)
                continue;
            const q = ny * w + nx;
            if (fg < 0 && core[q])
                fg = q * 4;
            if (bg < 0 && background[q] && src[q * 4 + 3] === 255)
                bg = q * 4;
            if (fg >= 0 && bg >= 0)
                break;
        }
        const min = Math.min(src[i], src[i + 1], src[i + 2]), max = Math.max(src[i], src[i + 1], src[i + 2]), mean = (src[i] + src[i + 1] + src[i + 2]) / 3;
        // Small pale details without an interior reference remain unchanged for review.
        if (fg < 0)
            continue;
        if (bg < 0 || max - min >= 65 || mean - (src[fg] + src[fg + 1] + src[fg + 2]) / 3 <= 18)
            continue;
        let numerator = 0, denominator = 0;
        for (let c = 0; c < 3; c++) {
            const delta = src[fg + c] - src[bg + c];
            numerator += (src[i + c] - src[bg + c]) * delta;
            denominator += delta * delta;
        }
        const coverage = Math.max(.04, Math.min(1, numerator / (denominator + 1e-6)));
        if (coverage >= .97)
            continue;
        for (let c = 0; c < 3; c++)
            clean[i + c] = Math.max(0, Math.min(255, (src[i + c] - src[bg + c] * (1 - coverage)) / coverage));
        clean[i + 3] = Math.round(src[i + 3] * coverage);
        edgeCorrected++;
    }
    const ow = spec.columns * spec.cellWidth, oh = spec.rows * spec.cellHeight, output = new Uint8ClampedArray(ow * oh * 4), frames: PreparedSprite['frames'] = [];
    for (let row = 0; row < spec.rows; row++)
        for (let column = 0; column < spec.columns; column++) {
            const originX = column * sw, originY = row * sh;
            let left = sw, top = sh, right = 0, bottom = 0, solid = 0;
            for (let y = 0; y < sh; y++)
                for (let x = 0; x < sw; x++) {
                    const p = (originY + y) * w + originX + x;
                    if (!background[p] && clean[p * 4 + 3] > 0) {
                        left = Math.min(left, x);
                        top = Math.min(top, y);
                        right = Math.max(right, x + 1);
                        bottom = Math.max(bottom, y + 1);
                        solid++;
                    }
                }
            if (!solid)
                reject('EMPTY_FRAME');
            if (left === 0 || top === 0 || right === sw || bottom === sh)
                reject('CLIPPED_FRAME');
            const anchor = spec.sourceAnchors?.[row * spec.columns + column] ?? { x: Math.floor((left + right) / 2), y: bottom };
            const dx = spec.foot.x - anchor.x, dy = spec.foot.y - anchor.y;
            if (left + dx < 0 || top + dy < 0 || right + dx > spec.cellWidth || bottom + dy > spec.cellHeight)
                reject('FRAME_DOES_NOT_FIT');
            for (let y = top; y < bottom; y++)
                for (let x = left; x < right; x++) {
                    const source = ((originY + y) * w + originX + x) * 4, target = ((row * spec.cellHeight + y + dy) * ow + column * spec.cellWidth + x + dx) * 4;
                    output.set(clean.subarray(source, source + 4), target);
                }
            frames.push({ row, column, sourceBox: [originX + left, originY + top, originX + right, originY + bottom], sourceAnchor: anchor, offset: { x: dx, y: dy } });
        }
    return { raster: { width: ow, height: oh, rgba: output }, frames, metrics: { removed: tail, edgeCorrected, corePreserved }, algorithm: 'neutral-matte-unmix-1' };
}
