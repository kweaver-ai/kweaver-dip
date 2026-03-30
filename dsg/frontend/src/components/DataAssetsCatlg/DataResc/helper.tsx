import { ReactNode } from 'react'
import Icon from '@ant-design/icons'
import { isNumber } from 'lodash'
import {
    DatasheetViewColored,
    DepartmentOutlined,
    FontIcon,
    InterfaceColored,
    ThemeOutlined,
} from '@/icons'
import styles from './styles.module.less'
import { ReactComponent as businessSystem } from '@/icons/svg/outlined/businessSystem.svg'
import __ from './locale'
import IndicatorIcons from '@/components/IndicatorManage/IndicatorIcons'
import { IconType } from '@/icons/const'
import { DataRescType } from '../ApplicationService/helper'

export interface IItemOtherInfo {
    // infoRawKey-必填
    infoRawKey: string
    infoKey?: string
    toolTipTitle?: any
    icon: ReactNode
}

export const DataRescTypeMap = {
    [DataRescType.INDICATOR]: '指标',
    [DataRescType.INTERFACE]: '接口',
    [DataRescType.LOGICALVIEW]: '库表',
}

// 省级目录显示目录信息
export const itemOtherInfo: Array<IItemOtherInfo> = [
    {
        infoRawKey: 'api_type',
        toolTipTitle: (text) =>
            `${__('接口类型：${text}', {
                text: text || '--',
            })}`,
        icon: <FontIcon name="icon-leixing" className={styles.commonIcon} />,
    },
    {
        infoRawKey: 'relate_resc_type',
        toolTipTitle: (text) =>
            `${__('资源类型：${text}', {
                text: text || '--',
            })}`,
        icon: <FontIcon name="icon-leixing" className={styles.commonIcon} />,
    },
    {
        infoRawKey: 'license_type',
        toolTipTitle: (text) =>
            `${__('证件类型：${text}', {
                text: text || '--',
            })}`,
        icon: <FontIcon name="icon-leixing" className={styles.commonIcon} />,
    },
    {
        infoRawKey: 'subject_domain_name',
        infoKey: 'subject_domain_path',
        toolTipTitle: (text) =>
            `${__('所属业务对象：${text}', {
                text: text || '--',
            })}`,
        icon: <ThemeOutlined className={styles.commonIcon} />,
    },
    {
        infoRawKey: 'department_name',
        infoKey: 'department_path',
        toolTipTitle: (text) =>
            `${__('所属部门：${text}', {
                text: text || '--',
            })}`,
        icon: <DepartmentOutlined className={styles.commonIcon} />,
    },
    {
        infoRawKey: 'raw_system_name',
        infoKey: 'system_name',
        toolTipTitle: (text) =>
            `${__('信息系统：${text}', {
                text: text || '--',
            })}`,
        icon: <Icon component={businessSystem} className={styles.commonIcon} />,
    },
]

// keys: IItemOtherInfo.infoRawKey[]
export const getOtherInfo = (keys: string[]) => {
    const otherInfo: any[] = []
    itemOtherInfo?.forEach((infoItem) => {
        const idx = keys?.indexOf(infoItem?.infoRawKey || '')
        if (isNumber(idx) && idx !== -1) {
            otherInfo[idx] = infoItem
        }
    })
    return otherInfo
}

export const getDataRescTypeIcon = (
    props: {
        type?: DataRescType
        indicator_type?: string
        // 是否显示类型文本
        showTypeText?: boolean
    },
    fontSize: number = 22,
) => {
    const { type, indicator_type, showTypeText } = props
    let IconComponent
    let color: string = ''
    let text: string = ''
    switch (type) {
        case DataRescType.INTERFACE:
            IconComponent = (
                <InterfaceColored
                    className={styles.itemIcon}
                    fontSize={fontSize}
                />
            )
            text = __('接口')
            color = '#ffba30'
            break
        case DataRescType.LOGICALVIEW:
            IconComponent = (
                <DatasheetViewColored
                    className={styles.itemIcon}
                    fontSize={fontSize}
                />
            )
            text = __('库表')
            color = '#14ceaa'
            break
        case DataRescType.INDICATOR:
            IconComponent = indicator_type ? (
                <IndicatorIcons type={indicator_type} fontSize={fontSize} />
            ) : (
                <FontIcon
                    name="icon-zhibiao2"
                    style={{
                        fontSize,
                    }}
                    type={IconType.COLOREDICON}
                />
            )
            // '#0091ff'
            color = indicator_type ? '#0096ff' : '#3ac4ff'
            text = __('指标')
            break
        case DataRescType.PROVINCE_DATACATLG:
            IconComponent = (
                <FontIcon
                    name="icon-shujumuluguanli1"
                    style={{
                        fontSize,
                    }}
                    type={IconType.COLOREDICON}
                />
            )
            color = '#0096ff'
            break
        case DataRescType.INFO_RESC_CATLG:
            IconComponent = (
                <FontIcon
                    name="icon-xinximulu1"
                    style={{
                        fontSize,
                    }}
                    type={IconType.COLOREDICON}
                />
            )
            color = '#0096ff'
            break
        case DataRescType.DATA_RESC_CATLG:
            IconComponent = (
                <FontIcon
                    name="icon-shujumuluguanli1"
                    style={{
                        fontSize,
                    }}
                    type={IconType.COLOREDICON}
                />
            )
            text = __('数据目录')
            color = '#0096ff'
            break
        case DataRescType.LICENSE_CATLG:
            IconComponent = (
                <FontIcon
                    name="icon-dianzizhengzhaomulu"
                    style={{
                        fontSize,
                    }}
                    type={IconType.COLOREDICON}
                />
            )
            color = '#0096ff'
            text = __('授权目录')
            break
        default:
            return null
    }
    return showTypeText ? (
        <span
            style={{
                display: 'flex',
                alignItems: 'center',
                background: color,
                color: '#fff',
                padding: '2px 6px 2px 2px',
                fontSize: 12,
                borderRadius: '4px',
                gap: '4px',
            }}
        >
            {IconComponent}
            {text}
        </span>
    ) : (
        IconComponent
    )
}
