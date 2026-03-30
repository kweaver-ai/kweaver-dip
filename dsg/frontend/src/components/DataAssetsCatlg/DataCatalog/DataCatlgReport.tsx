import React, { useEffect, useState } from 'react'
import { BackTop, Tooltip } from 'antd'
import { Graph } from '@antv/x6'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@/utils'
import {
    formatError,
    formsEnumConfig,
    getDataComprehensionDetails,
    IdimensionModel,
    IFormEnumConfigModel,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { Empty, Loader } from '@/ui'
import dataEmpty from '../../../assets/dataEmpty.svg'
import { ReturnTopOutlined } from '@/icons'
import { useUndsGraphContext } from '@/context/UndsGraphProvider'
import ReportAnchor from '../../DataComprehension/ReportAnchor'
import Report from '../../DataComprehension/Report'

const DataCatlgReport: React.FC<{
    catalogId: string
}> = ({ catalogId }) => {
    const { viewMode, setViewMode } = useUndsGraphContext()
    const query = useQuery()
    const navigate = useNavigate()
    const backUrl = query.get('backUrl') || ''
    const projectId = query.get('projectId')
    const taskId = query.get('taskId') || ''
    const templateId = query.get('templateId') || ''
    const taskExecutableStatus = query.get('taskExecutableStatus')
    // const catalogId = query.get('cid') || ''
    const [loading, setLoading] = useState(false)
    // 返回显示/隐藏
    const [backVisible, setBackVisible] = useState(false)
    // 当前模块
    const [activeKey, setActiveKey] = useState<string>()
    // 画布实例
    const [grapInstance, setGrapInstance] = useState<Graph>()
    // 画布比例
    const [graphSizeValue, setGraphSizeValue] = useState<number>(100)
    // 详情信息
    const [details, setDetails] = useState<IdimensionModel>()
    // 配置信息枚举
    const [enumConfigs, setEnumConfigs] = useState<IFormEnumConfigModel>()

    useEffect(() => {
        getEnumConfig()
        getDetails()
    }, [])

    // 获取枚举值
    const getEnumConfig = async () => {
        const res = await formsEnumConfig()
        setEnumConfigs(res)
    }

    // 理解详情
    const getDetails = async () => {
        if (!catalogId) return
        try {
            setLoading(true)
            const res = await getDataComprehensionDetails(catalogId, {
                task_id: taskId,
                template_id: templateId,
            })
            setDetails(res)
        } catch (err) {
            formatError(err)
            setDetails(undefined)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.duc_bottom}>
            {loading ? (
                <Loader />
            ) : details ? (
                <>
                    <Report details={details} enumConfigs={enumConfigs} />
                    <ReportAnchor
                        details={details}
                        targetOffset={24}
                        style={{
                            position: 'absolute',
                            top: 76,
                            right: 24,
                            zIndex: 1000,
                        }}
                    />
                    <Tooltip title={__('回到顶部')}>
                        <BackTop
                            visibilityHeight={100}
                            className={styles.backTop}
                            target={() =>
                                document.getElementById('reportWrap')!
                            }
                        >
                            <ReturnTopOutlined style={{ fontSize: 40 }} />
                        </BackTop>
                    </Tooltip>
                </>
            ) : (
                <div className={styles.empty}>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            )}
        </div>
    )
}

export default DataCatlgReport
