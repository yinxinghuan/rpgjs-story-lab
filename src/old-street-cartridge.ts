import {oldStreetCharacterDefinitions} from './old-street-characters'
import type {DomainActionRule, DomainEffect, DomainRequirement, Locale, StoryCartridge, StorySave} from './vendor/original-train/types'

/** In-project story draft. Not registered in production, and not an art-ready
 * game. The rules are consumed by the spatial binding and Core route checks. */
export const oldStreetId = 'old-street-letter'
export const oldStreetRooms = {
  street: ['街口', 'Street'], shop: ['修表铺', 'Watch shop'], yard: ['合住院', 'Courtyard'],
  laundry: ['洗衣店', 'Laundry'], photo: ['照相馆', 'Photo studio'], cellar: ['地下储物室', 'Cellar'],
  roof: ['屋顶', 'Roof terrace'], shed: ['河边工作棚', 'Riverside workshop'],
} as const
export type OldStreetRoom = keyof typeof oldStreetRooms
export const oldStreetConnections: ReadonlyArray<{
  id: string; a: OldStreetRoom; b: OldStreetRoom; kind: 'door' | 'alley' | 'stairs'; gate?: string
}> = [
  {id: 'shop-front', a: 'street', b: 'shop', kind: 'door'},
  {id: 'studio-front', a: 'street', b: 'photo', kind: 'door'},
  {id: 'yard-alley', a: 'street', b: 'yard', kind: 'alley'},
  {id: 'shop-back', a: 'shop', b: 'yard', kind: 'door'},
  {id: 'laundry-back', a: 'yard', b: 'laundry', kind: 'door'},
  {id: 'cellar-steps', a: 'yard', b: 'cellar', kind: 'stairs', gate: 'crates-cleared'},
  {id: 'studio-stairs', a: 'photo', b: 'roof', kind: 'stairs'},
  {id: 'riverside-stairs', a: 'roof', b: 'shed', kind: 'stairs'},
  {id: 'cellar-exit', a: 'cellar', b: 'shed', kind: 'stairs'},
  {id: 'yard-latch', a: 'shed', b: 'yard', kind: 'door', gate: 'yard-unlatched'},
]
export const oldStreetTravelId = (edge: string, from: OldStreetRoom) => `oldstreet:through:${edge}:${from}`
export const oldStreetActionId = (name: string) => `oldstreet:${name}`
export const oldStreetActionRooms: Record<string, OldStreetRoom> = {
  'greet-watchmaker':'shed', 'greet-laundry':'laundry', 'greet-photographer':'photo',
  'move-box': 'shop', 'take-lens': 'shop', 'borrow-trolley': 'laundry', 'clear-crates': 'yard',
  'return-trolley': 'laundry', 'borrow-key': 'shed', 'return-key': 'shed', 'lift-latch': 'shed',
  'unlock-letter': 'shop', 'take-letter': 'shop', 'take-clock': 'shed', 'inspect-clock': 'shop',
  'return-clock': 'laundry', 'take-photos': 'cellar', 'match-photos': 'photo', 'return-photos': 'photo',
  'consent-clock': 'laundry', 'consent-photo': 'photo', 'record-clock': 'shop', 'record-photo': 'shop',
  'withdraw-clock': 'shop', 'withdraw-photo': 'shop', 'leave': 'street',
}
const flagNames = ['drawer-open', 'lens-taken', 'crates-cleared', 'yard-unlatched', 'letter-unlocked',
  'letter-taken', 'clock-taken', 'clock-mark-known', 'clock-returned', 'photos-taken', 'photos-matched',
  'photos-returned', 'clock-consent', 'photo-consent', 'clock-recorded', 'photo-recorded', 'departed'] as const

export function oldStreetRules(locale: Locale): DomainActionRule[] {
  const t = (zh: string, en: string) => locale === 'zh' ? zh : en
  const flag = (id: string, value: boolean): DomainEffect => ({type: 'fact', id, value})
  const need = (id: string, equals: boolean, zh: string, en: string): DomainRequirement => ({type: 'fact', id, equals, reason: t(zh, en)})
  const requiredItems:Record<string,readonly [string,string]>={lens:['放大镜','the magnifying glass'],trolley:['推车','the trolley'],'letter-key':['小格钥匙','the compartment key'],letter:['密封信','the sealed letter'],clock:['旧钟','the old clock'],photos:['照片夹','the photo folder']}
  const has = (id: string): DomainRequirement => ({type: 'item', id, minCount: 1, reason: t(`需要随身带着${requiredItems[id]?.[0]??'对应物品'}。`, `You need to be carrying ${requiredItems[id]?.[1]??'the matching item'}.`)})
  const item = (id: string, zh: string, en: string): DomainEffect => ({type: 'inventory', action: 'add', itemId: id, count: 1, item: {id, label: t(zh, en), count: 1, rarity: 'common'}})
  const remove = (id: string): DomainEffect => ({type: 'inventory', action: 'remove', itemId: id, count: 1})
  const once = (id: string) => need(id, false, '这里已经处理过了。', 'This has already been handled.')
  const rules: DomainActionRule[] = []
  const action = (name: string, requirements: DomainRequirement[], effects: DomainEffect[], zh: string, en: string) => {
    const id = oldStreetActionId(name)
    rules.push({id, intent: id, match: [id], requirements: [
      need('departed', false, '这段旅程已经结束。', 'This journey has ended.'),
      {type: 'map', nodeId: oldStreetActionRooms[name], reason: t('先走到这件物品或人物旁。', 'Approach the object or person first.')},
      ...requirements,
    ], effects, successText: t(zh, en), successChoices: ['', '', '']})
  }
  action('greet-watchmaker', [], [], '取信的小格在铺里。钥匙可以借给你，院门的插销也能从这边打开。', 'The letter compartment is in the shop. You can borrow the key; the courtyard gate can be unbolted from this side.')
  action('greet-laundry', [], [], '推车放在旁边，用完放回来就行。院里的旧箱一直挡着台阶。', 'The trolley is over there. Return it when you finish. Those courtyard crates have been blocking the steps.')
  action('greet-photographer', [], [], '楼梯通向屋顶，从另一头能到河边工作棚。修表师这会儿常在那里。', 'The stairs lead to the roof. The far side goes down to the riverside workshop. The watchmaker is often there at this hour.')
  action('move-box', [once('drawer-open')], [flag('drawer-open', true)], '移开空盒后，抽屉拉开了。收据旁放着一把放大镜。', 'With the empty box moved aside, the drawer opens. A magnifying glass lies beside a receipt.')
  action('take-lens', [need('drawer-open', true, '抽屉还没打开。', 'The drawer is closed.'), once('lens-taken')], [flag('lens-taken', true), item('lens', '放大镜', 'Magnifying glass')], '你取出放大镜，原处空了。', 'You take the magnifying glass, leaving its place empty.')
  const available = (id: string) => need(id, false, '物品已经借出。', 'The item is already on loan.')
  action('borrow-trolley', [available('trolley-borrowed')], [flag('trolley-borrowed', true), item('trolley', '推车', 'Trolley')], '你借走推车，停放处空了出来。', 'You borrow the trolley, leaving its parking bay empty.')
  action('return-trolley', [has('trolley')], [remove('trolley'), flag('trolley-borrowed', false)], '推车放回了原位。', 'The trolley is back in its place.')
  action('clear-crates', [has('trolley'), once('crates-cleared')], [flag('crates-cleared', true)], '你把旧箱运到墙边空地，向下的台阶露出来了。', 'You wheel the crates into the clear space by the wall, revealing the steps down.')
  action('borrow-key', [available('key-borrowed')], [flag('key-borrowed', true), item('letter-key', '小格钥匙', 'Drawer key')], '“钥匙在这，用完带回来。”他把钥匙递给你。', '“Take the key; bring it back when you’re done.” He hands it to you.')
  action('return-key', [has('letter-key')], [remove('letter-key'), flag('key-borrowed', false)], '你把钥匙交还给修表师。他笑了：“说到做到，谢谢。”', 'You return the key. The watchmaker smiles. “You kept your word. Thank you.”')
  action('lift-latch', [once('yard-unlatched')], [flag('yard-unlatched', true)], '你抬起棚侧的插销。院门打开，回去不用绕楼梯了。', 'You lift the bolt on the workshop side. The courtyard gate opens, making a shortcut home.')
  action('unlock-letter', [has('letter-key'), once('letter-unlocked')], [flag('letter-unlocked', true)], '钥匙转动，小格打开。里面是一封写着家人姓名的密封信。', 'The key turns and the compartment opens. Inside is a sealed letter addressed to your family.')
  action('take-letter', [need('letter-unlocked', true, '小格还锁着。', 'The compartment is still locked.'), once('letter-taken')], [flag('letter-taken', true), item('letter', '密封信', 'Sealed letter')], '你收好信。现在可以从街口回家，也可以继续帮忙。', 'You put the letter away. You can go home from the street or stay to help.')
  action('take-clock', [once('clock-taken')], [flag('clock-taken', true), item('clock', '待归还的旧钟', 'Clock to return')], '修表师把旧钟递来：“洗衣店的，替我带过去吧。”', 'The watchmaker hands you the clock. “It belongs to the laundry. Could you take it back?”')
  action('inspect-clock', [has('clock'), has('lens'), once('clock-mark-known')], [flag('clock-mark-known', true)], '放大镜下，钟底刻着一对燕子。', 'Through the lens you see two swallows engraved beneath the clock.')
  action('return-clock', [has('clock'), once('clock-returned')], [remove('clock'), flag('clock-returned', true)], '店主接过钟：“这是我母亲的钟，谢谢你送回来。”她把它摆回柜台。', 'The owner takes the clock. “This was my mother’s. Thank you for bringing it back.” She sets it on the counter.')
  action('take-photos', [once('photos-taken')], [flag('photos-taken', true), item('photos', '旧照片夹', 'Old photo folder')], '你取下印着照相馆标记的照片夹。', 'You take the folder bearing the photo studio’s mark.')
  action('match-photos', [has('photos'), once('photos-matched')], [flag('photos-matched', true)], '窗沿和晾衣绳接上，洗衣店的旧店面重新连成一张照片。', 'The window sill and clothesline align, completing the old photograph of the laundry storefront.')
  action('return-photos', [has('photos'), need('photos-matched', true, '先在放大台比对照片。', 'Compare the photos on the viewing table first.'), once('photos-returned')], [remove('photos'), flag('photos-returned', true)], '摄影师接过照片：“这份底片原来在这里，谢谢你替我找回来。”', 'The photographer takes the photos. “So this is where the negatives went. Thank you for finding them.”')
  action('consent-clock', [need('clock-returned', true, '先把钟交还主人。', 'Return the clock to its owner first.'), once('clock-consent')], [flag('clock-consent', true)], '店主同意留下旧钟的照片和来历，不包括家里的私事。', 'The owner agrees to a photo of the clock and its history, keeping family matters private.')
  action('consent-photo', [need('photos-returned', true, '先交还照片，让主人选择。', 'Return the photos so their owner can choose.'), once('photo-consent')], [flag('photo-consent', true)], '摄影师选出店面的旧照，同意留下这一张。', 'The photographer selects an old picture of the shop and agrees to share that one.')
  for (const subject of ['clock', 'photo']) {
    action(`record-${subject}`, [need(`${subject}-consent`, true, '主人尚未同意留下这一条。', 'The owner has not agreed to share this entry.'), once(`${subject}-recorded`)], [flag(`${subject}-recorded`, true)], '你把获准留下的这一条放进记录册。', 'You place the approved entry in the record book.')
    action(`withdraw-${subject}`, [need(`${subject}-recorded`, true, '记录册里没有这一条。', 'This entry is not in the book.')], [flag(`${subject}-recorded`, false)], '你从记录册中撤下这一条。', 'You remove this entry from the book.')
  }
  action('leave', [has('letter')], [flag('departed', true), remove('letter')], '你带着密封信走出旧街，把它交回家人手里。', 'You leave the old street and deliver the sealed letter to your family.')
  for (const edge of oldStreetConnections) for (const [from, to] of [[edge.a, edge.b], [edge.b, edge.a]] as const) {
    const id = oldStreetTravelId(edge.id, from)
    rules.push({id, intent: id, match: [id], requirements: [
      need('departed', false, '旅程已经结束。', 'The journey has ended.'),
      {type: 'map', nodeId: from, reason: t('先走到对应的出入口。', 'Approach the matching entrance.')},
      ...(edge.gate ? [need(edge.gate, true, edge.gate === 'crates-cleared' ? '旧箱挡住了台阶。' : '插销在工作棚那一侧。', edge.gate === 'crates-cleared' ? 'Crates block the steps.' : 'The bolt is on the workshop side.')] : []),
    ], effects: [{type: 'map', nodeId: to}], successText: '', successChoices: ['', '', '']})
  }
  return rules
}

export function oldStreetCartridge(locale: Locale): StoryCartridge {
  const t = (zh: string, en: string) => locale === 'zh' ? zh : en
  return {
    schemaVersion: 1, id: oldStreetId, locale, coverImage: '',
    copy: {title: t('旧街最后一封信', 'The Last Letter on the Old Street'), subtitle: t('单人探索', 'Solo exploration'), promise: t('找回一封信，走进几段旧事。', 'Find a letter and uncover the stories around it.'), enter: t('进入旧街', 'Enter the street'), continue: t('继续探索', 'Continue exploring'), customAction: t('说点什么', 'Say something'), itemImagingTitle: '', itemImagingBody: ''},
    theme: {outer: '#101517', surface: '#202a2b', paper: '#ece5d8', ink: '#252928', muted: '#7b7d73', accent: '#52736a', danger: '#98594b', gold: '#ad9366', material: 'wayfarer'},
    audioTheme: {material: 'wayfarer', bpm: 72, rootHz: 196, scale: [0, 2, 5, 7, 9], levels: {music: 0, ambient: 0, sfx: 0, master: 0}, tension: []},
    statDefinitions: [], drawerLabels: {party: t('认识的人', 'People met'), map: t('街区', 'Neighbourhood'), inventory: t('随身物品', 'Inventory'), log: t('发现', 'Discoveries')},
    opening: {location: t(...oldStreetRooms.street), time: t('下午', 'Afternoon'), objective: t('到修表铺取家人寄存的信。', 'Collect your family’s letter from the watch shop.'), imagePrompt: '', imageMode: 'none',
      blocks: [{id: 'oldstreet-opening', kind: 'narration', text: t('家人让你到旧街取一封信。修表铺门开着，柜台后却没人。', 'Your family asked you to collect a letter from the old street. The watch shop is open, but nobody is behind the counter.')}], choices: []},
    characters: oldStreetCharacterDefinitions(locale), initialPartyMemberIds: [], initialInventory: [],
    initialMap: Object.entries(oldStreetRooms).map(([id, labels]) => ({id, label: t(labels[0], labels[1]), current: id === 'street', visited: id === 'street'})),
    initialFacts: {...Object.fromEntries(flagNames.map(name => [name, false])), 'key-borrowed': false, 'trolley-borrowed': false},
    domainRules: {rules: oldStreetRules(locale)}, demoTurns: [],
  }
}
export function oldStreetOutcome(save: Pick<StorySave, 'cartridgeId' | 'facts'>) {
  if (save.cartridgeId !== oldStreetId || save.facts.departed !== true) return undefined
  return {letterDelivered: true, clockReturned: save.facts['clock-returned'] === true,
    photosReturned: save.facts['photos-returned'] === true,
    clockRecorded: save.facts['clock-recorded'] === true && save.facts['clock-consent'] === true,
    photoRecorded: save.facts['photo-recorded'] === true && save.facts['photo-consent'] === true}
}
export const oldStreetAdmission = {ready: false, missing: ['spatial-renderer', 'admitted-art', 'character-introduction-and-relationships', 'session-transaction-and-ending', 'photo-comparison-input', 'free-input-action-adapter']} as const
