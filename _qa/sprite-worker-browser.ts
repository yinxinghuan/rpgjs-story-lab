import {prepareSpritesOffThread} from '../src/sprite-preparation-client'
import {prepareSpritePixels, type PixelRaster, type SpritePreparationSpec} from '../src/sprite-preparation'
const status = document.querySelector<HTMLPreElement>('#result')!
const button = document.querySelector<HTMLButtonElement>('#run')!
button.onclick = async () => {
  button.disabled = true
  status.textContent = 'Running synthetic 960 × 1280, 12 frames…'
  let ticks = 0
  const heartbeat = setInterval(() => ticks++, 10)
  try {
    const width = 960, height = 1280, rgba = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const v = (Math.floor(x / 12) + Math.floor(y / 12)) % 2 ? 225 : 250
      const localX = x % 320, localY = y % 320
      rgba.set(localX >= 95 && localX < 225 && localY >= 65 && localY < 275 ? [25, 70, 90, 255] : [v, v, v, 255], (y * width + x) * 4)
    }
    const input: PixelRaster = {width, height, rgba}
    const spec: SpritePreparationSpec = {columns: 3, rows: 4, cellWidth: 320, cellHeight: 320, foot: {x: 160, y: 290}, kind: 'actor', backgroundMode: 'pale-neutral', neutralMin: 200, chromaMax: 20}
    const before = await crypto.subtle.digest('SHA-256', rgba)
    ticks = 0
    const start = performance.now(), result = await prepareSpritesOffThread(input, spec), elapsedMs = performance.now() - start, workerTicks = ticks
    const after = await crypto.subtle.digest('SHA-256', rgba)
    const originalUnchanged = new Uint8Array(before).every((v, i) => v === new Uint8Array(after)[i])
    const reference = prepareSpritePixels(input, spec)
    const matchesReference = result.raster.rgba.every((v, i) => v === reference.raster.rgba[i])
    const cancelled = new AbortController(); cancelled.abort()
    const preAbort = await prepareSpritesOffThread(input, spec, cancelled.signal).then(() => 'unexpected-success', e => e.message)
    const running = new AbortController(), pending = prepareSpritesOffThread(input, spec, running.signal)
    running.abort()
    const midAbort = await pending.then(() => 'unexpected-success', e => e.message)
    // Exercise actual structured-clone failure; no timer/worker should survive rejection.
    const badSpec = {...spec, nonCloneable: () => 1}
    const cloneFailure = await prepareSpritesOffThread(input, badSpec).then(() => 'unexpected-success', e => e.message)
    const recovery = await prepareSpritesOffThread(input, spec)
    const ok = originalUnchanged && matchesReference && workerTicks > 0 && preAbort === 'SPRITE_PREPARATION_ABORTED' && midAbort === preAbort && cloneFailure === 'SPRITE_PREPARATION_FAILED' && recovery.frames.length === 12
    status.textContent = JSON.stringify({ok, elapsedMs: Math.round(elapsedMs), workerTicks, originalUnchanged, matchesReference, preAbort, midAbort, cloneFailure, recoveredFrames: recovery.frames.length, metrics: result.metrics, width: innerWidth, height: innerHeight, actualImageProcessing: false}, null, 2)
  } catch (e) {status.textContent = `FAILED: ${e instanceof Error ? e.message : String(e)}`}
  finally {clearInterval(heartbeat); button.disabled = false}
}
