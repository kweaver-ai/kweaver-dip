import { createSearchParams, useLocation, useNavigate } from 'react-router-dom'
import PlanList from '@/components/WorkPlanList'

/** 工作计划 */
const WorkPlan = () => {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <div className="h-full flex flex-col bg-[--dip-white] overflow-hidden">
      <div className="flex justify-between p-6 flex-shrink-0 z-20">
        <div className="flex flex-col gap-y-2">
          <span className="font-medium text-base text-[--dip-text-color]">工作计划</span>
          <span className="text-[--dip-text-color-65]">管理工作计划</span>
        </div>
      </div>
      <PlanList
        source={{ mode: 'global' }}
        onPlanClick={(job) => {
          const from = `${location.pathname}${location.search}`
          navigate(
            {
              pathname: `/work-plan/${job.id}`,
              search: `?${createSearchParams({
                sessionKey: job.sessionKey,
              })}`,
            },
            { state: { from } },
          )
        }}
      />
    </div>
  )
}

export default WorkPlan
