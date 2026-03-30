import { FC, useEffect } from 'react'
import classnames from 'classnames'
import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { noop } from 'lodash'
import { IndicatorColor } from './const'
import styles from './styles.module.less'
import __ from './locale'
import IndicatorManagementOutlined from '@/icons/IndicatorManagementOutlined'
import { LargeOutlined } from '@/icons'
import { IndicatorTypes } from '../IndicatorManage/const'
import IndicatorIcons from '../IndicatorManage/IndicatorIcons'

interface IIndicatorNodeHeader {
    // 指标信息
    data: any
    // 展开状态
    expandStatus?: boolean

    // 展开事件
    onExpand?: (status: boolean) => void

    onClickName: (detail: any) => void
    isBase?: boolean
    isLoading?: boolean
}
const IndicatorNodeHeader: FC<IIndicatorNodeHeader> = ({
    data,
    expandStatus = false,
    onExpand = noop,
    onClickName = noop,
    isBase = false,
    isLoading = false,
}) => {
    return (
        <div
            className={styles.indicatorNodeHeader}
            style={{
                borderBottom: `1px solid ${
                    IndicatorColor?.[data?.indicator_type]
                }26`,
            }}
        >
            <div className={styles.indicatorTypeTip}>
                {IndicatorTypes[data.indicator_type]}
            </div>
            <div
                className={styles.titleLine}
                style={{ background: IndicatorColor?.[data?.indicator_type] }}
            />
            <div className={styles.nameContainer}>
                <div
                    style={{
                        background: IndicatorColor?.[data?.indicator_type],
                    }}
                    className={styles.iconContainer}
                >
                    <IndicatorIcons type={data?.indicator_type} fontSize={20} />
                </div>
                <div
                    className={styles.name}
                    title={data?.name}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onClickName()
                    }}
                >
                    {data?.name}
                </div>
            </div>
            <div
                className={classnames(
                    styles.infoContainer,
                    styles.departmentColor,
                )}
            >
                <div className={styles.label}>{__('所属部门：')}</div>
                <div
                    className={styles.name}
                    title={data?.management_department_name}
                >
                    {data?.management_department_name || '--'}
                </div>
            </div>
            <div
                className={classnames(styles.infoContainer, styles.ownerColor)}
            >
                <div className={styles.label}>{__('数据Owner：')}</div>
                <div className={styles.name} title={data?.owner_name}>
                    {data?.owner_name || '--'}
                </div>
            </div>
            {isLoading ? (
                <div
                    className={classnames(styles.addNodeIcon)}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onExpand(true)
                    }}
                >
                    <Spin indicator={<LoadingOutlined spin />} size="small" />
                </div>
            ) : expandStatus ? null : (
                <div
                    className={classnames(styles.addNodeIcon)}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onExpand(true)
                    }}
                >
                    <LargeOutlined />
                </div>
            )}
        </div>
    )
}

export default IndicatorNodeHeader
