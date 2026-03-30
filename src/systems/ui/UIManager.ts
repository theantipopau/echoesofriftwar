import type { DialogueViewState, InventoryViewState, QuestViewState, RegionProgressViewState } from './uiTypes'
import type { InventoryPanelHandlers } from './panels/renderInventoryPanel'
import { assetPath } from '../../utils/assetPaths'

type NotificationType = 'info' | 'warning' | 'error' | 'success'

export class UIManager {
  private readonly baseAssetPath = assetPath('')
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
      <div class="panel-title"><img src="${assetPath('icons/quest.svg')}" alt="Quests" /> Frontier Journal</div>
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
      <div class="panel-title"><img class="panel-title__logo" src="${assetPath('squarelogo.PNG')}" alt="Echoes crest" /> Echoes of the Riftwar</div>
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
      /* ============================================================
         Echoes of the Riftwar — Premium UI Theme
         Palette: deep onyx + amber/gold + blood-crimson + rift-violet
      ============================================================ */
      :root {
        --ui-bg:          rgba(6, 10, 18, 0.90);
        --ui-panel:       rgba(14, 20, 34, 0.95);
        --ui-panel-warm:  rgba(22, 14, 10, 0.95);
        --ui-border:      rgba(180, 148, 72, 0.42);
        --ui-border-dim:  rgba(180, 148, 72, 0.18);
        --ui-text:        #e8dfc8;
        --ui-text-bright: #f5edda;
        --ui-muted:       #9a8e76;
        --ui-gold:        #c9a84c;
        --ui-gold-bright: #f0d060;
        --ui-red:         #c43030;
        --ui-green:       #4aad6a;
        --ui-blue:        #4a80cc;
        --ui-rift:        #8840cc;
        --ui-shadow:      0 20px 50px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(180,148,72,0.12);
        --ui-inner-glow:  inset 0 1px 0 rgba(255,220,120,0.12);
        --font-serif:     Georgia, 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
      }

      /* ─── Root ──────────────────────────────────────────────── */
      .ui-root {
        position: absolute;
        inset: 0;
        pointer-events: none;
        font-family: var(--font-serif);
        color: var(--ui-text);
        font-size: 14px;
      }

      /* ─── Shared panel shell ─────────────────────────────────── */
      .hud-shell, .quest-shell {
        position: absolute;
        backdrop-filter: blur(14px) saturate(1.1);
        background:
          linear-gradient(160deg, rgba(22,16,10,0.92) 0%, rgba(8,12,22,0.96) 100%),
          url('${this.baseAssetPath}art/rift-noise.svg');
        background-size: cover, 240px 240px;
        background-repeat: no-repeat, repeat;
        border: 1px solid var(--ui-border);
        border-top-color: rgba(240,210,100,0.55);
        border-radius: 4px;
        box-shadow: var(--ui-shadow), var(--ui-inner-glow);
        pointer-events: auto;
      }

      /* Decorative corner notch using outline + clip-path */
      .hud-shell::before, .quest-shell::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: 4px;
        background: linear-gradient(135deg, rgba(240,210,80,0.18) 0%, transparent 40%, transparent 60%, rgba(240,210,80,0.10) 100%);
        pointer-events: none;
      }

      .hud-shell  { top: 16px; left: 16px;  width: 290px; padding: 16px 18px; }
      .quest-shell { top: 16px; right: 16px; width: 310px; padding: 16px 18px; max-height: calc(100vh - 80px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--ui-gold) transparent; }

      /* ─── Panel title ────────────────────────────────────────── */
      .panel-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--ui-gold-bright);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--ui-border-dim);
      }
      .panel-title img { width: 18px; height: 18px; opacity: 0.85; }
      .panel-title__logo { width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--ui-border); }
      .panel-title--spaced { margin-top: 16px; }
      .panel-title--small {
        font-size: 11px;
        letter-spacing: 0.16em;
        color: var(--ui-muted);
        border-bottom-color: transparent;
        padding-bottom: 0;
        margin-bottom: 6px;
      }

      /* ─── HUD — bars ─────────────────────────────────────────── */
      .hud-block { margin-bottom: 10px; }

      .bar-label, .hud-meta {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        letter-spacing: 0.04em;
        color: var(--ui-muted);
        margin-bottom: 5px;
      }
      .hud-meta { margin-top: 10px; color: var(--ui-text); font-size: 13px; }

      .bar-track {
        height: 12px;
        border-radius: 2px;
        background: rgba(0,0,0,0.55);
        overflow: hidden;
        border: 1px solid rgba(180,148,72,0.22);
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
        position: relative;
      }
      .bar-track::before {
        content: '';
        position: absolute;
        inset: 0 0 50% 0;
        background: rgba(255,255,255,0.04);
        pointer-events: none;
      }
      .bar-fill {
        height: 100%;
        border-radius: inherit;
        transition: width 180ms ease, background 500ms ease;
        box-shadow: 0 0 8px rgba(255,200,80,0.20);
      }
      .bar-fill--health { background: linear-gradient(90deg, #962020 0%, #d44040 35%, #f07030 65%, #e8c040 100%); }
      .bar-fill--mana   { background: linear-gradient(90deg, #2040a0 0%, #4070e0 40%, #60b0ff 100%); }

      .hud-status {
        margin-top: 10px;
        font-size: 11px;
        color: var(--ui-muted);
        letter-spacing: 0.02em;
      }
      .hud-status strong { color: var(--ui-gold-bright); }

      .hud-controls {
        margin-top: 10px;
        font-size: 10px;
        color: rgba(154,142,118,0.55);
        letter-spacing: 0.02em;
        line-height: 1.6;
      }

      /* ─── Region & route cards ───────────────────────────────── */
      .region-card {
        padding: 12px 14px;
        border-radius: 3px;
        margin-top: 8px;
        border: 1px solid rgba(200,155,60,0.30);
        background: linear-gradient(160deg, rgba(50,28,10,0.55) 0%, rgba(18,10,6,0.60) 100%);
      }
      .route-card {
        padding: 10px 12px;
        border-radius: 3px;
        margin-top: 6px;
        border: 1px solid var(--ui-border-dim);
        background: rgba(255,255,255,0.03);
      }
      .route-card--open  { border-color: rgba(74,173,106,0.35); }
      .route-card--locked { border-color: rgba(180,148,72,0.14); opacity: 0.70; }

      .region-card__eyebrow {
        font-size: 10px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--ui-gold);
        margin-bottom: 5px;
      }
      .region-card__title, .route-card__title {
        font-size: 14px;
        font-weight: 700;
        color: var(--ui-text-bright);
        margin-bottom: 5px;
      }
      .region-card__text, .route-card__text,
      .region-card__meta,  .route-card__meta {
        font-size: 11px;
        line-height: 1.5;
        color: var(--ui-muted);
      }
      .region-card__meta, .route-card__meta { margin-top: 7px; }

      /* ─── Quest cards ────────────────────────────────────────── */
      .quest-card {
        padding: 10px 12px;
        border-radius: 3px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--ui-border-dim);
        margin-top: 8px;
      }
      .quest-card__title {
        font-size: 13px;
        font-weight: 700;
        color: var(--ui-gold-bright);
        margin-bottom: 6px;
      }
      .quest-card__objective {
        font-size: 11px;
        color: var(--ui-muted);
        margin-top: 5px;
        padding-left: 10px;
        border-left: 2px solid rgba(180,148,72,0.25);
      }
      .quest-card__objective.complete {
        color: var(--ui-green);
        border-left-color: var(--ui-green);
      }
      .quest-empty { color: var(--ui-muted); font-size: 12px; margin-top: 8px; }

      /* ─── Overlay / toasts ───────────────────────────────────── */
      .overlay-mount { position: absolute; inset: 0; pointer-events: none; }

      .toast {
        position: absolute;
        left: 50%;
        top: 18%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 2px;
        background: rgba(8,12,20,0.95);
        border: 1px solid var(--ui-border);
        border-top-color: rgba(240,210,80,0.50);
        font-size: 13px;
        letter-spacing: 0.04em;
        animation: toast-rise 2.4s ease forwards;
      }
      .toast--success { color: #7de8a8; }
      .toast--warning { color: #f0d060; }
      .toast--error   { color: #e86060; }
      .toast--info    { color: #90bcf0; }

      .world-popup {
        position: absolute;
        transform: translate(-50%, -50%);
        font-size: 14px;
        font-weight: 700;
        font-family: var(--font-serif);
        letter-spacing: 0.04em;
        text-shadow: 0 2px 12px rgba(0,0,0,0.8);
        animation: world-popup 1.0s ease forwards;
      }
      .world-popup--success { color: #80ffb0; }
      .world-popup--warning { color: #f0d060; }
      .world-popup--error   { color: #ff8080; }
      .world-popup--info    { color: #c0dcff; }

      /* ─── Modal backdrop ─────────────────────────────────────── */
      .modal-mount {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px;
        pointer-events: auto;
        background: rgba(2, 4, 10, 0.65);
      }
      .modal-mount.hidden { display: none; }

      /* ─── Inventory shell ────────────────────────────────────── */
      .inventory-shell, .dialogue-shell {
        width: min(1080px, calc(100vw - 80px));
        border-radius: 4px;
        background:
          linear-gradient(160deg, rgba(18,14,10,0.99) 0%, rgba(8,12,22,0.99) 100%),
          url('${this.baseAssetPath}art/rift-lines.svg');
        background-size: cover, 300px 300px;
        border: 1px solid var(--ui-border);
        border-top: 1px solid rgba(240,210,80,0.50);
        box-shadow: var(--ui-shadow);
      }
      .inventory-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(260px, 0.9fr);
        gap: 0;
        padding: 0;
      }
      .inventory-column {
        min-width: 0;
        padding: 22px;
      }
      .inventory-column--narrow {
        border-left: 1px solid var(--ui-border-dim);
        padding: 22px;
      }
      .inventory-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 10px;
      }

      /* ─── Interactive elements (cards / buttons) ─────────────── */
      .inventory-card, .equipment-row, .dialogue-option, .dialogue-close {
        font: inherit;
        color: var(--ui-text);
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--ui-border-dim);
        border-radius: 3px;
        padding: 10px 12px;
        cursor: pointer;
        text-align: left;
        transition: transform 100ms ease, background 120ms ease, border-color 120ms ease;
      }
      .inventory-card:hover, .equipment-row:hover, .dialogue-option:hover {
        transform: translateY(-1px);
        background: rgba(200,160,60,0.10);
        border-color: rgba(200,160,60,0.45);
      }
      .dialogue-close {
        padding: 6px 14px;
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--ui-muted);
      }
      .dialogue-close:hover { background: rgba(220,60,60,0.15); border-color: rgba(220,60,60,0.40); color: #ff9090; }

      .inventory-card__name { font-weight: 700; color: var(--ui-text-bright); margin-bottom: 4px; }
      .inventory-card__meta, .inventory-card__stats, .inventory-card__desc {
        font-size: 11px;
        color: var(--ui-muted);
        margin-top: 5px;
        line-height: 1.45;
      }
      .inventory-card__action {
        display: inline-block;
        margin-top: 10px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.10em;
        color: var(--ui-gold);
      }
      .inventory-empty {
        padding: 18px;
        border-radius: 3px;
        background: rgba(255,255,255,0.03);
        color: var(--ui-muted);
        font-size: 12px;
      }
      .equipment-list, .stats-card { display: grid; gap: 8px; }
      .equipment-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
      .equipment-row:disabled { cursor: default; opacity: 0.55; }
      .equipment-row__slot { text-transform: capitalize; color: var(--ui-muted); font-size: 12px; }
      .stats-card {
        padding: 12px 14px;
        border-radius: 3px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--ui-border-dim);
        font-size: 12px;
        line-height: 1.9;
        color: var(--ui-text);
      }

      /* ─── Dialogue shell ─────────────────────────────────────── */
      .dialogue-shell {
        max-width: 800px;
        width: min(800px, calc(100vw - 80px));
        padding: 0;
        overflow: hidden;
      }
      .dialogue-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 20px 22px 16px;
        border-bottom: 1px solid var(--ui-border-dim);
        background: rgba(0,0,0,0.25);
      }
      .dialogue-portrait-frame {
        flex-shrink: 0;
        width: 90px;
        height: 90px;
        border: 2px solid var(--ui-border);
        border-radius: 3px;
        overflow: hidden;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.4);
        background: rgba(0,0,0,0.4);
        /* Amber corner highlight */
        outline: 1px solid rgba(240,200,80,0.15);
        outline-offset: 2px;
      }
      .dialogue-portrait {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: top center;
        display: block;
        filter: saturate(0.85) contrast(1.05);
      }
      .dialogue-header-info {
        flex: 1;
        min-width: 0;
        align-self: center;
      }
      .dialogue-npc-name {
        font-size: 20px;
        font-weight: 700;
        color: var(--ui-gold-bright);
        letter-spacing: 0.04em;
        margin-bottom: 4px;
      }
      .dialogue-npc-title {
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ui-muted);
      }
      .dialogue-body {
        margin: 0;
        padding: 18px 22px;
        font-size: 15px;
        line-height: 1.75;
        color: var(--ui-text);
        border-bottom: 1px solid var(--ui-border-dim);
      }
      .dialogue-options {
        display: grid;
        gap: 8px;
        padding: 16px 22px 20px;
      }
      .dialogue-option {
        font-size: 14px;
        padding: 10px 14px;
        text-align: left;
      }
      .dialogue-option::before {
        content: '▶ ';
        font-size: 9px;
        color: var(--ui-gold);
        vertical-align: middle;
        margin-right: 4px;
        opacity: 0.6;
      }

      /* ─── Animations ─────────────────────────────────────────── */
      @keyframes toast-rise {
        0%   { opacity: 0; transform: translate(-50%, 16px); }
        10%  { opacity: 1; transform: translate(-50%, 0); }
        80%  { opacity: 1; }
        100% { opacity: 0; transform: translate(-50%, -24px); }
      }
      @keyframes world-popup {
        0%   { opacity: 0;   transform: translate(-50%, -10%); }
        18%  { opacity: 1; }
        100% { opacity: 0;   transform: translate(-50%, -160%); }
      }

      /* ─── Responsive ─────────────────────────────────────────── */
      @media (max-width: 900px) {
        .inventory-shell { grid-template-columns: 1fr; }
        .inventory-column--narrow { border-left: 0; padding-top: 0; border-top: 1px solid var(--ui-border-dim); }
        .quest-shell { width: 270px; }
        .dialogue-portrait-frame { width: 64px; height: 64px; }
        .dialogue-npc-name { font-size: 17px; }
      }
    `
    document.head.appendChild(style)
  }
}
