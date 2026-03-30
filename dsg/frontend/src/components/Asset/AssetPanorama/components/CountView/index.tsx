import React, { useEffect, useState } from 'react'
import { UpOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import styles from './styles.module.less'
import { IHierarchy, formatError, getClassificationStats } from '@/core'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import { thousandSplit } from '../../helper'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import __ from '../../locale'

const HierarchyItem = ({ item }: { item: IHierarchy }) => {
    const { color, count, name } = item || {}
    return (
        <div
            className={styles['hierarchy-item']}
            style={{ borderColor: color }}
        >
            <div
                className={styles['hierarchy-item-title']}
                style={{
                    background: `linear-gradient(
                    to right,
                    ${color ? `${color}30` : '#00000012'},
                    rgba(0, 0, 0, 0)
                )`,
                }}
            >
                <FontIcon
                    name="icon-biaoqianicon"
                    className={styles.icon}
                    style={{ color }}
                />
                <span className={styles.name} title={name}>
                    {name}
                </span>
            </div>
            <div className={styles['hierarchy-item-count']}>
                <span>字段数:</span>
                <span title={thousandSplit(count)}>{thousandSplit(count)}</span>
            </div>
        </div>
    )
}

function index() {
    const [isGradeOpen] = useGradeLabelState()
    const [data, setData] = useState<any>()
    const [isExpand, setIsExpand] = useState<boolean>(true)

    const loadData = async () => {
        try {
            const ret = await getClassificationStats()
            setData(ret)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div className={styles['count-view']}>
            {isExpand ? (
                <div className={styles['count-view-show']}>
                    <div>
                        <div className={styles.title}>
                            <div>分类字段总数</div>
                            <Tooltip placement="top" title={__('收起统计')}>
                                <div
                                    className={styles.icon}
                                    onClick={() => setIsExpand(false)}
                                >
                                    <FontIcon
                                        name="icon-shouqi1"
                                        type={IconType.FONTICON}
                                    />
                                </div>
                            </Tooltip>
                        </div>
                        <div className={styles.total}>
                            <span title={thousandSplit(data?.total)}>
                                {thousandSplit(data?.total)}
                            </span>
                        </div>
                    </div>
                    <div hidden={!isGradeOpen}>
                        <div className={styles.title}>分级字段数</div>
                        <div className={styles.list}>
                            {data?.hierarchy_tag?.map((o) => (
                                <HierarchyItem key={o.id} item={o} />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <Tooltip placement="top" title={__('展开统计')}>
                    <div
                        className={styles['count-view-hidden']}
                        onClick={() => setIsExpand(true)}
                    >
                        <FontIcon name="icon-tongji" type={IconType.FONTICON} />
                    </div>
                </Tooltip>
            )}
        </div>
    )
}

export default index
