import {test} from 'node:test'
import assert from 'node:assert/strict'
import {browserStorageName} from '../src/browser-storage-name'
import {GAME_ID} from '../src/game-id'
test('Pages and local names preserve every existing browser save',()=>{
 const old='alteru:'+GAME_ID+':pages-journeys-v1'
 assert.equal(browserStorageName('yinxinghuan.github.io','/rpgjs-story-lab/'),old)
 assert.equal(browserStorageName('127.0.0.1','/'),old)
})
test('self-hosted Remix cannot read the source game IndexedDB',()=>{
 const remix='f3a37721-8aca-4a73-a4be-2c29de798376'
 assert.equal(browserStorageName('game.aiwaves.tech',`/${remix}/`),`alteru:${remix}:pages-journeys-v1`)
 assert.notEqual(browserStorageName('game.aiwaves.tech',`/${remix}/`),browserStorageName('game.aiwaves.tech',`/${GAME_ID}/`))
 assert.throws(()=>browserStorageName('game.aiwaves.tech','/wrong/'))
})
