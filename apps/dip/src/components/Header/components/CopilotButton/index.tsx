import CopilotIcon from '@/assets/images/header/copilot.svg?react'

interface CopilotButtonProps {
  onClick?: () => void
}

/**
 * Copilot 按钮组件
 */
export const CopilotButton = ({ onClick }: CopilotButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-x-[8px] px-[8px] py-[5px] bg-white border-0 rounded-[6px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.1)] cursor-pointer transition-shadow duration-200 hover:shadow-[0px_4px_12px_0px_rgba(0,0,0,0.15)]"
    >
      <CopilotIcon />
      <span className="text-xs font-normal leading-[1.33] text-black">Copilot</span>
    </button>
  )
}
