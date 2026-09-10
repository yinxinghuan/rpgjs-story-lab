import type { PixelRaster, PreparedSprite, SpritePreparationSpec } from './sprite-preparation';
/** Keeps original pixels available for comparison and returns a separate candidate. */
export function prepareSpritesOffThread(input: PixelRaster, spec: SpritePreparationSpec, signal?: AbortSignal): Promise<PreparedSprite> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(Error('SPRITE_PREPARATION_ABORTED'));
            return;
        }
        const worker = new Worker(new URL('./sprite-preparation.worker.ts', import.meta.url), { type: 'module' }), id = crypto.randomUUID();
        const stop = () => { clearTimeout(timer); worker.terminate(); signal?.removeEventListener('abort', abort); };
        const abort = () => { stop(); reject(Error('SPRITE_PREPARATION_ABORTED')); }, timer = setTimeout(() => { stop(); reject(Error('SPRITE_PREPARATION_TIMEOUT')); }, 15000);
        signal?.addEventListener('abort', abort, { once: true });
        worker.onmessage = event => { if (event.data?.id !== id)
            return; stop(); event.data.error ? reject(Error(event.data.error)) : resolve(event.data.result); };
        worker.onerror = () => { stop(); reject(Error('SPRITE_PREPARATION_FAILED')); };
        try {
            const copy = new Uint8ClampedArray(input.rgba);
            worker.postMessage({ id, input: { ...input, rgba: copy }, spec }, [copy.buffer]);
        }
        catch {
            stop();
            reject(Error('SPRITE_PREPARATION_FAILED'));
        }
    });
}
