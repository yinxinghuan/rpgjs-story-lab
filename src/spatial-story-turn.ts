import { cartridge, finishStoryTurn, type StorySave } from './story'
import { actionLabel, localReply, validateProposal, type EntityId } from './contract'
import { resolveStoryActionById } from './story-domain-action'
import { executeStoryTurn } from './vendor/story/engine/executeTurn'
import { parseStoryProtocol } from './vendor/story/engine/protocol'
import type { DomainActionResolution } from './vendor/story/types'
import type { Narrator } from './journey-runtime'

/** Intent admission, canonical story execution, and the spatial presentation
 * policy. The outer session service alone commits the returned candidate. */
export async function executeSpatialStoryTurn(options: {
  save: StorySave
  target: EntityId
  actionId?: string
  input?: string
  live: boolean
  narrator: Narrator
  admitAction: (id: string) => boolean
}) {
  const base = structuredClone(options.save)
  let actionId = options.actionId
  let text = '', kind = 'dialogue', trace: unknown
  if (options.input !== undefined) {
    // Narrators receive a detached snapshot, never an object that can become
    // the authority's candidate through accidental mutation during an await.
    const result = await options.narrator(options.input, structuredClone(base), options.target, options.live)
    let proposal = result.proposal
    const issues = validateProposal(proposal, base, options.target)
    if (typeof proposal?.text === 'string' && parseStoryProtocol(proposal.text, base.locale).commands.length) issues.push('PROTOCOL_IN_PROSE')
    if (issues.length) {
      proposal = localReply(options.input, base, options.target)
      trace = { admission: 'authored-fallback', issues }
    } else trace = result.trace
    actionId = proposal.kind === 'action' ? proposal.actionId : undefined
    text = proposal.text;kind = proposal.kind
  }
  const c = cartridge(base.locale, base)
  let resolution: DomainActionResolution
  if (actionId) {
    if (!options.admitAction(actionId)) throw new Error('UNSUPPORTED_ACTION')
    resolution = resolveStoryActionById(base, c, actionId)
    text = resolution.status === 'accepted' ? resolution.successText : resolution.reasons.join(' ')
    kind = resolution.status === 'accepted' ? 'action' : 'rejected'
  } else {
    if (!text.trim()) throw new Error('EMPTY_RESULT')
    // An admitted observation has no mechanical effects. The same reducer still
    // records the player's question and response as one durable story turn.
    resolution = { status: 'accepted', ruleId: 'spatial-observation', intent: 'observe', effects: [], reasons: [], successText: text, successChoices: [], continuation: 'resume', dangerPolicy: 'suppress' }
  }
  const result = await executeStoryTurn({
    save: base, cartridge: c,
    action: options.input ?? actionLabel(actionId!, base.locale),
    admittedResolution: resolution,
    generator: { send: async () => { throw new Error('UNADMITTED_GENERATION') } },
  })
  finishStoryTurn(base, result.save, c, text)
  return { save: JSON.parse(JSON.stringify(result.save)) as StorySave, text, kind, accepted: Boolean(actionId) && resolution.status === 'accepted', actionId: actionId ?? null, trace }
}
