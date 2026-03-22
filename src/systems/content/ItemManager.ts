import itemsData from '../../data/content/items.json'
import type { ItemData } from '../../data/types'

export default class ItemManager {
  private items: Record<string, ItemData> = {}

  async load(): Promise<void> {
    this.items = (itemsData as ItemData[]).reduce((acc, item) => {
      acc[item.id] = item
      return acc
    }, {} as Record<string, ItemData>)
  }

  getItem(id: string): ItemData | undefined {
    return this.items[id]
  }

  getItems(): ItemData[] {
    return Object.values(this.items)
  }

  getAll(): ItemData[] {
    return Object.values(this.items)
  }

  getItemsByType(type: string): ItemData[] {
    return this.getAll().filter(item => item.type === type)
  }

  getItemsByRarity(rarity: string): ItemData[] {
    return this.getAll().filter(item => item.rarity === rarity)
  }
}
