import React from 'react'
import { Badge, Tooltip } from 'antd'
import {
    GlossaryStatus,
    GlossaryType,
    ClossaryStatusList,
} from '../BusinessGlossary/const'
import CommonIcon from '../CommonIcon'
import { ReactComponent as L1Svg } from '@/icons/svg/outlined/L1.svg'
import { ReactComponent as L2Svg } from '@/icons/svg/outlined/L2.svg'
import { ReactComponent as zhutiyuSvg } from '@/icons/svg/outlined/zhutiyu.svg'
import { ReactComponent as gantanhaoSvg } from '@/icons/svg/outlined/gantanhao.svg'
import { ReactComponent as gantanhao1Svg } from '@/icons/svg/outlined/gantanhao1.svg'
import { ReactComponent as duigouSvg } from '@/icons/svg/outlined/duigou.svg'
import { ReactComponent as weizhiSvg } from '@/icons/svg/outlined/weizhi.svg'
import { ReactComponent as shujubiaozhunSvg } from '@/icons/svg/outlined/shujubiaozhun.svg'
import { ReactComponent as termsSvg } from '@/icons/svg/outlined/terms.svg'
import { ReactComponent as shujuyuanSvg } from '@/icons/svg/outlined/shujuyuan.svg'
import { ReactComponent as activityL3 } from '@/icons/svg/outlined/activityL3.svg'
import { ReactComponent as objL3 } from '@/icons/svg/outlined/objL3.svg'

import { BusinessDomainType } from './const'
import { LogicEntityColored } from '@/icons'

interface IGetIcon {
    type?: GlossaryType | string | number
    status?: GlossaryStatus | string
    showDot?: boolean
    fontSize?: string
    width?: string
    styles?: object
}
/**
 * icon
 * @param type 后端返回状态
 * @param status 需要转换待状态枚举列表
 */
export const GlossaryIcons: React.FC<IGetIcon> = (props) => {
    const {
        type,
        status,
        showDot = true,
        fontSize,
        width = '14px',
        styles = {},
    } = props
    let icon: any
    let color: string = ''
    let statusColor: string = ''
    switch (type) {
        case BusinessDomainType.subject_domain_group:
            icon = L1Svg
            color = '#bea6d3'
            break
        case BusinessDomainType.subject_domain:
            icon = L2Svg
            color = '#ecc56f'
            break
        case BusinessDomainType.business_activity:
            icon = activityL3
            color = '#7cbc5c'
            break
        case BusinessDomainType.business_object:
            icon = objL3
            color = '#7cbc5c'
            break
        default:
            icon = zhutiyuSvg
    }
    switch (status) {
        case GlossaryStatus.Certified:
            statusColor = '#52C41B'
            break
        case GlossaryStatus.Draft:
            statusColor = '#afafaf'
            break
        default:
            statusColor = '#FAAC14'
    }
    return (
        <Badge dot={showDot} color={statusColor} offset={[-1, 21]}>
            <CommonIcon
                icon={icon}
                style={{ color, fontSize, width, ...styles }}
            />
        </Badge>
    )
}

/**
 * 新接口 Icon
 */
export const GlossaryIcon: React.FC<Partial<IGetIcon>> = (props) => {
    const { type, fontSize, width = '14px', styles = {} } = props
    let icon: any
    let color: string = ''
    switch (type) {
        case BusinessDomainType.subject_domain_group:
            icon = L1Svg
            color = '#9E7ABB'
            break
        case BusinessDomainType.subject_domain:
            icon = L2Svg
            color = '#DF9C19'
            break
        case BusinessDomainType.business_activity:
            icon = activityL3
            color = '#14CEAA'
            break
        case BusinessDomainType.business_object:
            icon = objL3
            color = '#14CEAA'
            break
        case BusinessDomainType.logic_entity:
            color = '#126EE3'
            return (
                <LogicEntityColored
                    style={{ color, fontSize, width, ...styles }}
                />
            )
        default:
            icon = zhutiyuSvg
    }

    return (
        <CommonIcon icon={icon} style={{ color, fontSize, width, ...styles }} />
    )
}

export const statusIcon: React.FC<GlossaryStatus> = (status) => {
    let color: string = ''
    let icon: any
    const tips: string | number =
        ClossaryStatusList.find((item) => item.value === status)?.label || ''
    switch (status) {
        case GlossaryStatus.Certified:
            color = '#52C41B'
            icon = duigouSvg
            break
        case GlossaryStatus.Draft:
            color = '#FAAC14'
            icon = gantanhaoSvg
            break
        default:
            color = '#FAAC14'
            icon = gantanhao1Svg
    }
    return (
        <Tooltip title={tips}>
            <CommonIcon icon={icon} style={{ color, fontSize: '22px' }} />
        </Tooltip>
    )
}

export const positionIcon = () => {
    return (
        <CommonIcon icon={weizhiSvg} style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
    )
}

export const menuIcon = () => {
    return (
        <CommonIcon
            icon={shujubiaozhunSvg}
            style={{ color: 'rgba(0, 0, 0, 0.30)' }}
        />
    )
}

interface IGlossaryMgmtIcons {
    type?: GlossaryType | string
    status?: GlossaryStatus | string
    showDot?: boolean
    style?: any
}
/**
 * icon
 * @param type 后端返回状态
 * @param status 需要转换待状态枚举列表
 */
export const GlossaryMgmtIcons: React.FC<IGlossaryMgmtIcons> = (props) => {
    const { type, status, showDot = true, style } = props
    let icon: any
    let statusColor: string = ''
    switch (type) {
        case GlossaryType.GLOSSARY:
            icon = zhutiyuSvg
            break
        case GlossaryType.TERMS:
            icon = termsSvg
            break
        case GlossaryType.CATEGORIES:
            icon = shujuyuanSvg
            break
        default:
            icon = shujuyuanSvg
    }
    switch (status) {
        case GlossaryStatus.Certified:
            statusColor = '#52C41B'
            break
        case GlossaryStatus.Draft:
            statusColor = '#afafaf'
            break
        default:
            statusColor = '#FAAC14'
    }
    return (
        <Badge dot={showDot} color={statusColor} offset={[0, 20]}>
            <CommonIcon icon={icon} style={style} />
        </Badge>
    )
}
