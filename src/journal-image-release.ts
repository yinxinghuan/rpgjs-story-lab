// Two live media attempts were rejected. Keep the feature out of production
// until a real successful image has passed decode and visual acceptance.
export const JOURNAL_IMAGE_RELEASED=false
export const journalImageAvailable=(mode:string)=>JOURNAL_IMAGE_RELEASED||mode==='cloud-preflight'
