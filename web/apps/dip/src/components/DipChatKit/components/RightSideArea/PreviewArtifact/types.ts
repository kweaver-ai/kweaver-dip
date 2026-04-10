import type { DipChatKitPreviewPayload } from '../../../types'

export interface PreviewArtifactProps {
  payload: DipChatKitPreviewPayload
  onClose: () => void
  fullscreen: boolean
  onToggleFullscreen: () => void
}
