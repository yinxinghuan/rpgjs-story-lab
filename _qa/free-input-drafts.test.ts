import test from 'node:test';import assert from 'node:assert/strict';
import {readFreeInputDrafts,saveFreeInputDrafts} from '../src/free-input-drafts';
test('UI draft cache restores exact text without mixing session, scene or target',()=>{
 let stored:string|null=null;const storage={getItem:()=>stored,setItem:(_key:string,value:string)=>{stored=value}};
 const drafts={'one:street:watchmaker':'My question','two:street:watchmaker':'Other journey','one:shop:drawer':'Object action'};
 saveFreeInputDrafts(storage,drafts);assert.deepEqual(readFreeInputDrafts(storage),drafts);
});
test('invalid draft cache is harmless and oversized or non-text entries are ignored',()=>{
 assert.deepEqual(readFreeInputDrafts({getItem:()=>'{broken'}),{});
 assert.deepEqual(readFreeInputDrafts({getItem:()=>JSON.stringify({valid:'Hello',bad:42,long:'x'.repeat(501)})}),{valid:'Hello'});
 assert.deepEqual(readFreeInputDrafts({getItem:()=>{throw Error('Unavailable')}}),{});
});
