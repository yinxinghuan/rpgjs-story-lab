import test from 'node:test';import assert from 'node:assert/strict';import {oldStreetAiNotice,oldStreetAiRefusals} from '../src/old-street-ai-notice';
test('confirmed AI limits explain recovery without losing exploration or exposing codes',()=>{
 for(const code of oldStreetAiRefusals)for(const locale of ['zh','en'] as const){const message=oldStreetAiNotice(code,locale);assert.ok(message);assert.ok(!message.includes(code));}
 assert.match(oldStreetAiNotice('AI_COOLDOWN','en')!,/minute/);assert.match(oldStreetAiNotice('AI_ROOM_DAILY_LIMIT','en')!,/midnight UTC/);assert.equal(oldStreetAiNotice('private database details','en'),undefined)
})
