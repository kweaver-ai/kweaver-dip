import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { noop } from 'lodash'
import { Steps } from 'antd'
import {
    CheckOutlined,
    CloseOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined,
} from '@ant-design/icons'
import __ from '../locale'
import styles from './styles.module.less'
import DetailsContent from './DetailsContent'
import {
    analysisInfo,
    applyCatalogInfo,
    applyInfo,
    departmentInfo,
    feedbackInfo,
} from './helper'
import {
    formatError,
    getCityShareApplyDetail,
    IShareApplyOperateLog,
    ShareApplyActionType,
    ShareApplyPhaseEnum,
    ShareApplyProcessStatus,
    IShareApplyProcessInfo,
} from '@/core'
import { renderEmpty, renderLoader, ResTypeEnum } from '../helper'
import DrawerHeader from '../component/DrawerHeader'
import CatalogDetails from './CatalogDetails'
import CatalogTable from '../Apply/CatalogTable'
import { CommonTitle } from '@/ui'
import CommonDetails from './CommonDetails'
import ResourceTable from '../Analysis/ResourceTable'
import { SharingTab } from '../const'
import ProcessRecord from './ProcessRecord'

interface IDetails {
    applyId?: string
    // 是否全屏
    fullScreen?: boolean
    onClose?: () => void
    tab?: SharingTab
}

const Details: React.FC<IDetails> = ({
    applyId,
    fullScreen = true,
    onClose = noop,
    tab,
}) => {
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(false)
    // 详情数据
    const [detailsData, setDetailsData] = useState<any>({})

    const [catalogsData, setCatalogsData] = useState<any[]>([])
    // 流程记录展开状态
    const [processRecordExpanded, setProcessRecordExpanded] =
        useState<boolean>(false)
    // 操作记录数据
    const [processLogs, setProcessLogs] = useState<IShareApplyOperateLog[]>([])
    // 用户信息映射（从数组转换为 Map）
    const [userInfoMap, setUserInfoMap] = useState<Record<string, string>>({})
    // 分析资源项映射（从数组转换为 Map）
    const [analItemsMap, setAnalItemsMap] = useState<Record<string, any>>({})
    // 进度信息
    const [processInfo, setProcessInfo] = useState<any[]>([])

    useEffect(() => {
        if (applyId) {
            getDetails()
        }
    }, [applyId])

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getCityShareApplyDetail(applyId!, {
                fields: 'base,analysis,implement,feedback,process_info,log',
            })
            const { feasibility, conclusion, usage } =
                res.analysis || ({} as any)
            setDetailsData({
                ...res.base,
                feasibility,
                conclusion,
                usage,
                analysis: res.analysis,
                implement: res.implement,
                feedback: res.feedback,
            })
            // 设置操作记录数据
            if (res.log && Array.isArray(res.log)) {
                setProcessLogs(res.log || [])
            }
            // 将用户信息数组转换为 Map 便于查询
            if (res.user_depts && Array.isArray(res.user_depts)) {
                const userMap: Record<string, string> = {}
                res.user_depts.forEach((user) => {
                    if (user.id) {
                        userMap[user.id] = user.name || user.id
                    }
                })
                setUserInfoMap(userMap)
            }
            // 将分析资源项数组转换为 Map 便于查询
            if (res.anal_items && Array.isArray(res.anal_items)) {
                const itemsMap: Record<string, any> = {}
                res.anal_items.forEach((item) => {
                    if (item.anal_item_id) {
                        itemsMap[item.anal_item_id] = item
                    }
                })
                setAnalItemsMap(itemsMap)
            }
            // 设置进度信息
            if (res.process_info && Array.isArray(res.process_info)) {
                setProcessInfo(res.process_info)
            }
            const baseResources = res.base.resources || []
            const analysisResources = res.analysis?.resources || []
            const clgData = baseResources.map((resource) => {
                const analysisRes = analysisResources.find(
                    (item) => item.src_id === resource.id,
                )
                const {
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    id,
                    is_res_replace,
                    column_names,
                } = analysisRes || ({} as any)

                return {
                    ...resource,
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    analysis_item_id: id,
                    column_names,
                    replace_res:
                        is_reasonable || !is_res_replace
                            ? undefined
                            : {
                                  res_type: ResTypeEnum.Catalog,
                                  res_id: analysisRes?.new_res_id,
                                  res_code: analysisRes?.new_res_code,
                                  res_name: analysisRes?.new_res_name,
                                  org_path: analysisRes?.org_path,
                                  apply_conf: analysisRes?.apply_conf,
                              },
                }
            })
            setCatalogsData([
                ...clgData,
                ...analysisResources
                    .filter((item) => item.is_new_res)
                    .map((item) => {
                        return {
                            ...item,
                            analysis_item_id: item.id,
                            res_id: item.new_res_id,
                            res_name: item.new_res_name,
                            res_code: item.new_res_code,
                            res_type: item.new_res_type,
                        }
                    }),
            ])
        } catch (error) {
            formatError(error)
        }
    }

    // 详情配置
    const config: any = useMemo(() => {
        const res = detailsData.analysis // 带有分析和实施的表格
            ? [
                  analysisInfo,
                  {
                      key: 'implementCatalogInfo',
                      title: __('申请资源清单'),
                      content: [],
                      render: () => (
                          <div style={{ marginTop: 16 }}>
                              <ResourceTable
                                  isView
                                  items={catalogsData || []}
                                  isImplement={
                                      detailsData?.implement?.length > 0
                                  }
                                  applyId={applyId}
                                  tab={tab}
                              />
                          </div>
                      ),
                  }, // 申请时的资源表格
              ]
            : [
                  analysisInfo,
                  {
                      key: 'applyCatalogInfo',
                      title: __('申请资源清单'),
                      content: [],
                      // render: () => <CatalogDetails detailsData={detailsData} />,
                      render: () => (
                          <div style={{ marginTop: 16 }}>
                              <CatalogTable isView items={catalogsData || []} />
                          </div>
                      ),
                  },
              ]
        return [
            applyInfo,
            detailsData.feedback?.feedback_content ? feedbackInfo : null,
            departmentInfo,
            ...res,
        ]
    }, [detailsData, catalogsData, tab])

    // 阶段名称映射
    const phaseNameMap: Record<ShareApplyPhaseEnum, string> = {
        [ShareApplyPhaseEnum.Report]: __('申报'),
        [ShareApplyPhaseEnum.Analysis]: __('分析完善'),
        [ShareApplyPhaseEnum.AnalConfirm]: __('分析结论确认'),
        [ShareApplyPhaseEnum.DsAudit]: __('数据共享确认'),
        [ShareApplyPhaseEnum.Implement]: __('共享申请实施'),
        [ShareApplyPhaseEnum.ImplAchvConfirm]: __('实施成果确认'),
        [ShareApplyPhaseEnum.Completed]: __('完结'),
    }

    const steps = useMemo(() => {
        // 定义所有阶段的顺序
        const phaseOrder = [
            ShareApplyPhaseEnum.Report,
            ShareApplyPhaseEnum.Analysis,
            ShareApplyPhaseEnum.AnalConfirm,
            ShareApplyPhaseEnum.DsAudit,
            ShareApplyPhaseEnum.Implement,
            ShareApplyPhaseEnum.ImplAchvConfirm,
            ShareApplyPhaseEnum.Completed,
        ]

        // 特殊场景1：找到人工关闭的阶段（需要显示为 error）
        let errorPhase: ShareApplyPhaseEnum | null = null
        const completedItem = processInfo.find(
            (info) => info.phase === ShareApplyPhaseEnum.Completed,
        )
        if (
            completedItem &&
            completedItem.status === ShareApplyProcessStatus.Completed &&
            completedItem.close_phase
        ) {
            errorPhase = completedItem.close_phase
        }

        // 特殊场景2：当 phase = "completed" 且状态不是完成时，找到第一个进行中的节点
        let currentProcessingPhase: ShareApplyPhaseEnum | null = null
        if (
            completedItem &&
            completedItem.status !== ShareApplyProcessStatus.Completed
        ) {
            const processingItem = processInfo.find(
                (info) =>
                    info.status === ShareApplyProcessStatus.Processing &&
                    info.phase !== ShareApplyPhaseEnum.Completed,
            )
            if (processingItem) {
                currentProcessingPhase = processingItem.phase
            }
        }

        return phaseOrder.map((phase, index) => {
            const title = phaseNameMap[phase]
            const processItem = processInfo.find((info) => info.phase === phase)

            // 特殊场景：如果该阶段是人工关闭的阶段，显示为 error
            if (errorPhase && phase === errorPhase) {
                return {
                    title,
                    status: 'error' as const,
                    icon: (
                        <div className={styles.stepIconError}>
                            <CloseOutlined />
                        </div>
                    ),
                }
            }

            // 特殊场景：如果是被标记为当前进行中的阶段，强制显示为 process
            if (currentProcessingPhase && phase === currentProcessingPhase) {
                return {
                    title,
                    status: 'process' as const,
                    icon: (
                        <div className={styles.stepIconCurrent}>
                            {index + 1}
                        </div>
                    ),
                }
            }

            // 根据接口返回的状态直接判断
            // completed: 已完成 -> finish
            if (processItem?.status === ShareApplyProcessStatus.Completed) {
                return {
                    title,
                    status: 'finish' as const,
                    icon: (
                        <div className={styles.stepIconFinish}>
                            <CheckOutlined />
                        </div>
                    ),
                }
            }

            // processing: 进行中 -> process
            if (processItem?.status === ShareApplyProcessStatus.Processing) {
                return {
                    title,
                    status: 'process' as const,
                    icon: (
                        <div className={styles.stepIconCurrent}>
                            {index + 1}
                        </div>
                    ),
                }
            }

            // pending: 未开始 或 没有对应的 processItem -> wait
            return {
                title,
                status: 'wait' as const,
                icon: <div className={styles.stepIconWait}>{index + 1}</div>,
            }
        })
    }, [processInfo, phaseNameMap])

    return (
        <div
            className={classnames(
                styles.details,
                !fullScreen && styles.details_notFullScreen,
            )}
        >
            {/* 导航头部 */}
            <DrawerHeader
                title={detailsData.name}
                fullScreen={fullScreen}
                onClose={onClose}
            />

            {/* 内容 */}
            <div className={styles.bottom}>
                <div className={styles.content}>
                    <div className={styles['step-container']}>
                        <Steps items={steps} labelPlacement="vertical" />
                    </div>
                    <div
                        className={
                            processRecordExpanded
                                ? styles.detailsWithSidebar
                                : styles.detailsContent
                        }
                    >
                        <div className={styles.detailsMain}>
                            {loading
                                ? renderLoader(0)
                                : !detailsData
                                ? renderEmpty(64)
                                : // <DetailsContent data={detailsData} config={config} />
                                  config.map((group) =>
                                      group ? (
                                          <div key={group.key}>
                                              <CommonTitle
                                                  title={group.title}
                                              />
                                              <div
                                                  className={
                                                      styles['content-info']
                                                  }
                                              >
                                                  {group.render ? (
                                                      group.render()
                                                  ) : (
                                                      <CommonDetails
                                                          data={
                                                              group.key ===
                                                              'feedbackInfo'
                                                                  ? detailsData.feedback
                                                                  : detailsData
                                                          }
                                                          configData={
                                                              group.content
                                                          }
                                                      />
                                                  )}
                                              </div>
                                          </div>
                                      ) : null,
                                  )}
                        </div>
                        {processRecordExpanded && (
                            <div className={styles.processRecordSidebar}>
                                <ProcessRecord
                                    logs={processLogs}
                                    userInfoMap={userInfoMap}
                                    analItemsMap={analItemsMap}
                                    onClose={() =>
                                        setProcessRecordExpanded(false)
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>
                {!processRecordExpanded && (
                    <div
                        className={styles.processRecordBtn}
                        onClick={() => setProcessRecordExpanded(true)}
                    >
                        <div className={styles.processRecordText}>
                            {__('展开操作记录')}
                        </div>
                        <div className={styles.processRecordIcon}>
                            <DoubleLeftOutlined />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
export default Details
