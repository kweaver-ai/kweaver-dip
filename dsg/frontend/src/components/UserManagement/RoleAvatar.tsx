import Icon from '@ant-design/icons'
import React, { useMemo } from 'react'
import classnames from 'classnames'
import styles from './styles.module.less'
import { RoleType, roleAvatarColor } from '@/core'
import { useRoleIcons } from '@/hooks/useRoleIcons'
import { FontIcon } from '@/icons'

interface IRoleAvatar {
    role?: any
    roleGroup?: any
    size?: number
    fontSize?: number
    style?: React.CSSProperties
}

/** 角色头像 */
const RoleAvatar = ({
    role,
    roleGroup,
    size = 20,
    fontSize = 12,
    style,
}: IRoleAvatar) => {
    const { type = RoleType.Custom, color = 'color-1', icon, name } = role || {}

    const [roleIcons] = useRoleIcons()

    const bgColor = useMemo(() => {
        if (roleGroup) {
            return '#ffffff'
        }
        if (type === RoleType.Custom) {
            return roleAvatarColor[color]
        }
        return color
    }, [type, color])

    const conbineSvg = (svgdata: string = '') => {
        return (
            <svg
                dangerouslySetInnerHTML={{
                    __html: svgdata || '',
                }}
                viewBox="0 0 1024 1024"
            />
        )
    }

    const getCurrentRoleIcon = () => {
        if (!roleIcons.length) {
            return ''
        }
        return roleIcons.find((roleIcon) => roleIcon.name === icon)?.icon
    }

    return (
        <div
            className={classnames(styles.roleAvatar, {
                [styles['roleAvatar-roleGroup']]: !!roleGroup,
            })}
            style={{
                background: bgColor?.concat('D9'),
                width: size,
                height: size,
                fontSize,
                ...style,
            }}
        >
            {role ? (
                type === RoleType.Custom ? (
                    name?.[0] || '角'
                ) : (
                    <Icon
                        component={() => {
                            return conbineSvg(getCurrentRoleIcon())
                        }}
                        style={{
                            fill: '#ffffff',
                            width: size,
                            height: size,
                        }}
                    />
                )
            ) : (
                <FontIcon
                    name="icon-duojiaose"
                    style={{ fontSize: fontSize - 2 }}
                />
            )}
        </div>
    )
}

export default RoleAvatar
