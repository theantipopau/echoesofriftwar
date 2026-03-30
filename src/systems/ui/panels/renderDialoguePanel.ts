import type { DialogueViewState } from '../uiTypes'
import { assetPath } from '../../../utils/assetPaths'

const PORTRAIT_MAP: Record<string, string> = {
  portraits_guard:   'art/portraits/warriorknight_npc.PNG',
  portraits_generic: 'art/portraits/female_npc.PNG',
  portraits_mage:    'art/portraits/elf_mage_npc.PNG',
  portraits_thief:   'art/portraits/hoodedthief_npc.PNG',
  portraits_elder:   'art/portraits/oldman_reading_npc.PNG',
  portraits_goblin:  'art/portraits/golbin_npc.PNG',
}

function resolvePortrait(portraitKey?: string): string {
  const file = portraitKey ? (PORTRAIT_MAP[portraitKey] ?? PORTRAIT_MAP.portraits_generic) : PORTRAIT_MAP.portraits_generic
  return assetPath(file)
}

export function renderDialoguePanel(
  container: HTMLElement,
  dialogue: DialogueViewState,
  onSelect: (optionId: string) => void,
  onClose: () => void,
): void {
  container.innerHTML = ''

  const shell = document.createElement('div')
  shell.className = 'dialogue-shell'

  const options = dialogue.options.length > 0
    ? dialogue.options
    : [{ id: '__close__', text: 'Continue' }]

  const portraitSrc = resolvePortrait(dialogue.portraitKey)

  shell.innerHTML = `
    <div class="dialogue-header">
      <div class="dialogue-portrait-frame">
        <img class="dialogue-portrait" src="${portraitSrc}" alt="${dialogue.name}" />
      </div>
      <div class="dialogue-header-info">
        <div class="dialogue-npc-name">${dialogue.name}</div>
        <div class="dialogue-npc-title">Resident of the Riftwar</div>
      </div>
      <button type="button" class="dialogue-close" aria-label="Close dialogue">✕</button>
    </div>
    <div class="dialogue-body">${dialogue.text}</div>
    <div class="dialogue-options"></div>
  `

  const optionMount = shell.querySelector('.dialogue-options') as HTMLDivElement
  options.forEach((option) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'dialogue-option'
    button.textContent = option.text
    button.addEventListener('click', () => {
      if (option.id === '__close__') {
        onClose()
        return
      }
      onSelect(option.id)
    })
    optionMount.appendChild(button)
  })

  ;(shell.querySelector('.dialogue-close') as HTMLButtonElement).addEventListener('click', onClose)
  container.appendChild(shell)
}