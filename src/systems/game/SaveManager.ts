import type { PlayerSnapshot } from '../../entities/Player3D'
import type { QuestJournalSnapshot } from './QuestJournal'
import type { RegionProgressionSnapshot } from './RegionProgression'
import type { WorldRuntimeSnapshot } from '../world/WorldManager'

export interface GameSaveSnapshot {
  version: number
  savedAtIso: string
  currentRegionId: string
  player: PlayerSnapshot
  questJournal: QuestJournalSnapshot
  regionProgression: RegionProgressionSnapshot
  world: WorldRuntimeSnapshot
}

export interface SaveSummary {
  version: number
  savedAtIso: string
  currentRegionId: string
}

export type SaveInspection =
  | { status: 'missing' }
  | { status: 'corrupt' }
  | { status: 'version-mismatch'; foundVersion: number | null; expectedVersion: number }
  | { status: 'ok'; summary: SaveSummary }

export type SaveLoadResult =
  | { status: 'missing' }
  | { status: 'corrupt' }
  | { status: 'version-mismatch'; foundVersion: number | null; expectedVersion: number }
  | { status: 'ok'; snapshot: GameSaveSnapshot }

export default class SaveManager {
  public static readonly SAVE_VERSION = 2
  private static readonly STORAGE_KEY = 'echoes_of_riftwar_save'

  public inspect(): SaveInspection {
    const raw = this.readRaw()
    if (!raw) {
      return { status: 'missing' }
    }

    try {
      const parsed = JSON.parse(raw) as Partial<GameSaveSnapshot>
      if (typeof parsed.version !== 'number') {
        return { status: 'corrupt' }
      }

      if (parsed.version !== SaveManager.SAVE_VERSION) {
        return {
          status: 'version-mismatch',
          foundVersion: parsed.version,
          expectedVersion: SaveManager.SAVE_VERSION,
        }
      }

      if (!this.isValidSnapshot(parsed)) {
        return { status: 'corrupt' }
      }

      return {
        status: 'ok',
        summary: {
          version: parsed.version,
          savedAtIso: parsed.savedAtIso!,
          currentRegionId: parsed.currentRegionId!,
        },
      }
    } catch (error) {
      console.warn('Failed to inspect save data', error)
      return { status: 'corrupt' }
    }
  }

  public save(snapshot: Omit<GameSaveSnapshot, 'version' | 'savedAtIso'>): SaveSummary | null {
    if (!this.isStorageAvailable()) {
      return null
    }

    const payload: GameSaveSnapshot = {
      ...snapshot,
      version: SaveManager.SAVE_VERSION,
      savedAtIso: new Date().toISOString(),
    }

    try {
      localStorage.setItem(SaveManager.STORAGE_KEY, JSON.stringify(payload))
      return {
        version: payload.version,
        savedAtIso: payload.savedAtIso,
        currentRegionId: payload.currentRegionId,
      }
    } catch (error) {
      console.warn('Failed to write save data', error)
      return null
    }
  }

  public load(): SaveLoadResult {
    const inspection = this.inspect()
    if (inspection.status !== 'ok') {
      return inspection
    }

    const raw = this.readRaw()
    if (!raw) {
      return { status: 'missing' }
    }

    try {
      const parsed = JSON.parse(raw) as GameSaveSnapshot
      return { status: 'ok', snapshot: parsed }
    } catch (error) {
      console.warn('Failed to parse save data', error)
      return { status: 'corrupt' }
    }
  }

  public clear(): void {
    if (!this.isStorageAvailable()) {
      return
    }

    localStorage.removeItem(SaveManager.STORAGE_KEY)
  }

  private readRaw(): string | null {
    if (!this.isStorageAvailable()) {
      return null
    }

    return localStorage.getItem(SaveManager.STORAGE_KEY)
  }

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }

  private isValidSnapshot(snapshot: Partial<GameSaveSnapshot>): boolean {
    if (!snapshot.player || !snapshot.questJournal || !snapshot.regionProgression || !snapshot.world) {
      return false
    }

    if (typeof snapshot.savedAtIso !== 'string' || typeof snapshot.currentRegionId !== 'string') {
      return false
    }

    return snapshot.currentRegionId.length > 0
  }
}