import type { DialogueViewState, InventoryViewState, QuestViewState, RegionProgressViewState } from './uiTypes'
import type { InventoryPanelHandlers } from './panels/renderInventoryPanel'

type NotificationType = 'info' | 'warning' | 'error' | 'success'

export class UIManager {
  private container: HTMLDivElement
  private hud: HTMLDivElement
  private questTracker: HTMLDivElement
  private overlayMount: HTMLDivElement
  private inventoryMount: HTMLDivElement
  private dialogueMount: HTMLDivElement
  private questState: QuestViewState[] = []
  private regionState: RegionProgressViewState | null = null
  private healthBarFill: HTMLElement | null = null
  private manaBarFill: HTMLElement | null = null
  private inventoryState: InventoryViewState | null = null
  private inventoryHandlers: InventoryPanelHandlers | null = null
  private inventoryOpen = false
  private inventoryRendererPromise: Promise<typeof import('./panels/renderInventoryPanel')> | null = null
  private dialogueRendererPromise: Promise<typeof import('./panels/renderDialoguePanel')> | null = null

  constructor() {
    this.container = document.createElement('div')
    this.container.id = 'ui-container'
    this.container.className = 'ui-root'
    this.hud = document.createElement('div')
    this.hud.className = 'hud-shell'
    this.questTracker = document.createElement('div')
    this.questTracker.className = 'quest-shell'
    this.overlayMount = document.createElement('div')
    this.overlayMount.className = 'overlay-mount'
    this.inventoryMount = document.createElement('div')
    this.inventoryMount.className = 'modal-mount hidden'
    this.dialogueMount = document.createElement('div')
    this.dialogueMount.className = 'modal-mount hidden'

    this.injectStyles()
    this.container.append(this.hud, this.questTracker, this.overlayMount, this.inventoryMount, this.dialogueMount)
    document.body.appendChild(this.container)
    this.createHUD()
    this.renderQuestShell()
  }

  public setInventoryHandlers(handlers: InventoryPanelHandlers): void {
    this.inventoryHandlers = handlers
  }

  public updateInventoryState(state: InventoryViewState): void {
    this.inventoryState = state
    if (this.inventoryOpen) {
      void this.renderInventory()
    }
  }

  public async toggleInventory(): Promise<void> {
    this.inventoryOpen = !this.inventoryOpen
    this.inventoryMount.classList.toggle('hidden', !this.inventoryOpen)
    if (this.inventoryOpen) {
      await this.renderInventory()
    }
  }

  public updateQuestTracker(quests: QuestViewState[]): void {
    this.questState = quests
    this.renderQuestShell()
  }

  public updateRegionProgress(state: RegionProgressViewState): void {
    this.regionState = state
    this.renderQuestShell()
  }

  private renderQuestShell(): void {
    this.questTracker.innerHTML = `
      <div class="panel-title"><img src="/icons/quest.svg" alt="Quests" /> Frontier Journal</div>
    `

    if (this.regionState?.currentRegion) {
      const regionCard = document.createElement('div')
      regionCard.className = 'region-card'
      regionCard.innerHTML = `
        <div class="region-card__eyebrow">Current Region</div>
        <div class="region-card__title">${this.regionState.currentRegion.name}</div>
        <div class="region-card__text">${this.regionState.currentRegion.description}</div>
        <div class="region-card__meta">Danger ${this.regionState.currentRegion.dangerLevel} • Recommended Level ${this.regionState.currentRegion.recommendedLevel ?? this.regionState.currentRegion.dangerLevel}</div>
      `
      this.questTracker.appendChild(regionCard)

      if (this.regionState.routes.length > 0) {
        const routesTitle = document.createElement('div')
        routesTitle.className = 'panel-title panel-title--spaced panel-title--small'
        routesTitle.textContent = 'Routes'
        this.questTracker.appendChild(routesTitle)

        this.regionState.routes.forEach((route) => {
          const routeCard = document.createElement('div')
          routeCard.className = `route-card ${route.unlocked ? 'route-card--open' : 'route-card--locked'}`
          const routeState = route.unlocked
            ? route.playable === false
              ? 'Route secured'
              : 'Route open'
            : 'Route sealed'
          routeCard.innerHTML = `
            <div class="route-card__title">${route.name}</div>
            <div class="route-card__text">${route.description}</div>
            <div class="route-card__meta">${routeState} • Danger ${route.dangerLevel} • Level ${route.recommendedLevel ?? route.dangerLevel}</div>
          `
          this.questTracker.appendChild(routeCard)
        })
      }
    }

    const questsTitle = document.createElement('div')
    questsTitle.className = 'panel-title panel-title--spaced panel-title--small'
    questsTitle.textContent = 'Active Quests'
    this.questTracker.appendChild(questsTitle)

    if (this.questState.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'quest-empty'
      empty.textContent = 'No active quests'
      this.questTracker.appendChild(empty)
      return
    }

    this.questState.forEach((quest) => {
      const card = document.createElement('div')
      card.className = 'quest-card'
      card.innerHTML = `<div class="quest-card__title">${quest.title}</div>`
      quest.objectives.forEach((objective) => {
        const line = document.createElement('div')
        line.className = `quest-card__objective ${objective.complete ? 'complete' : ''}`
        line.textContent = `${objective.description} (${objective.current}/${objective.target})`
        card.appendChild(line)
      })
      this.questTracker.appendChild(card)
    })
  }

  public updateHealth(current: number, max: number): void {
    if (this.healthBarFill) {
      const percentage = Math.max(0, Math.min(100, (current / max) * 100))
      this.healthBarFill.style.width = `${percentage}%`
      this.healthBarFill.style.background = this.getHealthColor(percentage)
    }
    this.setText('health-text', `${Math.ceil(current)}/${max}`)
  }

  public updateMana(current: number, max: number): void {
    if (this.manaBarFill) {
      const percentage = Math.max(0, Math.min(100, (current / max) * 100))
      this.manaBarFill.style.width = `${percentage}%`
    }
    this.setText('mana-text', `${Math.ceil(current)}/${max}`)
  }

  public updateLevel(level: number, experience: number): void {
    this.setText('level-text', level.toString())
    this.setText('exp-text', experience.toString())
  }

  public updateCombatStatus(text: string): void {
    this.setText('combat-status-text', text)
  }

  public async showDialogue(dialogue: DialogueViewState, onSelect: (optionId: string) => void, onClose: () => void): Promise<void> {
    this.dialogueMount.classList.remove('hidden')
    const renderer = await this.ensureDialogueRenderer()
    renderer.renderDialoguePanel(this.dialogueMount, dialogue, onSelect, onClose)
  }

  public hideDialogue(): void {
    this.dialogueMount.classList.add('hidden')
    this.dialogueMount.innerHTML = ''
  }

  public showNotification(message: string, type: NotificationType = 'info'): void {
    const note = document.createElement('div')
    note.className = `toast toast--${type}`
    note.textContent = message
    this.overlayMount.appendChild(note)
    window.setTimeout(() => note.remove(), 2200)
  }

  public showFloatingText(text: string, x: number, y: number, type: NotificationType = 'info'): void {
    const popup = document.createElement('div')
    popup.className = `world-popup world-popup--${type}`
    popup.textContent = text
    popup.style.left = `${x}px`
    popup.style.top = `${y}px`
    this.overlayMount.appendChild(popup)
    window.setTimeout(() => popup.remove(), 900)
  }

  public destroy(): void {
    this.container.remove()
  }

  private async renderInventory(): Promise<void> {
    if (!this.inventoryState || !this.inventoryHandlers) {
      return
    }

    const renderer = await this.ensureInventoryRenderer()
    renderer.renderInventoryPanel(this.inventoryMount, this.inventoryState, this.inventoryHandlers)
  }

  private createHUD(): void {
    this.hud.innerHTML = `
      <div class="panel-title"><img class="panel-title__logo" src="/squarelogo.PNG" alt="Echoes crest" /> Echoes of the Riftwar</div>
      <div class="hud-block">
        <div class="bar-label"><span>Health</span><span id="health-text">100/100</span></div>
        <div class="bar-track"><div id="health-fill" class="bar-fill bar-fill--health"></div></div>
      </div>
      <div class="hud-block">
        <div class="bar-label"><span>Mana</span><span id="mana-text">50/50</span></div>
        <div class="bar-track"><div id="mana-fill" class="bar-fill bar-fill--mana"></div></div>
      </div>
      <div class="hud-meta">
        <div>Level <strong id="level-text">1</strong></div>
        <div>EXP <strong id="exp-text">0</strong></div>
      </div>
      <div class="hud-status">Combat: <strong id="combat-status-text">Free target</strong></div>
      <div class="hud-controls">WASD move • Q lock • V dodge • Space attack • E talk • I inventory • F5 save • F9 load</div>
    `

    this.healthBarFill = this.hud.querySelector('#health-fill')
    this.manaBarFill = this.hud.querySelector('#mana-fill')
  }

  private ensureInventoryRenderer(): Promise<typeof import('./panels/renderInventoryPanel')> {
    if (!this.inventoryRendererPromise) {
      this.inventoryRendererPromise = import('./panels/renderInventoryPanel')
    }
    return this.inventoryRendererPromise
  }

  private ensureDialogueRenderer(): Promise<typeof import('./panels/renderDialoguePanel')> {
    if (!this.dialogueRendererPromise) {
      this.dialogueRendererPromise = import('./panels/renderDialoguePanel')
    }
    return this.dialogueRendererPromise
  }

  private setText(id: string, value: string): void {
    const node = document.getElementById(id)
    if (node) {
      node.textContent = value
    }
  }

  private getHealthColor(percentage: number): string {
    if (percentage > 50) {
      return 'linear-gradient(90deg, #3ac47d, #f0d264)'
    }
    if (percentage > 25) {
      return 'linear-gradient(90deg, #f0d264, #f08a5d)'
    }
    return 'linear-gradient(90deg, #f08a5d, #e84545)'
  }

  private injectStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      :root {
        --ui-bg: rgba(8, 16, 28, 0.84);
        --ui-panel: rgba(16, 28, 46, 0.92);
        --ui-border: rgba(163, 191, 250, 0.35);
        --ui-text: #ecf3ff;
        --ui-muted: #92a5c6;
        --ui-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
      }
      .ui-root { position: absolute; inset: 0; pointer-events: none; font-family: Georgia, 'Segoe UI', serif; color: var(--ui-text); }
      .hud-shell, .quest-shell { position: absolute; backdrop-filter: blur(10px); background-image: linear-gradient(180deg, rgba(20,34,56,0.9), rgba(9,14,24,0.9)), url('/art/rift-noise.svg'); background-size: cover, 220px 220px; background-repeat: no-repeat, repeat; border: 1px solid var(--ui-border); border-radius: 18px; box-shadow: var(--ui-shadow); pointer-events: auto; }
      .hud-shell { top: 18px; left: 18px; width: 300px; padding: 18px; }
      .quest-shell { top: 18px; right: 18px; width: 320px; padding: 18px; }
      .panel-title { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 700; letter-spacing: 0.03em; margin-bottom: 14px; }
      .panel-title img { width: 18px; height: 18px; }
      .panel-title__logo { width: 24px; height: 24px; border-radius: 6px; box-shadow: 0 0 0 1px rgba(255,255,255,0.2); }
      .panel-title--spaced { margin-top: 18px; }
      .panel-title--small { font-size: 13px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--ui-muted); }
      .hud-block { margin-bottom: 12px; }
      .bar-label, .hud-meta { display: flex; justify-content: space-between; font-size: 13px; color: var(--ui-muted); margin-bottom: 6px; }
      .hud-meta { margin-top: 10px; color: var(--ui-text); }
      .hud-status { margin-top: 10px; font-size: 12px; color: var(--ui-muted); }
      .hud-status strong { color: #f0d264; font-weight: 700; }
      .bar-track { height: 14px; border-radius: 999px; background: rgba(255,255,255,0.1); overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
      .bar-fill { height: 100%; border-radius: inherit; transition: width 160ms ease; }
      .bar-fill--health { background: linear-gradient(90deg, #3ac47d, #f0d264); }
      .bar-fill--mana { background: linear-gradient(90deg, #4d9eff, #6be6ff); }
      .hud-controls { margin-top: 12px; font-size: 12px; color: var(--ui-muted); }
      .quest-card { padding: 12px 14px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.05); margin-top: 10px; }
      .region-card, .route-card { padding: 14px; border-radius: 14px; margin-top: 10px; border: 1px solid rgba(255,255,255,0.08); }
      .region-card { background: linear-gradient(180deg, rgba(125, 78, 44, 0.24), rgba(38, 22, 14, 0.28)); }
      .route-card { background: rgba(255,255,255,0.03); }
      .route-card--open { border-color: rgba(126, 223, 168, 0.32); }
      .route-card--locked { border-color: rgba(244, 213, 141, 0.16); opacity: 0.78; }
      .region-card__eyebrow { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #e3cba0; margin-bottom: 6px; }
      .region-card__title, .route-card__title { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
      .region-card__text, .route-card__text, .region-card__meta, .route-card__meta { font-size: 12px; line-height: 1.45; color: var(--ui-muted); }
      .region-card__meta, .route-card__meta { margin-top: 8px; }
      .quest-card__title { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
      .quest-card__objective { font-size: 12px; color: var(--ui-muted); margin-top: 6px; }
      .quest-card__objective.complete { color: #7ce3ab; }
      .quest-empty { color: var(--ui-muted); font-size: 13px; }
      .overlay-mount { position: absolute; inset: 0; pointer-events: none; }
      .toast { position: absolute; left: 50%; top: 18%; transform: translateX(-50%); padding: 12px 16px; border-radius: 999px; background: rgba(10,18,30,0.92); border: 1px solid rgba(255,255,255,0.12); animation: toast-rise 2.2s ease forwards; }
      .toast--success { color: #90efb3; }
      .toast--warning { color: #f4d58d; }
      .toast--error { color: #ff8a8a; }
      .toast--info { color: #b7d6ff; }
      .world-popup { position: absolute; transform: translate(-50%, -50%); font-size: 13px; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.7); animation: world-popup 0.9s ease forwards; }
      .world-popup--success { color: #9cffc8; }
      .world-popup--warning { color: #f4d58d; }
      .world-popup--error { color: #ff9f9f; }
      .world-popup--info { color: #d7e6ff; }
      .modal-mount { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 32px; pointer-events: auto; background: rgba(5, 8, 15, 0.52); }
      .modal-mount.hidden { display: none; }
      .inventory-shell, .dialogue-shell { width: min(1080px, calc(100vw - 80px)); border-radius: 24px; background-image: linear-gradient(180deg, rgba(22,34,56,0.98), rgba(10,16,28,0.98)), url('/art/rift-lines.svg'); background-size: cover, 300px 300px; border: 1px solid var(--ui-border); box-shadow: var(--ui-shadow); }
      .inventory-shell { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(260px, 0.9fr); gap: 20px; padding: 24px; }
      .inventory-column { min-width: 0; }
      .inventory-column--narrow { border-left: 1px solid rgba(255,255,255,0.08); padding-left: 20px; }
      .inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
      .inventory-card, .equipment-row, .dialogue-option, .dialogue-close { font: inherit; color: inherit; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px; cursor: pointer; text-align: left; transition: transform 120ms ease, background 120ms ease; }
      .inventory-card:hover, .equipment-row:hover, .dialogue-option:hover, .dialogue-close:hover { transform: translateY(-1px); background: rgba(255,255,255,0.08); }
      .inventory-card__name { font-weight: 700; margin-bottom: 4px; }
      .inventory-card__meta, .inventory-card__stats, .inventory-card__desc { font-size: 12px; color: var(--ui-muted); margin-top: 6px; }
      .inventory-card__action { display: inline-block; margin-top: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9cd4ff; }
      .inventory-empty { padding: 20px; border-radius: 14px; background: rgba(255,255,255,0.04); color: var(--ui-muted); }
      .equipment-list, .stats-card { display: grid; gap: 10px; }
      .equipment-row { display: flex; justify-content: space-between; align-items: center; }
      .equipment-row:disabled { cursor: default; opacity: 0.6; }
      .equipment-row__slot { text-transform: capitalize; color: var(--ui-muted); }
      .stats-card { padding: 14px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
      .dialogue-shell { max-width: 760px; padding: 22px; }
      .dialogue-header { display: flex; align-items: center; gap: 12px; font-size: 18px; font-weight: 700; }
      .dialogue-header img { width: 18px; height: 18px; }
      .dialogue-close { margin-left: auto; }
      .dialogue-body { margin: 16px 0; font-size: 15px; line-height: 1.7; color: #dfe7f2; }
      .dialogue-options { display: grid; gap: 10px; }
      @keyframes toast-rise { 0% { opacity: 0; transform: translate(-50%, 20px); } 12% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -30px); } }
      @keyframes world-popup { 0% { opacity: 0; transform: translate(-50%, -20%); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -140%); } }
      @media (max-width: 900px) {
        .inventory-shell { grid-template-columns: 1fr; }
        .inventory-column--narrow { border-left: 0; padding-left: 0; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; }
        .quest-shell { width: 280px; }
      }
    `
    document.head.appendChild(style)
  }
}
