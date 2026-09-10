import { prepareSpritePixels, type PixelRaster, type SpritePreparationSpec } from './sprite-preparation';
// Heavy pixel work stays off the game/UI thread. No source file is overwritten.
const scope = globalThis as unknown as {
    onmessage: ((event: MessageEvent<{
        id: string;
        input: PixelRaster;
        spec: SpritePreparationSpec;
    }>) => void) | null;
    postMessage: (value: unknown, transfer?: Transferable[]) => void;
};
scope.onmessage = event => { const { id, input, spec } = event.data; try {
    const result = prepareSpritePixels(input, spec);
    scope.postMessage({ id, result }, [result.raster.rgba.buffer]);
}
catch (e) {
    scope.postMessage({ id, error: e instanceof Error && e.message.startsWith('SPRITE_PREPARATION_') ? e.message : 'SPRITE_PREPARATION_FAILED' });
} };
