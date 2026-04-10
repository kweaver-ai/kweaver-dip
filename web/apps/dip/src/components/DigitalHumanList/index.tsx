import { Col, type MenuProps, Row } from 'antd'
import { memo, useCallback } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import type { DigitalHuman } from '@/apis'
import ScrollBarContainer from '../ScrollBarContainer'
import EmployeeCard from './EmployeeCard'
import { computeColumnCount, gap } from './utils'

interface DigitalHumanListProps {
  /** 数字员工列表数据 */
  digitalHumans: DigitalHuman[]
  /** 卡片点击回调 */
  onCardClick?: (digitalHuman: DigitalHuman) => void
  /** 卡片菜单点击回调 */
  menuItems?: (digitalHuman: DigitalHuman) => MenuProps['items']
}

/**
 * DigitalHumanList 数字员工列表组件
 */
const DigitalHumanList: React.FC<DigitalHumanListProps> = ({
  digitalHumans,
  onCardClick,
  menuItems,
}) => {
  /** 渲染卡片 */
  const renderCard = useCallback(
    (digitalHuman: DigitalHuman, width: number) => {
      return (
        <Col key={digitalHuman.id} style={{ width, minWidth: width }}>
          <EmployeeCard
            digitalHuman={digitalHuman}
            width={width}
            menuItems={menuItems?.(digitalHuman)}
            onCardClick={(digitalHuman) => onCardClick?.(digitalHuman)}
          />
        </Col>
      )
    },
    [onCardClick],
  )

  return (
    <div className="flex flex-col h-0 flex-1">
      <ScrollBarContainer className="h-full min-h-0 pl-4 pr-2 -ml-4 -mr-6">
        <div className="pt-2 pb-4">
          <AutoSizer style={{ width: 'calc(100% - 8px)' }} disableHeight>
            {({ width }) => {
              const count = computeColumnCount(width)
              const calculatedCardWidth = width / count

              return (
                <Row gutter={[gap, gap]}>
                  {digitalHumans.map((digitalHuman) =>
                    renderCard(digitalHuman, calculatedCardWidth),
                  )}
                </Row>
              )
            }}
          </AutoSizer>
        </div>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(DigitalHumanList)
