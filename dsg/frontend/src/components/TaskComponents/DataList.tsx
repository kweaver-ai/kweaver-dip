import React, { memo, useState } from 'react'
import { Tooltip } from 'antd'
import {
    ExclamationCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons'
import styles from './styles.module.less'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import { TaskType } from '@/core'

import FileDetails from '@/components/File/Details'
import Details from '@/components/BusiArchitecture/Details'

interface IDataListItem {
    id: string
    name?: string
}

interface IDataList {
    data?: IDataListItem[]
    type?: string
}

const DataList: React.FC<IDataList> = ({ data, type }) => {
    const [hoveredId, setHoveredId] = useState<string>()
    const [currentId, setCurrentId] = useState<string>()
    if (!data || data.length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <Empty
                    desc={`暂无${
                        type === TaskType.MODELINGDIAGNOSIS
                            ? __('关联主干业务')
                            : __('关联标准文件')
                    }`}
                    iconSrc={dataEmpty}
                />
            </div>
        )
    }

    return (
        <div className={styles.dataListContainer}>
            {data.map((item) => (
                <div
                    key={item.id}
                    className={styles.dataListItem}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(undefined)}
                >
                    <div className={styles.itemContent}>
                        <span className={styles.itemName}>
                            {item.name || '--'}
                        </span>

                        {!item?.name && (
                            <Tooltip
                                title={`${
                                    type === TaskType.MODELINGDIAGNOSIS
                                        ? __('关联主干业务')
                                        : __('关联标准文件')
                                }被删除`}
                                placement="right"
                            >
                                <ExclamationCircleOutlined
                                    className={styles.infoIcon}
                                />
                            </Tooltip>
                        )}
                    </div>

                    {hoveredId === item.id && item?.name && (
                        <div className={styles.detailButton}>
                            <span
                                className={styles.detailText}
                                onClick={() => {
                                    setCurrentId(item.id)
                                }}
                            >
                                详情
                            </span>
                        </div>
                    )}
                </div>
            ))}

            {currentId && type === TaskType.STANDARDNEW && (
                <FileDetails
                    visible={!!currentId}
                    fileId={currentId}
                    onClose={() => setCurrentId(undefined)}
                />
            )}
            {currentId && type === TaskType.MODELINGDIAGNOSIS && (
                <Details
                    open={!!currentId}
                    data={{ id: currentId } as any}
                    onClose={() => setCurrentId(undefined)}
                />
            )}
        </div>
    )
}

export default memo(DataList)
