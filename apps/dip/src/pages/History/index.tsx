import { useNavigate } from 'react-router-dom'
import HistoryList from '@/components/HistoryList'

const History = () => {
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col bg-[--dip-white] overflow-hidden">
      <div className="flex justify-between p-6 flex-shrink-0 z-20">
        <div className="flex flex-col gap-y-2">
          <span className="font-medium text-base text-[--dip-text-color]">历史记录</span>
          <span className="text-[--dip-text-color-65]">查看和管理您的所有对话记录</span>
        </div>
      </div>
      <HistoryList
        source={{ mode: 'global' }}
        onHistoryClick={(session) => {
          navigate(`/history/${session.key}`)
        }}
      />
    </div>
  )
}

export default History
