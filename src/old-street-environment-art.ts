import roofVariants from '../doc/roof-materials-20260917/candidate.png'
import {oldStreetEnvironmentKeys} from './old-street-environment-dependencies'
import shedFloor from '../doc/oldstreet-shed-floor/correction/candidate.png'
import doorWood from '../doc/oldstreet-door-wood/candidate.png'
import roofFloor from '../doc/oldstreet-roof-floor/candidate.png'
import cellarFloor from '../doc/oldstreet-cellar-floor/candidate.png'
import stoneStair from '../doc/oldstreet-stone-stair/correction/candidate.png'
import photoFloor from '../doc/oldstreet-photo-floor/candidate.png'
import shopComposite from '../doc/oldstreet-shop-composite/correction/candidate.png'
import debris from '../doc/oldstreet-ground-debris/cutout.png'
import photoWall from '../doc/oldstreet-photo-wall/candidate.png'
import yard from '../doc/oldstreet-yard-atmosphere/reference-edit/candidate.png'
import streetGround from '../doc/oldstreet-street-atmosphere/ground/candidate.png'
import streetEdges from '../doc/oldstreet-street-atmosphere/roof-edges/candidate.png'
import wood from '../doc/oldstreet-pixel-study/floor-narrow/candidate-actual.png'
import laundry from '../doc/oldstreet-laundry-candidate/correction/candidate.png'
import shopWall from '../doc/oldstreet-pixel-study/workshop-wall/candidate.png'
import shedWall from '../doc/oldstreet-shed-wall/candidate.png'
export const oldStreetEnvironmentArt={roofVariants,wood,laundry,shopWall,shedWall,shedFloor,yard,streetGround,streetEdges,photoWall,debris,shopComposite,photoFloor,stoneStair,cellarFloor,roofFloor,doorWood}
export type OldStreetEnvironmentArt=typeof oldStreetEnvironmentArt
export function oldStreetEnvironmentDownloads(pixel:boolean,composite=false,room?:string){
 const needed=room?new Set(oldStreetEnvironmentKeys(room,pixel,composite)):null
 return Object.entries(oldStreetEnvironmentArt).filter(([id])=>needed?needed.has(id):id==='shopComposite'?composite:(pixel||id==='wood'||id==='laundry')).map(([id,url])=>({id:'environment-'+id,url}))
}
