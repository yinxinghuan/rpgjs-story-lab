/** Read only this named synthetic database. Export no owner/token/enrollment. */
import {DatabaseSync} from 'node:sqlite'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {oldStreetJournal} from '../src/old-street-journal'
const d=new DatabaseSync('.data/archive-photo-playtest-20260917/journeys.sqlite',{readOnly:true})
try{
 const heads=d.prepare('SELECT data FROM journeys').all().map((r:any)=>JSON.parse(r.data))
 const h=heads.find(h=>h.expansions?.[0]?.archiveSource)
 if(!h)throw Error('MISSING_SYNTHETIC_LINKED_JOURNEY')
 const j=JSON.parse((d.prepare('SELECT data FROM oldstreet_expansion_media WHERE journey=?').get(h.id) as {data:string}).data)
 const sha=createHash('sha256').update(readFileSync('doc/archive-photo-media-20260917/candidate.png')).digest('hex')
 if(j.state!=='candidate'||sha!==j.asset.sha256||h.save.facts['darkroom-photo-matched']!==sha||h.save.facts['darkroom-photo-choice']!=='leave')throw Error('PHOTO_OR_RESTORE_MISMATCH')
 const requests=readFileSync('doc/archive-photo-media-20260917/requests.jsonl','utf8').trim().split('\n').map(l=>JSON.parse(l))
 const report={source:'local actual renderer + authority + platform media',archiveSource:h.expansions[0].archiveSource,photo:j.asset,requestId:j.requestId,taskId:j.taskId,generationRequests:requests.filter(r=>r.startedAt).length,uniqueRequests:new Set(requests.map(r=>r.requestId)).size,choice:h.save.facts['darkroom-photo-choice'],discovery:oldStreetJournal(h.save,h.campaign).notes.find(n=>n.id==='darkroom-photo-discovery'),hasPrintInInventory:h.save.inventory.some((i:any)=>i.id==='darkroom-print'),browserEvidence:'_qa/ui/archive-photo-media-20260917/notes-restored-320-platform-layout.png',modelText:'Replay of previously generated accepted bridge proposal; synthetic matching archive, no new narrative request'}
 writeFileSync('doc/archive-photo-media-20260917/result.json',JSON.stringify(report,null,2)+'\n')
 console.log(JSON.stringify({generationRequests:report.generationRequests,uniqueRequests:report.uniqueRequests,choice:report.choice,hasPrintInInventory:report.hasPrintInInventory,sha256:sha}))
}finally{d.close()}
