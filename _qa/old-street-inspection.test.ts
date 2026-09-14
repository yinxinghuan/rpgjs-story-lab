import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetRequiredInspection} from '../src/old-street-inspection'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
test('opening a required inspection rechecks recovered inventory, completion and scene',()=>{
 const s=createInitialSave(oldStreetCartridge('zh'))
 for(const n of s.map)n.current=n.id==='shop'
 const code='OLD_STREET_CLOCK_INSPECTION_REQUIRED'
 assert.equal(oldStreetRequiredInspection(s,'shop','drawer',code),null)
 s.inventory=[{id:'clock',label:'旧钟',count:1},{id:'lens',label:'放大镜',count:1}]
 assert.equal(oldStreetRequiredInspection(s,'shop','drawer',code),'clock')
 assert.equal(oldStreetRequiredInspection(s,'laundry','drawer',code),null)
 assert.equal(oldStreetRequiredInspection(s,'shop','record-book',code),null)
 s.facts['clock-mark-known']=true
 assert.equal(oldStreetRequiredInspection(s,'shop','drawer',code),null)
 for(const n of s.map)n.current=n.id==='photo'
 s.inventory=[{id:'photos',label:'照片',count:1}]
 assert.equal(oldStreetRequiredInspection(s,'photo','viewing-table','OLD_STREET_PHOTO_ALIGNMENT_REQUIRED'),'photo')
 s.inventory=[]
 assert.equal(oldStreetRequiredInspection(s,'photo','viewing-table','OLD_STREET_PHOTO_ALIGNMENT_REQUIRED'),null)
})
