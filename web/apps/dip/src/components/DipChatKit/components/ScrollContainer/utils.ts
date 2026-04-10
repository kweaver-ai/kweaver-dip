export const BOTTOM_THRESHOLD = 8

export const isScrollAtBottom = (element: HTMLDivElement): boolean => {
  const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight
  return distanceToBottom <= BOTTOM_THRESHOLD
}
