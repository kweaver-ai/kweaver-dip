import { Card, Col, Row, Skeleton } from 'antd'
import { memo, useMemo } from 'react'
import { gap } from './utils'

const getCount = ({ width, cardWidth }: { width?: number; cardWidth?: number } = {}) => {
  let count = 4
  try {
    if (width && cardWidth) {
      count = Math.floor(width / cardWidth)
    }
  } catch {
    // ignore
  }

  return count
}

// 渲染骨架屏
const SkeletonGrid = ({
  width,
  cardWidth,
  avatarShape = 'circle',
}: {
  width?: number
  cardWidth?: number
  avatarShape?: 'square' | 'circle'
}) => {
  const count = useMemo(() => getCount({ width, cardWidth }), [width, cardWidth])
  const skeletonKeys = useMemo(
    () => Array.from({ length: count }, (_, i) => `skeleton-${width || 0}-${cardWidth || 0}-${i}`),
    [count, width, cardWidth],
  )

  return (
    <Row gutter={[gap, gap]}>
      {skeletonKeys.map((key) => (
        <Col style={{ width: cardWidth }} key={key}>
          <Card
            className="border border-[rgba(0,0,0,0.1)] rounded-[10px] h-[171px]"
            variant="borderless"
          >
            <div className="p-1">
              <div className="flex items-start mb-0.5">
                <Skeleton.Avatar active size={48} shape={avatarShape} className="mr-0.5" />
                <div className="flex-1 overflow-hidden">
                  <Skeleton active paragraph={{ rows: 2 }} title={{ width: '80%' }} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-0.5 mt-0.5">
                <Skeleton.Button active size="small" style={{ width: 120 }} />
                <Skeleton.Input active size="small" className="w-full" />
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default memo(SkeletonGrid)
