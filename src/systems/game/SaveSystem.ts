import type { PlayerSnapshot } from '../../entities/Player3D'
import type { QuestJournalSnapshot } from './QuestJournal'
import type { RegionProgressionSnapshot } from './RegionProgression'

export interface GameSaveSnapshot {
  version: number
  savedAtIso: string
  currentRegionId: string
  player: PlayerSnapshot
  questJournal: QuestJournalSnapshot
  regionProgression: RegionProgressionSnapshot
}

export default class SaveSystem {
  private static readonly SAVE_VERSION = 1
  private static readonly STORAGE_KEY = 'echoes_of_riftwar_save'

  public save(snapshot: Omit<GameSaveSnapshot, 'version' | 'savedAtIso'>): boolean {
    if (!this.isStorageAvailable()) {
      return false
    }

    const payload: GameSaveSnapshot = {
      ...snapshot,
      version: SaveSystem.SAVE_VERSION,
      savedAtIso: new Date().toISOString(),
    }

    try {
      localStorage.setItem(SaveSystem.STORAGE_KEY, JSON.stringify(payload))
      return true
    } catch (error) {
      console.warn('Failed to write save data', error)
      return false
    }
  }

  public load(): GameSaveSnapshot | null {
    if (!this.isStorageAvailable()) {
      return null
    }

    const raw = localStorage.getItem(SaveSystem.STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as Partial<GameSaveSnapshot>
      if (!this.isValidSnapshot(parsed)) {
        return null
      }
      return parsed as GameSaveSnapshot
    } catch (error) {
      console.warn('Failed to parse save data', error)
      return null
    }
  }

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }

  private isValidSnapshot(snapshot: Partial<GameSaveSnapshot>): boolean {
    if (!snapshot || typeof snapshot !== 'object') {
      return false
    }

    if (snapshot.version !== SaveSystem.SAVE_VERSION) {
      return false
    }

    if (!snapshot.player || !snapshot.questJournal || !snapshot.regionProgression) {
      return false
    }

    return typeof snapshot.currentRegionId === 'string' && snapshot.currentRegionId.length > 0
  }
}