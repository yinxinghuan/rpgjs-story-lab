import {inspectSpritePng,type SpriteDraft,type SpritePng} from './sprite-draft'
export const SPRITE_ARCHIVE_LIMIT=6,SPRITE_ARCHIVE_PART=49152,SPRITE_ARCHIVE_BYTES=24*1024*1024
export const spriteArchiveBodyLimit=(path:string)=>/^\/api\/creator\/sprites\/[a-f0-9-]{36}\/parts$/.test(path)?70000:6000
export const SPRITE_FILE_ROLES=['source','candidate','input-0','input-1'] as const
export type SpriteFileRole=typeof SPRITE_FILE_ROLES[number]
export type SpriteFile={role:SpriteFileRole;sha256:string;bytes:number;width:number;height:number}
export type SpriteArchiveManifest={version:1;id:string;draft:any;files:SpriteFile[]}
export type SpriteArchiveRecord={manifest:SpriteArchiveManifest;state:'uploading'|'ready';createdAt:number}
export const spriteArchiveId=(id:unknown):id is string=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)
const fail=()=>{throw Error('SPRITE_ARCHIVE_INVALID')}
const integer=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isInteger(n)&&n>=min&&n<=max
export function spriteManifest(d:SpriteDraft){
 if(!d.result||!d.spec||d.state!=='candidate')throw Error('SPRITE_NOT_READY')
 const files:SpriteFile[]=[],payload=new Map<SpriteFileRole,SpritePng>()
 const file=(role:SpriteFileRole,png:SpritePng)=>{const f={role,sha256:png.sha256,bytes:png.bytes.length,width:png.width,height:png.height};files.push(f);payload.set(role,png);return role}
 const draft={version:d.version,id:d.id,revision:d.revision,createdAt:d.createdAt,...(d.parentId?{parentId:d.parentId}:{}),source:file('source',d.source),sourceName:d.sourceName,sourceKind:d.sourceKind??d.spec.kind,...(d.deviceStateSet?{deviceStateSet:d.deviceStateSet}:{}),spec:structuredClone(d.spec),state:'candidate',result:{...structuredClone(d.result),png:file('candidate',d.result.png)},...(d.composition?{composition:{version:1,inputs:d.composition.inputs.map((i,n)=>({...i,source:file(('input-'+n) as SpriteFileRole,i.source)}))}}:{})}
 const manifest:SpriteArchiveManifest={version:1,id:d.id,draft,files};assertSpriteManifest(manifest);return {manifest,payload}
}
export function assertSpriteManifest(v:any):asserts v is SpriteArchiveManifest{
 if(!v||Object.keys(v).sort().join(',')!=='draft,files,id,version'||v.version!==1||!spriteArchiveId(v.id)||!Array.isArray(v.files)||![2,4].includes(v.files.length)||JSON.stringify(v).length>5500)return fail()
 const roles=new Set<string>();let bytes=0
 for(const f of v.files){if(!f||Object.keys(f).sort().join(',')!=='bytes,height,role,sha256,width'||!SPRITE_FILE_ROLES.includes(f.role)||roles.has(f.role)||!/^[a-f0-9]{64}$/.test(f.sha256)||!integer(f.bytes,45,8*1024*1024)||!integer(f.width,1,1536)||!integer(f.height,1,1536)||f.width*f.height>1572864)return fail();roles.add(f.role);bytes+=f.bytes}
 if(bytes>SPRITE_ARCHIVE_BYTES||!roles.has('source')||!roles.has('candidate'))return fail()
 const d=v.draft,s=d?.spec,r=d?.result
 if(!d||Object.keys(d).some(k=>!['version','id','revision','createdAt','parentId','source','sourceName','sourceKind','deviceStateSet','spec','state','result','composition'].includes(k))||d.version!=='sprite-draft-1'||d.id!==v.id||!integer(d.revision,0,1000000)||!integer(d.createdAt,0,Number.MAX_SAFE_INTEGER)||d.parentId!==undefined&&!spriteArchiveId(d.parentId)||d.source!=='source'||typeof d.sourceName!=='string'||d.sourceName.length>100||!['actor','states'].includes(d.sourceKind)||d.deviceStateSet!==undefined&&d.deviceStateSet!=='repair'||d.state!=='candidate'||!s||!r||r.png!=='candidate'||r.algorithm!=='neutral-matte-unmix-1')return fail()
 if(Object.keys(s).some(k=>!['columns','rows','cellWidth','cellHeight','foot','kind','backgroundMode','sourceAnchors','neutralMin','chromaMax'].includes(k))||!['actor','states'].includes(s.kind)||s.columns!==(d.deviceStateSet==='repair'?2:3)||s.rows!==(s.kind==='actor'?4:1)||!integer(s.cellWidth,8,1536)||!integer(s.cellHeight,8,1536)||!['alpha','pale-neutral'].includes(s.backgroundMode)||!integer(s.neutralMin,180,255)||!integer(s.chromaMax,0,35)||!s.foot||Object.keys(s.foot).sort().join(',')!=='x,y'||!integer(s.foot.x,1,s.cellWidth-1)||!integer(s.foot.y,4,s.cellHeight-1))return fail()
 if(d.deviceStateSet==='repair'&&s.kind!=='states')return fail()
 const source=v.files.find((f:SpriteFile)=>f.role==='source'),out=v.files.find((f:SpriteFile)=>f.role==='candidate'),count=s.columns*s.rows
 if(source.width%s.columns||source.height%s.rows||out.width!==s.cellWidth*s.columns||out.height!==s.cellHeight*s.rows||Object.keys(r).sort().join(',')!=='algorithm,frames,metrics,png'||!Array.isArray(r.frames)||r.frames.length!==count)return fail()
 if(s.kind==='states'&&(!Array.isArray(s.sourceAnchors)||s.sourceAnchors.length!==count))return fail()
 if(s.sourceAnchors!==undefined&&(!Array.isArray(s.sourceAnchors)||s.sourceAnchors.length!==count||s.sourceAnchors.some((a:any)=>!a||Object.keys(a).sort().join(',')!=='x,y'||!integer(a.x,0,source.width/s.columns)||!integer(a.y,0,source.height/s.rows))))return fail()
 if(!r.metrics||Object.keys(r.metrics).sort().join(',')!=='corePreserved,edgeCorrected,removed'||Object.values(r.metrics).some(n=>!integer(n,0,1572864)))return fail()
 for(let i=0;i<count;i++){const f=r.frames[i];if(!f||Object.keys(f).sort().join(',')!=='column,offset,row,sourceAnchor,sourceBox'||f.column!==i%s.columns||f.row!==Math.floor(i/s.columns)||!Array.isArray(f.sourceBox)||f.sourceBox.length!==4||f.sourceBox.some((n:unknown)=>!integer(n,0,1536))||!f.sourceAnchor||Object.keys(f.sourceAnchor).sort().join(',')!=='x,y'||!f.offset||Object.keys(f.offset).sort().join(',')!=='x,y'||!integer(f.sourceAnchor.x,0,source.width/s.columns)||!integer(f.sourceAnchor.y,0,source.height/s.rows)||!integer(f.offset.x,-1536,1536)||!integer(f.offset.y,-1536,1536)||f.sourceAnchor.x+f.offset.x!==s.foot.x||f.sourceAnchor.y+f.offset.y!==s.foot.y)return fail();if(s.sourceAnchors&&(f.sourceAnchor.x!==s.sourceAnchors[i].x||f.sourceAnchor.y!==s.sourceAnchors[i].y))return fail()}
 if(d.composition){const c=d.composition;if(d.deviceStateSet!=='repair'||d.sourceKind!=='states'||Object.keys(c).sort().join(',')!=='inputs,version'||c.version!==1||!Array.isArray(c.inputs)||c.inputs.length!==2||roles.size!==4)return fail();for(let n=0;n<2;n++){const i=c.inputs[n],f=v.files.find((f:SpriteFile)=>f.role==='input-'+n);if(!i||Object.keys(i).sort().join(',')!=='column,columns,source,sourceName'||i.source!=='input-'+n||!f||typeof i.sourceName!=='string'||i.sourceName.length>100||!integer(i.columns,1,12)||!integer(i.column,0,i.columns-1)||f.width%i.columns||f.width/i.columns!==source.width/2||f.height!==source.height)return fail()}}else if(roles.size!==2)return fail()
}
export function assertSpriteArchiveRecord(r:any):asserts r is SpriteArchiveRecord{if(!r||Object.keys(r).sort().join(',')!=='createdAt,manifest,state'||!['uploading','ready'].includes(r.state)||!integer(r.createdAt,0,Number.MAX_SAFE_INTEGER))return fail();assertSpriteManifest(r.manifest)}
export async function restoreSpriteManifest(manifest:SpriteArchiveManifest,read:(file:SpriteFile)=>Promise<Uint8Array>):Promise<SpriteDraft>{
 assertSpriteManifest(manifest);const files=new Map<string,SpritePng>()
 for(const f of manifest.files){const bytes=await read(f),png=await inspectSpritePng(bytes);if(bytes.length!==f.bytes||png.sha256!==f.sha256||png.width!==f.width||png.height!==f.height)throw Error('SPRITE_ARCHIVE_CORRUPT');files.set(f.role,png)}
 const d=structuredClone(manifest.draft)
 d.source=files.get('source');d.result.png=files.get('candidate')
 if(d.composition)for(const i of d.composition.inputs)i.source=files.get(i.source)
 return d
}
export function spritePartText(bytes:Uint8Array){let value='';for(const b of bytes)value+=String.fromCharCode(b);return btoa(value)}
export function spritePartBytes(value:unknown){if(typeof value!=='string'||value.length>65536||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return fail();return Uint8Array.from(atob(value),c=>c.charCodeAt(0))}
export function spriteManifestSignature(v:SpriteArchiveManifest){const sort=(o:any):any=>Array.isArray(o)?o.map(sort):o&&typeof o==='object'?Object.fromEntries(Object.keys(o).sort().map(k=>[k,sort(o[k])])):o;return JSON.stringify(sort(v))}
