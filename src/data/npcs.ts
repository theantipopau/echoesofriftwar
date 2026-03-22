export type DialogOption = {
  id: string
  text: string
  next?: string
  onSelect?: string // optional action key (e.g., "open_inventory")
}

export type DialogueNode = {
  id: string
  text: string
  options?: DialogOption[]
}

export type NpcTemplate = {
  id: string
  name: string
  portraitKey: string
  role: 'quest' | 'merchant' | 'trainer' | 'story' | 'neutral'
  description: string
  dialogTree: Record<string, DialogueNode>
}

export const NpcTemplates: Record<string, NpcTemplate> = {
  crydee_guard: {
    id: 'crydee_guard',
    name: 'Crydee Guard',
    portraitKey: 'portraits_guard',
    role: 'story',
    description: 'A seasoned guard of Crydee Castle, standing watch over the frontier.',
    dialogTree: {
      start: {
        id: 'start',
        text: 'Greetings, traveler. The roads are not safe beyond the village. Rumor says strange rifts have opened nearby.',
        options: [
          { id: 'ask_rifts', text: 'Tell me about these rifts.', next: 'rifts_intro' },
          { id: 'ask_help', text: 'Is there anything I can do to help?', next: 'help_offer' },
          { id: 'goodbye', text: 'I should be going.', next: 'end' }
        ]
      },
      rifts_intro: {
        id: 'rifts_intro',
        text: 'The rifts are tears in the world. Creatures come through them, and the soil itself feels sick. If you find a rift, report it to Captain Arutha at the keep.',
        options: [
          { id: 'offer_help', text: 'I will look into it.', next: 'end' },
          { id: 'goodbye', text: 'Understood. Farewell.', next: 'end' }
        ]
      },
      help_offer: {
        id: 'help_offer',
        text: 'We could use strong arms. Check the notice board in town or speak to the captain. If you find strange creatures, come back and tell me.',
        options: [
          { id: 'thanks', text: 'Thanks for the tip.', next: 'end' }
        ]
      },
      end: {
        id: 'end',
        text: 'Stay safe, and may the gods watch over you.',
        options: []
      }
    }
  }
}
