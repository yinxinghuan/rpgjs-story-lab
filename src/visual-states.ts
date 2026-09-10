import type {EntityId} from './contract'
// The renderer and admission export consume these exact admitted state mappings.
export const visualStates:Record<EntityId,Record<string,string>>={
 rearExit:{locked:'locked',open:'doorOpen'},walkwayBack:{open:'doorOpen'},callpoint:{ready:'powered',reported:'connected'},
 'zhou-yu':{waiting:'attendant',known:'attendant'},
 cabinet:{closed:'closed',open:'open',empty:'empty'},panel:{broken:'broken',repaired:'repaired',emergency:'repaired',beacon:'repaired'},lin:{waiting:'mechanic',known:'mechanic'},exit:{locked:'locked',open:'doorOpen'},
 supply:{closed:'closed',open:'empty',empty:'empty'},record:{unread:'record',read:'record'},forward:{open:'doorOpen'},back:{open:'doorOpen'},radio:{unpowered:'unpowered',powered:'powered','routed-lights':'powered','routed-radio':'powered',acknowledged:'powered',connected:'connected'},cabBack:{open:'doorOpen'},
}
