import type {StorySave} from './vendor/original-train/types'

/** Physical state labels used until each corresponding art state is admitted. */
export function oldStreetPropState(id: string, save: Pick<StorySave, 'facts'>): readonly [string, string] | undefined {
  const f = save.facts
  switch (id) {
    case 'trolley': return f['trolley-borrowed'] === true ? ['推车停放处 · 空', 'Trolley bay · empty'] : ['推车', 'Trolley']
    case 'photo-folder': return f['photos-taken'] === true ? ['空搁架', 'Empty shelf'] : ['照片夹', 'Photo folder']
    case 'drawer': return f['lens-taken'] === true ? ['抽屉 · 收据', 'Drawer · receipt'] : f['drawer-open'] === true ? ['抽屉 · 放大镜', 'Drawer · lens'] : ['被空盒挡住的抽屉', 'Drawer behind box']
    case 'letter-compartment': return f['letter-taken'] === true ? ['小格 · 空', 'Compartment · empty'] : f['letter-unlocked'] === true ? ['小格 · 密封信', 'Compartment · letter'] : ['锁着的小格', 'Locked compartment']
    case 'crates': return f['crates-cleared'] === true ? ['墙边的旧箱', 'Crates by wall'] : ['挡着台阶的旧箱', 'Crates blocking steps']
  }
}
