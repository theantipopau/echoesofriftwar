// Small helper for mapping alternate keys if needed later
export const mapKeys = (scene: any) => {
  return scene.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT')
}
