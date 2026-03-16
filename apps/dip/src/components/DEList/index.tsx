import { Col, type MenuProps, Row } from 'antd'
import { memo, useCallback } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import type { Employee } from '@/apis'
import ScrollBarContainer from '../ScrollBarContainer'
import EmployeeCard from './EmployeeCard'
import { computeColumnCount, gap } from './utils'

interface DEListProps {
  /** 数字员工列表数据 */
  employees: Employee[]
  /** 卡片点击回调 */
  onCardClick?: (employee: Employee) => void
  /** 卡片菜单点击回调 */
  menuItems?: (employee: Employee) => MenuProps['items']
}

/**
 * DEList 数字员工列表组件
 */
const DEList: React.FC<DEListProps> = ({ employees, onCardClick, menuItems }) => {
  /** 渲染卡片 */
  const renderCard = useCallback(
    (employee: Employee, width: number) => {
      return (
        <Col key={employee.id} style={{ width, minWidth: width }}>
          <EmployeeCard
            employee={employee}
            width={width}
            menuItems={menuItems?.(employee)}
            onCardClick={(employee) => onCardClick?.(employee)}
          />
        </Col>
      )
    },
    [onCardClick],
  )

  return (
    <div className="flex flex-col h-0 flex-1">
      <ScrollBarContainer className="p-2 pt-0 ml-[-8px] mb-[-8px] mr-[-24px]">
        <AutoSizer style={{ width: 'calc(100% - 8px)' }} disableHeight>
          {({ width }) => {
            const count = computeColumnCount(width)
            const calculatedCardWidth = width / count

            return (
              <Row gutter={[gap, gap]}>
                {employees.map((employee) => renderCard(employee, calculatedCardWidth))}
              </Row>
            )
          }}
        </AutoSizer>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(DEList)
