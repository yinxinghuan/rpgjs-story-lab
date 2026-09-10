import type { AdapterContext, AdapterResult, Locale, StoryCartridge, StorySave } from '../types'
import { parseStoryProtocol } from './protocol'
import { applyParsedScene } from './reducer'
import { buildDangerDirective } from './dangerDirector'
import { domainDemoContent, domainOwnsDanger, resolveDomainAction } from './domainRules'

export interface StoryTurnGenerator {
  send(action: string, context: AdapterContext): Promise<AdapterResult>
}

export interface ExecutedStoryTurn {
  save: StorySave
  source: 'domain' | 'model'
}

/**
 * Server-compatible ordinary-turn authority boundary. This cartridge currently
 * asks the narrator to describe accepted domain actions before reducer commit.
 * Finale generation remains a separate snapshot-bound transaction.
 */
export async function executeStoryTurn(options: {
  save: StorySave
  cartridge: StoryCartridge
  action: string
  locale?: Locale
  generator: StoryTurnGenerator
}): Promise<ExecutedStoryTurn> {
  const action = options.action.trim()
  if (!action) throw new Error('Story action is required')
  const cartridge = options.cartridge
  const locale = options.locale ?? cartridge.locale
  const base = options.save
  const domainResolution = resolveDomainAction(base, cartridge, action)
  const dangerDirective = domainResolution?.status === 'rejected' || domainOwnsDanger(domainResolution)
    ? undefined
    : buildDangerDirective(base, cartridge, action)
  let result: AdapterResult
  try {
    result = await options.generator.send(action, {
      cartridge, save: base, actionId: action, locale, dangerDirective, domainResolution,
    })
  } catch (cause) {
    if (!domainResolution) throw cause
    result = { content: domainDemoContent(domainResolution) }
  }
  const parsed = parseStoryProtocol(result.content, locale)
  return {
    save: applyParsedScene(
      base, parsed, cartridge, action, result.imagePrompt, result.imageSubject,
      dangerDirective, domainResolution,
    ),
    source: domainResolution ? 'domain' : 'model',
  }
}
