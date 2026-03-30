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
    message,
} from 'antd'
import { InfoCircleFilled, SearchOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/lib/table'
import classnames from 'classnames'
import { useDebounceFn, useGetState } from 'ahooks'
import { trim } from 'lodash'
import styles from './styles.module.less'
import {
    formsQueryStandards,
    formsQueryCreateStandardTaskList,
    formatError,
    getStandardRecommend,
    IStandardEnum,
    IFormEnumConfigModel,
    formsQueryStandardUnreadTaskList,
    IStdTaskCommonRes,
    IPendingBusinsTableFieldQuery,
    getPendingBusinTableField,
    acceptFieldStd,
    editBusinessStandard,
} from '@/core'

import {
    FieldsInfoContext,
    getFormulateBasis,
    getFormulateBasisNum,
    StandardLabel,
    transformDataOptions,
} from './helper'
import {
    FieldSource,
    fieldSourceText,
    numberAndStringTypeArr,
    numberTypeArr,
    StandardStatus,
    ToBeCreStdStatusValue,
} from './const'
import __ from './locale'
import BusinessAddFormOutlined from '@/icons/BusinessAddFormOutlined'
import { stardOrignizeTypeList, useQuery } from '@/utils'
import { TaskInfoContext } from '@/context'
import {
    ListDefaultPageSize,
    ListPagination,
    ListType,
    SearchInput,
} from '@/ui'
import Empty from '@/ui/Empty'
import ViewValueRange from '../FormTableMode/ViewValueRange'
import { ValueRangeType } from '../FormTableMode/const'
import Loader from '@/ui/Loader'

interface IViewFieldStd {
    visible: boolean
    keyVal?: any
    mid?: string
    fid?: any
    mbid?: any
    standardEnum?: IStandardEnum
    config: IFormEnumConfigModel | undefined
    name?: string
    onClose: () => void
    onSure: (info?: any) => void
    getContainer?: any
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
const ViewFieldStd: React.FC<IViewFieldStd> = ({
    visible,
    keyVal,
    standardEnum,
    name,
    mid,
    fid,
    mbid,
    config,
    onClose,
    onSure,
    getContainer = false,
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

    // 未读标准列表
    const [unreadList, setUnreadList] = useState<IStdTaskCommonRes<any>>()

    // loading
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)

    const listType = ListType.WideList

    const [searchCondition, setSearchCondition] =
        useState<IPendingBusinsTableFieldQuery>({
            // 业务表模型id
            business_table_model_id: mbid,
            // 业务表名称
            business_table_id: fid,
            state: `${ToBeCreStdStatusValue.CREATED}`,
            offset: 1,
            limit: ListDefaultPageSize[listType],
        })

    // 选中项
    const [selectedRowKey, setSelectedRowKey, getSelectedRowKey] =
        useGetState<any>()

    useEffect(() => {
        setUnreadList(undefined)
        if (visible) {
            const searchConditionTemp = {
                // 业务表模型id
                business_table_model_id: mbid,
                // 业务表名称
                business_table_id: fid,
                state: `${ToBeCreStdStatusValue.CREATED}`,
                offset: 1,
                limit: ListDefaultPageSize[listType],
            }
            setSearchCondition(searchConditionTemp)
            getUnreadStandardList(searchConditionTemp)
        }
    }, [visible])

    // 获取未读字段列表
    const getUnreadStandardList = async (
        params: IPendingBusinsTableFieldQuery,
    ) => {
        try {
            setFetching(true)
            const { data, total_count } = await getPendingBusinTableField(
                params,
            )
            const unreadListTemp: Array<any> = []
            await Promise.all(
                data.map(async (currentData) => {
                    // 获取数据元详细信息
                    const data_element = transformDataOptions(
                        currentData?.data_element_id || '',
                        currentData?.data_element,
                        1,
                    ).then((res) => {
                        unreadListTemp.push({
                            ...currentData,
                            data_element: res,
                            value_range: res?.value_range,
                            value_range_type: res?.value_range_type,
                        })
                    })

                    return data_element
                }),
            )

            setUnreadList({
                data: unreadListTemp,
                total_count,
            })
        } catch (e) {
            formatError(e)
        } finally {
            setFetching(false)
        }
    }

    // 保存数据
    const handleOk = async () => {
        if (!selectedRowKey?.length) {
            message.error(__('请先勾选需替换的数据标准'))
            return
        }
        try {
            setLoading(true)
            const stds =
                unreadList?.data?.reduce((arr: any[], cur) => {
                    if (selectedRowKey?.includes(cur?.id)) {
                        const { data_element } = cur
                        const readedField = {
                            ...cur,
                            sid: cur.business_table_field_id,
                            rowKey: cur.id,
                            standard_id: cur.data_element_id,
                            name: cur?.business_table_field_current_name,
                            name_en:
                                cur?.business_table_field_current_name_en ||
                                data_element?.name_en,
                            data_type: cur?.business_table_field_data_type,
                            data_length: cur?.business_table_field_data_length,
                            data_accuracy:
                                cur?.business_table_field_data_precision,
                            // 标准类型-传枚举值（数字）
                            formulate_basis: config?.formulate_basis.find(
                                (currentConfig) =>
                                    cur.business_table_field_current_std_type ===
                                    currentConfig.value_en,
                            )?.id,
                            code_table: cur?.business_table_field_dict_name,
                            standard_status: StandardStatus.NORMAL,
                        }
                        return arr.concat([readedField])
                    }
                    return arr
                }, []) || []
            // 通知业务模型修改字段参数
            await editBusinessStandard(mid!, fid!, {
                standards: stds,
            })

            // 通知标准平台字段已采纳
            await acceptFieldStd(selectedRowKey)
            // message.success(__('配置成功'))
            onSure(selectedRowKey)
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (offset: number, limit: number) => {
        // 字段table pagechange
        const searchConditionTemp = {
            // 业务表模型id
            business_table_model_id: mbid,
            // 业务表名称
            business_table_id: fid,
            state: `${ToBeCreStdStatusValue.CREATED}`,
            offset,
            limit: ListDefaultPageSize[listType],
        }
        setSearchCondition(searchConditionTemp)
        getUnreadStandardList(searchConditionTemp)
    }

    // 行选项
    const rowSelection = {
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedRowKey(selectedKeys)
        },
        selectedRowKeys: getSelectedRowKey(),
    }

    // 检查当前行是否选中
    const checkSelected = (record) => record.rowKey === selectedRowKey

    // 行内容
    const rowLabel = (record, children) => {
        return (
            <div
                className={classnames(
                    // checkSelected(record) ? styles.selectdInfo : styles.info,
                    styles.singelRowInfo,
                )}
            >
                {children}
            </div>
        )
    }

    // 业务表字段
    const columns: ColumnsType<any> = [
        {
            title: __('字段中文名称'),
            dataIndex: 'business_table_field_origin_name',
            key: 'business_table_field_origin_name',
            ellipsis: true,
            width: 156,
            render: (_, record) => {
                const originName =
                    record?.business_table_field_origin_name || '--'
                const curName = record?.data_element?.name_cn || '--'
                return (
                    <div className={styles.rowConWrapper}>
                        <div className={styles.topInfo} title={originName}>
                            {curName}
                        </div>
                        <div className={styles.bottomInfo} title={curName}>
                            {__('原始：') + originName}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('字段英文名称'),
            dataIndex: 'business_table_field_origin_name_en',
            key: 'business_table_field_origin_name_en',
            ellipsis: true,
            width: 152,
            render: (_, record) => {
                // return rowLabel(record, record.name || '--')
                const originName =
                    record?.business_table_field_origin_name_en || '--'
                const curName = record?.data_element?.name_en || '--'

                return (
                    <div className={styles.rowConWrapper}>
                        <div className={styles.topInfo} title={originName}>
                            {curName}
                        </div>
                        <div className={styles.bottomInfo} title={curName}>
                            {__('原始：') + originName}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('标准分类'),
            dataIndex: 'business_table_field_current_std_type',
            key: 'business_table_field_current_std_type',
            ellipsis: true,
            render: (_, record) => {
                const { business_table_field_origin_std_type: originStdType } =
                    record
                const curStdType = record?.data_element?.std_type
                const origin =
                    stardOrignizeTypeList?.find(
                        (item) => originStdType === item.value,
                    )?.label || '--'
                const cur =
                    stardOrignizeTypeList?.find(
                        (item) => curStdType === item.value,
                    )?.label || '--'
                return (
                    <div className={styles.rowConWrapper}>
                        <div className={styles.topInfo} title={origin}>
                            {cur}
                        </div>
                        <div className={styles.bottomInfo} title={cur}>
                            {__('原始：') + origin}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('数据类型'),
            dataIndex: 'business_table_field_data_type',
            key: 'business_table_field_data_type',
            ellipsis: true,
            render: (business_table_field_data_type, record) => {
                return rowLabel(
                    record,
                    config?.data_type.find(
                        (currentData) =>
                            currentData.value_en ===
                            business_table_field_data_type,
                    )?.value || '--',
                )
            },
        },
        {
            title: __('数据长度'),
            dataIndex: 'business_table_field_data_length',
            key: 'business_table_field_data_length',
            ellipsis: true,
            render: (data_length, record) => {
                const bo = numberAndStringTypeArr.includes(
                    record.business_table_field_data_type,
                )
                return rowLabel(record, bo ? data_length || '--' : '--')
            },
        },
        {
            title: __('数据精度'),
            dataIndex: 'business_table_field_data_precision',
            key: 'business_table_field_data_precision',
            ellipsis: true,
            render: (precision, record) => {
                const bo = numberTypeArr.includes(
                    record.business_table_field_data_type,
                )
                return rowLabel(record, bo ? precision || 0 : '--')
            },
        },
        {
            title: __('值域'),
            dataIndex: 'value_range',
            key: 'value_range',
            ellipsis: true,
            width: 165,
            render: (_, record) => {
                const { data_element } = record
                return (
                    <ViewValueRange
                        type={data_element?.value_range_type}
                        value={data_element?.value_range}
                    />
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
            title={
                <div className={styles.titleWrapper}>
                    {__('查看新建标准')}
                    <span className={styles.titleDescWrapper}>
                        <InfoCircleFilled
                            style={{ color: '#1890ff', fontSize: 14 }}
                        />
                        <span className={styles.titleDescInfo}>
                            {__(
                                '依据您发起的“新建标准任务”，可勾选确定采用的标准化字段信息',
                            )}
                        </span>
                    </span>
                </div>
            }
            width={1000}
            bodyStyle={{ maxHeight: 600, minHeight: 200 }}
            maskClosable={false}
            open={visible}
            onCancel={onClose}
            onOk={handleOk}
            destroyOnClose
            getContainer={getContainer}
            wrapClassName={styles.viewFieldStdWrapper}
            okButtonProps={{
                // disabled: !selectedRowKey?.length || loading,
                disabled: loading,
            }}
            // maskStyle={{ zIndex: 1002 }}
        >
            <div className={styles.body}>
                {fetching ? (
                    <div style={{ marginTop: 52 }}>
                        <Loader />
                    </div>
                ) : (
                    <Table
                        className={styles.fieldsCompTable}
                        columns={columns}
                        dataSource={unreadList?.data}
                        pagination={{
                            total: unreadList?.total_count || 0,
                            hideOnSinglePage:
                                (unreadList?.total_count || 0) <= 10,
                            pageSizeOptions: [10, 20, 50, 100],
                            showQuickJumper: true,
                            responsive: true,
                            showLessItems: true,
                            showSizeChanger: true,
                            showTotal: (count) => {
                                return `共 ${count} 条记录 第 ${
                                    searchCondition.offset
                                }/${Math.ceil(
                                    count / (searchCondition.limit || 1),
                                )} 页`
                            },
                        }}
                        locale={{ emptyText: <Empty /> }}
                        scroll={{
                            y: '448px',
                        }}
                        loading={fetching}
                        rowSelection={{ type: 'checkbox', ...rowSelection }}
                        rowKey="id"
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    setSelectedRowKey(record.rowKey)
                                },
                            }
                        }}
                    />
                )}
            </div>
        </Modal>
    )
}

export default ViewFieldStd
