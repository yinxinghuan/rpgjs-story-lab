import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs'
import {join} from 'node:path'
const lock=JSON.parse(readFileSync('package-lock.json','utf8'))
let out=`Carriage 07 — RPG-JS narrative experiment\n\nFramework: RPG-JS by Samuel Ronce, https://github.com/RSamaium/RPG-JS\nVersions fixed by package-lock.json. RPG-JS source is MIT licensed.\nStarter inspected at https://github.com/RSamaium/RPG-JS-Starter commit 9156f8af780cf9cfcf00c04d49561c81462d650a; no starter art redistributed.\nOriginal lab map and test sprites: scripts/assets.ts. Generated art studies: OpenAI image generation, 2026-09-07, see doc/visual.md.\nInternal story engine provenance: src/vendor/story/ENGINE_SOURCE.json; copied from the workspace frozen template without modifications.\n\n`
const missing=[]
for(const [dir,meta] of Object.entries(lock.packages)){
 if(!dir||meta.dev||!existsSync(join(dir,'package.json')))continue
 const p=JSON.parse(readFileSync(join(dir,'package.json'),'utf8'))
 const licenses=readdirSync(dir).filter(f=>/^(LICEN[SC]E|COPYING|NOTICE)([.-]|$)/i.test(f))
 out+=`\n====================\n${p.name}@${p.version}\nSource: ${typeof p.repository==='string'?p.repository:p.repository?.url??p.homepage??meta.resolved}\nLicense: ${p.license??meta.license??'See upstream'}\n`
 if(licenses.length){for(const f of licenses){try{out+=readFileSync(join(dir,f),'utf8')+'\n'}catch{}}}
 else if(p.name.startsWith('@rpgjs/')||p.name==='canvasengine'||p.name.startsWith('@canvasengine/')){out+='RPG-JS/CanvasEngine project notice (same upstream author):\n'+readFileSync('node_modules/@rpgjs/client/LICENSE','utf8')+'\n'}
 else if(existsSync(join('public/licenses',p.name.replaceAll('/','__')+'.txt')))out+=readFileSync(join('public/licenses',p.name.replaceAll('/','__')+'.txt'),'utf8')+'\n'
 else missing.push(p.name)
}
writeFileSync('public/THIRD_PARTY_NOTICES.txt',out)
console.log(JSON.stringify({missing,bytes:out.length}))
