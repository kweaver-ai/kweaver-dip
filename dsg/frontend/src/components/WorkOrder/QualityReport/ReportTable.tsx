import { Button, Space, Tooltip } from 'antd'
import classnames from 'classnames'
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import CommonTable from '@/components/CommonTable'
import { FixedType } from '@/components/CommonTable/const'
import SearchLayout from '@/components/SearchLayout'
import {
    getQualityReportList,
    IDatasheetView,
    IDataSourceInfo,
    SortDirection,
} from '@/core'
import { databaseTypesEleData } from '@/core/dataSource'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { Empty, LightweightSearch, SearchInput } from '@/ui'
import { OperateType } from '@/utils'
import CorrectionOptModal from '../WorkOrderType/QualityOrder/OptModal'
import { OrderType } from '../helper'
import ReportDetail from './ReportDetail'
import { DsType } from './const'
import { SearchFilter } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'
import { RefreshBtn } from '@/components/ToolbarComponents'

interface IReportTable {
    // dataType?: DsType
    getTableEmptyFlag?: (flag: boolean) => void
    getTableList?: (data: any) => void
    // 任务中心 'task'
    type?: string
    // 任务当前任务信息
    taskInfo?: any
    datasourceData?: any[]
    selectedDatasources?: any
}

const ReportTable = forwardRef((props: IReportTable, ref) => {
    const {
        // dataType,
        type,
        taskInfo,
        getTableEmptyFlag,
        getTableList,
        datasourceData,
        selectedDatasources,
    } = props
    const [{ using }] = useGeneralConfig()

    const commonTableRef: any = useRef()
    const searchRef: any = useRef()

    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [moreExpansionStatus, setMoreExpansionStatus] =
        useState<boolean>(false)

    const initSearchCondition: IDatasheetView = {
        offset: 1,
        limit: 10,
        direction: SortDirection.DESC,
        sort: 'updated_at',
    }

    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [showSearch, setShowSearch] = useState<boolean>(false)
    const [listEmpty, setListEmpty] = useState<boolean>(true)
    const [reportDetailVisible, setReportDetailVisible] =
        useState<boolean>(false)
    const [correctionVisible, setCorrectionVisible] = useState<boolean>(false)

    const [searchCondition, setSearchCondition] = useState<any>({
        ...initSearchCondition,
        catalog_name: '',
        keyword: '',
    })

    // 点击目录项
    const [curDataView, setCurDataView] = useState<IDataSourceInfo>()
    const [formData, setFormData] = useState<any[]>(SearchFilter)
    const [tableHeight, setTableHeight] = useState<number>(0)

    useImperativeHandle(ref, () => ({
        search,
    }))

    useEffect(() => {
        getTableEmptyFlag?.(isEmpty)
    }, [isEmpty])

    useEffect(() => {
        if (selectedDatasources) {
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                catalog_name: selectedDatasources?.catalog_name || '',
            })
        }
    }, [selectedDatasources])

    useEffect(() => {
        const unLimit = {
            label: __('不限'),
            value: undefined,
        }
        const dbOptions = formData.map((item) => {
            const obj: any = { ...item }
            if (obj.key === 'catalog_name') {
                const opts = (datasourceData || [])
                    .filter((it) => it.last_scan)
                    .map((it) => {
                        const { Colored = undefined } = it.type
                            ? databaseTypesEleData.dataBaseIcons[it.type]
                            : {}
                        return {
                            ...it,
                            label: it.name,
                            value: it.catalog_name,
                            icon: <Colored />,
                        }
                    })
                obj.options = [unLimit, ...opts]
            }
            return obj
        })
        setFormData(dbOptions)
    }, [datasourceData])

    useEffect(() => {
        const {
            sort,
            direction,
            offset,
            limit,
            datasource_id,
            datasource_type,
            task_id,
            project_id,
            keyword,
            include_sub_subject,
            ...searchObj
        } = searchCondition || {}
        // 过滤type查询条件
        const hasSearchCondition = Object.values({
            ...searchObj,
            type: undefined,
        }).some((item) => item)

        // 超过8个查询条件，且展开了全部时的高度
        const allSearchHeight: number =
            moreExpansionStatus && searchIsExpansion ? 73 : 0
        // 展开/收起查询条件高度
        const defalutHeight: number = !searchIsExpansion ? 314 : 504
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0

        // 元数据库表
        const dataSourceHeight =
            defalutHeight +
            searchConditionHeight +
            (using === 1 ? 0 : allSearchHeight)

        setTableHeight(dataSourceHeight)
    }, [searchCondition, searchIsExpansion, moreExpansionStatus])

    const handleOperate = (op: OperateType, item: any) => {
        setCurDataView(item)

        switch (op) {
            case OperateType.DETAIL:
                setReportDetailVisible(true)
                break

            case OperateType.CREATE:
                setCorrectionVisible(true)
                break
            default:
                break
        }
    }

    // 查询
    const search = () => {
        commonTableRef?.current?.getData()
    }

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('库表业务名称')}</span>
                    <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'business_name',
            key: 'business_name',
            width: 220,
            // sorter: true,
            // sortOrder: tableSort.name,
            // showSorterTooltip: {
            //     title: __('按库表业务名称排序'),
            // },
            render: (text, record) => {
                return (
                    <div className={styles.catlgBox}>
                        <div className={styles.catlgName}>
                            <div
                                onClick={() =>
                                    handleOperate(OperateType.DETAIL, record)
                                }
                                className={styles.ellipsis}
                                title={text}
                            >
                                {text}
                            </div>
                        </div>
                        <div
                            className={classnames(
                                styles.ellipsis,
                                styles.catlgCode,
                            )}
                            title={record.uniform_catalog_code}
                            style={{
                                color: 'rgba(0, 0, 0, 0.45)',
                                fontSize: '12px',
                            }}
                        >
                            {record.uniform_catalog_code}
                        </div>
                    </div>
                )
            },
            ellipsis: true,
        },
        {
            title: __('库表技术名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            width: 120,
            ellipsis: true,
        },
        {
            title: __('问题数'),
            dataIndex: 'problem_count',
            key: 'problem_count',
            width: 120,
            ellipsis: true,
            render: (text, record) => text || '--',
        },
        {
            title: __('所属部门'),
            dataIndex: 'department_path',
            key: 'department_path',
            ellipsis: true,
            width: 120,
            render: (text, record) => (
                <div
                    className={styles.tableItem}
                    title={
                        record.department_path ||
                        record.department ||
                        __('未分配')
                    }
                >
                    {record.department || '--'}
                </div>
            ),
        },
        {
            title: __('所属数据源'),
            dataIndex: 'datasource',
            key: 'datasource',
            ellipsis: true,
            width: 180,
            // sorter: true,
            // sortOrder: tableSort.type,
            // showSorterTooltip: false,
            render: (text, record) => {
                const { Colored = undefined } = record?.datasource_type
                    ? databaseTypesEleData.dataBaseIcons[
                          record?.datasource_type
                      ]
                    : {}
                return (
                    <div className={styles.datasourceBox}>
                        {record?.datasource_type && (
                            <Colored className={styles.datasourceIcon} />
                        )}
                        <div className={styles.ellipsisText}>
                            <div className={styles.ellipsisText} title={text}>
                                {text || '--'}
                            </div>
                            <div
                                title={`${__('catalog：')}${
                                    record.datasource_catalog_name
                                }`}
                                className={styles.subText}
                            >
                                {record.datasource_catalog_name}
                            </div>
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 160,
            fixed: FixedType.RIGHT,
            render: (text: string, record) => {
                const btnList = [
                    {
                        label: __('质量报告'),
                        status: OperateType.DETAIL,
                    },
                    {
                        label: __('发起质量整改'),
                        status: OperateType.CREATE,
                        disable: record?.status === 'added',
                        disableTips: __('此表整改中，暂时无法发起'),
                    },
                ]
                return (
                    <Space size={16}>
                        {btnList.map((item: any) => {
                            return (
                                <Tooltip
                                    placement="bottomLeft"
                                    title={item.disable ? item.disableTips : ''}
                                    overlayInnerStyle={{
                                        whiteSpace: 'nowrap',
                                    }}
                                    overlayClassName={
                                        styles.datasheetTableTooltipTips
                                    }
                                >
                                    <Button
                                        type="link"
                                        key={item.label}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (!item.popconfirmTips) {
                                                handleOperate(
                                                    item.status,
                                                    record,
                                                )
                                            }
                                        }}
                                        disabled={item.disable}
                                    >
                                        {item.label}
                                    </Button>
                                </Tooltip>
                            )
                        })}
                    </Space>
                )
            },
        },
    ]

    const showEmpty = () => {
        return (
            <div className={styles.indexEmptyBox}>
                <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
            </div>
        )
    }

    return (
        <div className={classnames(styles.datasheetTableWrapper)}>
            {isEmpty ? (
                showEmpty()
            ) : (
                <div
                    className={classnames(
                        !searchIsExpansion && styles.isExpansion,
                    )}
                >
                    <div
                        className={styles['operate-container']}
                        hidden={!showSearch}
                    >
                        <div style={{ fontWeight: 550 }}>
                            {__('元数据库表')}
                        </div>
                        <Space size={16}>
                            <Space size={8}>
                                <SearchInput
                                    className={styles.nameInput}
                                    style={{ width: 272 }}
                                    placeholder={__('搜索库表技术名称')}
                                    onKeyChange={(kw: string) =>
                                        setSearchCondition({
                                            ...searchCondition,
                                            keyword: kw,
                                            offset: 1,
                                        })
                                    }
                                />
                            </Space>
                            <span>
                                <RefreshBtn
                                    onClick={() =>
                                        setSearchCondition({
                                            ...searchCondition,
                                        })
                                    }
                                />
                            </span>
                        </Space>
                    </div>

                    <CommonTable
                        queryAction={getQualityReportList}
                        params={searchCondition}
                        baseProps={{
                            columns,
                            scroll: {
                                x: 1300,
                                y: `calc(100vh - ${
                                    commonTableRef?.current?.total > 10
                                        ? tableHeight
                                        : tableHeight - 48
                                }px)`,
                            },
                            rowClassName: styles.tableRow,
                        }}
                        ref={commonTableRef}
                        emptyDesc="暂无数据"
                        emptyIcon={dataEmpty}
                        getEmptyFlag={(flag) => {
                            setListEmpty(flag)
                            const empty =
                                flag &&
                                !Object.values(searchCondition).some(
                                    (item) => item,
                                )
                            setIsEmpty(empty)
                            setShowSearch(!empty)
                        }}
                        onChange={(currentPagination, filters, sorter) => {
                            if (
                                currentPagination.current ===
                                searchCondition.offset
                            ) {
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: 1,
                                    limit: currentPagination?.pageSize,
                                })
                            } else {
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: currentPagination.current,
                                })
                            }
                        }}
                        getTableList={(data) => getTableList?.(data)}
                    />
                </div>
            )}
            {reportDetailVisible && (
                <DataViewProvider>
                    <ReportDetail
                        item={curDataView}
                        visible={reportDetailVisible}
                        onClose={() => setReportDetailVisible(false)}
                    />
                </DataViewProvider>
            )}
            {correctionVisible && (
                <CorrectionOptModal
                    item={curDataView}
                    type={OrderType.QUALITY}
                    visible={correctionVisible}
                    onClose={() => setCorrectionVisible(false)}
                />
            )}
        </div>
    )
})

export default ReportTable
