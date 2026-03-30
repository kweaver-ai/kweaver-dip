import React, { useEffect, useState } from 'react'
import CommonTitle from '../CommonTitle'
import __ from '../locale'
import styles from './styles.module.less'
import ViewConfig from './ViewConfig'
import DemandItems from './DemandItems'
import {
    IAnalysisResult,
    formatError,
    getDemandAnalysisResultBackV2,
    getDemandAnalysisResultV2,
} from '@/core'
import { DemandFeasibilityNameMap } from './const'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'

interface IAnalysisInfo {
    id: string
    isBack?: boolean
}
const AnalysisInfo: React.FC<IAnalysisInfo> = ({ id, isBack = false }) => {
    const [configOpen, setConfigOpen] = useState(false)
    const [analysisRes, setAnalysisRes] = useState<IAnalysisResult>()

    const getAnalysisRes = async () => {
        try {
            if (id) {
                const aciton = isBack
                    ? getDemandAnalysisResultBackV2
                    : getDemandAnalysisResultV2
                const res = await aciton(id)
                setAnalysisRes(res)
            }
        } catch (err) {
            if (
                err.data.code === 'DemandManagement.Form.NoDataExisted' ||
                err.data.code ===
                    'DemandManagement.Form.DemandNotExistOrUserNotMatchedError'
            )
                return
            formatError(err)
        }
    }

    useEffect(() => {
        getAnalysisRes()
    }, [id])

    return (
        <div className={styles['analysis-info-wrapper']}>
            {analysisRes ? (
                <>
                    <div className={styles['analysis-info-title']}>
                        <CommonTitle title={__('需求项')} />
                    </div>
                    <div className={styles['analysis-info-demand-items']}>
                        <DemandItems demandItems={analysisRes?.items} />
                    </div>
                    <div className={styles['analysis-info-title']}>
                        <CommonTitle title={__('需求可行性结论')} />
                    </div>
                    <div className={styles['demand-conclusion']}>
                        <div className={styles['demand-conclusion-item']}>
                            <div
                                className={
                                    styles['demand-conclusion-item-label']
                                }
                            >
                                {__('需求可行性：')}
                            </div>
                            <div className={styles['demand-conclusion-value']}>
                                {analysisRes?.feasibility
                                    ? DemandFeasibilityNameMap[
                                          analysisRes?.feasibility
                                      ]
                                    : '--'}
                            </div>
                        </div>
                        <div className={styles['demand-conclusion-item']}>
                            <div
                                className={
                                    styles['demand-conclusion-item-label']
                                }
                            >
                                {__('分析结论说明：')}
                            </div>
                            <div className={styles['demand-conclusion-value']}>
                                {analysisRes?.conclusion || '--'}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className={styles['analysis-empty-container']}>
                    <Empty iconSrc={dataEmpty} desc={__('暂无需求分析方案')} />
                </div>
            )}
        </div>
    )
}
export default AnalysisInfo
