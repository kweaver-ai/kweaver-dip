import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import { BusinessSystemOutlined } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { ISystemItem, formatError, reqInfoSystemList } from '@/core'
import dataEmpty from '../../assets/dataEmpty.svg'
import { Empty, Loader } from '@/ui'

interface SelectIndicatorListType {
    systems: ISystemItem[]
    onSelectSysId?: (value) => void
    onSelectedNode?: (node: any) => void
}
const InfoSystem = ({
    systems,
    onSelectSysId,
    onSelectedNode,
}: SelectIndicatorListType) => {
    // const [systems, setSystems] = useState<ISystemItem[]>([])
    const [sysId, setSysId] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)

    // useEffect(() => {
    //     getSystems()
    // }, [])

    // const getSystems = async () => {
    //     setIsLoading(true)
    //     try {
    //         const res = await reqInfoSystemList({
    //             limit: 2000,
    //             offset: 1,
    //         })
    //         setSystems(res.entries || [])
    //     } catch (error) {
    //         formatError(error)
    //     }
    //     setIsLoading(false)
    // }

    return (
        <div className={styles.infoSys}>
            {systems.length > 0 ? (
                systems.map((sys) => {
                    return (
                        <div
                            className={classnames(
                                styles.sysItem,
                                sysId === sys.id ? styles.picked : '',
                            )}
                            key={sys.id}
                            onClick={() => {
                                onSelectSysId?.(sys.id)
                                setSysId(sys.id || '')
                                onSelectedNode?.(sys)
                            }}
                        >
                            <div className={styles.name}>
                                <BusinessSystemOutlined />
                                <span
                                    className={styles.nameInfo}
                                    title={sys.name}
                                >
                                    {sys.name}
                                </span>
                            </div>
                        </div>
                    )
                })
            ) : isLoading ? (
                <div style={{ paddingTop: 48 }}>
                    <Loader />
                </div>
            ) : (
                <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
            )}
        </div>
    )
}
export default InfoSystem
