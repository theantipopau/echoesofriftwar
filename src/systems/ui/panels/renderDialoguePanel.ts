import type { DialogueViewState } from '../uiTypes'

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

  shell.innerHTML = `
    <div class="dialogue-header">
      <img src="/icons/quest.svg" alt="Dialogue" />
      <span>${dialogue.name}</span>
      <button type="button" class="dialogue-close">Close</button>
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