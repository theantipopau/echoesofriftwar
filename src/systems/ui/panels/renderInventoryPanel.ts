import type { InventoryViewState } from '../uiTypes'
import { assetPath } from '../../../utils/assetPaths'

export interface InventoryPanelHandlers {
  onEquip: (itemId: string) => void
  onConsume: (itemId: string) => void
  onUnequip: (slot: string) => void
}

const rarityClass: Record<string, string> = {
  common: '#cad5e5',
  uncommon: '#54d28c',
  rare: '#5c8fff',
  epic: '#cc78f0',
  legendary: '#f6bc49',
}

function formatStats(stats: Record<string, number | undefined>): string {
  return Object.entries(stats)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] !== 0)
    .map(([key, value]) => `${key} +${value}`)
    .join(' • ') || 'No modifiers'
}

export function renderInventoryPanel(container: HTMLElement, state: InventoryViewState, handlers: InventoryPanelHandlers): void {
  container.innerHTML = ''

  const shell = document.createElement('div')
  shell.className = 'inventory-shell'

  const left = document.createElement('div')
  left.className = 'inventory-column'
  left.innerHTML = `
    <div class="panel-title"><img src="${assetPath('squarelogo.PNG')}" alt="Inventory" /> Inventory</div>
    <div class="inventory-grid"></div>
  `

  const grid = left.querySelector('.inventory-grid') as HTMLDivElement
  state.items.forEach((item) => {
    const card = document.createElement('button')
    card.type = 'button'
    card.className = 'inventory-card'
    card.style.borderColor = rarityClass[item.rarity] ?? rarityClass.common
    const actionLabel = item.type === 'consumable' ? 'Use' : item.type === 'weapon' || item.type === 'armor' || item.type === 'relic' ? 'Equip' : 'Inspect'
    card.innerHTML = `
      <div class="inventory-card__name">${item.name}</div>
      <div class="inventory-card__meta">${item.type} • ${item.rarity}</div>
      <div class="inventory-card__stats">${formatStats(item.stats)}</div>
      <div class="inventory-card__desc">${item.description}</div>
      <span class="inventory-card__action">${actionLabel}</span>
    `

    if (item.type === 'consumable') {
      card.addEventListener('click', () => handlers.onConsume(item.id))
    } else if (item.type === 'weapon' || item.type === 'armor' || item.type === 'relic') {
      card.addEventListener('click', () => handlers.onEquip(item.id))
    }

    grid.appendChild(card)
  })

  if (state.items.length === 0) {
    grid.innerHTML = '<div class="inventory-empty">No items carried.</div>'
  }

  const right = document.createElement('div')
  right.className = 'inventory-column inventory-column--narrow'
  right.innerHTML = `
    <div class="panel-title"><img src="${assetPath('logo.PNG')}" alt="Loadout" /> Loadout</div>
    <div class="equipment-list"></div>
    <div class="panel-title panel-title--spaced">Stats</div>
    <div class="stats-card">
      <div>Attack <strong>${state.stats.attack}</strong></div>
      <div>Defense <strong>${state.stats.defense}</strong></div>
      <div>Max Health <strong>${state.stats.maxHealth}</strong></div>
      <div>Max Mana <strong>${state.stats.maxMana}</strong></div>
      <div>Speed <strong>${state.stats.speed}</strong></div>
    </div>
  `

  const equipmentList = right.querySelector('.equipment-list') as HTMLDivElement
  state.equipment.forEach((entry) => {
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'equipment-row'
    row.innerHTML = `
      <span class="equipment-row__slot">${entry.slot}</span>
      <span class="equipment-row__item">${entry.item?.name ?? 'Empty'}</span>
    `

    if (entry.item) {
      row.addEventListener('click', () => handlers.onUnequip(entry.slot))
    } else {
      row.disabled = true
    }

    equipmentList.appendChild(row)
  })

  shell.appendChild(left)
  shell.appendChild(right)
  container.appendChild(shell)
}