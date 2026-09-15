import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetPhotoTablePose,oldStreetPhotoTableSheets} from '../src/old-street-photo-table'
import {oldStreetPropState} from '../src/old-street-prop-state'
test('only actual return puts the closed folder on the table; matching alone does not',()=>{
 for(const facts of [{},{'photos-taken':true},{'photos-matched':true},{'photo-consent':true}] as Record<string,boolean>[])assert.equal(oldStreetPhotoTablePose({facts}),'stand')
 const save={facts:{'photos-returned':true,'photos-taken':true}}
 assert.equal(oldStreetPhotoTablePose(JSON.parse(JSON.stringify(save))),'returned')
 assert.deepEqual(oldStreetPropState('photo-folder',save),['空搁架','Empty shelf'])
 assert.match(oldStreetPropState('viewing-table',save)![0],/已归还/)
 const [table,folder]=oldStreetPhotoTableSheets('table','folder')
 assert.deepEqual(table.textures.stand.animations(),table.textures.returned.animations())
 assert.equal(folder.textures.stand.animations()[0][0].opacity,0)
 assert.equal(folder.textures.returned.animations()[0][0].opacity,1)
})
