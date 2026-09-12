import {ORIGINAL_BACKGROUND_BASELINE,ORIGINAL_BACKGROUND_PLATFORM} from './original-asset-releases'
import {GRAYSTONE_BACKGROUND,PINE_BACKGROUND,TOWN_BACKGROUND,TUNNEL_BACKGROUND,PASS_BACKGROUND,FLOOD_BRIDGE_BACKGROUND,JUNCTION_BACKGROUND} from './original-environment-layouts'
/** Repository files, not built asset paths. Shared by packaging and references. */
export const originalBackgroundSourcePaths:Readonly<Record<string,string>>={
 [ORIGINAL_BACKGROUND_BASELINE]:'doc/original-train-candidates/20260911/north-cape-v2.png',
 [ORIGINAL_BACKGROUND_PLATFORM]:'doc/platform-art-candidates/20260911/environment-edit-02/candidate.png',
 [GRAYSTONE_BACKGROUND]:'doc/platform-art-candidates/20260912/yard-edit-02/candidate.png',
 [PINE_BACKGROUND]:'doc/platform-art-candidates/20260912/pine-edit-02/candidate.png',
 [TOWN_BACKGROUND]:'doc/platform-art-candidates/20260912/town-edit-01/candidate.png',
 [TUNNEL_BACKGROUND]:'doc/platform-art-candidates/20260912/tunnel-edit-02/candidate.png',
 [PASS_BACKGROUND]:'doc/platform-art-candidates/20260912/pass-edit-01/candidate.png',
 [FLOOD_BRIDGE_BACKGROUND]:'doc/platform-art-candidates/20260912/flood-bridge-edit-02/candidate.png',
 [JUNCTION_BACKGROUND]:'doc/platform-art-candidates/20260912/junction-edit-02/candidate.png',
}
