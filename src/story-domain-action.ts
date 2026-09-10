import type { StoryCartridge, StorySave, DomainActionResolution } from './vendor/story/types'
import { resolveDomainAction } from './vendor/story/engine/domainRules'

/** Resolve an already admitted map action by its stable Cartridge rule ID.
 * The caller still owns entity/scene/proximity checks and the session transaction.
 * Free text must go through intent admission first, never directly into this API.
 */
export function resolveStoryActionById(
  save: StorySave,
  cartridge: StoryCartridge,
  actionId: string,
): DomainActionResolution {
  const matches = cartridge.domainRules?.rules.filter(rule => rule.id === actionId) ?? []
  if (matches.length === 0) throw new Error('UNREGISTERED_ACTION')
  if (matches.length !== 1) throw new Error('AMBIGUOUS_ACTION_ID')
  const selected = matches[0]
  // A validated explicit action is a commitment. Language-specific keyword and
  // rest-intent recognition belong to free-input admission, not this boundary.
  // Keep the complete rule, requirements, repeat policy, floors and derived data.
  const bound: StoryCartridge = {
    ...cartridge,
    domainRules: {
      ...cartridge.domainRules!,
      rules: [{ ...selected, match: [actionId], matchMode: 'exact', intentGuard: undefined }],
    },
  }
  const result = resolveDomainAction(save, bound, actionId)
  if (!result) throw new Error('UNRESOLVED_REGISTERED_ACTION')
  return result
}
