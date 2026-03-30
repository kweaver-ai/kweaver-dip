import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import { useUpdateEffect } from 'ahooks'
import { CheckOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { ResourceType, typeOptoins } from '@/components/ResourcesDir/const'
import {
    formatError,
    getDataCatalogMount,
    getDatasheetViewDetails,
    getInfoItems,
} from '@/core'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'

interface IProps {
    // 选择对象
    selectType: 'column' | 'catlg'
    // 数据资源目录
    selCatlg?: any
    // 'column'模式下，选中信息项
    checkedItems?: any[]
    // 选择/取消选择信息项
    onChangeColumn: (value?: any, isSel?: boolean) => void
}
const ColumnListView = ({
    selectType,
    selCatlg,
    checkedItems,
    onChangeColumn,
}: IProps) => {
    const [currentCatlg, setCurrentCatlg] = useState<any>()
    // 目录信息项加载中
    const [infoItemsLoading, setInfoItemsLoading] = useState(false)
    // 目录信息项
    const [infoItems, setInfoItems] = useState<Array<any>>([])

    // 获取目录信息项
    const getDirInfoItems = async (catlg: any) => {
        const catlgId = catlg?.id
        if (!catlgId) return
        try {
            setInfoItemsLoading(true)
            const mountRes = await getDataCatalogMount(catlgId)
            const logicViewId = mountRes?.mount_resource?.find(
                (item) => item.resource_type === ResourceType.DataView,
            )?.resource_id
            if (logicViewId) {
                const logicViewInfo = await getDatasheetViewDetails(logicViewId)
                setCurrentCatlg((prev) => {
                    return {
                        ...prev,
                        logicViewInfo: logicViewInfo ?? {},
                    }
                })
            }
            const res = await getInfoItems(catlgId, { limit: 0 })
            setInfoItems(
                res.columns || [],
                // res.columns?.map((cItem) => {
                //     return {
                //         ...cItem,
                //         [fieldKeys.id]: cItem.id,
                //         [fieldKeys.name]: cItem.business_name,
                //     }
                // }),
            )
        } catch (e) {
            formatError(e)
        } finally {
            setInfoItemsLoading(false)
        }
    }

    useUpdateEffect(() => {
        if (currentCatlg?.id) {
            getDirInfoItems(currentCatlg)
        }
    }, [currentCatlg?.id])

    useEffect(() => {
        if (selCatlg) {
            setCurrentCatlg(selCatlg)
        }
    }, [selCatlg])

    return (
        <div className={styles.columnListView}>
            <div className={styles.boxTitle}>
                {selectType === 'column' ? (
                    <span>
                        {__('选择信息项')}
                        <span className={styles.multiSelect}>
                            {__('（多选）')}
                        </span>
                    </span>
                ) : (
                    __('预览信息项')
                )}
            </div>
            <div className={styles.infoItemListContent}>
                {infoItemsLoading ? (
                    <Loader />
                ) : infoItems?.length > 0 ? (
                    infoItems.map((item) => {
                        let isSel = false
                        if (selectType === 'column') {
                            isSel = checkedItems?.find(
                                (_item) => _item.id === item.id,
                            )
                        }
                        return (
                            <div
                                key={item.id}
                                className={classnames(styles.fieldInfo, {
                                    [styles.canSel]: selectType === 'column',
                                    [styles.selFieldInfo]: isSel,
                                })}
                                onClick={() => {
                                    if (selectType === 'column') {
                                        onChangeColumn(
                                            {
                                                ...item,
                                                catalog_id: currentCatlg?.id,
                                                catalog_name:
                                                    currentCatlg?.name,
                                                tableNameEn:
                                                    currentCatlg?.logicViewInfo
                                                        ?.technical_name,
                                            },
                                            !isSel,
                                        )
                                    }
                                }}
                            >
                                <span className={styles.icon}>
                                    {getFieldTypeEelment(
                                        {
                                            type: typeOptoins.find(
                                                (_item) =>
                                                    _item.value ===
                                                    item?.data_type,
                                            )?.strValue,
                                        },
                                        16,
                                    )}
                                </span>
                                <div className={styles.fieldNameWrapper}>
                                    <div
                                        className={styles.top}
                                        title={item.business_name}
                                    >
                                        {item.business_name || '--'}
                                    </div>
                                    <div
                                        className={styles.bottom}
                                        title={item.technical_name}
                                    >
                                        {item.technical_name || '--'}
                                    </div>
                                </div>
                                {isSel && selectType === 'column' && (
                                    <CheckOutlined
                                        style={{ color: '#59A3FF' }}
                                    />
                                )}
                            </div>
                        )
                    })
                ) : (
                    <Empty
                        style={{
                            marginTop: 64,
                        }}
                        iconSrc={dataEmpty}
                        desc={__('暂无数据')}
                    />
                )}
            </div>
        </div>
    )
}

export default ColumnListView
