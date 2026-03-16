import { memo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Employee } from '@/apis'
import { getDigitalEmployees } from '@/apis'
import AiInput from '@/components/AiInput'
import DEList from '@/components/DEList'
import { useListService } from '@/hooks/useListService'
import { useUserInfoStore } from '@/stores/userInfoStore'
import { useUserWorkPlanStore } from '@/stores/userWorkPlanStore'

const Conversation = () => {
  const navigate = useNavigate()
  const { userInfo } = useUserInfoStore()
  const { plans, fetchPlans } = useUserWorkPlanStore()
  useListService<Employee>({
    fetchFn: getDigitalEmployees,
  })
  const employees: Employee[] = [
    {
      id: 1,
      name: '运营小助手',
      description: '负责日常运营数据统计、报表生成和用户消息回复',
      icon: '',
      creator: '张三',
      created_at: new Date().toISOString(),
      editor: '张三',
      edited_at: new Date().toISOString(),
      status: 1,
      users: [
        userInfo,
        userInfo,
        userInfo,
        userInfo,
        userInfo,
        userInfo,
        userInfo,
        userInfo,
        userInfo,
        userInfo,
      ],
      plan_count: 100,
      task_success_rate: [
        { day: '2026-03-13', value: 80 },
        { day: '2026-03-12', value: 90 },
        { day: '2026-03-11', value: 60 },
        { day: '2026-03-10', value: 50 },
        { day: '2026-03-09', value: 70 },
        { day: '2026-03-08', value: 30 },
        { day: '2026-03-07', value: 50 },
      ],
    },
  ]

  useEffect(() => {
    if (!plans.length) {
      void fetchPlans()
    }
  }, [plans.length, fetchPlans])

  /** 发送消息 */
  const handleSend: Parameters<typeof AiInput>[0]['onSubmit'] = () => {
    navigate(`/studio/home`)
  }

  /** 点击数字员工卡片 */
  const handleCardClick = (employee: Employee) => {
    navigate(`/studio/digital-employee/${employee.id}/setting`)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '上午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  return (
    <div className="h-full p-6 py-8 flex flex-col relative">
      {/* 顶部：用户信息 */}
      <div className="text-3xl font-medium tracking-normal flex-shrink-0">
        {getGreeting()}，{userInfo?.vision_name}
      </div>
      <div className="text-base text-[--dip-text-color-65] mt-3">
        当前有{plans.length}个计划正在执行中，数字员工持续为你工作。
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-y-8">
        {/* 输入框 */}
        <div className="w-full mt-8">
          <AiInput
            employees={employees}
            onSubmit={handleSend}
            placeholder="输入任何指令，通过@指定数字员工即刻为你执行"
          />
        </div>
        {/* 数字员工卡片：固定在下方 */}
        <div className="flex flex-col gap-y-4 flex-shrink-0 w-full mb-8">
          <div className="text-base font-medium tracking-normal">数字员工</div>
          <DEList employees={employees.slice(0, 3)} onCardClick={handleCardClick} />
        </div>
      </div>
    </div>
  )
}

export default memo(Conversation)
