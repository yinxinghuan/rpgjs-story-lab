import {getMaterial} from './material-library'
// This game explicitly previews a candidate; the reusable library does not admit it yet.
const wood=getMaterial('wood-narrow-01',{allowCandidate:true})
if(!wood.render)throw Error('WOOD_RENDER_METADATA_MISSING')
export const oldStreetWoodSource={...wood.image,observedColumns:wood.render.observedColumnsApprox}
export const oldStreetWoodTile={
 width:wood.render.tileWidth,
 height:wood.render.tileWidth*wood.image.height/wood.image.width,
 opacity:wood.render.opacity,
}
