import type {OldStreetHead} from './old-street-head'
/** Layout is authored once. Media can never mutate it. */
export const darkroomMediaSlots={
 floor:{id:'floor',rect:{x:88,y:112,w:208,h:320},prompt:'One seamless worn dark photographic studio floor material, orthographic directly overhead, subdued gray brown stone, restrained painterly pixel clusters matching a nostalgic 2D exploration RPG. Entire square filled by flat floor texture. No walls, furniture, objects, doors, lettering, perspective convergence, borders or shadows from unseen objects.'},
 bench:{id:'bench',rect:{x:136,y:160,w:112,h:48},prompt:'One complete freestanding vintage photographic developing workbench, shallow elevated orthographic front view for a 2D top-down exploration RPG. Large readable rectangular wooden tabletop, short dark cabinet base, shallow top depth, muted weathered brown and olive, detailed but calm painted pixel clusters. Parallel edges, no vanishing point. Width about twice total visible height. Entire object isolated centered on flat pure magenta #ff00ff with generous margin. No floor, wall, people, text, extra objects, checkerboard or cast shadow outside the object.'},
} as const
export type DarkroomSlot=keyof typeof darkroomMediaSlots
export function darkroomMediaEligible(head:OldStreetHead){return head.save.facts['darkroom-ready']===true&&!!head.expansions?.length}
export type RoomMediaRow={id:DarkroomSlot;state:'preparing'|'failed'|'ready';recoverable:boolean;nextAt:number;asset?:{sha256:string;bytes:number;width:number;height:number}}
