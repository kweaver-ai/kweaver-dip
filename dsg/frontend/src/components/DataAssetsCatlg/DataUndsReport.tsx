import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BackTop, Tooltip } from 'antd'
import { useScroll } from 'ahooks'
import { noop } from 'lodash'
import classnames from 'classnames'
import {
    formatError,
    formsEnumConfig,
    getDataComprehensionDetails,
    IdimensionModel,
    IFormEnumConfigModel,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import Loader from '@/ui/Loader'
import { ReturnTopOutlined } from '@/icons'
import ReportAnchor from '../DataComprehension/ReportAnchor'
import Report from '../DataComprehension/Report' // CSSJJ版报告调整
import { formatCatlgError } from './helper'

const DataUndsReport: React.FC<{
    id: string
    isMarket?: boolean
    errorCallback?: (error?: any) => void
}> = ({ id, isMarket, errorCallback = noop }) => {
    const [loading, setLoading] = useState(false)
    const [details, setDetails] = useState<IdimensionModel>()
    const ref = useRef<HTMLDivElement>(null)
    const scroll = useScroll(document.getElementById('customDrawerBody'))
    const anchorFixed = useMemo(() => {
        return (
            (document.getElementById('customDrawerBody')?.scrollTop || 0) > 136
        )
    }, [scroll])
    // 配置信息枚举
    const [enumConfigs, setEnumConfigs] = useState<IFormEnumConfigModel>()

    useEffect(() => {
        getEnumConfig()
        getDetails()
    }, [id])

    // 获取枚举值
    const getEnumConfig = async () => {
        const res = await formsEnumConfig()
        setEnumConfigs(res)
    }

    // 理解详情
    const getDetails = async () => {
        if (!id) return
        try {
            setLoading(true)
            const res = await getDataComprehensionDetails(id)
            setDetails(res)
        } catch (err) {
            formatCatlgError(err, errorCallback)
            setDetails(undefined)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className={classnames({
                [styles.dataUndsReportWrap]: true,
                [styles.marketReportWrapper]: isMarket,
            })}
            id="dataUndsReport"
            ref={ref}
        >
            {loading ? (
                <Loader />
            ) : (
                <div>
                    <Report details={details} enumConfigs={enumConfigs} />
                    {details && (
                        <ReportAnchor
                            details={details}
                            targetOffset={101}
                            container={
                                document.getElementById('customDrawerBody') ||
                                window
                            }
                            style={{
                                position: 'absolute',
                                top: anchorFixed
                                    ? 62
                                    : 197 - (scroll?.top || 0),
                                right: 24,
                                zIndex: 999,
                            }}
                        />
                    )}
                    <Tooltip title={__('回到顶部')}>
                        <BackTop
                            visibilityHeight={100}
                            style={{
                                position: 'fixed',
                                zIndex: 9999,
                                right: 24,
                                bottom: 24,
                                width: 40,
                                height: 40,
                            }}
                            target={() =>
                                document.getElementById('customDrawerBody') ||
                                window
                            }
                        >
                            <ReturnTopOutlined
                                className={styles.dur_returnTopIcon}
                                style={{}}
                            />
                        </BackTop>
                    </Tooltip>
                </div>
            )}
        </div>
    )
}

export default DataUndsReport
