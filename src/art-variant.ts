import {actorArt,propsArt,artDirection} from './art-catalog'
// Both art variants use one isolated demo journey; a normal URL keeps its own save.
const requested=new URLSearchParams(window.location.search).get('art')
export const isArtDemo=requested==='balanced'||requested==='baseline'
// Current B is the user-approved default. A remains available for comparison.
export const isBalancedArt=requested!=='baseline'
export const overheadAsset=(name:'hero'|'mechanic'|'attendant'|'props')=>`${name==='props'?propsArt.balanced.path:actorArt.balanced[name].path}?v=${artDirection.referenceVersion}`
