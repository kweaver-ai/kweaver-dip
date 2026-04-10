import { Col, type MenuProps, Row } from 'antd'
import { memo, useCallback } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import type { DigitalHumanSkill } from '@/apis'
import ScrollBarContainer from '../ScrollBarContainer'
import SkillCard from './SkillCard'
import { computeColumnCount, gap } from './utils'

interface SkillListProps {
  skills: DigitalHumanSkill[]
  onCardClick?: (skill: DigitalHumanSkill) => void
  menuItems?: (skill: DigitalHumanSkill) => MenuProps['items']
}

const SkillList: React.FC<SkillListProps> = ({ skills, onCardClick, menuItems }) => {
  const renderCard = useCallback(
    (skill: DigitalHumanSkill, width: number) => {
      return (
        <Col key={skill.name} style={{ width, minWidth: width }}>
          <SkillCard
            skill={skill}
            width={width}
            menuItems={menuItems?.(skill)}
            onCardClick={onCardClick}
          />
        </Col>
      )
    },
    [onCardClick, menuItems],
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
                  {skills.map((skill) => renderCard(skill, calculatedCardWidth))}
                </Row>
              )
            }}
          </AutoSizer>
        </div>
      </ScrollBarContainer>
    </div>
  )
}

export default memo(SkillList)
