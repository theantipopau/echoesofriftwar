export class InputManager {
  private keys: Record<string, boolean> = {}
  private justPressed: Record<string, boolean> = {}
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 }
  private mouseButtons: Record<number, boolean> = {}

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.key.toLowerCase()]) {
        this.justPressed[e.key.toLowerCase()] = true
      }
      this.keys[e.key.toLowerCase()] = true
    })

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false
    })

    // Mouse
    document.addEventListener('mousemove', (e) => {
      this.mousePosition = { x: e.clientX, y: e.clientY }
    })

    document.addEventListener('mousedown', (e) => {
      this.mouseButtons[e.button] = true
    })

    document.addEventListener('mouseup', (e) => {
      this.mouseButtons[e.button] = false
    })
  }

  public isKeyPressed(key: string): boolean {
    return this.keys[key.toLowerCase()] || false
  }

  public wasKeyPressed(key: string): boolean {
    const normalized = key.toLowerCase()
    const value = this.justPressed[normalized] || false
    this.justPressed[normalized] = false
    return value
  }

  public isKeyDown(key: string): boolean {
    return this.keys[key.toLowerCase()] || false
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons[button] || false
  }

  public getMousePosition(): { x: number; y: number } {
    return this.mousePosition
  }

  public reset(): void {
    // Useful for when UI is focused
    Object.keys(this.keys).forEach((key) => {
      this.keys[key] = false
    })
    Object.keys(this.justPressed).forEach((key) => {
      this.justPressed[key] = false
    })
  }
}
