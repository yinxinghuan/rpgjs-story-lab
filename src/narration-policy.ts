export const NARRATION_POLICY={modeKey:'narration-mode-v2',maxHistory:4,windowMs:60000,turnsPerWindow:6} as const
export function narrationMode(value:unknown,browserEdition=false):'local'|'live'{return !browserEdition&&value==='live'?'live':'local'}
