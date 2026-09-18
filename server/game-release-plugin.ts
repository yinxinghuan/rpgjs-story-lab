import {createHash} from 'node:crypto'
import {readFileSync,readdirSync,existsSync} from 'node:fs'
import {join} from 'node:path'
import type {Plugin} from 'vite'
/** Deterministic across cloud/Pages builds, including public artwork-only changes.
 * Works in a remixed source ZIP without .git. No private files enter the manifest. */
export function gameReleasePlugin():Plugin {
 let version='development'
 return {name:'game-release',apply:'build',config(){
  const hash=createHash('sha256')
  const visit=(path:string)=>{if(!existsSync(path))return;for(const entry of readdirSync(path,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=join(path,entry.name);if(entry.isDirectory())visit(file);else if(entry.isFile())hash.update(file).update('\0').update(readFileSync(file)).update('\0')}}
  for(const dir of ['src','public','server'])visit(dir)
  for(const file of ['index.html','creator.html','vite.config.ts','package.json','package-lock.json','worker/source.ts'])if(existsSync(file))hash.update(file).update('\0').update(readFileSync(file))
  version=hash.digest('hex').slice(0,24)
  return {define:{__GAME_RELEASE__:JSON.stringify(version)}}
 },generateBundle(){this.emitFile({type:'asset',fileName:'release.json',source:JSON.stringify({schema:1,version})+'\n'})}}
}
