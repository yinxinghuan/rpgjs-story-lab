import type {SceneResource} from './scene-readiness'
/** Reviewed baseline pixels only. These descriptions never transfer to a replacement release. */
export const adaStandingResource:SceneResource={kind:'background',path:'./art/ada-standing-v1.png',sha256:'c9d268d14c4890014e101124fcb166efd813992e0a956b8417012729bbb12912',bytes:36405,width:320,height:320}
export const adaStandingAppearance={hair:'short dark-brown hair',coat:'navy work coat',collar:'cream collar',trousers:'dark teal trousers',boots:'brown boots',accessories:'brown diagonal strap and brown tool pouch at the hip',lamp:'upper part of a small brass lamp visible above the pouch opening on screen-right in this front-standing view; fastening method not established'} as const
export const fixedStandingReleases={
 'ren-standing-v1':{
  characterId:'ren-medic',graphic:'original-ren-standing-v1',foot:{x:320,y:600},scale:.08,capability:'front-standing-only',
  resource:{kind:'background',path:'./art/ren-standing-v1.png',sha256:'48e9a626cec744373f209007605a69f9f62716c1788c0419d03fcf6cbea6cade',bytes:106450,width:640,height:640} satisfies SceneResource,
  appearance:{hair:'short gray hair',coat:'muted gray-green field jacket',collar:'cream collar',trousers:'dark teal trousers',boots:'brown boots',accessories:'compact dark brown case beside the hip on screen-right in this standing view; no visible lamp'},
 },
 'lin-standing-v1':{
  characterId:'lin-scout',graphic:'original-lin-standing-v1',foot:{x:320,y:600},scale:.076,capability:'front-standing-only',
  resource:{kind:'background',path:'./art/lin-standing-v1.png',sha256:'cbd6ebd698ee794403b2669b71d65a9c654864f55aaeca005641155a889a92d9',bytes:86794,width:640,height:640} satisfies SceneResource,
  appearance:{hair:'short black hair',coat:'slate-blue inspection jacket with muted ochre cuff trim',trousers:'dark charcoal trousers',boots:'brown work boots',accessories:'closed maroon route notebook at the hip on screen-right and small dark radio at the opposite hip in this standing view'},
 },
 'mako-standing-v1':{
  characterId:'mara-raider',graphic:'original-mako-standing-v1',foot:{x:320,y:600},scale:.068,capability:'front-standing-only',
  resource:{kind:'background',path:'./art/mako-standing-v1.png',sha256:'28e8686d170119af59a7020801bee50f036ac6811fddbfb62721c70d0d7d0265',bytes:121059,width:640,height:640} satisfies SceneResource,
  appearance:{hair:'very short dark-brown hair',coat:'dark umber raincoat with turned-down collar',trousers:'dark charcoal trousers',boots:'black work boots',accessories:'short black-and-brass flashlight in lowered hand on screen-right in this standing view; bright lens without a visible beam'},
 },
} as const
export type FixedStandingBindings=Partial<Record<typeof fixedStandingReleases[keyof typeof fixedStandingReleases]['characterId'],keyof typeof fixedStandingReleases>>
