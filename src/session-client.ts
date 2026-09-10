import {RecoverableSessionClient,type SessionLock,type Transport} from './recoverable-session-client'
import {currentScene} from './contract'
import {assertReadableJourney} from './journey-compatibility'
import type {Head} from './journey-runtime'
export type {SessionLock,Transport,Pending} from './recoverable-session-client'
/** Carriage adapter preserves existing storage keys and request envelopes. */
export class SessionClient extends RecoverableSessionClient<Head>{
 constructor(storage:Storage,prefix:string,transport:Transport,lock?:SessionLock){super(storage,prefix,transport,{scene:h=>currentScene(h.save),assertHead:(v:unknown):asserts v is Head=>assertReadableJourney(v as Head)},lock)}
}
