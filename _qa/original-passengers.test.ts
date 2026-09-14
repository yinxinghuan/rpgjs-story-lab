import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalPassengers,originalPassengerConversation,passengerArt} from '../src/original-passengers'
import {originalBoundWorldPlan} from '../src/original-world-plan'
import {originalWorldWalkabilitySnapshot} from '../src/original-world-space'
import {findGridPath} from '../src/grid-path'
const fixture=()=>{const h=originalTrainRuntime(()=>true).initial('zh','12345678-1234-1234-1234-123456789012');h.sceneId='train-at-sleeping-town';h.save.facts['town-inspected']=true;return h}
test('passengers appear only at an inspected stop, without changing party membership',()=>{const h=fixture(),before=structuredClone(h);assert.equal(originalPassengers(h).length,2);assert.deepEqual(h,before);h.save.facts['town-inspected']=false;assert.deepEqual(originalPassengers(h),[]);h.sceneId='train-at-tunnel';h.save.facts['town-inspected']=true;assert.deepEqual(originalPassengers(h),[])})
test('passengers have solid feet and reachable conversation points without blocking existing stops',()=>{for(const legacy of [false,true]){const h=fixture();if(legacy)h.assets=undefined;const world=originalBoundWorldPlan(h.assets),scene=world.scenes.find(s=>s.id===h.sceneId)!,walk=originalWorldWalkabilitySnapshot(h);const passengers=originalPassengers(h);assert.equal(passengers.length,2);for(const p of passengers){assert.equal(walk({x:p.position.x-4.5,y:p.position.y-15}),false);assert.ok(walk(p.approach));assert.ok(findGridPath(scene.spawn,p.approach,walk).length,p.id)}for(const e of world.entities.filter(e=>e.scene===h.sceneId))assert.ok(findGridPath(scene.spawn,e.approach,walk).length,e.id)}})
test('short topics reflect morale and rest, and never mutate the save',()=>{const h=fixture(),before=structuredClone(h),low=originalPassengerConversation(h,'blue');h.save.stats.morale=90;h.save.facts['town-rested']=true;const rested=structuredClone(h);const high=originalPassengerConversation(h,'gray');assert.equal(high.topics.length,2);assert.notEqual(low.topics[1].reply,high.topics[1].reply);assert.deepEqual(h,rested);assert.deepEqual(before.save.partyMemberIds,h.save.partyMemberIds)})
test('existing crowd art matches the immutable resource manifest',()=>{for(const art of Object.values(passengerArt)){const bytes=readFileSync('public/'+art.resource.path.slice(2));assert.equal(bytes.length,art.resource.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),art.resource.sha256)}})
