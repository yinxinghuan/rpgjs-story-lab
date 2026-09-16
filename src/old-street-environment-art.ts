import shedFloor from '../doc/oldstreet-shed-floor/correction/candidate.png'
import doorWood from '../doc/oldstreet-door-wood/candidate.png'
import roofFloor from '../doc/oldstreet-roof-floor/candidate.png'
import cellarFloor from '../doc/oldstreet-cellar-floor/candidate.png'
import stoneStair from '../doc/oldstreet-stone-stair/correction/candidate.png'
import photoFloor from '../doc/oldstreet-photo-floor/candidate.png'
import shopComposite from '../doc/oldstreet-shop-composite/correction/candidate.png'
import debris from '../doc/oldstreet-ground-debris/cutout.png'
import photoWall from '../doc/oldstreet-photo-wall/candidate.png'
import yard from '../doc/oldstreet-yard-floor/candidate.png'
import wood from '../doc/oldstreet-pixel-study/floor-narrow/candidate-actual.png'
import laundry from '../doc/oldstreet-laundry-candidate/correction/candidate.png'
import shopWall from '../doc/oldstreet-pixel-study/workshop-wall/candidate.png'
import shedWall from '../doc/oldstreet-shed-wall/candidate.png'
export const oldStreetEnvironmentArt={wood,laundry,shopWall,shedWall,shedFloor,yard,photoWall,debris,shopComposite,photoFloor,stoneStair,cellarFloor,roofFloor,doorWood}
export type OldStreetEnvironmentArt=typeof oldStreetEnvironmentArt
export function oldStreetEnvironmentDownloads(pixel:boolean,composite=false){
 return Object.entries(oldStreetEnvironmentArt).filter(([id])=>id==='shopComposite'?composite:(pixel||id==='wood'||id==='laundry')).map(([id,url])=>({id:'environment-'+id,url}))
}
