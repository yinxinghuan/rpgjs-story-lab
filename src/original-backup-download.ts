import {GAME_ID} from './game-id'
import {originalBackupDigest} from './original-backup-integrity'
/** Check an authenticated export before offering a download; not a restore API. */
export async function inspectOriginalBackupDownload(value:any,journeyId:string,minVersion:number){
 const p=value?.payload,j=p?.tables?.journeys?.[0]
 if(!value||Object.keys(value).sort().join(',')!=='payload,sha256'||p?.format!=='original-train-backup-v1'||p.gameId!==GAME_ID||p.journeyId!==journeyId||p.tables?.journeys?.length!==1||j?.id!==journeyId||typeof j.data!=='string'||!Number.isSafeInteger(minVersion)||minVersion<0||typeof value.sha256!=='string'||!/^[a-f0-9]{64}$/.test(value.sha256))throw Error('INVALID_ORIGINAL_BACKUP')
 if(value.sha256!==await originalBackupDigest(p))throw Error('INVALID_ORIGINAL_BACKUP')
 const head=JSON.parse(j.data)
 if(head?.id!==journeyId||!Number.isSafeInteger(head.version)||head.version<minVersion)throw Error('INVALID_ORIGINAL_BACKUP')
 return {version:head.version as number,text:JSON.stringify(value)}
}
