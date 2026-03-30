import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
    AutoComplete,
    Input,
    Modal,
    Table,
    Tooltip,
    Button,
    InputRef,
    Spin,
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/lib/table'
import classnames from 'classnames'
import { useDebounceFn, useGetState } from 'ahooks'
import { trim } from 'lodash'
import styles from './styles.module.less'
import {
    formsQueryStandardItem,
    formsQueryStandardRecommend,
    formsQueryStandards,
    formsQueryCreateStandardTaskList,
    formatError,
    getStandardRecommend,
    IStandardEnum,
    IFormEnumConfigModel,
} from '@/core'

import {
    FieldsInfoContext,
    getFormulateBasis,
    getFormulateBasisNum,
    StandardLabel,
    transformDataOptions,
    transformDataOptionsForDataStandard,
} from './helper'
import {
    FieldSource,
    fieldSourceText,
    FormTableKind,
    numberAndStringTypeArr,
    numberTypeArr,
    StandardStatus,
} from './const'
import __ from './locale'
import BusinessAddFormOutlined from '@/icons/BusinessAddFormOutlined'
import { useQuery } from '@/utils'
import { TaskInfoContext } from '@/context'
import { SearchInput } from '@/ui'
import ViewValueRange from '../FormTableMode/ViewValueRange'

interface IStandardChoose {
    title?: string
    visible: boolean
    keyVal?: any
    fid?: any
    mbid?: any
    standardEnum?: IStandardEnum
    config: IFormEnumConfigModel | undefined
    name?: string
    onClose: () => void
    onSure: () => void
    tableKind?: FormTableKind
}

/**
 * 标准比较配置
 * @param keyVal key标识
 * @param standardEnum 标准枚举值
 * @param name string 业务表名称
 * @param fid any 业务表ID
 * @param mbid any main_business_id
 * @returns
 */
const StandardChoose: React.FC<IStandardChoose> = ({
    title,
    visible,
    keyVal,
    standardEnum,
    name,
    fid,
    mbid,
    config,
    onClose,
    onSure,
    tableKind,
}) => {
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)
    const searchRef = useRef<boolean>(false)
    // 存储的字段信息
    const { fieldsInfo } = useContext(FieldsInfoContext)
    const query = useQuery()
    // 当前字段所有相关信息
    const current = useMemo(
        () => fieldsInfo.find((f) => f.keyId === keyVal)!,
        [fieldsInfo, visible],
    )

    // 搜索历史集
    const [history, setHistory] = useState<any[]>([])

    // 推荐集
    const [recommends, setRecommends] = useState<any[]>([])

    // 标准集
    const [standards, setStandards] = useState<any[] | undefined>(undefined)

    // loading
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)

    // 搜索值
    const [search, setSearch] = useState('')

    // 搜索选中值
    const [searchSel, setSearchSel] = useState<any>()

    // 搜索 -- 创建标准清单文字
    const [searchText, setSearchText] = useState(__('找不到？'))

    // 搜索 -- 创建标准清单文字
    const [searchTooptip, setSearchTooptip] = useState(
        __('添加至新建标准请求清单'),
    )

    // 搜索 -- 创建标准清单文字
    const [searchstatus, setSearchstatus] = useState('before')

    // 搜索 -- 创建标准清单文字
    const [iconLoading, setIconLoading] = useState(false)

    // 选中项
    const [selectedRowKey, setSelectedRowKey, getSelectedRowKey] =
        useGetState<any>()

    useEffect(() => {
        setSearch('')
        setSearchSel(undefined)
        setStandards(undefined)
        setRecommends([])
        setIconLoading(false)
        setSearchstatus('before')
        setSearchText(__('找不到？'))
        setSearchTooptip(__('添加至新建标准请求清单'))
        if (visible && keyVal) {
            getRecommendData()
            setHistory(current.historyFields)
            chooseOne()
        }
    }, [visible])

    const handleCompositionStart = () => {
        searchRef.current = true
    }

    const handleCompositionEnd = (e: any) => {
        searchRef.current = false
        // webkit：compositionstart onChange compositionend
        // firefox：compositionstart compositionend onChange
        if (navigator.userAgent.indexOf('WebKit') > -1) {
            handleSearch(e)
        }
    }

    // 确定当前选中值
    const chooseOne = () => {
        // 选中更改值
        if (current?.changedField) {
            setSelectedRowKey(current?.changedField.rowKey)
            return
        }
        // 选中推荐值第一个
        if (current?.recommendFields.length > 0) {
            setSelectedRowKey(current.recommendFields[0].rowKey)
            return
        }
        // 选中原数据
        setSelectedRowKey(current?.originalField.rowKey)
    }

    // 获取当前字段的推荐值
    const getRecommendData = async () => {
        // 判断是否已有推荐值
        if (current.recommendFields.length > 0) {
            const newInfos = await Promise.all(
                current.recommendFields.map((currentData) =>
                    transformDataOptions(currentData.standard_id, currentData),
                ),
            )
            current.recommendFields = newInfos

            setRecommends(newInfos)
            return
        }

        try {
            setLoading(true)
            const res = await getStandardRecommend({
                table: name,
                table_description: '',
                table_fields: [
                    {
                        table_field: current.originalField.name,
                        table_field_description: '',
                        std_ref_file: '',
                    },
                ],
            })
            // 推荐的标准列表
            const { rec_stds } = res[0]
            if (rec_stds && rec_stds.length > 0) {
                // 对标推荐信息，增加自定义信息
                const recs = rec_stds.map((r) => ({
                    sid: current.originalField.id,
                    standard_id: r.id,
                    name: r.name,
                    name_en: r.name_en,
                    data_type: r.data_type,
                    data_length: r.data_length,
                    data_accuracy: r.data_accuracy,
                    // value_range: r.value_range,
                    formulate_basis: r.std_type_name,
                    rowName: FieldSource.RECOMMEND,
                    code_table_code: r?.code_table_code || '',
                    code_table: r?.code_table_name || '',
                    rowKey: r.id,
                }))
                // 存储推荐值
                const newInfos = await Promise.all(
                    recs.map((currentData) =>
                        transformDataOptions(
                            currentData.standard_id,
                            currentData,
                        ),
                    ),
                )
                current.recommendFields = newInfos

                // 刷新列表
                setRecommends(newInfos)
                chooseOne()
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 保存数据
    const handleOk = () => {
        if (selectedRowKey === '0') {
            // 原数据清空
            current.changedField = undefined
        } else {
            const info = [
                ...recommends,
                current?.originalField,
                ...history,
            ].find((d) => d.rowKey === selectedRowKey)
            // 修改标准状态
            current.changedField = {
                ...info,
                standard_status: StandardStatus.NORMAL,
            }
        }
        onSure()
    }

    // 搜索标准
    const handleSearch = async (value) => {
        if (typeof value !== 'string' || !value?.length) return
        try {
            setFetching(true)
            const res = await formsQueryStandards({
                keyword: value,
                limit: 1000,
            })
            if (!value || value === '') {
                setStandards(undefined)
            } else {
                setStandards(res || [])
            }
        } catch (error) {
            setStandards([])
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    const addStandardList = async () => {
        try {
            if (!iconLoading) {
                setIconLoading(true)
                const taskId = query.get('taskId') || ''
                const sourceType =
                    window.location.pathname.indexOf('/coreBusiness') > -1
                        ? 'mainBusiness'
                        : 'executeTask'
                await formsQueryCreateStandardTaskList({
                    ...{
                        fields: [
                            {
                                field_id: keyVal,
                                field_name: current.originalField.name,
                            },
                        ],
                        form_id: fid,
                    },
                    ...(sourceType === 'executeTask'
                        ? { standard_task_id: taskId }
                        : { main_business_id: mbid }),
                })
                setSearchstatus('after')
                setSearchText(__('已添加'))
                setSearchTooptip(
                    __(
                        '已添加至新建标准请求清单，可前往「业务表 > 新建标准请求」中去发起请求',
                    ),
                )
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 选中搜索项
    const handleSelected = async (value, option) => {
        setLoading(true)
        setSearch(option.show)
        // 判断选中值是否是推荐的
        const rec = recommends.find((r) => r.standard_id === value)
        if (rec) {
            // 列表直接选中推荐值
            setSelectedRowKey(rec.rowKey)
            setLoading(false)
            return
        }

        // 获取标准详情
        try {
            const res = await formsQueryStandardItem({ id: value })
            if (!res) {
                return
            }

            // 判断是否为历史数据
            const his = current.historyFields.find((h) => h.rowKey === value)
            if (his) {
                // 清掉已有的选中项
                current.historyFields.splice(
                    current.historyFields.indexOf(his),
                    1,
                )
            }
            // 更新历史数据，对标标准信息，增加自定义信息
            const { code_table_name, ...others } = res
            if (tableKind === FormTableKind.DATA_STANDARD) {
                const newRes = await transformDataOptionsForDataStandard(
                    res.id,
                    res,
                )
                current.historyFields.push({
                    ...others,
                    id: current.originalField.id,
                    sid: current.originalField.id,
                    standard_id: newRes.id,
                    formulate_basis: newRes.std_type_name,
                    rowName: FieldSource.SEARCH,
                    rowKey: newRes.id,
                    code_table: newRes.code_table,
                    encoding_rule: newRes.encoding_rule,
                })
            } else {
                const newRes = await transformDataOptions(res.id, res)
                current.historyFields.push({
                    ...others,
                    id: current.originalField.id,
                    sid: current.originalField.id,
                    standard_id: newRes.id,
                    formulate_basis: newRes.std_type_name,
                    rowName: FieldSource.SEARCH,
                    rowKey: newRes.id,
                    value_range: newRes.value_range,
                    value_range_type: newRes.value_range_type,
                })
            }

            // 刷新列表
            setSearchSel(value)
            setHistory([...current.historyFields])
            setSelectedRowKey(res.id)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 搜索防抖
    const { run } = useDebounceFn(handleSearch, {
        wait: 400,
        leading: false,
        trailing: true,
    })

    // 行选项
    const rowSelection = {
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedRowKey(selectedKeys[0])
        },
        selectedRowKeys: [getSelectedRowKey()],
    }

    // 检查当前行是否选中
    const checkSelected = (record) => record.rowKey === selectedRowKey

    // 行内容
    const rowLabel = (record, children) => (
        <div
            className={classnames(
                checkSelected(record) ? styles.selectdInfo : styles.info,
            )}
        >
            {children}
        </div>
    )

    // 业务表字段
    const columns: ColumnsType<any> = [
        {
            title: __('来源'),
            dataIndex: 'rowName',
            key: 'rowName',
            ellipsis: true,
            render: (_, record) => {
                return rowLabel(
                    record,
                    record.rowName ? fieldSourceText[record.rowName] : '--',
                )
            },
        },
        {
            title: __('字段中文名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (_, record) => {
                return rowLabel(record, record.name || '--')
            },
        },
        {
            title: __('字段英文名称'),
            dataIndex: 'name_en',
            key: 'name_en',
            ellipsis: true,
            render: (_, record) => {
                return rowLabel(record, record.name_en || '--')
            },
        },
        {
            title: __('标准分类'),
            dataIndex: 'formulate_basis',
            key: 'formulate_basis',
            ellipsis: true,
            render: (_, record) => {
                const value =
                    config?.formulate_basis.find(
                        (currentData) =>
                            currentData.value_en === record.formulate_basis,
                    )?.value || ''
                return rowLabel(record, value || '--')
            },
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            render: (_, record) => {
                return rowLabel(
                    record,
                    config?.data_type.find(
                        (currentData) =>
                            currentData.value_en === record.data_type,
                    )?.value || '--',
                )
            },
        },
        {
            title: __('数据长度'),
            dataIndex: 'data_length',
            key: 'data_length',
            ellipsis: true,
            render: (_, record) => {
                const bo = numberAndStringTypeArr.includes(record.data_type)
                return rowLabel(record, bo ? record.data_length || 0 : '--')
            },
        },
        {
            title: __('数据精度'),
            dataIndex: 'data_accuracy',
            key: 'data_accuracy',
            ellipsis: true,
            render: (_, record) => {
                const bo = numberTypeArr.includes(record.data_type)
                return rowLabel(record, bo ? record.data_accuracy || 0 : '--')
            },
        },
        {
            title: __('值域'),
            dataIndex: 'value_range',
            key: 'value_range',
            ellipsis: true,
            width: 280,
            render: (_, record) => {
                return rowLabel(
                    record,
                    <ViewValueRange
                        type={record.value_range_type}
                        value={record.value_range}
                        style={{ width: '220px' }}
                    />,
                )
            },
        },
        // {
        //     title: __('值域'),
        //     dataIndex: 'value_range',
        //     key: 'value_range',
        //     ellipsis: true,
        //     render: (_, record) => {
        //         return rowLabel(record, record.value_range || '--')
        //     },
        // },
        // {
        //     title: __('字段关系'),
        //     dataIndex: 'field_relationship',
        //     key: 'field_relationship',
        //     ellipsis: true,
        //     render: (_, record) => {
        //         return rowLabel(record, record.field_relationship || '--')
        //     },
        // },
    ]

    return (
        <Modal
            title={title || __('选择数据元标准')}
            width={1011}
            bodyStyle={{ maxHeight: 444 }}
            maskClosable={false}
            open={visible}
            onCancel={onClose}
            onOk={handleOk}
            destroyOnClose
            getContainer={false}
            className={styles.standardChooseWrapper}
            okButtonProps={{ disabled: loading }}
        >
            <div className={styles.body}>
                <div className={styles.topWrapper}>
                    <AutoComplete
                        className={styles.search}
                        options={standards?.map((s) => ({
                            label: (
                                <StandardLabel
                                    name={s.name}
                                    nameEn={s.name_en}
                                    basis={
                                        config?.formulate_basis.find(
                                            (currentData) =>
                                                currentData.value_en ===
                                                s.std_type_name,
                                        )?.value || ''
                                    }
                                    bg={
                                        searchSel === s.id
                                            ? '#E6F5FF'
                                            : undefined
                                    }
                                />
                            ),
                            value: s.id,
                            show: s.name,
                        }))}
                        notFoundContent={
                            fetching ? (
                                <Spin size="small" />
                            ) : standards &&
                              standards.length === 0 &&
                              search?.length ? (
                                <div style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                                    {__('抱歉，没有找到相关内容')}
                                </div>
                            ) : undefined
                        }
                        onSelect={handleSelected}
                        maxLength={128}
                        style={{ width: '100%' }}
                        getPopupContainer={(n) => n}
                        // onClear={() => {
                        //     setSearch('')
                        //     setStandards(undefined)
                        // }}
                        onChange={(val) => {
                            // 重置下拉面板内容
                            if (!trim(val)) {
                                setStandards(undefined)
                            }
                        }}
                        value={search}
                    >
                        <SearchInput
                            style={{ width: 475 }}
                            placeholder={__('搜索标准数据元中英文名称、同义词')}
                            onKeyChange={(kw: string) => {
                                // 解决AutoComponent下onCompositionStart/End触发问题
                                if (!searchRef.current) {
                                    // 搜索值
                                    setSearch(kw)
                                    handleSearch(kw)
                                }
                            }}
                            onCompositionStart={handleCompositionStart}
                            onCompositionEnd={handleCompositionEnd}
                        />
                    </AutoComplete>
                    <div
                        className={styles.searchBox}
                        // hidden={!getAccess(accessScene.biz_newStd, taskInfo)}
                    >
                        <div
                            className={
                                searchstatus === 'after' ? styles.searchBtn : ''
                            }
                        >
                            <Tooltip title={searchTooptip}>
                                <span className={styles.searchText}>
                                    {searchText}
                                </span>
                                <Button
                                    type="text"
                                    className={
                                        searchstatus === 'after'
                                            ? styles.searchText
                                            : ''
                                    }
                                    icon={<BusinessAddFormOutlined />}
                                    onClick={() => {
                                        addStandardList()
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </div>
                </div>
                <Table
                    className={styles.fieldsTable}
                    columns={columns}
                    dataSource={[
                        ...recommends,
                        current?.originalField,
                        ...history.slice().reverse(),
                    ]}
                    pagination={false}
                    scroll={{
                        x: 1600,
                        y:
                            [...recommends, current?.originalField, ...history]
                                .length > 5
                                ? 292
                                : undefined,
                    }}
                    loading={loading}
                    rowSelection={{ type: 'radio', ...rowSelection }}
                    rowKey="rowKey"
                    onRow={(record) => {
                        return {
                            onClick: () => {
                                setSelectedRowKey(record.rowKey)
                            },
                        }
                    }}
                />
            </div>
        </Modal>
    )
}

export default StandardChoose
