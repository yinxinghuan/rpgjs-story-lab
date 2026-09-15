import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetStride} from '../src/old-street-space'
import {WALK_SPEED} from '../src/walking-motion'
import {createDistancePoseSelector} from '../src/vendor/space-motion/distance-motion'
test('old street gait completes both feet within 56 world units at each refresh rate',()=>{
 assert.equal(oldStreetStride,56)
 const select=createDistancePoseSelector(oldStreetStride,['left','center','right','center'])
 assert.equal(select(0),'left');assert.equal(select(28),'right');assert.equal(select(56),'left')
 const counts=[30,60,120].map(fps=>{let previous='',changes=0;for(let i=0;i<fps*4;i++){const pose=select(WALK_SPEED*i/fps);if(pose!==previous){changes++;previous=pose}}return changes})
 assert.ok(Math.max(...counts)-Math.min(...counts)<=1)
 assert.ok(counts[0]>=Math.floor(WALK_SPEED*4/(oldStreetStride/4))-1)
})
