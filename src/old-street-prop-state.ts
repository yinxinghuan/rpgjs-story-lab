import type {StorySave} from './vendor/original-train/types'
import {oldStreetRecordBookPose} from './old-street-record-book'

/** Semantic physical states shared by map labels and dialogue knowledge.
 * These do not assert that appearance or each art state has been admitted. */
export function oldStreetPropState(id: string, save: Pick<StorySave, 'facts'>): readonly [string, string] | undefined {
  const f = save.facts
  switch (id) {
    case 'record-book': {
      const pose=oldStreetRecordBookPose(save)
      return pose==='both'?['记录册 · 旧钟与旧照','Record book · clock and photograph']:pose==='photo'?['记录册 · 旧照','Record book · photograph']:pose==='clock'?['记录册 · 旧钟','Record book · clock']:['记录册 · 空白','Record book · blank']
    }
    case 'clock-display': return f['clock-returned'] === true ? ['柜台 · 已归还的旧钟', 'Counter · returned clock'] : ['柜台', 'Counter']
    case 'trolley': return f['trolley-borrowed'] === true ? ['推车停放处 · 空', 'Trolley bay · empty'] : ['推车', 'Trolley']
    case 'viewing-table': return f['photos-returned'] === true ? ['放大台 · 已归还的照片夹', 'Viewing table · returned photo folder'] : ['放大台', 'Viewing table']
    case 'photo-folder': return f['photos-taken'] === true ? ['空搁架', 'Empty shelf'] : ['照片夹', 'Photo folder']
    case 'drawer': return f['lens-taken'] === true ? ['抽屉 · 收据', 'Drawer · receipt'] : f['drawer-open'] === true ? ['抽屉 · 放大镜', 'Drawer · lens'] : ['被空盒挡住的抽屉', 'Drawer behind box']
    case 'letter-compartment': return f['letter-taken'] === true ? ['小格 · 空', 'Compartment · empty'] : f['letter-unlocked'] === true ? ['小格 · 密封信', 'Compartment · letter'] : ['锁着的小格', 'Locked compartment']
    case 'crates': return f['crates-cleared'] === true ? ['墙边的旧箱', 'Crates by wall'] : ['挡着台阶的旧箱', 'Crates blocking steps']
  }
}
