import type ItemManager from '../content/ItemManager'
import type QuestManager from '../content/QuestManager'
import type { ItemData, QuestData, QuestObjective } from '../../data/types'
import type { QuestViewState } from '../ui/uiTypes'
import type { Player3D } from '../../entities/Player3D'

export interface ActiveQuest {
  data: QuestData
  progress: Record<string, number>
  completed: boolean
  rewarded: boolean
}

export interface QuestEventResult {
  started?: string
  completed?: string[]
  completedIds?: string[]
  rewards?: string[]
}

export interface QuestJournalSnapshot {
  completedQuestIds: string[]
  activeQuests: Array<{
    questId: string
    progress: Record<string, number>
    completed: boolean
    rewarded: boolean
  }>
}

export class QuestJournal {
  private activeQuests = new Map<string, ActiveQuest>()
  private completedQuestIds = new Set<string>()

  constructor(
    private readonly questManager: QuestManager,
    private readonly itemManager: ItemManager,
  ) {}

  public startQuest(questId: string): QuestEventResult {
    const existing = this.activeQuests.get(questId)
    if (existing) {
      return {}
    }

    const quest = this.questManager.getQuest(questId)
    if (!quest) {
      return {}
    }

    const progress = quest.objectives.reduce((accumulator, objective) => {
      accumulator[objective.id] = 0
      return accumulator
    }, {} as Record<string, number>)

    this.activeQuests.set(questId, {
      data: quest,
      progress,
      completed: false,
      rewarded: false,
    })

    return { started: quest.title }
  }

  public onEnemyKilled(enemyId: string, player: Player3D): QuestEventResult {
    return this.advanceByType('kill', enemyId, player)
  }

  public onVisit(targetId: string, player: Player3D): QuestEventResult {
    return this.advanceByType('visit', targetId, player)
  }

  public onTalk(targetId: string, player: Player3D): QuestEventResult {
    return this.advanceByType('talk', targetId, player)
  }

  public hasActiveQuest(questId: string): boolean {
    return this.activeQuests.has(questId)
  }

  public hasCompletedQuest(questId: string): boolean {
    return this.completedQuestIds.has(questId)
  }

  public getViewState(): QuestViewState[] {
    return Array.from(this.activeQuests.values()).map((quest) => ({
      id: quest.data.id,
      title: quest.data.title,
      complete: quest.completed,
      objectives: quest.data.objectives.map((objective) => ({
        id: objective.id,
        description: objective.description,
        current: quest.progress[objective.id] ?? 0,
        target: objective.count ?? 1,
        complete: this.isObjectiveComplete(objective, quest.progress[objective.id] ?? 0),
      })),
    }))
  }

  public getCompletedQuestIds(): string[] {
    return Array.from(this.completedQuestIds)
  }

  public getSnapshot(): QuestJournalSnapshot {
    return {
      completedQuestIds: Array.from(this.completedQuestIds),
      activeQuests: Array.from(this.activeQuests.values()).map((quest) => ({
        questId: quest.data.id,
        progress: { ...quest.progress },
        completed: quest.completed,
        rewarded: quest.rewarded,
      })),
    }
  }

  public restoreFromSnapshot(snapshot: QuestJournalSnapshot): void {
    this.activeQuests.clear()
    this.completedQuestIds = new Set(snapshot.completedQuestIds ?? [])

    ;(snapshot.activeQuests ?? []).forEach((savedQuest) => {
      const data = this.questManager.getQuest(savedQuest.questId)
      if (!data) {
        return
      }

      const progress = data.objectives.reduce((accumulator, objective) => {
        const target = objective.count ?? 1
        const savedValue = savedQuest.progress?.[objective.id] ?? 0
        accumulator[objective.id] = Math.max(0, Math.min(target, savedValue))
        return accumulator
      }, {} as Record<string, number>)

      const completed = savedQuest.completed || data.objectives.every((objective) => {
        const current = progress[objective.id] ?? 0
        return this.isObjectiveComplete(objective, current)
      })

      if (completed) {
        this.completedQuestIds.add(data.id)
      }

      this.activeQuests.set(data.id, {
        data,
        progress,
        completed,
        rewarded: Boolean(savedQuest.rewarded),
      })
    })
  }

  private advanceByType(type: QuestObjective['type'], targetId: string, player: Player3D): QuestEventResult {
    const completed: string[] = []
    const completedIds: string[] = []
    const rewards: string[] = []

    this.activeQuests.forEach((quest) => {
      if (quest.completed) {
        return
      }

      let dirty = false
      quest.data.objectives.forEach((objective) => {
        if (objective.type !== type || objective.targetId !== targetId) {
          return
        }

        if (!this.areObjectiveRequirementsMet(quest, objective)) {
          return
        }

        const targetCount = objective.count ?? 1
        const current = quest.progress[objective.id] ?? 0
        if (current >= targetCount) {
          return
        }

        quest.progress[objective.id] = Math.min(targetCount, current + 1)
        dirty = true
      })

      if (!dirty) {
        return
      }

      if (this.isQuestComplete(quest)) {
        quest.completed = true
        completed.push(quest.data.title)
        completedIds.push(quest.data.id)
        this.completedQuestIds.add(quest.data.id)
        rewards.push(...this.grantRewards(quest, player))
      }
    })

    return { completed, completedIds, rewards }
  }

  private grantRewards(quest: ActiveQuest, player: Player3D): string[] {
    if (quest.rewarded) {
      return []
    }

    const granted: string[] = []
    quest.data.rewards.forEach((reward) => {
      if (reward.experience) {
        player.addExperience(reward.experience)
        granted.push(`${reward.experience} XP`)
      }

      if (reward.itemId) {
        const item = this.itemManager.getItem(reward.itemId)
        if (item) {
          player.addToInventory(item)
          granted.push(item.name)
        }
      }
    })

    quest.rewarded = true
    return granted
  }

  private isQuestComplete(quest: ActiveQuest): boolean {
    return quest.data.objectives.every((objective) => {
      const current = quest.progress[objective.id] ?? 0
      return this.isObjectiveComplete(objective, current)
    })
  }

  private isObjectiveComplete(objective: QuestObjective, current: number): boolean {
    return current >= (objective.count ?? 1)
  }

  private areObjectiveRequirementsMet(quest: ActiveQuest, objective: QuestObjective): boolean {
    return (objective.requiredObjectiveIds ?? []).every((requiredId) => {
      const requiredObjective = quest.data.objectives.find((entry) => entry.id === requiredId)
      if (!requiredObjective) {
        return true
      }

      return this.isObjectiveComplete(requiredObjective, quest.progress[requiredId] ?? 0)
    })
  }
}