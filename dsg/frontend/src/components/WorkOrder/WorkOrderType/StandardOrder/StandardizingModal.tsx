import { InfoCircleFilled } from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import { Button, Checkbox, message, Space, Table, Tooltip } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import classnames from 'classnames'
import { trim } from 'lodash'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import CustomDrawer from '@/components/CustomDrawer'
import DataEleDetails from '@/components/DataEleManage/Details'
import {
    FieldSource,
    StandardStatus,
    standardStatusInfos,
} from '@/components/Forms/const'
import { StdOperateType } from '@/components/Forms/helper'
import __ from './locale'
import SelDataByTypeModal from '@/components/SelDataByTypeModal'
import { RefreshBtn } from '@/components/ToolbarComponents'
import {
    CatalogType,
    formatError,
    formsStandardFieldsList,
    getDatasheetViewDetails,
    getStandardRecommend,
    IDataItem,
    IFormEnumConfigModel,
} from '@/core'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import {
    LightweightSearch,
    ListDefaultPageSize,
    ListType,
    SearchInput,
} from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import styles from './styles.module.less'
import { stateType } from '@/components/DatasheetView/const'
import { standardizingSearchData, transformDataOptions } from './helper'
import { RadioBox } from '@/components/FormTableMode/helper'
import RecommendOutlined from '@/icons/RecommendOutlined'
import { FormatDataTypeToText } from '@/components/DatasheetView/DatasourceExploration/helper'

interface ISearchCondition {
    keyword?: string
    status: string
}

interface IStandardizing {
    visible: boolean
    viewId?: string
    name?: string
    defaultFields?: any[]
    config: IFormEnumConfigModel | undefined
    onClose: () => void
    onSure: (item: any) => void
    getContainer?: any
}

/**
 * @param viewId number 库表id
 * @param name string 业务表名称
 * @param fType string 业务表类型
 * @param onClose
 */
const StandardizingModal: React.FC<IStandardizing> = ({
    visible,
    viewId = '',
    defaultFields,
    config,
    name,
    onClose,
    onSure,
    getContainer = false,
}) => {
    // 选择数据元弹窗-数据元详情id
    const [showDEDetailId, setShowDEDetailId] = useState<string>('')
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)

    // 字段列表默认类型
    const defaultListType = ListType.NarrowList
    const defaultPageSize = ListDefaultPageSize[defaultListType]

    // 展示的原字段集
    const [fields, setFields] = useState<any[]>([])
    // 显示的字段
    const [showFields, setShowFields] = useState<any[]>([])

    // 整个页面loading
    const [loading, setLoading] = useState(false)
    // 字段列表loading
    const [listLoading, setListLoading] = useState(false)
    // 智能推荐loading
    const [fetching, setFetching] = useState(false)
    // 编辑界面显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)
    // 选中项集
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    // 编辑选中项
    const [editItem, setEditItem] = useState<any>()
    // 记录"配置数据元"配置数据,格式{[id]: xxFieldItemContent}
    const [configFields, setConfigFields] = useState<Object>({})

    // 搜索
    const [searchCondition, setSearchCondition] = useState({
        data_element: 'all',
        standard_required: 'all',
        searchKeyword: '',
    })

    // 保存按钮可用状态
    const [saveDisabled, setSaveDisabled] = useState(true)

    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])

    const [isStart] = useGradeLabelState()

    // 显示/隐藏搜索框
    const showSearch = useMemo(
        () =>
            searchCondition.searchKeyword !== '' ||
            searchCondition.standard_required !== 'all' ||
            searchCondition.data_element !== 'all' ||
            (fields && fields.length > 0),
        [searchCondition, fields],
    )

    // 错误提示
    const [errText, setErrText] = useState(__('暂无数据'))

    useEffect(() => {
        setSaveDisabled(true)
        setErrText(__('暂无数据'))
        if (visible) {
            if (defaultFields?.length) {
                setFields(defaultFields)
            } else if (viewId) {
                setLoading(true)
                getFormFields()
            }
        }
    }, [visible, defaultFields, viewId])
    // 保存
    const handleOk = async () => {
        const sureFields = fields.map((o) => {
            const { recommendFields, ...rest } = o
            return rest
        })

        onSure(sureFields)
        handleCancel()
    }

    useEffect(() => {
        const hasNeed = fields?.filter((o) => o.standard_required)?.length > 0
        const disSave = fields?.some(
            (o) =>
                o.standard_required &&
                !Object.keys(o.data_element || {})?.length,
        )
        setSaveDisabled(hasNeed && disSave)
    }, [fields])

    useEffect(() => {
        if (
            searchCondition?.searchKeyword !== '' ||
            searchCondition?.standard_required !== 'all' ||
            searchCondition?.data_element !== 'all'
        ) {
            const { searchKeyword, standard_required, data_element } =
                searchCondition
            let curFields: any = fields || []
            if (searchKeyword !== '') {
                curFields = curFields.filter((o) => {
                    const businessName = o?.business_name?.toLowerCase()
                    const technicalName = o?.technical_name?.toLowerCase()
                    const keyword = searchKeyword?.toLowerCase()
                    return (
                        businessName.includes(keyword) ||
                        technicalName.includes(keyword)
                    )
                })
            }

            if (standard_required !== 'all') {
                curFields = curFields.filter((o) => {
                    return !!o?.standard_required === !!standard_required
                })
            }

            if (data_element !== 'all') {
                curFields = curFields.filter((o) => {
                    return !!o?.data_element === !!data_element
                })
            }

            setShowFields(curFields)
        } else {
            setShowFields(fields)
        }
    }, [fields, searchCondition])

    // 取消
    const handleCancel = async () => {
        onClose()
    }

    // 智能推荐
    const handleRecommend = async () => {
        // 没有选中内容不处理
        if (selectedRowKeys.length === 0) {
            return
        }
        try {
            setFetching(true)
            const currentFields = fields
            // 需要请求推荐值的选项
            const names = selectedRowKeys.reduce((arr: any[], cur) => {
                // 查找存储数据中的k
                const info = currentFields.find((f) => f.id === cur)
                // 判断k是否有推荐值
                if (info?.recommendFields && info?.recommendFields.length > 0) {
                    return arr
                }
                return arr.concat([
                    { fieldName: info?.business_name, id: info?.id },
                ])
            }, [])

            let num = 0
            if (names.length > 0) {
                const res = await getStandardRecommend({
                    table: name,
                    table_description: '',
                    table_fields: names.map((n) => ({
                        table_field: n.fieldName,
                        table_field_description: '',
                        std_ref_file: '',
                    })),
                })
                // 表字段列表数据
                const table_fields = res
                if (table_fields && table_fields.length > 0) {
                    names.forEach(({ fieldName, id }, idx) => {
                        // 查找n的推荐的标准
                        // const { rec_stds } = table_fields.find(
                        //     (tf) => tf.table_field === table_field,
                        // )
                        const { rec_stds } = table_fields[idx]
                        // 查找存储数据中的n
                        const info = currentFields.find((f) => f.id === id)
                        if (rec_stds && rec_stds.length > 0 && info) {
                            num += 1
                            // 对标推荐信息，增加自定义信息
                            const recs = rec_stds.map((r) => ({
                                id: r?.id,
                                name_zh: r?.name,
                                name_en: r?.name_en,
                                standard_type_name: r?.std_type_name,
                                data_type_name:
                                    r?.data_type_name || r?.data_type
                                        ? FormatDataTypeToText(r?.data_type)
                                        : undefined,
                                data_length: r?.data_length,
                                data_precision: r?.data_precision,
                                dict_name_zh: r?.dict_name,
                                code: r?.code,
                            }))
                            // 存储推荐值
                            info.recommendFields = recs
                        }
                    })
                }
            }
            selectedRowKeys.forEach((k) => {
                // 查找存储数据中的k
                const info = currentFields.find((f) => f.id === k)
                // 智能推荐有数据，才修改值
                if (info!.recommendFields?.length > 0) {
                    // 存储更换值为推荐值的第一个
                    const [rec] = info!.recommendFields
                    info!.data_element = {
                        ...(info?.data_element || {}),
                        ...(rec || {}),
                    }
                    // info!.changedField = rec
                    // newRecommendMap = [...newRecommendMap, info]
                }
            })
            // 提示
            if (names.length > 0 && num < names.length) {
                message.info(__('部分字段暂无推荐，您可手动选择数据元'))
            } else {
                message.success(__('推荐成功'))
            }
            // 刷新列表
            setFields(currentFields)
        } catch (e) {
            formatError(e)
        } finally {
            setFetching(false)
        }
    }

    // 行选项
    const rowSelection = {
        onChange: (val: React.Key[]) => {
            setSelectedRowKeys(val)
        },
        selectedRowKeys,
        // getCheckboxProps: (record) => {
        //     return {
        //         disabled: !!record.ref_id,
        //     }
        // },
    }

    // 获取表单字段信息
    const getFormFields = async () => {
        try {
            setListLoading(true)
            const res = await getDatasheetViewDetails(viewId)

            const infos = (res?.fields || [])
                ?.filter((item) => item.status !== stateType.delete)
                ?.map((o) => ({
                    ...o,
                    standard_required: true,
                }))
            setFields(infos)
        } catch (error) {
            setFields([])
            if (error?.data?.code === 'DataView.FormView.FormViewIdNotExist') {
                setErrText(__('该表单被删除，可重新选择'))
            }
            formatError(error)
        } finally {
            setLoading(false)
            setListLoading(false)
        }
    }

    const handleTableOpr = (e: any, op: StdOperateType, record?: any) => {
        e.stopPropagation()
        setEditItem(record)

        if (op === StdOperateType.ConfigureDataEle) {
            setSelDataItems([])
            setEditVisible(true)
        }
    }

    // 配置数据元-选择数据元弹窗
    const handleSelDataEle = async (newDataEle: any) => {
        const it = {
            id: newDataEle?.id,
            name_zh: newDataEle?.name_cn,
            name_en: newDataEle?.name_en,
            standard_type_name: newDataEle?.std_type_name,
            data_type_name: newDataEle?.data_type_name,
            data_length: newDataEle?.data_length,
            data_precision: newDataEle?.data_precision,
            dict_name_zh: newDataEle?.dict_name,
            code: newDataEle?.code,
        }

        onAttrChange(editItem?.id, 'data_element', it)
    }

    const onAttrChange = (id, attr, val) => {
        setFields((prev) =>
            prev.map((o) => (o.id === id ? { ...o, [attr]: val } : o)),
        )
    }

    // 业务表字段
    const columns: ColumnsType<any> = [
        {
            title: __('字段业务名称'),
            dataIndex: 'business_name',
            key: 'business_name',
            ellipsis: true,
            render: (item, record) => item || '--',
        },
        {
            title: __('需要标准化'),
            dataIndex: 'standard_required',
            key: 'standard_required',
            ellipsis: true,
            render: (item, record) => {
                return (
                    <RadioBox
                        checked={!!item}
                        onChange={(isChecked) =>
                            onAttrChange(
                                record?.id,
                                'standard_required',
                                !!isChecked,
                            )
                        }
                    />
                )
            },
        },
        {
            title: __('标准化状态'),
            dataIndex: 'data_element',
            key: 'data_element',
            render: (item, record) => {
                const value = item ? StandardStatus.NORMAL : StandardStatus.NONE
                const { label } = standardStatusInfos.find(
                    (s) => s.value === value,
                )!
                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            className={classnames(
                                styles.stdStatus,
                                value === StandardStatus?.NORMAL &&
                                    styles.stdStatusNormal,
                            )}
                        >
                            {label}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('数据标准'),
            dataIndex: ['data_element', 'name_zh'],
            key: 'data_element_name_zh',
            ellipsis: true,
            render: (item, record) => item || '--',
        },
        {
            title: __('字段技术名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
            render: (item, record) => item || '--',
        },
        {
            title: __('标准分类'),
            dataIndex: ['data_element', 'standard_type_name'],
            key: 'data_element_standard_type_name',
            ellipsis: true,
            render: (item, record) => item || '--',
        },
        {
            title: __('数据类型'),
            dataIndex: ['data_element', 'data_type_name'],
            key: 'data_element_data_type_name',
            ellipsis: true,
            render: (item, record) => item || '--',
        },
        {
            title: __('数据长度'),
            dataIndex: ['data_element', 'data_length'],
            key: 'data_element_data_length',
            ellipsis: true,
            render: (item, record) => item || '--',
        },
        {
            title: __('数据精度'),
            dataIndex: ['data_element', 'data_precision'],
            key: 'data_element_data_precision',
            ellipsis: true,
            render: (item, record) => item || '--',
        },
        {
            title: __('码表'),
            dataIndex: ['data_element', 'dict_name_zh'],
            key: 'data_element_dict_name_zh',
            ellipsis: true,
            render: (item, record) => item || '--',
        },
        {
            title: __('操作'),
            fixed: 'right',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <div className={styles.tableOperate}>
                    <Button
                        type="link"
                        onClick={(e) =>
                            handleTableOpr(
                                e,
                                StdOperateType.ConfigureDataEle,
                                record,
                            )
                        }
                    >
                        {__('配置数据元')}
                    </Button>
                </div>
            ),
        },
    ]

    const searchChange = (d, dataKey) => {
        const { standard_required, data_element } = d
        setSearchCondition({
            ...searchCondition,
            standard_required,
            data_element,
        })
    }

    const footer = (
        <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Tooltip
                title={
                    saveDisabled
                        ? '存在需要标准化字段未配置数据标准，无法点击'
                        : ''
                }
                placement="topRight"
            >
                <Button
                    type="primary"
                    onClick={handleOk}
                    disabled={saveDisabled}
                >
                    确定
                </Button>
            </Tooltip>
        </Space>
    )

    return (
        <div className={styles.standardizingWrapper}>
            <CustomDrawer
                open={visible}
                destroyOnClose
                onClose={() => {
                    // 没有变更不提示
                    if (saveDisabled) {
                        handleCancel()
                        return
                    }
                    ReturnConfirmModal({
                        onCancel: handleCancel,
                    })
                }}
                className={styles.standardizingWrapper}
                headerWidth="calc(100% - 40px)"
                customTitleStyle={{
                    marginTop: 16,
                }}
                title={
                    <div>
                        <span>{__('标准化')}</span>
                    </div>
                }
                loading={saveDisabled}
                style={{
                    height: 'calc(100% - 100px)',
                    top: '76px',
                    left: '24px',
                    width: 'calc(100% - 48px)',
                }}
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 1280,
                    overflow: 'hidden',
                }}
                customBodyStyle={{
                    overflow: 'hidden',
                    height: 'calc(100% - 104px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                }}
                customHeaderStyle={{
                    display: 'flex',
                    flexDirection: 'column-reverse',
                }}
                footerExtend={footer}
                getContainer={getContainer || false}
            >
                <div className={styles.empty} hidden={loading || showSearch}>
                    <Empty iconSrc={dataEmpty} desc={errText} />
                </div>
                <div className={styles.empty} hidden={!loading}>
                    <Loader />
                </div>
                <div
                    className={styles.bodyWrapper}
                    hidden={loading || !showSearch}
                >
                    <div className={styles.operateWrapper}>
                        <div className={styles.operateBox}>
                            <Tooltip
                                title={
                                    selectedRowKeys.length === 0 &&
                                    __('选择字段进行标准推荐')
                                }
                            >
                                <Button
                                    type="primary"
                                    className={styles.operate}
                                    onClick={() => handleRecommend()}
                                    loading={fetching}
                                    disabled={selectedRowKeys.length === 0}
                                >
                                    {!fetching && (
                                        <RecommendOutlined
                                            style={{ fontSize: 14 }}
                                        />
                                    )}
                                    {__('智能推荐')}
                                </Button>
                            </Tooltip>
                        </div>
                        <Space size={4}>
                            <SearchInput
                                placeholder={__(
                                    '搜索字段业务名称、字段技术名称',
                                )}
                                onKeyChange={(kw: string) => {
                                    if (
                                        searchCondition.searchKeyword !==
                                        trim(kw)
                                    ) {
                                        setSearchCondition((prev) => ({
                                            ...prev,
                                            searchKeyword: trim(kw),
                                        }))
                                    }
                                }}
                                style={{ width: 272 }}
                            />
                            <div className={styles.selectWrapper}>
                                <LightweightSearch
                                    formData={standardizingSearchData}
                                    onChange={(data, key) =>
                                        searchChange(data, key)
                                    }
                                    defaultValue={{
                                        standard_required: 'all',
                                        data_element: 'all',
                                    }}
                                />
                            </div>
                            <RefreshBtn
                                onClick={() => {
                                    if (defaultFields?.length) {
                                        setFields(defaultFields)
                                    } else if (viewId) {
                                        setLoading(true)
                                        getFormFields()
                                        setLoading(false)
                                    }
                                }}
                            />
                        </Space>
                    </div>
                    <div className={styles.fieldsTableWrapper}>
                        <Table
                            className={styles.fieldsTable}
                            columns={
                                isStart
                                    ? columns
                                    : columns.filter(
                                          (col) => col.key !== 'label_name',
                                      )
                            }
                            dataSource={showFields}
                            loading={listLoading || fetching}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: false,
                                hideOnSinglePage: true,
                            }}
                            scroll={{
                                x: 1600,
                                y:
                                    showFields?.length < defaultPageSize
                                        ? 'calc(100vh - 390px)'
                                        : 'calc(100vh - 434px)',
                            }}
                            locale={{ emptyText: <Empty /> }}
                            rowKey="id"
                            rowSelection={rowSelection}
                            onRow={(record) => {
                                return {
                                    onClick: () => {
                                        // 单行点击处理
                                        const idx = selectedRowKeys.indexOf(
                                            record.id,
                                        )
                                        if (idx === -1) {
                                            // 不存在添加
                                            setSelectedRowKeys([
                                                ...selectedRowKeys,
                                                record.id,
                                            ])
                                        } else {
                                            // 存在删除
                                            setSelectedRowKeys([
                                                ...selectedRowKeys.filter(
                                                    (k) => k !== record.id,
                                                ),
                                            ])
                                        }
                                    },
                                }
                            }}
                        />
                    </div>
                </div>
                {/* 选择码表/编码规则 */}
                {editVisible && (
                    <SelDataByTypeModal
                        visible={editVisible}
                        onClose={() => setEditVisible(false)}
                        dataType={CatalogType.DATAELE}
                        oprItems={selDataItems}
                        setOprItems={setSelDataItems}
                        onOk={(oprItems: any, node: any) => {
                            handleSelDataEle(node?.[0])
                            setEditItem(undefined)
                        }}
                        handleShowDataDetail={(
                            dataType: CatalogType,
                            dataId?: string,
                        ) => {
                            setShowDEDetailId(dataId || '')
                            setDataEleDetailVisible(true)
                        }}
                        stdRecParams={{
                            table_name: name || '',
                            table_fields: [
                                {
                                    table_field: editItem?.business_name,
                                },
                            ],
                        }}
                    />
                )}
                {/* 查看数据元详情 */}
                {dataEleDetailVisible && !!showDEDetailId && (
                    <DataEleDetails
                        visible={dataEleDetailVisible}
                        dataEleId={showDEDetailId}
                        onClose={() => setDataEleDetailVisible(false)}
                    />
                )}
            </CustomDrawer>
        </div>
    )
}

export default StandardizingModal
