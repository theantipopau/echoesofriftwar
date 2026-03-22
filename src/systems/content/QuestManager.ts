import questsData from '../../data/content/quests.json'
import type { QuestData } from '../../data/types'

export default class QuestManager {
  private quests: Record<string, QuestData> = {}

  async load(): Promise<void> {
    this.quests = (questsData as QuestData[]).reduce((acc, quest) => {
      acc[quest.id] = quest
      return acc
    }, {} as Record<string, QuestData>)
  }

  getQuest(id: string): QuestData | undefined {
    return this.quests[id]
  }

  getAll(): QuestData[] {
    return Object.values(this.quests)
  }
}
