import { isBalancedArt,overheadAsset } from './art-variant'
import {actorArt} from './art-catalog'
export {actorSheet} from './actor-sheet'
import {actorSheet} from './actor-sheet'
const actor=(id:'hero'|'mechanic'|'attendant')=>{const a=actorArt[isBalancedArt?'balanced':'baseline'][id];return actorSheet(id,isBalancedArt?overheadAsset(id):a.path,a.width,a.height,a.baselines,a.scale,a.centers)}
export const heroSheet=actor('hero')
export const mechanicSheet=actor('mechanic')
export const attendantSheet=actor('attendant')
