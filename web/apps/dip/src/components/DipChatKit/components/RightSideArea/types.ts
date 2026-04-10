import type { DipChatKitPreviewPayload } from '../../types'

export interface RightSideAreaProps {
  visible: boolean
  payload: DipChatKitPreviewPayload | null
  onClose: () => void
  fullscreen: boolean
  onToggleFullscreen: () => void
}
