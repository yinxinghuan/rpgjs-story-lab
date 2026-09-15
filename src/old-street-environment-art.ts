import wood from '../doc/oldstreet-pixel-study/floor-narrow/candidate-actual.png'
import laundry from '../doc/oldstreet-laundry-candidate/correction/candidate.png'
import shopWall from '../doc/oldstreet-pixel-study/workshop-wall/candidate.png'
import shedWall from '../doc/oldstreet-shed-wall/candidate.png'
export const oldStreetEnvironmentArt={wood,laundry,shopWall,shedWall}
export type OldStreetEnvironmentArt=typeof oldStreetEnvironmentArt
export function oldStreetEnvironmentDownloads(pixel:boolean){
 return Object.entries(oldStreetEnvironmentArt).filter(([id])=>pixel||id==='wood'||id==='laundry').map(([id,url])=>({id:'environment-'+id,url}))
}
