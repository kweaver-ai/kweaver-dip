import { useCallback, useState } from 'react'
import { createSearchParams, useLocation, useNavigate } from 'react-router-dom'
import SearchInput from '@/components/SearchInput'
import PlanList from '@/components/WorkPlanList'

/** 工作计划 */
const WorkPlan = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchValue, setSearchValue] = useState('')
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  return (
    <div className="h-full flex flex-col bg-[--dip-white] overflow-hidden relative">
      <div className="flex justify-between items-center mt-6 mb-4 flex-shrink-0 z-20 max-w-[880px] w-full mx-auto">
        <span className="font-bold text-lg text-[--dip-text-color]">全部</span>
        <div className="flex-shrink-0">
          <SearchInput placeholder="搜索工作计划" onSearch={handleSearch} />
        </div>
      </div>
      <PlanList
        source={{ mode: 'global' }}
        searchValue={searchValue}
        onPlanClick={(job) => {
          const from = `${location.pathname}${location.search}`
          navigate(
            {
              pathname: `/studio/work-plan/${job.id}`,
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
