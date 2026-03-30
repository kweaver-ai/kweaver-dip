import { useAntdTable } from 'ahooks'
import { Button, message, Space, Table, Tooltip, Dropdown, Switch } from 'antd'
import classnames from 'classnames'
import { isNumber } from 'lodash'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretDownOutlined } from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import SearchLayout from '@/components/SearchLayout'
import {
    formatError,
    delTemplateRule,
    getTemplateRuleList,
    editTemplateRuleStatus,
} from '@/core'
import { AddOutlined, FontIcon } from '@/icons'
import { Loader } from '@/ui'
import Empty from '@/ui/Empty'
import {
    initSearchCondition,
    qualityDimensionOptions,
    ruleSourceOptions,
    typeMap,
    menus,
    defaultMenu,
} from './const'
import { SortBtn } from '@/components/ToolbarComponents'
import DropDownFilter from '../DropDownFilter'
import { searchFormInitData, detectionTitle } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import { getConfirmModal } from '../ObjectionMgt/helper'
import {
    ExplorationRuleTabs,
    ExplorationRule,
    InternalRuleType,
    ExplorationPeculiarity,
    explorationPeculiarityList,
} from '../DatasheetView/DatasourceExploration/const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import RulesModal from '../DatasheetView/DatasourceExploration/RulesModal'
import RulesDetails from '../DatasheetView/DatasourceExploration/RulesModal/RulesDetails'
import { useDataViewContext } from '../DatasheetView/DataViewProvider'

const QualityRuleTemplate = () => {
    const searchFormRef: any = useRef()
    const { setIsTemplateConfig, setExplorationData } = useDataViewContext()
    const [{ cssjj }] = useGeneralConfig()

    const [loading, setLoading] = useState<boolean>(false)
    const [rulesModalOpen, setRulesModalOpen] = useState<boolean>(false)
    const [rulesType, setRulesType] = useState<any>()
    const [rulesDetailsOpen, setRulesDetailsOpen] = useState<boolean>(false)
    const [operateType, setOperateType] = useState<string>('')
    const [rulesModalTitle, setRulesModalTitle] = useState<string>('')
    const [currentData, setCurrentData] = useState<any>()
    const [searchCondition, setSearchCondition] =
        useState<any>(initSearchCondition)
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [tableHeight, setTableHeight] = useState<number>(0)
    const [initSearch, setInitSearch] = useState<boolean>(true)
    const [searchFormData, setSearchFormData] = useState(searchFormInitData)
    const [explorationAttributeList, setExplorationAttributeList] = useState<
        any[]
    >([])
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    const hasSearchCondition = useMemo(() => {
        return (
            searchCondition.dimension ||
            searchCondition.enable ||
            searchCondition.rule_level
        )
    }, [searchCondition])

    useEffect(() => {
        // 展开/收起查询条件高度
        const defalutHeight: number = !searchIsExpansion ? 276 : 384
        // 已选搜索条件高度
        const searchConditionHeight: number = hasSearchCondition ? 41 : 0
        const height = defalutHeight + searchConditionHeight

        setTableHeight(height)
    }, [hasSearchCondition, searchIsExpansion])

    useEffect(() => {
        run(searchCondition)
        setIsTemplateConfig(true)
    }, [])

    useEffect(() => {
        if (!initSearch) {
            run(searchCondition)
        }
    }, [searchCondition])

    useEffect(() => {
        setExplorationData((pre) => ({
            ...pre,
            cssjj: !!cssjj,
        }))
    }, [cssjj])

    const dropdownItems: any[] = [
        {
            key: '1',
            label: (
                <a
                    onClick={() =>
                        toAdd(ExplorationRule.DataView, __('库表级规则'))
                    }
                >
                    {__('库表级规则')}
                </a>
            ),
        },
        {
            key: '2',
            label: (
                <a onClick={() => toAdd(ExplorationRule.Row, __('行级规则'))}>
                    {__('行级规则')}
                </a>
            ),
        },
        {
            key: '3',
            label: (
                <a
                    onClick={() =>
                        toAdd(ExplorationRule.Field, __('字段级规则'))
                    }
                >
                    {__('字段级规则')}
                </a>
            ),
        },
    ]

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            current: 1,
        })
        setSelectedSort(selectedMenu)
    }

    const getTempRuleList = async (params) => {
        try {
            setLoading(!params?.noLoading)
            const { current, pageSize, noLoading, ...rest } = params
            const obj = { ...rest, offset: current, limit: pageSize }
            const res = await getTemplateRuleList(obj)
            return {
                total: res?.length,
                list: res,
            }
        } catch (error) {
            formatError(error)
            return {
                total: 0,
                list: [],
            }
        } finally {
            setLoading(false)
            setInitSearch(false)
            setSelectedSort(undefined)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getTempRuleList, {
        defaultPageSize: 10,
        manual: true,
    })

    const handleOperate = (type: string, record: any) => {
        setOperateType(type)
        setCurrentData(record)
        switch (type) {
            case 'details':
                setExplorationData((pre) => ({
                    ...pre,
                    explorationRule: record.rule_level,
                }))
                setRulesDetailsOpen(true)
                break
            case 'edit':
                getRuleType(record.rule_level)
                setRulesModalOpen(true)
                setRulesModalTitle(
                    `${__('编辑')}${
                        ExplorationRuleTabs.find(
                            (o) => o.key === record.rule_level,
                        )?.label || ''
                    }`,
                )
                break
            case 'del':
                getConfirmModal({
                    title: __('确定要删除规则吗？'),
                    content: __('删除后该规则将无法找回，请谨慎操作！'),
                    onOk: () => handleDelete(record),
                })
                break
            default:
                break
        }
    }

    const columns: any = [
        {
            title: __('规则名称'),
            dataIndex: 'rule_name',
            key: 'rule_name',
            ellipsis: true,
            width: 240,
            render: (text, record) => {
                return (
                    <div className={styles.nameBox}>
                        <div className={styles.nameText} title={text}>
                            {text}
                        </div>
                        {record.enable && record.source !== 'custom' && (
                            <div className={styles.nameTag}>
                                {__('默认检测')}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('规则类型'),
            dataIndex: 'rule_level',
            key: 'rule_level',
            ellipsis: true,
            width: 140,
            render: (text, record) =>
                ExplorationRuleTabs.find((o) => o.key === text)?.label || '--',
        },
        {
            title: __('质量维度'),
            dataIndex: 'dimension',
            key: 'dimension',
            ellipsis: true,
            width: 140,
            render: (text, record) =>
                qualityDimensionOptions.find((o) => o.value === text)?.label ||
                '--',
        },
        {
            title: __('描述'),
            dataIndex: 'rule_description',
            key: 'rule_description',
            ellipsis: true,
            width: 180,
            render: (text, record) => text || '--',
        },
        {
            title: __('来源'),
            dataIndex: 'source',
            key: 'source',
            ellipsis: true,
            width: 140,
            render: (text, record) =>
                ruleSourceOptions.find((o) => o.value === text)?.label || '--',
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            ellipsis: true,
            render: (text: any) => {
                return text && isNumber(text)
                    ? moment(text).format('YYYY-MM-DD HH:mm:ss')
                    : '--'
            },
            width: 140,
        },
        // {
        //     title: detectionTitle(),
        //     dataIndex: 'enable',
        //     key: 'enable',
        //     ellipsis: true,
        //     width: 120,
        //     render: (text: any, record: any) => {
        //         return record.source !== 'custom' ? (
        //             <Switch
        //                 checked={text}
        //                 size="small"
        //                 onChange={(val) => {
        //                     if (val) {
        //                         confirmSwitchChange(record)
        //                     } else {
        //                         onStatusChange(val, record)
        //                     }
        //                 }}
        //             />
        //         ) : null
        //     },
        // },
        {
            title: detectionTitle(),
            dataIndex: 'action',
            key: 'action',
            width: 200,
            render: (_, record) => {
                return record.source === 'custom' ? (
                    <Space size={16}>
                        <a onClick={() => handleOperate('details', record)}>
                            {__('详情')}
                        </a>
                        <a onClick={() => handleOperate('edit', record)}>
                            {__('编辑')}
                        </a>
                        <a onClick={() => handleOperate('del', record)}>
                            {__('删除')}
                        </a>
                    </Space>
                ) : (
                    <a
                        onClick={() => {
                            if (!record.enable) {
                                confirmSwitchChange(record)
                            } else {
                                onStatusChange(false, record)
                            }
                        }}
                    >
                        {record.enable
                            ? __('关闭默认检测')
                            : __('开启默认检测')}
                    </a>
                )
            },
        },
    ]

    const renderEmpty = () => {
        return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    }

    const getRuleType = (type: ExplorationRule) => {
        const list = explorationPeculiarityList
            .filter((item) => typeMap[type].includes(item.key))
            .map((item) => ({
                ...item,
                value: item.key,
            }))
        setRulesType(list?.[0].value)
        setExplorationAttributeList(list)
    }

    const toAdd = (type: ExplorationRule, title: string) => {
        setCurrentData(undefined)
        setRulesModalOpen(true)
        setRulesModalTitle(title)
        setExplorationData((pre) => ({
            ...pre,
            explorationRule: type,
        }))
        getRuleType(type)
    }

    const handleDelete = async (record: any) => {
        try {
            await delTemplateRule(record.rule_id)
            message.success(__('删除成功'))
            run(searchCondition)
        } catch (err) {
            formatError(err)
        }
    }

    const onStatusChange = async (
        val: boolean,
        record: any,
        stopRecord?: any,
    ) => {
        try {
            await editTemplateRuleStatus({
                enable: val,
                rule_id: record.rule_id,
            })
            if (stopRecord) {
                await editTemplateRuleStatus({
                    enable: false,
                    rule_id: stopRecord.rule_id,
                })
            }
            message.success(val ? __('启用成功') : __('停用成功'))
            run({ ...searchCondition, noLoading: true })
        } catch (err) {
            formatError(err)
        }
    }
    const confirmSwitchChange = async (record) => {
        try {
            let res: any = []
            if (
                record.dimension_type ||
                record.dimension === ExplorationPeculiarity.Timeliness
            ) {
                res = await getTemplateRuleList({
                    limit: 100,
                    offset: 1,
                    enable: true,
                    dimension_type: record.dimension_type,
                    dimension: record.dimension,
                })
            }
            if (res?.length > 0) {
                const name = res[0].rule_name
                getConfirmModal({
                    title: __('确定要替换吗？'),
                    content: __(
                        '此维度类型中「${name}」规则已开启默认检测，是否替换为「${currntName}」？',
                        { name, currntName: record?.rule_name },
                    ),
                    onOk: () => {
                        onStatusChange(
                            true,
                            record,
                            record.dimension ===
                                ExplorationPeculiarity.Timeliness
                                ? res[0]
                                : undefined,
                        )
                    },
                })
            } else {
                onStatusChange(true, record)
            }
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.qualityRuleTemplateWrapper}>
            <div className={styles.top}>
                <div className={styles.title}>{__('质量规则')}</div>
                <SearchLayout
                    ref={searchFormRef}
                    prefixNode={
                        <Dropdown
                            menu={{ items: dropdownItems }}
                            placement="bottom"
                        >
                            <Button
                                type="primary"
                                icon={
                                    <FontIcon
                                        name="icon-Add"
                                        style={{
                                            marginRight: '8px',
                                            fontSize: 14,
                                        }}
                                    />
                                }
                            >
                                {__('新建')}
                                <CaretDownOutlined />
                            </Button>
                        </Dropdown>
                    }
                    formData={searchFormData}
                    onSearch={(object, isRefresh) => {
                        const params = {
                            ...searchCondition,
                            ...object,
                            current: isRefresh ? searchCondition.current : 1,
                        }
                        if (object.enable) {
                            params.enable = object.enable === '1'
                        }
                        setSearchCondition(params)
                    }}
                    getExpansionStatus={setSearchIsExpansion}
                    suffixNode={
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        />
                    }
                />
            </div>
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.bottom}>
                    {tableProps.dataSource.length === 0 &&
                    !hasSearchCondition ? (
                        <div className={styles.emptyWrapper}>
                            {renderEmpty()}
                        </div>
                    ) : (
                        <Table
                            className={classnames(
                                !searchIsExpansion && styles.isExpansion,
                            )}
                            rowClassName={styles.tableRow}
                            columns={columns}
                            {...tableProps}
                            rowKey="rule_id"
                            scroll={{
                                y:
                                    tableProps.dataSource.length === 0
                                        ? undefined
                                        : `calc(100vh - ${tableHeight}px)`,
                                x: 1200,
                            }}
                            pagination={{
                                ...tableProps.pagination,
                                hideOnSinglePage:
                                    tableProps.pagination.total <= 10,
                                showQuickJumper: true,
                                responsive: true,
                                showLessItems: true,
                                showSizeChanger: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                            }}
                            bordered={false}
                            locale={{
                                emptyText: <Empty />,
                            }}
                            onChange={(newPagination, filters, sorter) => {
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    current: newPagination.current || 1,
                                    pageSize: newPagination.pageSize || 0,
                                }))
                            }}
                        />
                    )}
                </div>
            )}
            {rulesModalOpen && (
                <RulesModal
                    open={rulesModalOpen}
                    onClose={(flag) => {
                        setRulesModalOpen(false)
                        if (flag) {
                            run(searchCondition)
                        }
                    }}
                    title={rulesModalTitle}
                    ruleType={
                        operateType === 'edit'
                            ? currentData?.dimension
                            : rulesType
                    }
                    ruleId={currentData?.rule_id}
                    ruleList={explorationAttributeList}
                />
            )}
            {rulesDetailsOpen && (
                <RulesDetails
                    open={rulesDetailsOpen}
                    onClose={() => {
                        setRulesDetailsOpen(false)
                    }}
                    ruleId={currentData?.rule_id}
                />
            )}
        </div>
    )
}

export default QualityRuleTemplate
