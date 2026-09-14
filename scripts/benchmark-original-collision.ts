// Read-only synthetic CPU probe; timings are not an iPhone FPS measurement.
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalWorldWalkable} from '../src/original-world-space'
const h=originalTrainRuntime(()=>true).initial('zh',crypto.randomUUID());h.sceneId='train-at-tunnel'
let hits=0;const samples=[]
for(let round=0;round<6;round++){
 const start=performance.now()
 for(let i=0;i<3000;i++)if(originalWorldWalkable(h,{x:85+i%60,y:400+i%100}))hits++
 samples.push(performance.now()-start)
}
console.log(JSON.stringify({queriesPerRound:3000,samples,hits}))
