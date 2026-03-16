import { Avatar, Card, Dropdown, type MenuProps } from 'antd'
import clsx from 'clsx'
import type { EChartsOption } from 'echarts'
import { LineChart as ELineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useRef, useState } from 'react'
import type { Employee } from '@/apis'
import { formatTimeSlash } from '@/utils/handle-function/FormatTime'
import AppIcon from '../AppIcon'
import IconFont from '../IconFont'
import { cardHeight } from './utils'

echarts.use([ELineChart, GridComponent, TooltipComponent, CanvasRenderer])

interface EmployeeCardProps {
  employee: Employee
  width: number
  menuItems?: MenuProps['items']
  /** 卡片菜单点击回调 */
  onCardClick?: (employee: Employee) => void
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, width, menuItems, onCardClick }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const chartRef = useRef<HTMLDivElement | null>(null)

  const successRateData = employee.task_success_rate ?? []
  const lastPoint = successRateData[successRateData.length - 1] as
    | { day?: string; value?: number }
    | undefined
  const successRate = typeof lastPoint?.value === 'number' ? lastPoint.value : 0
  const successRateColor = successRate >= 90 ? '#52c41a' : successRate >= 70 ? '#faad14' : '#ff4d4f'

  useEffect(() => {
    if (!chartRef.current || successRateData.length === 0) return

    const chart = echarts.init(chartRef.current)

    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
        },
        formatter: (params: any) => {
          const point = Array.isArray(params) ? params[0] : params
          const day = point?.axisValue ?? ''
          const value = typeof point?.data === 'number' ? point.data : 0
          const num = typeof value === 'number' ? value : Number(value) || 0
          return `${day}<br />成功率：${num.toFixed(1)}%`
        },
        confine: true,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderWidth: 0,
        textStyle: {
          color: '#fff',
          fontSize: 12,
        },
        padding: [6, 8],
      },
      grid: {
        top: 2,
        bottom: 2,
        left: 0,
        right: 0,
      },
      xAxis: {
        type: 'category',
        data: successRateData.map((item: { day?: string }) => item.day ?? ''),
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'line',
          data: successRateData.map((item: { value?: number }) => item.value ?? 0),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2,
            color: successRateColor,
          },
        },
      ],
      animation: false,
    }

    chart.setOption(option)
    const resize = () => {
      chart.resize()
    }
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      chart.dispose()
    }
  }, [successRateColor, successRateData])

  const updateTime = employee.edited_at
    ? formatTimeSlash(new Date(employee.edited_at).getTime())
    : ''

  const users = employee.users ?? []

  return (
    <Card
      className="group rounded-[10px] transition-all w-full cursor-pointer"
      styles={{
        root: {
          height: cardHeight,
          boxShadow: '0px 2px 8px 0px hsla(0,0%,0%,0.1)',
        },
        body: {
          height: '100%',
          padding: '16px 16px 12px 16px',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      onClick={() => {
        onCardClick?.(employee)
      }}
    >
      <div className="flex gap-4 flex-shrink-0">
        {/* 图标 */}
        <AppIcon
          icon={employee.icon}
          name={employee.name}
          size={48}
          className="w-12 h-12 rounded-xl overflow-hidden"
          shape="square"
        />
        {/* 名称 + 描述 */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div
                className="text-base font-medium mr-px truncate text-black"
                title={employee.name}
              >
                {employee.name}
              </div>
            </div>
            <p
              className="text-[13px] line-clamp-2 leading-5 text-black"
              title={employee.description}
            >
              {employee.description || '[暂无描述]'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-end flex-1 h-0 mt-2">
        <div className="flex items-center justify-between">
          {/* 更新信息 */}
          <div className="flex items-center text-xs text-[var(--dip-text-color-45)]">
            <Avatar size="small" className="flex-shrink-0 mr-2">
              {employee.creator?.charAt(0)}
            </Avatar>
            <span
              className="truncate mr-4"
              style={{ maxWidth: `${Math.floor(width * 0.22)}px` }}
              title={employee.creator}
            >
              {employee.creator}
            </span>
            <span>更新：{updateTime}</span>
          </div>
          {/* 更多操作 */}
          {menuItems && menuItems.length > 0 && (
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['click']}
              placement="bottomRight"
              onOpenChange={(open) => {
                setMenuOpen(open)
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                }}
                className={clsx(
                  'w-6 h-6 flex items-center justify-center rounded text-[var(--dip-text-color-45)] hover:text-[var(--dip-text-color-85)] hover:bg-[--dip-hover-bg-color] transition-opacity',
                  menuOpen
                    ? 'opacity-100 visible'
                    : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                )}
              >
                <IconFont type="icon-dip-gengduo" />
              </button>
            </Dropdown>
          )}
        </div>
        <div className="mb-3 mt-2 w-full h-px bg-[var(--dip-line-color)]" />

        {/* 使用者 + 计划 + 成功率 */}
        <div className="flex gap-5">
          {/* 使用者 */}
          <div className="flex items-center gap-1">
            <Avatar.Group max={{ count: 4 }}>
              {users.slice(0, 3).map((user: any) => (
                <Avatar key={user?.id} size="small">
                  <span title={user?.vision_name}>{user?.vision_name?.charAt(0)}</span>
                </Avatar>
              ))}
              {users.length > 3 && (
                <Avatar
                  size="small"
                  style={{ backgroundColor: '#F5F5F5', color: 'black', fontSize: 10 }}
                >
                  <span title={users.map((user: any) => user?.vision_name).join(',')}>
                    +{users.length - 3}
                  </span>
                </Avatar>
              )}
            </Avatar.Group>
          </div>

          {/* 计划 */}
          <div>
            <div className="text-xs text-[#92929D] mb-1.5">计划</div>
            <div className="text-lg font-medium">{employee.plan_count}</div>
          </div>

          {/* 成功率 */}
          <div className="flex-1">
            <div className="text-xs text-[#92929D] mb-1.5">7日成功率</div>
            <div className="flex items-center gap-2">
              <div className="w-full h-8">
                <div ref={chartRef} className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default EmployeeCard
