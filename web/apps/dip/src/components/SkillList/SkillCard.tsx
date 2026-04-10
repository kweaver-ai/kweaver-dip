import { Card, Dropdown, type MenuProps } from 'antd'
import clsx from 'clsx'
import { useState } from 'react'
import type { DigitalHumanSkill } from '@/apis'
import { DEFAULT_SKILL_ICON_COLORS, getMatchedColorByName } from '@/utils/handle-function'
import IconFont from '../IconFont'
import { cardHeight } from './utils'

interface SkillCardProps {
  skill: DigitalHumanSkill
  width: number
  menuItems?: MenuProps['items']
  onCardClick?: (skill: DigitalHumanSkill) => void
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, menuItems, onCardClick }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const clickable = Boolean(onCardClick)
  const hasMenu = Boolean(menuItems && menuItems.length > 0)
  const showMenuTrigger = hasMenu && (hovered || menuOpen)

  return (
    <Card
      className={clsx('group w-full rounded-[20px] transition-all', clickable && 'cursor-pointer')}
      styles={{
        root: {
          height: cardHeight,
          border: '1px solid #E3E6EE',
          boxShadow: hovered ? '0px 2px 9px 0.5px #0000000F' : '',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
          overflow: 'hidden',
        },
        body: {
          height: '100%',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      onClick={() => {
        if (clickable) {
          onCardClick?.(skill)
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex gap-x-4 items-center">
        <div
          className="w-9 h-9 flex-shrink-0 overflow-hidden rounded-md flex items-end pl-1 pb-0.5"
          style={{ backgroundColor: getMatchedColorByName(skill.name, DEFAULT_SKILL_ICON_COLORS) }}
        >
          <span className="text-white text-[8px]">skill</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[22px] leading-[22px] font-bold truncate" title={skill.name}>
            {skill.name}
          </div>
        </div>
      </div>
      <p
        className="mt-3 flex-1 min-h-0 text-[13px] leading-5 text-[--dip-text-color-45] line-clamp-2"
        title={skill.description}
      >
        {skill.description?.trim() || '[暂无描述]'}
      </p>

      <div className="mt-2 flex h-6 shrink-0 items-center justify-end text-xs">
        {showMenuTrigger ? (
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
                'flex h-6 w-6 items-center justify-center rounded-md text-[var(--dip-text-color-65)] transition-colors hover:bg-[--dip-hover-bg-color] hover:text-[var(--dip-text-color-85)]',
                menuOpen && 'bg-[--dip-hover-bg-color] text-[var(--dip-text-color-85)]',
              )}
            >
              <IconFont type="icon-more" />
            </button>
          </Dropdown>
        ) : (
          <span className="text-[#A0A0A9]">
            @{skill.type === 'openclaw-managed' ? '自定义' : '官方'}
          </span>
        )}
      </div>
    </Card>
  )
}

export default SkillCard
