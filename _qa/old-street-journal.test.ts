import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetJournal} from '../src/old-street-journal'
import {oldStreetCartridge,oldStreetConnections,oldStreetTravelId,type OldStreetRoom} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {resolveDomainAction,applyDomainResolution} from '../src/vendor/original-train/engine/domainRules'
for(const locale of ['zh','en'] as const)test(`discoveries survive returning items; withdrawal updates the record (${locale})`,()=>{
 const c=oldStreetCartridge(locale);let s=createInitialSave(c)
 const run=(id:string)=>{const r=resolveDomainAction(s,c,id)!;assert.equal(r.status,'accepted',id);applyDomainResolution(s,c,r)}
 const go=(to:OldStreetRoom)=>{const from=s.map.find(n=>n.current)!.id as OldStreetRoom,e=oldStreetConnections.find(e=>e.a===from&&e.b===to||e.b===from&&e.a===to)!;run(oldStreetTravelId(e.id,from))}
 assert.deepEqual(oldStreetJournal(s).notes,[]);assert.deepEqual(oldStreetJournal(s).items,[])
 go('shop');run('oldstreet:move-box');run('oldstreet:take-lens')
 go('street');go('photo');go('roof');go('shed');run('oldstreet:take-clock')
 assert.equal(oldStreetJournal(s).notes.some(n=>n.id==='clock-mark-known'),false)
 go('roof');go('photo');go('street');go('shop');run('oldstreet:inspect-clock')
 assert.equal(oldStreetJournal(s).notes.some(n=>n.id==='clock-mark-known'),true)
 go('yard');go('laundry');run('oldstreet:return-clock');run('oldstreet:consent-clock')
 s=JSON.parse(JSON.stringify(s))
 assert.equal(oldStreetJournal(s).items.some(i=>i.id==='clock'),false)
 assert.equal(oldStreetJournal(s).notes.some(n=>n.id==='clock-mark-known'),true)
 go('yard');go('shop');run('oldstreet:record-clock')
 const recorded=oldStreetJournal(s).notes.find(n=>n.id==='clock-record')!.text
 run('oldstreet:withdraw-clock')
 const before=JSON.stringify(s),journal=oldStreetJournal(s)
 assert.notEqual(journal.notes.find(n=>n.id==='clock-record')!.text,recorded)
 assert.equal(journal.notes.some(n=>n.id==='photos-matched'),false)
 assert.equal(JSON.stringify(s),before)
})
