import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareSpritePixels, type PixelRaster, type SpritePreparationSpec} from '../src/sprite-preparation'

// All inputs are invented RGBA arrays. No generated/player image is read or edited.
const DARK = [30, 50, 70, 255]
function raster(width = 24, height = 24): PixelRaster {
  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const v = (Math.floor(x / 3) + Math.floor(y / 3)) % 2 ? 220 : 255
    rgba.set([v, v, v, 255], (y * width + x) * 4)
  }
  return {width, height, rgba}
}
function rect(image: PixelRaster, x: number, y: number, w: number, h: number, color = DARK) {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) image.rgba.set(color, ((y + dy) * image.width + x + dx) * 4)
}
function pixel(image: PixelRaster, x: number, y: number) {
  return Array.from(image.rgba.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4))
}
const spec: SpritePreparationSpec = {columns: 1, rows: 1, cellWidth: 24, cellHeight: 24, foot: {x: 12, y: 20}, kind: 'actor', backgroundMode: 'pale-neutral', neutralMin: 200, chromaMax: 20}
function sourcePixel(output: ReturnType<typeof prepareSpritePixels>, x: number, y: number, frame = 0) {
  const f = output.frames[frame]
  return pixel(output.raster, x + f.offset.x + f.column * spec.cellWidth, y + f.offset.y + f.row * spec.cellHeight)
}

test('connected neutral matte is removed; enclosed light fabric and original bytes survive', () => {
  const input = raster(); rect(input, 6, 5, 12, 13); rect(input, 10, 9, 3, 3, [255, 255, 255, 255])
  const before = new Uint8ClampedArray(input.rgba), out = prepareSpritePixels(input, spec)
  assert.deepEqual(input.rgba, before)
  assert.deepEqual(pixel(out.raster, 0, 0), [0, 0, 0, 0])
  assert.deepEqual(sourcePixel(out, 11, 10), [255, 255, 255, 255])
  assert.deepEqual(sourcePixel(out, 8, 8), DARK)
  assert.ok(out.metrics.removed > 300)
  assert.equal(out.frames[0].sourceAnchor.y + out.frames[0].offset.y, 20)
})

test('opaque neutral fringe is unmixed while native partial alpha is not processed twice', () => {
  const input = raster(); rect(input, 0, 0, 24, 24, [250, 250, 250, 255]); rect(input, 6, 5, 12, 13, [50, 50, 50, 255])
  rect(input, 5, 7, 1, 9, [150, 150, 150, 255])
  rect(input, 18, 8, 1, 1, [245, 245, 245, 100])
  const out = prepareSpritePixels(input, spec), fringe = sourcePixel(out, 5, 10)
  assert.ok(Math.abs(fringe[3] - 128) <= 1)
  assert.ok(Math.abs(fringe[0] - 50) <= 1)
  assert.deepEqual(sourcePixel(out, 18, 8), [245, 245, 245, 100])
  assert.deepEqual(sourcePixel(out, 10, 10), [50, 50, 50, 255])
})

test('actors retain frame scale and align feet despite different source heights and shifts', () => {
  const input = raster(48, 24); rect(input, 3, 4, 10, 14); rect(input, 34, 8, 8, 12, [20, 80, 40, 255])
  const out = prepareSpritePixels(input, {...spec, columns: 2})
  assert.deepEqual(out.frames.map(f => f.sourceAnchor.y + f.offset.y), [20, 20])
  assert.deepEqual(pixel(out.raster, 12, 19), DARK)
  assert.deepEqual(pixel(out.raster, 36, 19), [20, 80, 40, 255])
  const widths = out.frames.map(f => f.sourceBox[2] - f.sourceBox[0])
  assert.deepEqual(widths, [10, 8])
})

test('equipment uses the cabinet contact anchor, not the lower open-door corner', () => {
  const input = raster(48, 24); rect(input, 7, 4, 10, 13); rect(input, 31, 4, 10, 13)
  rect(input, 29, 10, 3, 11, [110, 70, 20, 255])
  const settings = {...spec, columns: 2, kind: 'states' as const, foot: {x: 12, y: 18}}
  assert.throws(() => prepareSpritePixels(input, settings), /STATE_ANCHORS_REQUIRED/)
  const out = prepareSpritePixels(input, {...settings, sourceAnchors: [{x: 12, y: 17}, {x: 12, y: 17}]})
  assert.deepEqual(out.frames.map(f => f.offset.y), [1, 1])
  assert.deepEqual(pixel(out.raster, 12, 17), DARK)
  assert.deepEqual(pixel(out.raster, 36, 17), DARK)
  assert.deepEqual(pixel(out.raster, 29, 21), [110, 70, 20, 255])
})

test('small light details are retained when no reliable interior reference exists', () => {
  const input = raster(); rect(input, 10, 8, 2, 5, [170, 170, 170, 255])
  const out = prepareSpritePixels(input, spec)
  assert.equal(out.metrics.edgeCorrected, 0)
  assert.deepEqual(sourcePixel(out, 10, 10), [170, 170, 170, 255])
})

test('fringe sampling cannot borrow a dark core from an adjacent animation cell', () => {
  const input = raster(24, 16)
  rect(input, 9, 6, 2, 5, [170, 170, 170, 255]); rect(input, 13, 3, 9, 10)
  const out = prepareSpritePixels(input, {...spec, columns: 2, cellWidth: 12, cellHeight: 16, foot: {x: 6, y: 14}})
  const f = out.frames[0]
  assert.deepEqual(pixel(out.raster, 9 + f.offset.x, 8 + f.offset.y), [170, 170, 170, 255])
})

test('invalid preparation fails without modifying the candidate or silently clipping it', () => {
  const input = raster(); rect(input, 6, 5, 12, 13)
  const before = new Uint8ClampedArray(input.rgba)
  const invalid: Array<[Partial<SpritePreparationSpec>, RegExp]> = [
    [{columns: 5}, /GRID/], [{neutralMin: 120}, /MATTE/], [{foot: {x: 24, y: 20}}, /FOOT/],
    [{cellHeight: 8, foot: {x: 12, y: 8}}, /FRAME_DOES_NOT_FIT/],
    [{sourceAnchors: [{x: NaN, y: 20}]}, /ANCHORS/],
    [{columns: 2, cellWidth: 1000}, /GRID/],
  ]
  for (const [change, reason] of invalid) assert.throws(() => prepareSpritePixels(input, {...spec, ...change}), reason)
  assert.deepEqual(input.rgba, before)
  assert.throws(() => prepareSpritePixels(raster(), spec), /EMPTY_FRAME/)
  const clipped = raster(); rect(clipped, 0, 5, 12, 13)
  assert.throws(() => prepareSpritePixels(clipped, spec), /CLIPPED_FRAME/)
  const noMatte = raster(); rect(noMatte, 0, 0, 24, 24)
  assert.throws(() => prepareSpritePixels(noMatte, spec), /NO_CONNECTED_MATTE/)
})

test('native alpha mode preserves white edge pixels and arbitrary transparent RGB cannot tint them', () => {
  const input = raster(); rect(input, 0, 0, 24, 24, [180, 20, 160, 0])
  rect(input, 7, 5, 9, 13, [255, 255, 255, 255]); rect(input, 6, 7, 1, 8, [240, 240, 240, 100])
  const out = prepareSpritePixels(input, {...spec, backgroundMode: 'alpha'})
  assert.deepEqual(sourcePixel(out, 7, 5), [255, 255, 255, 255])
  assert.deepEqual(sourcePixel(out, 6, 10), [240, 240, 240, 100])
  assert.equal(out.metrics.edgeCorrected, 0)
  assert.deepEqual(pixel(out.raster, 0, 0), [0, 0, 0, 0])
})
