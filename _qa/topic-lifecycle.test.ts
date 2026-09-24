import test from 'node:test';import assert from 'node:assert/strict';import {createInitialSave} from '../src/vendor/original-train/engine/reducer';import {oldStreetCartridge} from '../src/old-street-cartridge';import {recordOldStreetInteraction} from '../src/old-street-characters';import {oldStreetTalkTopics,oldStreetTalkBlocks,oldStreetConversationHistory} from '../src/old-street-conversation';
test('three residents consume a three-round conversation while route help remains available',()=>{
 for(const [person,action,root] of [['watchmaker','oldstreet:greet-watchmaker','clock'],['laundry-owner','oldstreet:greet-laundry-owner','clock'],['photographer','oldstreet:greet-photographer','photos']]){
 let s=createInitialSave(oldStreetCartridge('en'));recordOldStreetInteraction(s,person,action,'hello','intro');
 for(let i=0;i<3;i++){const id=root+'-follow'.repeat(i),t=oldStreetTalkTopics(s,person).find(t=>t.id===id)!;assert.ok(t,person+'/'+id);s.blocks.push(...oldStreetTalkBlocks(s,person,'exchange-'+i,t.text,t.reply));s=JSON.parse(JSON.stringify(s));s.locale=i%2?'en':'zh';assert.ok(!oldStreetTalkTopics(s,person).some(t=>t.id===id))}
 assert.ok(oldStreetTalkTopics(s,person).some(t=>t.utility))
 }
})
test('old paired text is migrated conservatively, incomplete replies are not consumed',()=>{
 const s=createInitialSave(oldStreetCartridge('en'));recordOldStreetInteraction(s,'watchmaker','oldstreet:greet-watchmaker','hello','intro');const t=oldStreetTalkTopics(s,'watchmaker').find(t=>t.id==='clock')!,b=oldStreetTalkBlocks(s,'watchmaker','legacy',t.text,t.reply);for(const x of b)delete x.data!.topicKey;
 s.blocks.push(b[0]);assert.ok(oldStreetTalkTopics(s,'watchmaker').some(t=>t.id==='clock'));s.blocks.push(b[1]);s.locale='zh';assert.ok(!oldStreetTalkTopics(s,'watchmaker').some(t=>t.id==='clock'));assert.equal(oldStreetConversationHistory(s,'zhou-watchmaker').length,1)
 s.facts['clock-returned']=true;assert.ok(oldStreetTalkTopics(s,'watchmaker').some(t=>t.key==='clock@returned'))
})
