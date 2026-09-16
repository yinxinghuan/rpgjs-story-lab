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

for(const locale of ['zh','en'] as const)test(`people show only introduced identities and their own persisted encounters (${locale})`,async()=>{
 const {recordOldStreetInteraction}=await import('../src/old-street-characters')
 const c=oldStreetCartridge(locale),s=createInitialSave(c)
 s.facts['photos-returned']=true
 assert.deepEqual(oldStreetJournal(s).people,[])
 recordOldStreetInteraction(s,'photographer','oldstreet:greet-photographer','hello','intro')
 let people=oldStreetJournal(s).people
 assert.equal(people.length,1);assert.equal(people[0].id,'xu-photographer')
 assert.equal(people[0].text.includes(locale==='zh'?'交还':'returned'),false)
 recordOldStreetInteraction(s,'photographer','oldstreet:return-photos','thank you','return')
 const before=JSON.stringify(s)
 people=oldStreetJournal(JSON.parse(before)).people
 assert.equal(people.length,1)
 assert.match(people[0].text,locale==='zh'?/找回并交还/:/found and returned/)
 assert.equal(JSON.stringify(s),before)
 s.relationships.push({id:'wrong-owner',characterId:'xu-photographer',actor:'Xu',axis:'kept-promise',delta:1,source:'test'})
 assert.equal(oldStreetJournal(s).people[0].text.includes(locale==='zh'?'钥匙':'key'),false)
 assert.equal(oldStreetJournal(s).people.some(p=>p.id==='lan-laundry'),false)
})

for(const locale of ['zh','en'] as const)test(`current purpose follows learned progress and survives a returned key (${locale})`,async()=>{
 const {recordOldStreetInteraction}=await import('../src/old-street-characters')
 const s=createInitialSave(oldStreetCartridge(locale)),purpose=()=>oldStreetJournal(JSON.parse(JSON.stringify(s))).purpose
 assert.doesNotMatch(purpose(),/河边|riverside/)
 recordOldStreetInteraction(s,'watchmaker','oldstreet:greet-watchmaker','hello','purpose-intro')
 assert.match(purpose(),locale==='zh'?/借小格钥匙/:/Borrow the compartment key/)
 s.inventory.push({id:'letter-key',label:'key',count:1,rarity:'common'});s.facts['key-borrowed']=true
 assert.match(purpose(),locale==='zh'?/带钥匙回/:/Take the key/)
 s.inventory=[];s.facts['key-borrowed']=false
 assert.match(purpose(),locale==='zh'?/借小格钥匙/:/Borrow the compartment key/)
 s.facts['letter-unlocked']=true
 assert.match(purpose(),locale==='zh'?/已经打开/:/is open/)
 s.facts['letter-taken']=true
 assert.match(purpose(),locale==='zh'?/也可以继续/:/or keep exploring/)
 s.facts.departed=true
 assert.match(purpose(),locale==='zh'?/已经交给/:/has been delivered/)
})

for(const locale of ['zh','en'] as const)test(`observation notes track changed props without rewriting history (${locale})`,()=>{
 const save=createInitialSave(oldStreetCartridge(locale))
 const add=(id:string,key:string,text:string)=>save.blocks.push({id,kind:'narration',text:'attempt',data:{oldStreetDiscoveries:JSON.stringify([{id:key,text}])}})
 add('first','visible:letter-compartment','LOCKED_OLD_SNAPSHOT')
 add('repeat','visible:letter-compartment','LOCKED_NEWER_SNAPSHOT')
 add('unknown','some-knowledge','A previous remark.')
 add('duplicate','learned:clock-mark-known','Already recorded clue')
 let notes=oldStreetJournal(save).notes
 assert.equal(notes.length,2)
 assert.match(notes[0].text,locale==='zh'?/锁着/:/Locked/)
 save.facts['letter-unlocked']=true
 const before=JSON.stringify(save)
 notes=oldStreetJournal(save).notes
 assert.match(notes[0].text,locale==='zh'?/密封信/:/letter/)
 assert.equal(notes[1].title,locale==='zh'?'先前的观察':'Earlier observation')
 save.facts['letter-taken']=true
 assert.match(oldStreetJournal(save).notes[0].text,locale==='zh'?/空/:/empty/)
 assert.deepEqual(JSON.parse(before).blocks,save.blocks)
 assert.deepEqual(oldStreetJournal(JSON.parse(JSON.stringify(save))),oldStreetJournal(save))
 add('photo','visible:developing-bench','Still preparing')
 save.facts['darkroom-photo-matched']='a'.repeat(64)
 save.facts['darkroom-photo-choice']='keep'
 notes=oldStreetJournal(save).notes
 assert.ok(notes.some(n=>n.id==='darkroom-photo'))
 assert.ok(!notes.some(n=>n.text==='Still preparing'))
})
