export const GAME_ID = 'cb90357b-fe01-48ab-b14b-0620eb0d556e'
export const getGameApiBase = () => '/' + GAME_ID

// Keep browser identity registration additive; server imports have no window.
if(typeof window!=='undefined') (window as any).__GAME_UUID__ = 'cb90357b-fe01-48ab-b14b-0620eb0d556e';
