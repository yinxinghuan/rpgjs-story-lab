// Source: create-rpg-game stateful Story Session overlay; local spatial admission extension.
import type { AdapterContext, AdapterResult, DomainActionResolution, Locale, StoryCartridge, StorySave } from '../types'
import {
  applyConsistencyRecovery,
  applyConsistencyRecoverySelection,
  applyDisplayedRouteFallback,
  applyParsedScene,
  resolveConsistencyRecoverySelection,
} from './reducer'
import { parseStoryProtocol } from './protocol'
import { canCommitDisplayedChoiceWithoutGeneratedReplies, inferActionDestination } from './turnConsistency'
import { prepareTurnCandidate } from './turnPipeline'
import { buildDangerDirective, createDangerFallbackScene } from './dangerDirector'
import { domainSuppressesDanger, resolveDomainAction } from './domainRules'
import { resolveDeterministicChoiceTurn, resolveDeterministicOpeningTurn } from './authoredTurns'
import { resolvePresetEventTurn } from './presetEventDirector'

export interface StoryTurnGenerator {
  send(action: string, context: AdapterContext): Promise<AdapterResult>
}

export interface ExecutedStoryTurn {
  save: StorySave
  source: 'domain' | 'authored' | 'model' | 'local-recovery'
  repaired: boolean
}

/** Server-compatible authority boundary with no React, DOM, media or storage dependency. */
export async function executeStoryTurn(options: {
  save: StorySave
  cartridge: StoryCartridge
  action: string
  locale?: Locale
  generator: StoryTurnGenerator
  /** Server-admitted spatial action; never read from an HTTP request. */
  admittedResolution?: DomainActionResolution
}): Promise<ExecutedStoryTurn> {
  const action = options.action.trim()
  if (!action) throw new Error('Story action is required')
  const cartridge = options.cartridge
  const locale = options.locale ?? cartridge.locale
  const base = options.save
  // Map interaction has already selected its exact registered rule. Preserve
  // that decision instead of matching localized prose or recovery labels again.
  if (options.admittedResolution) {
    const resolution = options.admittedResolution
    const text = resolution.status === 'accepted' ? resolution.successText : resolution.reasons.join(locale === 'zh' ? '；' : '; ')
    const dangerDirective = resolution.status === 'rejected' || domainSuppressesDanger(resolution)
      ? undefined : buildDangerDirective(base, cartridge, action)
    const parsed = resolution.status === 'accepted' && resolution.dangerPolicy === 'advance' && dangerDirective
      ? createDangerFallbackScene(base, cartridge, dangerDirective) : parseStoryProtocol(text, locale)
    return {
      save: applyParsedScene(base, parsed, cartridge, action, undefined, undefined, dangerDirective, resolution),
      source: 'domain', repaired: false,
    }
  }
  const commit = (
    parsed: ReturnType<typeof parseStoryProtocol>,
    result: AdapterResult,
    dangerDirective: ReturnType<typeof buildDangerDirective>,
    domainResolution: ReturnType<typeof resolveDomainAction>,
    presetEventResolution: ReturnType<typeof resolvePresetEventTurn>,
  ) => applyParsedScene(
    base, parsed, cartridge, action, result.imagePrompt, result.imageSubject,
    dangerDirective, domainResolution, result.imageCharacterId, presetEventResolution,
  )

  const selectedChoice = base.choices.find((choice) => choice.label.trim() === action)
  const displayedRouteDestination = selectedChoice
    ? (selectedChoice.targetLocationId
        ? base.map.find((node) => node.id === selectedChoice.targetLocationId)
          ?? cartridge.initialMap.find((node) => node.id === selectedChoice.targetLocationId)
        : undefined)
      ?? inferActionDestination(base, cartridge, action)
    : undefined
  const recoverySelection = resolveConsistencyRecoverySelection(base, cartridge, action)
  if (recoverySelection) {
    return {
      save: applyConsistencyRecoverySelection(base, cartridge, action, recoverySelection),
      source: 'local-recovery',
      repaired: false,
    }
  }

  const domainResolution = resolveDomainAction(base, cartridge, action)
  const authoredOpening = domainResolution ? undefined : resolveDeterministicOpeningTurn(base, cartridge, action)
  const authoredChoice = domainResolution || authoredOpening ? undefined : resolveDeterministicChoiceTurn(base, cartridge, action)
  const authoredOwnsCalmTurn = base.danger.phase === 'calm' && Boolean(authoredOpening || authoredChoice)
  const scheduledDanger = domainResolution?.status === 'rejected'
    || domainSuppressesDanger(domainResolution)
    || authoredOwnsCalmTurn
    ? undefined
    : buildDangerDirective(base, cartridge, action)
  const presetEvent = domainResolution || authoredOpening || authoredChoice || scheduledDanger
    ? undefined
    : resolvePresetEventTurn(base, cartridge, action)
  const authored = authoredOpening ?? authoredChoice ?? presetEvent?.turn
  const dangerDirective = presetEvent ? undefined : scheduledDanger
  let source: ExecutedStoryTurn['source'] = domainResolution ? 'domain' : authored ? 'authored' : 'model'
  let result: AdapterResult = domainResolution
    ? { content: domainResolution.status === 'accepted' ? domainResolution.successText : domainResolution.reasons.join(locale === 'zh' ? '；' : '; ') }
    : authored
      ? { content: authored.content, imagePrompt: authored.imagePrompt, imageSubject: authored.imageSubject, imageCharacterId: authored.imageCharacterId }
      : await options.generator.send(action, { cartridge, save: base, actionId: action, locale, dangerDirective })
  let parsed = domainResolution?.status === 'accepted'
    && domainResolution.dangerPolicy === 'advance'
    && dangerDirective
    ? createDangerFallbackScene(base, cartridge, dangerDirective)
    : parseStoryProtocol(result.content, locale)
  let repaired = false

  if (!domainResolution) {
    let prepared = prepareTurnCandidate({
      save: base, parsed, cartridge, action, imagePrompt: result.imagePrompt, trustedAuthored: Boolean(authored),
    })
    parsed = prepared.parsed
    if (prepared.discardedImage) result = { ...result, imagePrompt: undefined, imageSubject: undefined, imageCharacterId: undefined }
    if (prepared.violations.length) {
      if (authored) throw new Error(`invalid deterministic turn: ${prepared.violations.join(', ')}`)
      if (prepared.canCommitWithoutReplies) return { save: commit(parsed, result, dangerDirective, undefined, presetEvent), source, repaired }
      repaired = true
      result = await options.generator.send(action, {
        cartridge, save: base, actionId: action, locale, dangerDirective,
        repair: { draft: result.content, violations: prepared.violations },
      })
      parsed = parseStoryProtocol(result.content, locale)
      prepared = prepareTurnCandidate({ save: base, parsed, cartridge, action, imagePrompt: result.imagePrompt })
      parsed = prepared.parsed
      if (prepared.discardedImage) result = { ...result, imagePrompt: undefined, imageSubject: undefined, imageCharacterId: undefined }
      if (prepared.violations.length) {
        if (prepared.canCommitWithoutReplies
          || canCommitDisplayedChoiceWithoutGeneratedReplies(base, cartridge, action, prepared.violations)) {
          return { save: commit(parsed, result, dangerDirective, undefined, presetEvent), source, repaired }
        }
        if (dangerDirective) {
          return {
            save: applyParsedScene(base, createDangerFallbackScene(base, cartridge, dangerDirective), cartridge, action, undefined, undefined, dangerDirective),
            source: 'local-recovery',
            repaired,
          }
        }
        if (displayedRouteDestination && base.danger.phase === 'calm') {
          return {
            save: applyDisplayedRouteFallback(base, cartridge, action, displayedRouteDestination),
            source: 'local-recovery',
            repaired,
          }
        }
        return { save: applyConsistencyRecovery(base, cartridge, action), source: 'local-recovery', repaired }
      }
    }
  }

  return { save: commit(parsed, result, dangerDirective, domainResolution, presetEvent), source, repaired }
}
