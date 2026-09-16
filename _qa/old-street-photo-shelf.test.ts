import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetPhotoShelfPose,oldStreetPhotoShelfSheets} from '../src/old-street-photo-shelf'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {resolveDomainAction,applyDomainResolution} from '../src/vendor/original-train/engine/domainRules'
test('taking and returning photos never restores the folder on its original shelf',()=>{
 const c=oldStreetCartridge('zh'),s=createInitialSave(c)
 // Scene fixture selects a reachable cellar; the real domain action owns the fact and inventory.
 s.map.forEach(n=>{n.current=n.id==='cellar'})
 assert.equal(oldStreetPhotoShelfPose(s),'stand')
 const take=resolveDomainAction(s,c,'oldstreet:take-photos')!
 assert.equal(take.status,'accepted');applyDomainResolution(s,c,take)
 assert.equal(s.inventory.find(i=>i.id==='photos')?.count,1)
 assert.equal(oldStreetPhotoShelfPose(s),'empty')
 s.map.forEach(n=>{n.current=n.id==='photo'})
 const match=resolveDomainAction(s,c,'oldstreet:match-photos')!
 assert.equal(match.status,'accepted');applyDomainResolution(s,c,match)
 const ret=resolveDomainAction(s,c,'oldstreet:return-photos')!
 assert.equal(ret.status,'accepted');applyDomainResolution(s,c,ret)
 assert.equal(oldStreetPhotoShelfPose(JSON.parse(JSON.stringify(s))),'empty')
 const [shelf,folder,papers]=oldStreetPhotoShelfSheets('prepared')
 for(const pose of ['stand','empty','papers','both'] as const){
  assert.equal(shelf.textures[pose].animations()[0][0].opacity,1)
  assert.equal(folder.textures[pose].animations()[0][0].opacity,['stand','both'].includes(pose)?1:0)
  assert.equal(papers.textures[pose].animations()[0][0].opacity,['papers','both'].includes(pose)?1:0)
 }
 assert.equal(folder.textures.stand.animations()[0][0].opacity,1)
 assert.equal(folder.textures.empty.animations()[0][0].opacity,0)
})
