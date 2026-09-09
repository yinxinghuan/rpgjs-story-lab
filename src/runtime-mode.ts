// Explicit build target. Missing servers never silently create a different save.
export const isBrowserEdition=import.meta.env.MODE==='pages'
