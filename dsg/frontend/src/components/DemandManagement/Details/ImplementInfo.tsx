import React, { useEffect, useRef, useState } from 'react'
import CommonTitle from '../CommonTitle'
import __ from '../locale'
import styles from './styles.module.less'
import { ImplementConclusionFields } from './const'
import dataEmpty from '@/assets/dataEmpty.svg'
import ImplementItems from './ImplementItems'
import {
    IDemandItemInfo,
    IItemImplementAuthority,
    formatError,
    getDemandAnalysisResultBackV2,
    getDemandAnalysisResultV2,
    getImplementResBackV2,
} from '@/core'
import { Empty, Loader } from '@/ui'

interface IImplementInfo {
    id: string
    isBack?: boolean
}
const ImplementInfo: React.FC<IImplementInfo> = ({ id, isBack = false }) => {
    const [feedback, setFeedBack] = useState('')
    const [isEmpty, setIsEmpty] = useState(false)
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<IDemandItemInfo[]>([])
    const [implementRes, setImplementRes] = useState<IItemImplementAuthority[]>(
        [],
    )

    const getEmptyStatus = (isEmp: boolean) => {
        setIsEmpty(isEmp)
    }

    const getAnalysisRes = async () => {
        try {
            setLoading(true)
            if (id) {
                const aciton = isBack
                    ? getDemandAnalysisResultBackV2
                    : getDemandAnalysisResultV2
                const res = await aciton(id)
                setItems(res.items)
            }
        } catch (err) {
            if (err.data.code === 'DemandManagement.Form.NoDataExisted') {
                setIsEmpty(true)
                return
            }
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    const getImplementBackRes = async () => {
        try {
            if (id) {
                const res = await getImplementResBackV2(id)
                setFeedBack(res.accept_feedback)
                setImplementRes(
                    res.entries.map((item) => {
                        return {
                            id: item.id,
                            item_id: item.item_id,
                            impl_achv: item.impl_achv,
                        }
                    }),
                )
            }
        } catch (err) {
            if (err.data.code === 'DemandManagement.Form.NoDataExisted') {
                getEmptyStatus?.(true)
                return
            }
            formatError(err)
        }
    }

    useEffect(() => {
        getAnalysisRes()
        getImplementBackRes()
    }, [id])

    return (
        <div className={styles['implement-info-wrapper']}>
            {loading ? (
                <Loader />
            ) : isEmpty ? (
                <div className={styles['analysis-empty-container']}>
                    <Empty iconSrc={dataEmpty} desc={__('暂无需求实施成果')} />
                </div>
            ) : (
                <>
                    <CommonTitle title={__('需求项')} />
                    <div className={styles['demand-items']}>
                        <ImplementItems
                            id={id}
                            isBack={isBack}
                            initItems={items}
                            implementResult={implementRes}
                        />
                    </div>
                    <CommonTitle title={__('验收反馈')} />
                    <div className={styles['demand-conclusion']}>
                        {ImplementConclusionFields.map((field) => (
                            <div className={styles['demand-conclusion-item']}>
                                <div
                                    className={
                                        styles['demand-conclusion-item-label']
                                    }
                                >
                                    {field.label}
                                </div>
                                <div
                                    className={
                                        styles['demand-conclusion-value']
                                    }
                                >
                                    {feedback || '--'}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
export default ImplementInfo
