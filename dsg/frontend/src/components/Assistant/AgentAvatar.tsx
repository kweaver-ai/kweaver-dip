import React from 'react'
import { Avatar } from 'antd'
import styles from './styles.module.less'
import AgentIcons from '@/assets/agent'

// 统一背景色（蓝色）
const BG_COLOR = '#E6F2FE'

export interface AgentAvatarProps {
    /** 头像类型，默认为1 */
    avatarType?: number
    /** 头像值，用于匹配 assets/agent 中的图标 */
    avatar?: string
    /** 名称，用于显示首字母 */
    name?: string
    /** 大小，默认为32 */
    size?: number

    style?: React.CSSProperties
}

/**
 * 助手头像组件
 * 根据 avatar_type 和 avatar 进行显示
 * 1. 如果有 avatar 则根据 avatar 显示对应的图片
 * 2. 如果没有，或者 avatar 没有匹配到图片，则显示蓝色背景的首字母
 */
const AgentAvatar: React.FC<AgentAvatarProps> = ({
    avatarType = 1,
    avatar,
    name,
    size = 32,
    style = { width: 48, height: 48 },
}) => {
    // 获取预设图标
    const getPresetIcon = () => {
        if (avatarType === 1 && avatar) {
            const iconKey = Number(avatar) as keyof typeof AgentIcons
            return AgentIcons[iconKey] || null
        }
        return null
    }

    const presetIcon = getPresetIcon()

    return (
        <div
            className={styles.iconWrapper}
            style={{ background: BG_COLOR, ...style }}
        >
            {presetIcon ? (
                <Avatar
                    src={presetIcon}
                    size={size}
                    className={styles.agentIcon}
                />
            ) : (
                <Avatar
                    size={size}
                    className={styles.avatar}
                    style={{ background: 'transparent' }}
                >
                    {name?.[0] || 'A'}
                </Avatar>
            )}
        </div>
    )
}

export default AgentAvatar
