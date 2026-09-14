import {writeFileSync} from 'node:fs'
import {oldStreetFloors, oldStreetTmx} from '../src/old-street-space'
import type {OldStreetRoom} from '../src/old-street-cartridge'
for (const room of Object.keys(oldStreetFloors) as OldStreetRoom[]) {
  writeFileSync(new URL(`../public/map/oldstreet-${room}.tmx`, import.meta.url), oldStreetTmx(room))
}
