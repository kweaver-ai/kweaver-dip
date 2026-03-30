import React, { useEffect, useState } from 'react'
import { Modal, Tabs } from 'antd'
import moment from 'moment'
import styles from './styles.module.less'
import __ from '../locale'
import { DetailsLabel } from '@/ui'
import { formatError, getExploreTaskDetails } from '@/core'
import { getState } from '@/components/BusinessDiagnosis/helper'
import {
    explorationTaskDetails,
    explorationTaskStatusList,
    explorationStrategyRadio,
    ExplorationType,
    explorationContentType,
} from './const'
import ExplorationRulesTable from './ExplorationRulesTable'
import {
    convertSecondsToHMS,
    explorationContentList,
    dataSourceIsDelNode,
} from './helper'
import Loader from '@/ui/Loader'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IExplorationTaskDetails {
    open: boolean
    onClose: () => void
    id: string
}

const ExplorationTaskDetails: React.FC<IExplorationTaskDetails> = ({
    open,
    onClose,
    id,
}) => {
    const [isGradeOpen] = useGradeLabelState()

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isExplorationDatasource, setIsExplorationDatasource] =
        useState<boolean>(false)
    const [detailsList, setDetailsList] = useState<any>(explorationTaskDetails)
    const [strategy, setStrategy] = useState<string>('')
    const [totalSample, setTotalSample] = useState<string>('')
    const [taskDetails, setTaskDetails] = useState<any>({})
    const { checkPermission } = useUserPermCtx()
    useEffect(() => {
        if (open && id) {
            search()
        }
    }, [open, id])

    // 查询
    const search = async () => {
        try {
            setIsLoading(true)
            const res = await getExploreTaskDetails(id)
            const isExpDatasOurce = !res?.form_view_id
            setIsExplorationDatasource(isExpDatasOurce)
            const config = res?.config ? JSON.parse(res?.config) : {}
            setTaskDetails(res)
            if (config?.strategy) {
                setStrategy(
                    explorationStrategyRadio.find(
                        (item) => item.value === config?.strategy,
                    )?.label || '',
                )
                setTotalSample(
                    config?.total_sample === 0
                        ? __('全量数据')
                        : __('随机采样数据${sum}条', {
                              sum: config?.total_sample,
                          }),
                )
            }

            const list = detailsList.map((item) => {
                const obj = {
                    ...item,
                    value: res?.[item.key],
                }
                if (item.key === 'name') {
                    const name = !isExpDatasOurce
                        ? res?.form_view_name
                        : res?.datasource_name
                    obj.render = () => {
                        return name || dataSourceIsDelNode()
                    }
                }
                if (item.key === 'finished_at' || item.key === 'created_at') {
                    obj.value = res?.[item.key]
                        ? moment(res?.[item.key]).format('YYYY-MM-DD HH:mm:ss')
                        : ''
                }
                if (item.key === 'time') {
                    const endT = res?.finished_at || new Date().getTime()
                    const seconds = endT - (res?.created_at || 0)
                    obj.value = res?.created_at
                        ? convertSecondsToHMS(Math.ceil(seconds / 1000))
                        : ''
                }
                if (item.key === 'type') {
                    obj.value = explorationContentList
                        .map((it) => ({
                            ...it,
                            statusLabel:
                                it.value ===
                                    explorationContentType.Classification &&
                                !isGradeOpen
                                    ? it.subStatusLabel
                                    : it.statusLabel,
                        }))
                        .filter((it) => {
                            if (
                                it.value ===
                                explorationContentType.Classification
                            ) {
                                return checkPermission(
                                    'manageDataClassification',
                                )
                            }
                            return true
                        })
                        ?.find((it) => it.value === res?.type)?.statusLabel
                }
                if (item.key === 'status') {
                    const text =
                        explorationTaskStatusList?.find(
                            (it) => it.value === res?.status,
                        )?.label || ''
                    obj.render = () => {
                        return (
                            <span title={text}>
                                {getState(
                                    res?.status,
                                    explorationTaskStatusList,
                                )}
                            </span>
                        )
                    }
                }
                return obj
            })
            setDetailsList(
                isExpDatasOurce
                    ? list.filter((it) => it.key !== 'datasource_name')
                    : list,
            )
        } catch (err) {
            formatError(err)
        } finally {
            setIsLoading(false)
        }
    }

    // const tabItems = [
    //     {
    //         label: __('任务详情'),
    //         key: '1',
    //         children: (
    //             <DetailsLabel detailsList={detailsList} labelWidth="120px" />
    //         ),
    //     },
    //     {
    //         label: __('探查规则'),
    //         key: '2',
    //         children: (
    //             <div className={styles.tabItems}>
    //                 {isExplorationDatasource && (
    //                     <div className={styles.labelItem}>
    //                         <div className={styles.label}>
    //                             {__('探查策略：')}
    //                         </div>
    //                         <div className={styles.text}>
    //                             {strategy || '--'}
    //                         </div>
    //                     </div>
    //                 )}
    //                 <div className={styles.labelItem}>
    //                     <div className={styles.label}>{__('采样数据量：')}</div>
    //                     <div className={styles.text}>{totalSample}</div>
    //                 </div>
    //                 <div style={{ height: '370px' }}>
    //                     <div className={styles.label}>{__('字段探查规则')}</div>
    //                     <div style={{ height: '340px' }}>
    //                         <ExplorationRulesTable
    //                             isDetails
    //                             datasourceId={taskDetails?.datasource_id}
    //                             formViewId={taskDetails?.form_view_id}
    //                             explorationType={
    //                                 taskDetails?.form_view_id
    //                                     ? ExplorationType.FormView
    //                                     : ExplorationType.Datasource
    //                             }
    //                         />
    //                     </div>
    //                 </div>
    //             </div>
    //         ),
    //     },
    // ]
    return (
        <div>
            <Modal
                title={__('任务详情')}
                onCancel={() => onClose()}
                open={open}
                width={640}
                className={styles.drawerWrapper}
                footer={null}
            >
                {isLoading ? (
                    <div className={styles.Loader}>
                        <Loader />
                    </div>
                ) : (
                    <div className={styles.drawerBox}>
                        {/* <Tabs
                            defaultActiveKey="1"
                            items={
                                taskDetails?.type ===
                                explorationContentType.Quality
                                    ? tabItems
                                    : tabItems.filter(
                                          (item) => item.key === '1',
                                      )
                            }
                        /> */}
                        <DetailsLabel
                            detailsList={detailsList}
                            labelWidth="120px"
                        />
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default ExplorationTaskDetails
