import {writeFileSync} from 'node:fs'
import {Resvg} from '@resvg/resvg-js'
import {oldStreetFloors,oldStreetDoors} from '../src/old-street-space'
import type {OldStreetRoom} from '../src/old-street-cartridge'
const room=(process.argv[2]??'shop') as OldStreetRoom
if(!Object.hasOwn(oldStreetFloors,room))throw Error('UNKNOWN_ROOM')
const name=room==='shop'?'watch-shop':room
const floor=oldStreetFloors[room],doors=oldStreetDoors().filter(d=>d.room===room)
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 384 576"><rect width="384" height="576" fill="#303735"/><rect x="${floor.x-8}" y="${floor.y-8}" width="${floor.w+16}" height="${floor.h+16}" fill="#806142"/><rect x="${floor.x}" y="${floor.y}" width="${floor.w}" height="${floor.h}" fill="#c7b391"/>${doors.map(d=>`<rect x="${d.position.x-18}" y="${d.position.y-12}" width="36" height="24" fill="#8dbda5"/>`).join('')}</svg>`
writeFileSync(`public/assets/oldstreet/${name}-layout-guide.svg`,svg)
writeFileSync(`public/assets/oldstreet/${name}-layout-guide.png`,new Resvg(svg).render().asPng())
