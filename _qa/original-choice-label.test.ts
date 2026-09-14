import test from 'node:test'
import assert from 'node:assert/strict'
import {originalChoiceLabel} from '../src/original-choice-label'
test('ending titles are short while every stated cost stays visible in both languages',()=>{
 for(const [label,title,cost] of [['选择「共同线路」；代价：放弃决定权；预留救援燃料','共同线路','代价：放弃决定权；预留救援燃料'],['Choose “Common Line” — Cost: Give up command; reserve fuel','Common Line','Cost: Give up command; reserve fuel']]){const input={id:'junction-common-line',label},before={...input};assert.deepEqual(originalChoiceLabel(input),{title,cost});assert.deepEqual(input,before)}
})
test('normal actions and unexpected labels keep their full text',()=>{for(const choice of [{id:'repair',label:'修复启动机（燃料−3）'},{id:'junction-review',label:'核对记录'}])assert.deepEqual(originalChoiceLabel(choice),{title:choice.label})})
