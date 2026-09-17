/** Stable per-image workbench calibration. This changes the live preview only;
 * the admitted media file and story remain untouched until authority confirms. */
export type DevelopingSetting={focus:number;exposure:number}
export function developingTarget(version:string):DevelopingSetting{
 let hash=2166136261
 for(const c of version)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0
 return {focus:2+hash%3,exposure:2+Math.floor(hash/7)%3}
}
export function validDevelopingSetting(value:unknown):value is DevelopingSetting{
 const s=value as DevelopingSetting
 return !!s&&[s.focus,s.exposure].every(n=>Number.isInteger(n)&&n>=0&&n<=6)
}
export function developingPreview(version:string,setting:DevelopingSetting){
 if(!validDevelopingSetting(setting))throw Error('INVALID_DEVELOPING_SETTING')
 const target=developingTarget(version),focus=Math.abs(setting.focus-target.focus),exposure=setting.exposure-target.exposure
 return {blur:focus*1.4,brightness:2**(exposure/1.5),focusReady:focus===0,light:exposure<0?'dark':exposure>0?'bright':'balanced'} as const
}
export function developingMatches(value:unknown,version:string){
 const proof=value as DevelopingSetting&{version?:unknown;method?:unknown}
 if(!validDevelopingSetting(proof)||proof.version!==version||proof.method!=='develop-v1')return false
 const target=developingTarget(version)
 return proof.focus===target.focus&&proof.exposure===target.exposure
}
