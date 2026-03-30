import type { MenuProps } from 'antd'
import { Badge, Button, Divider, message, Space, Tooltip } from 'antd'
import { useEffect, useRef, useState } from 'react'

import {
    ExclamationCircleFilled,
    InfoCircleOutlined,
    ScanOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import moment from 'moment'
import { useLocation, useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import { DataSourceOrigin } from '@/components/DataSource/helper'
import {
    DataViewAuditType,
    formatError,
    getDataViewDatasouces,
    LogicViewType,
    scanDatasource,
    unCategorizedKey,
} from '@/core'
import { DataColoredBaseIcon } from '@/core/dataSource'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { AddOutlined, ClockColored, FontIcon } from '@/icons'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { getSource, useQuery, isSemanticGovernanceApp } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import DragBox from '../DragBox'
import MultiTypeSelectTree from '../MultiTypeSelectTree'
import { TreeType } from '../MultiTypeSelectTree/const'
import { RescCatlgType } from '../ResourcesDir/const'
import {
    datasourceTitleData,
    DsType,
    formatSelectedNodeToTableParams,
    getNewDataType,
    IconType,
    IDatasourceInfo,
    scanType,
} from './const'
import DatasheetTable from './DatasheetTable'
import DatasourceExploration from './DatasourceExploration'
import DatasourceOverview from './DatasourceExploration/DatasourceOverview'
import { useDataViewContext } from './DataViewProvider'
import {
    cancelScanVisible,
    getDataViewTitleIcon,
    showMessage,
    showSuccessMessage,
} from './helper'
import Icons from './Icons'
import __ from './locale'
import ScanConfirm from './ScanConfirm'
import ScanModal from './ScanModal'
import MyTaskDrawer from '../AssetCenterHeader/MyTaskDrawer'
import FieldBlackList from './FieldBlackList'
import styles from './styles.module.less'

interface IDatasheetView {
    // 是否价值评估菜单
    isValueEvaluation?: boolean
}
const DatasheetView = (props: IDatasheetView) => {
    const { isValueEvaluation } = props
    const datasheetTableRef: any = useRef()
    const navigator = useNavigate()
    const [defaultSize, setDefaultSize] = useState<Array<number>>([15, 82])

    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [isDataViewEmpty, setIsDataViewEmpty] = useState<boolean>(false)

    const [selectedNode, setSelectedNode] = useState<any>({
        name: '全部',
        id: '',
    })

    const [dataType, setDataType] = useState<DsType>(DsType.all)
    const [datasourceInfo, setDatasourceInfo] = useState<IDatasourceInfo>(
        datasourceTitleData[dataType],
    )
    const isSemanticGovernance = isSemanticGovernanceApp()

    const [scanModalOpen, setScanModalOpen] = useState<boolean>(false)
    const [scanModalType, setScanModalType] = useState<scanType>(scanType.init)
    const [datasourceData, setDatasourceData] = useState<any[]>([])
    const [scanDatasourceData, setScanDatasourceData] = useState<any[]>([])
    const [scanDatasourceDataAll, setScanDatasourceDataAll] = useState<any[]>(
        [],
    )
    const [tableList, setTableList] = useState<any>()
    const [curSum, setCurSum] = useState<number>(0)
    const [scanConfirmOpen, setScanConfirmOpen] = useState<boolean>(false)
    const [isScaning, setIsScaning] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [showMytask, setShowMytask] = useState<boolean>(false)
    const [showFieldBlackList, setShowFieldBlackList] = useState<boolean>(false)
    const { auditProcessStatus, hasExcelDataView, setIsValueEvaluation } =
        useDataViewContext()
    const [{ using }, updateUsing] = useGeneralConfig()
    const [datasourceExplorationOpen, setDatasourceExplorationOpen] =
        useState<boolean>(false)
    const [datasourceOverviewOpen, setDatasourceOverviewOpen] =
        useState<boolean>(false)
    const { pathname } = useLocation()
    const query = useQuery()
    const backUrl = query.get('backUrl') || ''
    const datasourceTab = query.get('tab') || ''

    const [tableParams, setTableParams] = useState<any>({})
    useEffect(() => {
        if (isValueEvaluation) {
            setIsValueEvaluation(true)
        }
    }, [isValueEvaluation])

    useEffect(() => {
        setDatasourceInfo(datasourceTitleData[dataType])
    }, [dataType])

    useEffect(() => {
        getDatasourceData()
    }, [])

    useEffect(() => {
        const listener = (e: any) => {
            if (!isScaning) return
            e.preventDefault()
            e.returnValue = '扫描中'
        }
        window.addEventListener('beforeunload', listener)
        return () => {
            window.removeEventListener('beforeunload', listener)
        }
    }, [isScaning])

    // 获取选中的节点
    const getSelectedNode = (sn?: any, type?: RescCatlgType) => {
        setSelectedNode(sn)
        setTableParams(formatSelectedNodeToTableParams(sn))
        setDataType(getNewDataType(sn))
        // const snType =
        //     sn?.id === ''
        //         ? DsType.all
        //         : sn?.id === sn?.type
        //         ? DsType.datasourceType
        //         : DsType.datasource
        // setDataType(snType)

        // setSelectedNode(sn || allNodeInfo)
        // const data = !sn?.id
        //     ? datasourceData
        //     : sn?.id === sn?.type
        //     ? datasourceData?.filter((item) => item.type === sn?.type)
        //     : datasourceData?.filter((item) => item.id === sn?.id)
        // setScanDatasourceDataAll(data || [])
    }

    const showEmpty = () => {
        return (
            <div className={styles.indexEmptyBox}>
                <Empty
                    desc={__('暂无数据，可通过【扫描数据源】来添加库表')}
                    iconSrc={dataEmpty}
                />
                <div className={styles.emptyBtn}>
                    <Button
                        type="primary"
                        onClick={() => {
                            // setScanModalType(scanType.init)
                            // setScanDatasourceData(scanDatasourceDataAll)
                            // setScanModalOpen(true)
                            window.open('/studio/mmdl/data-connect')
                        }}
                        icon={<ScanOutlined />}
                    >
                        {__('数据扫描>>')}
                    </Button>
                </div>
            </div>
        )
    }

    const getDatasourceData = async () => {
        try {
            const res = await getDataViewDatasouces({
                limit: 1000,
                direction: 'desc',
                sort: 'updated_at',
                source_type: isValueEvaluation
                    ? DataSourceOrigin.INFOSYS
                    : undefined,
            })
            const list = res?.entries || []
            setDatasourceData(list)
            setScanDatasourceData(list)
            setScanDatasourceDataAll(list)
            setIsLoading(false)
            if (list.length === 0) {
                setIsEmpty(true)
            }
        } catch (err) {
            formatError(err)
        } finally {
            setIsLoading(false)
        }
    }

    const dropdownItems: MenuProps['items'] = [
        {
            key: '1',
            label: (
                <a
                    onClick={() => {
                        setScanModalType(scanType.history)
                        const datasources = scanDatasourceDataAll.filter(
                            (item) => item.last_scan,
                        )
                        setScanDatasourceData(datasources)
                        setScanModalOpen(true)
                    }}
                >
                    <Badge
                        offset={[0, 10]}
                        count={
                            <ClockColored
                                style={{
                                    fontSize: '10px',
                                }}
                            />
                        }
                    >
                        {selectedNode.nodeType ? (
                            <DataColoredBaseIcon
                                type={selectedNode.nodeType}
                                iconType="Colored"
                            />
                        ) : (
                            <Icons type={IconType.DATASHEET} />
                        )}
                    </Badge>

                    <span className={styles.dropdownItem}>
                        {__('仅重新扫描历史数据源')}
                    </span>
                </a>
            ),
        },
        {
            key: '2',
            label: (
                <a
                    onClick={() => {
                        setScanModalType(scanType.all)
                        setScanDatasourceData(scanDatasourceDataAll)
                        setScanModalOpen(true)
                    }}
                >
                    {selectedNode.nodeType ? (
                        <DataColoredBaseIcon
                            type={selectedNode.nodeType}
                            iconType="Colored"
                        />
                    ) : (
                        <Icons type={IconType.DATASHEET} />
                    )}
                    {/* <Icons type={selectedNode.type || IconType.DATASHEET} /> */}
                    <span className={styles.dropdownItem}>
                        {__('扫描所有数据源')}
                    </span>
                </a>
            ),
        },
    ]

    // 取消扫描
    const scanCancel = () => {
        // 取消请求
        const sor = getSource()
        if (sor.length > 0) {
            sor.forEach((info) => {
                info.source.cancel()
            })
        }
        message.success(__('未开始的任务终止成功，有1个任务已开始将继续执行'))
    }

    // 扫描数据源
    const scanModalOk = async (data?: any[]) => {
        setScanModalOpen(false)
        setScanConfirmOpen(true)
        const scanData = data?.length ? data : scanDatasourceData
        setScanDatasourceData(scanData)
        setIsScaning(true)
        loopScan(scanData, 1, [], [])
    }

    const loopScan = async (
        listArr: any[],
        index: number,
        errorList: any[],
        revokeAuditList: any[],
    ) => {
        let count: number = index
        setCurSum(count)
        try {
            const res = await scanDatasource({
                datasource_id: listArr[count - 1].id,
            })
            if (res?.update_revoke_audit_view_list?.length > 0) {
                revokeAuditList.push(...res.update_revoke_audit_view_list)
            }
            if (res?.delete_revoke_audit_view_list?.length > 0) {
                revokeAuditList.push(...res.delete_revoke_audit_view_list)
            }
            if (res?.error_view?.length) {
                const obj = {
                    name: listArr[count - 1].name,
                    type: listArr[count - 1].type,
                    error_view: res?.error_view,
                    error_view_count: res?.error_view_count,
                    scan_view_count: res?.scan_view_count,
                }
                errorList.push(obj)
            }
        } catch (err) {
            const obj = {
                ...err?.data,
                name: listArr[count - 1].name,
                type: listArr[count - 1].type,
                description:
                    err?.data?.description ||
                    __('请求的服务暂不可用，请稍后再试'),
            }
            errorList.push(obj)
        } finally {
            count += 1
            setCurSum(count)
            if (
                count - 1 === listArr.length ||
                errorList.findIndex((item) => item.code === 'ERR_CANCELED') > -1
            ) {
                const cancelList =
                    errorList.filter((item) => item.code === 'ERR_CANCELED') ||
                    []
                setScanConfirmOpen(false)
                if (
                    errorList.length - cancelList.length > 0 ||
                    revokeAuditList.length > 0
                ) {
                    showMessage(count - 1, errorList, revokeAuditList, using)
                } else {
                    showSuccessMessage(count - 1 - cancelList.length)
                }
                await setIsEmpty(false)
                datasheetTableRef?.current?.search()
                setScanDatasourceData([])
                getDatasourceData()
                setIsScaning(false)
            } else {
                loopScan(listArr, count, errorList, revokeAuditList)
            }
        }
    }

    /**
     * 新建excel库表
     */
    const handleCreateExcel = () => {
        let detailsUrl: string = ''
        if (backUrl) {
            detailsUrl = `${pathname}/${window.location.search}`
        }
        const url = `/datasheet-view/detail?datasourceTab=${datasourceTab}&model=edit&isCompleted=${true}&taskId=&detailsUrl=${
            detailsUrl || null
        }&logic=${
            LogicViewType.DataSource
        }&dataSourceType=excel&filename=${encodeURIComponent(
            selectedNode.title || selectedNode.name || '',
        )}&catalog=${selectedNode.catalog_name}&dataSourceId=${
            selectedNode?.nodeId
        }`
        navigator(url)
    }

    return (
        <div className={styles.datasheetViewWrapper}>
            {isLoading ? (
                <div className={styles.indexEmptyBox}>
                    <Loader />
                </div>
            ) : isEmpty ? (
                showEmpty()
            ) : (
                <DragBox
                    defaultSize={defaultSize}
                    minSize={[270, 270]}
                    maxSize={[800, Infinity]}
                    onDragEnd={(size) => {
                        setDefaultSize(size)
                    }}
                >
                    <div className={styles.left}>
                        {isValueEvaluation ? (
                            <div className={styles.leftTips}>
                                {__('数据价值评估')}
                            </div>
                        ) : (
                            <div className={styles.leftTips}>
                                {__('扫描数据源获取库表')}
                                <Tooltip
                                    placement="bottomLeft"
                                    color="white"
                                    overlayClassName="datasheetViewTreeTipsBox"
                                    title={
                                        <span
                                            style={{
                                                color: 'rgba(0, 0, 0, 0.65)',
                                            }}
                                        >
                                            {__(
                                                '仅展示已扫描过且存在库表的数据源',
                                            )}
                                        </span>
                                    }
                                >
                                    <InfoCircleOutlined
                                        className={styles.leftIcon}
                                    />
                                </Tooltip>
                            </div>
                        )}
                        <div className={styles.leftTreeBox}>
                            {/* <DatasourceTree
                                getSelectedNode={getSelectedNode}
                                datasourceData={datasourceData}
                            /> */}
                            <MultiTypeSelectTree
                                enabledTreeTypes={[
                                    TreeType.Department,
                                    TreeType.InformationSystem,
                                    TreeType.DataSource,
                                ]}
                                onSelectedNode={(sn) => {
                                    getSelectedNode(sn)
                                }}
                                treePropsConfig={{
                                    [TreeType.InformationSystem]: {
                                        needUncategorized: !isValueEvaluation,
                                    },
                                    [TreeType.Department]: {
                                        needUncategorized: true,
                                        unCategorizedKey:
                                            '00000000-0000-0000-0000-000000000000',
                                    },
                                    [TreeType.DataSource]: {
                                        filterDataSourceTypes: isValueEvaluation
                                            ? [
                                                  DataSourceOrigin.DATASANDBOX,
                                                  DataSourceOrigin.DATAWAREHOUSE,
                                              ]
                                            : [DataSourceOrigin.DATASANDBOX],
                                        extendNodesData: [
                                            {
                                                id: unCategorizedKey,
                                                title: __('未分类'),
                                            },
                                        ],
                                    },
                                }}
                            />
                        </div>
                        {/* {!isValueEvaluation && ( */}
                        <div className={styles.leftBottom}>
                            <Button
                                onClick={() => {
                                    window.open('/studio/mmdl/data-connect')
                                    // setScanModalType(scanType.init)
                                    // setScanModalOpen(true)
                                }}
                                icon={<ScanOutlined />}
                            >
                                {__('数据扫描>>')}
                            </Button>
                        </div>
                        {/* )} */}
                    </div>
                    <div className={styles.right}>
                        <div className={styles.rightTop}>
                            {__('元数据库表')}
                            {!isSemanticGovernance && (
                                <div className={styles.rightSubTitle}>
                                    {__(
                                        '（未发布的库表不能上线，不展示未发布库表）',
                                    )}
                                </div>
                            )}
                            {isSemanticGovernance && (
                                <div className={styles.rightTopBtn}>
                                    <span
                                        className={styles.rightTopBtnItem}
                                        onClick={() => {
                                            setShowMytask(true)
                                        }}
                                    >
                                        <FontIcon name="icon-tancharenwu2" />
                                        {__('探查任务')}
                                    </span>
                                    <span
                                        className={styles.rightTopBtnItem}
                                        onClick={() => {
                                            setShowFieldBlackList(true)
                                        }}
                                    >
                                        <FontIcon name="icon-tancharenwu2" />
                                        {__('字段黑名单')}
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* <div className={styles.rightTop}>
                            <div
                                className={classnames(
                                    styles.rightTopleft,
                                    tableList?.last_scan_time && styles.scanWid,
                                )}
                            >
                                {getDataViewTitleIcon(selectedNode)}
                                <div className={styles.rightTopDescBox}>
                                    <div className={styles.rightTopDesc}>
                                        <span title={selectedNode.name}>
                                            {selectedNode?.name}
                                        </span>
                                        {dataType !== DsType.datasource && (
                                            <span className={styles.titleText}>
                                                {datasourceInfo.name}
                                            </span>
                                        )}
                                        {tableList?.last_scan_time &&
                                        ((selectedNode?.nodeId as string) !==
                                            'excel' ||
                                            hasExcelDataView) ? (
                                            <span className={styles.titleTime}>
                                                {__('最近扫描时间：')}
                                                {moment(
                                                    tableList?.last_scan_time,
                                                ).format('YYYY-MM-DD HH:mm:ss')}
                                                <span
                                                    className={
                                                        styles.titleTimeDivide
                                                    }
                                                >
                                                    /
                                                </span>
                                                {__('最近探查时间：')}
                                                {tableList?.explore_time
                                                    ? moment(
                                                          tableList?.explore_time,
                                                      ).format(
                                                          'YYYY-MM-DD HH:mm:ss',
                                                      )
                                                    : '--'}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            {!isDataViewEmpty && !isValueEvaluation && (
                                <div className={styles.rightTopRight}>
                                    {dataType === DsType.datasource ? (
                                        <Space size={20}>
                                            <Button
                                                onClick={() =>
                                                    setDatasourceExplorationOpen(
                                                        true,
                                                    )
                                                }
                                                className={styles.defaultBtn}
                                            >
                                                {__('探查数据源')}
                                                <Divider type="vertical" />
                                                <Tooltip
                                                    title={__('查看数据源概览')}
                                                    placement="bottom"
                                                >
                                                    <FontIcon
                                                        name="icon-gailan"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            setDatasourceOverviewOpen(
                                                                true,
                                                            )
                                                        }}
                                                        className={
                                                            styles.rightIcon
                                                        }
                                                    />
                                                </Tooltip>
                                            </Button>
                                            {(selectedNode.nodeType as string) !==
                                                'excel' && (
                                                <Popconfirm
                                                    title={__(
                                                        '确定要重新扫描此数据源吗？',
                                                    )}
                                                    okText={__('确定')}
                                                    cancelText={__('取消')}
                                                    icon={
                                                        <InfoCircleFilled
                                                            style={{
                                                                color: '#3A8FF0',
                                                                fontSize:
                                                                    '16px',
                                                            }}
                                                        />
                                                    }
                                                    onConfirm={() => {
                                                        scanModalOk([
                                                            {
                                                                ...selectedNode,
                                                                id: selectedNode.nodeId,
                                                                type: selectedNode.nodeType,
                                                            },
                                                        ])
                                                    }}
                                                >
                                                    <Button
                                                        type="primary"
                                                        icon={<ScanOutlined />}
                                                    >
                                                        {__('重新扫描')}
                                                    </Button>
                                                </Popconfirm>
                                            )}
                                        </Space>
                                    ) : null}
                                </div>
                            )}
                            {(selectedNode?.dataType as string) === 'file' &&
                                !isValueEvaluation && (
                                    <div className={styles.rightTopRight}>
                                        <Button
                                            type="primary"
                                            icon={<AddOutlined />}
                                            onClick={handleCreateExcel}
                                        >
                                            {__('新建库表')}
                                        </Button>
                                    </div>
                                )}
                        </div> */}

                        <DatasheetTable
                            datasourceData={datasourceData}
                            dataType={dataType}
                            getTableEmptyFlag={(flag) => {
                                setIsDataViewEmpty(flag)
                                setIsEmpty(flag && datasourceData?.length === 0)
                                setIsLoading(false)
                            }}
                            selectedNode={selectedNode}
                            selectedDatasources={tableParams}
                            getTableList={setTableList}
                            ref={datasheetTableRef}
                            logicType={LogicViewType.DataSource}
                        />
                    </div>
                </DragBox>
            )}
            {/* 扫描数据源 -- 选择数据源 */}
            {scanModalOpen && (
                <ScanModal
                    open={scanModalOpen}
                    type={scanModalType}
                    onClose={() => {
                        setScanDatasourceData([])
                        setScanModalOpen(false)
                    }}
                    onOk={(data) => {
                        if (
                            data &&
                            data.filter((item) => item.last_scan)?.length > 0 &&
                            auditProcessStatus[DataViewAuditType.Online] &&
                            using !== 1
                        ) {
                            confirm({
                                title: __(
                                    '您选择的数据源中，有产生历史库表的数据，请您确认是否继续扫描？',
                                ),
                                icon: (
                                    <ExclamationCircleFilled
                                        style={{
                                            color: '#FAAD14',
                                            fontSize: '24px',
                                        }}
                                    />
                                ),
                                content: (
                                    <div>
                                        {__(
                                            '若扫描数据源发现库表字段有变更（源表更改、源表删除），上线审核中的库表会自动撤销审核。',
                                        )}
                                        <div
                                            style={{
                                                color: 'rgb(0 0 0 / 45%)',
                                                marginTop: 18,
                                            }}
                                        >
                                            {__(
                                                '其中标记“源表更改”的库表建议更新后重新操作上线，已上线的不用重新上线但需要手动更新；标记“源表删除”的库表不能上线，已上线的将会自动下线。',
                                            )}
                                        </div>
                                    </div>
                                ),
                                okText: __('我知道了，继续扫描'),
                                onOk() {
                                    scanModalOk(data)
                                },
                            })
                        } else {
                            scanModalOk(data)
                        }
                    }}
                    isEmpty={datasourceData.length === 0}
                    selectedDsNode={{
                        ...selectedNode,
                        id: selectedNode.nodeId,
                        type: selectedNode.nodeType,
                    }}
                    datasourceData={scanDatasourceData}
                />
            )}

            {/* 扫描数据源 -- 进度 */}
            {scanConfirmOpen && (
                <ScanConfirm
                    open={scanConfirmOpen}
                    datasourceData={scanDatasourceData}
                    curSum={curSum}
                    onClose={() => {
                        cancelScanVisible(scanCancel)
                        setIsScaning(false)
                    }}
                />
            )}
            {/* 探查数据源 */}
            {datasourceExplorationOpen && (
                <DatasourceExploration
                    open={datasourceExplorationOpen}
                    onClose={() => {
                        setDatasourceExplorationOpen(false)
                    }}
                    datasourceId={selectedNode?.nodeId}
                />
            )}
            {/* 数据源概览 */}
            {datasourceOverviewOpen && (
                <DatasourceOverview
                    open={datasourceOverviewOpen}
                    datasource_id={selectedNode?.nodeId}
                    onClose={() => {
                        setDatasourceOverviewOpen(false)
                    }}
                    exploreTime={
                        tableList?.explore_time
                            ? moment(tableList?.explore_time).format(
                                  'YYYY-MM-DD HH:mm:ss',
                              )
                            : ''
                    }
                />
            )}
            {showMytask && (
                <MyTaskDrawer
                    open={showMytask}
                    onClose={() => {
                        setShowMytask(false)
                    }}
                    tabKey="2"
                />
            )}
            {showFieldBlackList && (
                <FieldBlackList
                    open={showFieldBlackList}
                    onClose={() => {
                        setShowFieldBlackList(false)
                    }}
                />
            )}
        </div>
    )
}

export default DatasheetView
