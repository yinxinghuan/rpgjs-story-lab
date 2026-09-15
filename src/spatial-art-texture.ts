import {Assets,type Texture} from 'pixi.js'
/** Configure the actual cached source before the engine creates cropped frames.
 * Never mutate Pixi global defaults: other games/UI can retain smooth filtering.
 */
export async function loadSpatialArtTexture(src:string,sampling:'nearest'|'linear'){
 const texture=await Assets.load<Texture>({src,parser:'loadTextures'})
 if(!texture?.source)throw Error('SPATIAL_TEXTURE_NOT_READY')
 texture.source.scaleMode=sampling
 return texture
}
