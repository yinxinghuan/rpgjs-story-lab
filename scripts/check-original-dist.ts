import {brakeArt} from '../src/original-brake-art'
import {readFileSync,statSync} from 'node:fs'
import {resolve,relative} from 'node:path'
import {createHash} from 'node:crypto'
import {originalStoryPreviewDefinition} from '../server/original-scene-preview'
import {originalBoundSceneResources,newOriginalAssetBindings} from '../src/original-asset-releases'
import {adaStandingResource,fixedStandingReleases} from '../src/original-art-identities'
import {originalHeroRelease} from '../src/original-hero-release'
import {originalHeroVersion} from '../src/original-asset-releases'
import {originalEquipmentResource,originalFanResources} from '../src/original-equipment-art'
const dir=resolve(process.argv[2]??'dist'),assets=newOriginalAssetBindings(),manifest=originalBoundSceneResources(originalStoryPreviewDefinition(),assets)
const resources=[brakeArt.resource,originalHeroRelease(originalHeroVersion(assets)).resource,...Object.values(manifest.scenes).flatMap(s=>s.assets),adaStandingResource,...Object.values(fixedStandingReleases).map(r=>r.resource),originalEquipmentResource(assets),...originalFanResources(assets).map(([,r])=>r)]
for(const r of resources){
 if(!r.path.startsWith('./')||r.path.includes('whitebox'))throw Error('ORIGINAL_DIST_UNRELEASED_PATH:'+r.path)
 const path=resolve(dir,r.path);if(relative(dir,path).startsWith('..'))throw Error('ORIGINAL_DIST_PATH_ESCAPE')
 const bytes=readFileSync(path)
 if(bytes.length!==r.bytes||createHash('sha256').update(bytes).digest('hex')!==r.sha256)throw Error('ORIGINAL_DIST_RESOURCE_CHANGED:'+r.path)
 if(r.kind==='background'&&(bytes.readUInt32BE(16)!==r.width||bytes.readUInt32BE(20)!==r.height))throw Error('ORIGINAL_DIST_DIMENSIONS:'+r.path)
}
if(!statSync(resolve(dir,'THIRD_PARTY_NOTICES.txt')).size)throw Error('ORIGINAL_DIST_NOTICES_MISSING')
console.log(JSON.stringify({directory:dir,scenes:Object.keys(manifest.scenes).length,resources:resources.length,sha256Verified:true,noDraftBackgrounds:true}))
