import test from 'node:test'
import assert from 'node:assert/strict'
import {OldStreetAudioLayers} from '../src/old-street-audio-layers'
test('ambient layers wait for gesture and stop when muted, hidden, outside river or disposed',async()=>{
 const tracks:Array<any>=[]
 const make=(src:string)=>{const a={src,paused:true,plays:0,play(){this.plays++;this.paused=false;return Promise.resolve()},pause(){this.paused=true},removeAttribute(){this.src=''},load(){}};tracks.push(a);return a as unknown as HTMLAudioElement}
 const layers=new OldStreetAudioLayers('music','river',make)
 layers.setScene('shed');assert.equal(tracks[0].plays,0)
 layers.unlock();assert.equal(tracks[0].paused,false);assert.equal(tracks[1].paused,false)
 layers.setScene('photo');assert.equal(tracks[1].paused,true)
 layers.setVisible(false);assert.equal(tracks[0].paused,true)
 layers.setEnabled(false);layers.setVisible(true);assert.equal(tracks[0].paused,true)
 layers.setEnabled(true);assert.equal(tracks[0].paused,false)
 layers.dispose();await Promise.resolve();assert.ok(tracks.every(t=>t.paused&&t.src===''))
})
