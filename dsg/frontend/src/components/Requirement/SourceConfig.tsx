import { DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons'
import {
    Button,
    Col,
    DatePicker,
    Divider,
    Drawer,
    Form,
    Input,
    message,
    Pagination,
    Popconfirm,
    Radio,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tooltip,
} from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import { RangePickerProps } from 'antd/lib/date-picker'
import { trim } from 'lodash'
import {
    AddOutlined,
    APIColored,
    ClearOutlined,
    DBTableColored,
    DeadlineOutlined,
    RecycleBinOutlined,
    RefreshOutlined,
} from '@/icons'
import Empty from '@/ui/Empty'
import empty from '@/assets/emptyAdd.svg'
import {
    callUnitList,
    dataSpaceRange,
    dataTimeRange,
    dataTypes,
    PageType,
    ResourceSource,
    ResourceType,
    updateCycle,
} from './const'
import AddInfoItem from './AddInfoItem'
import styles from './styles.module.less'
import FilterRules from './FilterRules'
import ChooseInfoItem from './ChooseInfoItem'
import {
    ErrorInfo,
    ipReg,
    keyboardReg,
    nameReg,
    numberReg,
    OperateType,
    positiveIntegerReg,
    useQuery,
} from '@/utils'
import ImportInfoItems from './ImportInfoItems'
import { formatError, getDemandItemInfos, IInfoItem } from '@/core'
import { SearchInput } from '@/ui'
import __ from './locale'

interface IDBTableConfig {
    open: boolean
    resourceInfo?: any
    onClose: () => void
    operateType: OperateType
    title: string
    getAddedBlankRes?: (vals) => void
    updateResConfig?: (vals) => void
    disabledFields?: string[]
    pageType?: PageType
}

const SourceConfig: React.FC<IDBTableConfig> = ({
    resourceInfo,
    onClose,
    open,
    operateType,
    title,
    getAddedBlankRes,
    updateResConfig,
    disabledFields = [],
    pageType = PageType.APPLY,
}) => {
    const [form] = Form.useForm()
    const [foldInfo, setFoldInfo] = useState([false, false, false])
    const [addInfoOpen, setAddInfoOpen] = useState(false)
    const [importInfoOpen, setImportInfoOpen] = useState(false)
    const [chooseInfoOpen, setChooseInfoOpen] = useState(false)
    // 全部信息项数据
    const [infoItems, setInfoItems] = useState<any>([])
    const [searchValue, setSearchValue] = useState<any>('')
    const [current, setCurrent] = useState(1)
    const [total, setTotal] = useState(0)
    const [callUnit, setCallUnit] = useState(1)
    const [isShowInfoError, setIsShowInfoError] = useState(false)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [checked, setChecked] = useState(false)
    const errorInfoRef: any = useRef()

    const query = useQuery()
    // 编辑时获取的需求id
    const id = query.get('id')

    useEffect(() => {
        if (!open) {
            setIsShowInfoError(false)
            setCurrent(1)
            setChecked(false)
            // 添加空白资源关闭弹窗后清空数据
            if (
                !resourceInfo ||
                resourceInfo?.res_source === ResourceSource.BLANK
            ) {
                form.resetFields()
                setInfoItems([])
            }
        }
    }, [open])

    // 资源目录资源选中项变化时
    useEffect(() => {
        if (selectedRowKeys.length === 0) {
            form.setFieldsValue({ filter_description: undefined })
        }
        // 已被使用的信息项被取消勾选时 清空使用该信息项的过滤信息
        const filterItems = form.getFieldValue('filter_items') || []
        const newFilterItems = filterItems.filter((item) =>
            selectedRowKeys.includes(item?.item_uuid),
        )
        form.setFieldsValue({
            filter_items: newFilterItems.length > 0 ? newFilterItems : [{}],
        })
    }, [selectedRowKeys])

    // 在资源目录的信息项资源 （传给过滤规则组件）
    const infoItemsInServiceShop = useMemo(
        () =>
            infoItems.filter((item) =>
                selectedRowKeys.includes(item.item_uuid),
            ),
        [selectedRowKeys],
    )

    // 获取信息项
    const getInfoItems = async (resId: string) => {
        try {
            const res = await getDemandItemInfos({
                res_id: resId,
                // 需求申请时的需求项id
                item_id:
                    pageType === PageType.APPLY
                        ? id
                            ? resourceInfo.id
                            : undefined
                        : undefined,
                // 需求分析时的分析项id
                // 新增的分析项不需要传该参数
                analyse_item_id:
                    pageType === PageType.APPLY
                        ? undefined
                        : resourceInfo?.id
                        ? `${resourceInfo?.id}`
                        : undefined,
                original_id:
                    pageType === PageType.ANALYSIS
                        ? resourceInfo?.original_id
                        : undefined,
            })
            setInfoItems(res.entries || [])
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        // 当信息项被删除完时  清除过滤规则信息 (空白资源适用)
        if (infoItems.length === 0) {
            form.setFieldsValue({ filter_description: undefined })
        }
        // 进入配置中：服务超市的信息项选中项设置
        if (resourceInfo?.res_source === ResourceSource.SERVICESHOP) {
            setSelectedRowKeys(
                infoItems
                    .filter((item) => item.selected === 2)
                    .map((item) => item.item_uuid),
            )
        }
    }, [infoItems])

    useEffect(() => {
        if (resourceInfo) {
            form.resetFields()
            form.setFieldsValue({
                ...resourceInfo,
                data_push_time: resourceInfo.data_push_time
                    ? moment(resourceInfo.data_push_time)
                    : undefined,
                service_end_time: resourceInfo.service_end_time
                    ? moment(resourceInfo.service_end_time)
                    : undefined,
                filter_items:
                    resourceInfo.filter_items?.length > 0
                        ? resourceInfo.filter_items
                        : [{}],
                service_life: resourceInfo.service_life || 1,
            })
            setCallUnit(resourceInfo.call_frequency_unit)
            if (resourceInfo.info_items?.length > 0) {
                setInfoItems(resourceInfo.info_items || [])
            } else {
                getInfoItems(resourceInfo.res_id)
            }
        }
    }, [resourceInfo])

    // 获取筛选后的全部数据
    const getFilterData = () => {
        const keyword = searchValue?.toLocaleLowerCase()
        const data =
            infoItems.filter(
                (item) =>
                    item.item_name?.toLocaleLowerCase().includes(keyword) ||
                    item.column_name?.toLocaleLowerCase().includes(keyword),
            ) || []

        return checked
            ? data.filter((item) => selectedRowKeys.includes(item.item_uuid))
            : data
    }
    useEffect(() => {
        const data = getFilterData()
        setTotal(data.length)

        form.setFieldsValue({
            info_items: data.length > 10 ? data.slice(0, 10) : data,
        })
        if (!searchValue) {
            setCurrent(1)
        }
    }, [infoItems, searchValue])

    useEffect(() => {
        const data = getFilterData()
        setTotal(data.length)
        form.setFieldsValue({
            info_items: data.slice((current - 1) * 10, current * 10),
        })
    }, [current])

    useEffect(() => {
        const data = getFilterData()
        setTotal(data.length)
        form.setFieldsValue({
            info_items: data.slice(0, 10),
        })
    }, [checked])

    const resetFoldInfo = (index: number) => {
        foldInfo[index] = !foldInfo[index]
        setFoldInfo([...foldInfo])
    }

    const getTitleComp = (t: string, index: number) => {
        return (
            <div
                className={styles.sourceConfigTitleWrapper}
                onClick={() => resetFoldInfo(index)}
            >
                <div className={styles.sourceConfigTitle}>{t}</div>
                {foldInfo[index] ? (
                    <DownOutlined className={styles.arrow} />
                ) : (
                    <UpOutlined className={styles.arrow} />
                )}
            </div>
        )
    }

    const renderEmpty = () => {
        return <Empty iconSrc={empty} desc={__('暂无信息项')} />
    }

    const handleClose = () => {
        onClose()
        // setInfoItems([])
        setSearchValue('')
    }

    const onFinish = (values) => {
        let isFilterInfoFilledRight = true
        const filterItems = values.filter_items?.filter((item) => {
            if (!item.item_uuid && !item.condition && !item.value) {
                return false
            }
            if (!item.item_uuid || !item.condition || !item.value) {
                isFilterInfoFilledRight = false
            }
            return true
        })
        if (!isFilterInfoFilledRight) {
            message.error(__('过滤规则中的信息项、条件、值需填写完整'))
            return
        }

        //  创建空白资源时，信息项必填  或在需求分析中配置空白资源
        if (
            infoItems.length === 0 &&
            (operateType === OperateType.CREATE ||
                resourceInfo?.res_source === ResourceSource.BLANK)
        ) {
            setIsShowInfoError(true)
            if (foldInfo[2]) {
                foldInfo[2] = false
                setFoldInfo([...foldInfo])
            }
            errorInfoRef?.current.scrollIntoView()
            return
        }

        // 配置目录资源的信息项校验
        if (
            resourceInfo?.res_source === ResourceSource.SERVICESHOP &&
            selectedRowKeys.length === 0
        ) {
            message.error(__('请至少选择一个信息项'))
            return
        }

        const resValues = {
            call_frequency_unit: callUnit,
            data_push_time: values.data_push_time?.valueOf() || undefined,
            configured: 2,
            target_machine_id: '1',
            service_end_time: values.service_end_time?.valueOf() || undefined,
            call_frequency: values.call_frequency
                ? Number(values.call_frequency)
                : undefined,
            shared_type: 1,
            provide_type: 1,
            filter_items: filterItems,
            info_items: infoItems.map((item) => {
                return {
                    ...item,
                    selected: selectedRowKeys.includes(item.item_uuid) ? 2 : 1,
                }
            }),
        }
        // 新增空白资源时,直接添加到资源列表
        getAddedBlankRes?.({
            ...values,
            ...resValues,
            id: uuidv4(),
        })

        // 更新资源配置
        updateResConfig?.({
            ...resourceInfo,
            ...values,
            ...resValues,
            configed: 2, // 已配置
        })

        handleClose()
    }

    const handleChangeUnit = (e) => {
        setCallUnit(e)
        setCurrent(1)
    }

    const selectAfter = (
        <Select
            value={callUnit}
            onChange={handleChangeUnit}
            getPopupContainer={(node) => node.parentNode}
            options={callUnitList}
        />
    )

    const handleAddInfoItems = () => {
        setAddInfoOpen(true)
    }

    const handleImportInfoItems = () => {
        setImportInfoOpen(true)
    }

    const getInfoItem = (values: IInfoItem[]) => {
        setInfoItems([{ ...values, item_uuid: uuidv4() }, ...infoItems])
    }

    const getImportInfoItem = (its: IInfoItem[]) => {
        setInfoItems([...its, ...infoItems])
    }

    // 移除信息项
    const handleRemove = (record) => {
        // 将过滤规则中使用到的被移除的信息项 移除掉

        const filterItems = form.getFieldValue('filter_items') || []
        const newFilterItems = filterItems.filter(
            (item) => item?.item_uuid !== record?.item_uuid,
        )
        form.setFieldsValue({
            filter_items: newFilterItems.length > 0 ? newFilterItems : [{}],
        })

        // 重新设置信息项
        setInfoItems(
            infoItems.filter((item) => item.item_uuid !== record.item_uuid),
        )
        form.setFieldsValue({
            info_items: infoItems.filter(
                (item) =>
                    item.item_uuid !== record.item_uuid &&
                    (item.item_name
                        ?.toLocaleLowerCase()
                        .includes(searchValue?.toLocaleLowerCase()) ||
                        item.column_name
                            ?.toLocaleLowerCase()
                            .includes(searchValue?.toLocaleLowerCase())),
            ),
        })
    }

    const infoItemColumns = () => {
        const itemNameCol = {
            title: __('信息项名称'),
            dataIndex: 'item_name',
            key: 'item_name',
            ellipsis: true,
        }
        const ColumnNameCol = {
            title: __('字段名称'),
            dataIndex: 'column_name',
            key: 'column_name',
            ellipsis: true,
        }

        const dataTypeCol = {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            render: (val) => {
                if (typeof val === 'number') {
                    return (
                        dataTypes.find((data) => data.value === val)?.label ||
                        '--'
                    )
                }
                return '--'
            },
        }

        const desCol = {
            title: __('信息项描述'),
            dataIndex: 'description',
            key: 'description',
            render: (val: string) => val || '--',
            ellipsis: true,
        }

        const operateCol = {
            title: __('操作'),
            key: 'action',
            width: 120,
            render: (_: string, record) => (
                <Popconfirm
                    placement="topRight"
                    title={__('你确定要删除吗？')}
                    onConfirm={() => handleRemove(record)}
                    okText={__('确定')}
                    cancelText={__('取消')}
                    getPopupContainer={(node) =>
                        node.parentElement as HTMLElement
                    }
                >
                    <a>{__('删除')}</a>
                </Popconfirm>
            ),
        }

        return resourceInfo?.res_source === ResourceSource.SERVICESHOP
            ? [itemNameCol, ColumnNameCol]
            : [itemNameCol, dataTypeCol, desCol, operateCol]
    }

    const handleInfoPageChange = (page: number) => {
        setCurrent(page)
    }

    // 设置不可选日期 - 当天之前不可选
    const disabledDate: RangePickerProps['disabledDate'] = (cur) => {
        return cur < moment().subtract(1, 'days')
    }

    // 校验数据大小是否在 0~2147483647
    const validateDataLength = (
        value: string,
        max: number,
        errorInfo: string,
    ): Promise<void> => {
        const trimValue = trim(value)
        if (!trimValue) return Promise.resolve()
        if (
            !positiveIntegerReg.test(trimValue) ||
            Number(trimValue) < 1 ||
            Number(trimValue) > max
        ) {
            return Promise.reject(new Error(errorInfo))
        }
        return Promise.resolve()
    }

    const validateIp = (value): Promise<void> => {
        const trimValue = trim(value)
        if (!trimValue) return Promise.resolve()
        const ipArr = trimValue.split(',')
        let isError = false
        ipArr.forEach((ip) => {
            if (!ipReg.test(ip)) {
                isError = true
            }
        })
        if (isError) {
            return Promise.reject(
                new Error(
                    __('请输入正确格式的ip地址，多个ip地址以英文逗号分隔'),
                ),
            )
        }
        return Promise.resolve()
    }

    const validateEndTime = (val) => {
        const startTime = form.getFieldValue('data_push_time')
        if (!startTime || !val) return Promise.resolve()
        if (
            moment(startTime.format('YYYY-MM-DD')) >
            moment(val.format('YYYY-MM-DD'))
        ) {
            return Promise.reject(new Error(__('截止日期不能小于开始日期')))
        }
        return Promise.resolve()
    }

    // 点击某一行的数据
    const onSelect = (record, selected, selectedRows) => {
        if (selected) {
            setSelectedRowKeys([...selectedRowKeys, record.item_uuid])
        } else {
            setSelectedRowKeys(
                selectedRowKeys.filter((key) => key !== record.item_uuid),
            )
        }
    }

    // 点击全部
    const onSelectAll = (selected, selectedRows, changeRows) => {
        if (selected) {
            setSelectedRowKeys([
                ...selectedRowKeys,
                ...changeRows.map((row) => row.item_uuid),
            ])
        } else {
            setSelectedRowKeys([
                ...selectedRowKeys.filter(
                    (key) => !changeRows.find((row) => row.item_uuid === key),
                ),
            ])
        }
    }

    const rowSelection = {
        selectedRowKeys,
        onSelect,
        onSelectAll,
        getCheckboxProps: (record) => ({
            disabled: false,
        }),
    }

    const handleSwitch = (cked: boolean) => {
        setChecked(cked)
    }

    const refreshInfoItems = () => {
        if (current !== 1) {
            setCurrent(1)
        } else {
            const data = getFilterData()
            setTotal(data.length)
            form.setFieldsValue({
                info_items: data.slice((current - 1) * 10, current * 10),
            })
        }
    }
    return (
        <Drawer
            open={open}
            title={title}
            width={640}
            getContainer={false}
            maskClosable={false}
            onClose={handleClose}
            destroyOnClose
            footer={
                <Space className={styles.configFooter}>
                    <Button onClick={handleClose} className={styles.configBtn}>
                        {__('取消')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => {
                            const resRame = form.getFieldValue('res_name')
                            if (!resRame && foldInfo[0]) {
                                foldInfo[0] = false
                                setFoldInfo([...foldInfo])
                            }
                            form.submit()
                        }}
                        className={styles.configBtn}
                    >
                        {__('保存')}
                    </Button>
                </Space>
            }
            style={{ height: '100vh' }}
            footerStyle={{
                display: 'flex',
                height: 68,
                justifyContent: 'flex-end',
                paddingRight: 36,
            }}
        >
            <div className={styles.sourceConfigWrapper}>
                {OperateType.EDIT === operateType && (
                    <div className={styles.resourceNameContainer}>
                        {resourceInfo?.res_type === ResourceType.DBTABLE ? (
                            <DBTableColored
                                className={styles.resourceTypeIcon}
                            />
                        ) : resourceInfo?.res_type ===
                          ResourceType.INTERFACE ? (
                            <APIColored className={styles.resourceTypeIcon} />
                        ) : null}
                        <div
                            className={styles.resourceName}
                            title={resourceInfo?.res_name}
                        >
                            {resourceInfo?.res_name}
                        </div>
                    </div>
                )}
                {getTitleComp(__('基本配置'), 0)}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    scrollToFirstError
                >
                    {operateType === OperateType.CREATE && (
                        <div hidden={foldInfo[0]}>
                            <Form.Item
                                label={__('资源名称')}
                                name="res_name"
                                rules={[
                                    {
                                        required: true,
                                        message: ErrorInfo.NOTNULL,
                                    },
                                    {
                                        pattern: nameReg,
                                        message: ErrorInfo.ONLYSUP,
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请输入资源名称')}
                                    maxLength={128}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('资源类型')}
                                name="res_type"
                                initialValue={ResourceType.DBTABLE}
                                className={styles.horizontalItem}
                            >
                                <Radio.Group className={styles.horizontalRadio}>
                                    <Radio value={ResourceType.DBTABLE}>
                                        {__('库表')}
                                    </Radio>
                                    <Radio value={ResourceType.INTERFACE}>
                                        API
                                    </Radio>
                                </Radio.Group>
                            </Form.Item>
                        </div>
                    )}
                    {/* API资源展示的配置 */}
                    <Row gutter={20} hidden={foldInfo[0]}>
                        <Col span={12}>
                            <Form.Item
                                shouldUpdate={(pre, cur) => {
                                    if (operateType === OperateType.CREATE) {
                                        return pre.res_type !== cur.res_type
                                    }
                                    return false
                                }}
                                noStyle
                            >
                                {({ getFieldValue }) => {
                                    return getFieldValue('res_type') ===
                                        ResourceType.INTERFACE ||
                                        resourceInfo?.res_type ===
                                            ResourceType.INTERFACE ? (
                                        <Form.Item
                                            label={__('调用频率')}
                                            name="call_frequency"
                                            validateFirst
                                            rules={[
                                                {
                                                    validator: (e, value) =>
                                                        validateDataLength(
                                                            value,
                                                            2147483647,
                                                            __(
                                                                '仅支持数字，且为1～2147483647整数',
                                                            ),
                                                        ),
                                                },
                                            ]}
                                            hidden={foldInfo[0]}
                                        >
                                            <Input
                                                placeholder={__(
                                                    '请输入调用频率',
                                                )}
                                                addonAfter={selectAfter}
                                            />
                                        </Form.Item>
                                    ) : null
                                }}
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                shouldUpdate={(pre, cur) => {
                                    if (operateType === OperateType.CREATE) {
                                        return pre.res_type !== cur.res_type
                                    }
                                    return false
                                }}
                                noStyle
                            >
                                {({ getFieldValue }) => {
                                    return getFieldValue('res_type') ===
                                        ResourceType.INTERFACE ||
                                        resourceInfo?.res_type ===
                                            ResourceType.INTERFACE ? (
                                        <Form.Item
                                            label={__('授权IP地址')}
                                            name="access_ip"
                                            validateFirst
                                            rules={[
                                                {
                                                    validator: (e, value) =>
                                                        validateIp(value),
                                                },
                                            ]}
                                            hidden={foldInfo[0]}
                                        >
                                            <Input
                                                placeholder={__(
                                                    '请输入授权IP地址',
                                                )}
                                            />
                                        </Form.Item>
                                    ) : null
                                }}
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item
                        shouldUpdate={(pre, cur) => {
                            if (operateType === OperateType.CREATE) {
                                return pre.res_type !== cur.res_type
                            }
                            return false
                        }}
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            return getFieldValue('res_type') ===
                                ResourceType.DBTABLE ||
                                resourceInfo?.res_type ===
                                    ResourceType.DBTABLE ? (
                                <Form.Item
                                    label={__('目标数据源/库表')}
                                    name="target_machine_name"
                                    rules={[
                                        {
                                            pattern: nameReg,
                                            message: ErrorInfo.ONLYSUP,
                                        },
                                    ]}
                                    hidden={foldInfo[0]}
                                >
                                    <Input
                                        placeholder={__(
                                            '请输入目标数据源/库表',
                                        )}
                                        maxLength={255}
                                        disabled={disabledFields?.includes(
                                            'target_machine_name',
                                        )}
                                    />
                                </Form.Item>
                            ) : null
                        }}
                    </Form.Item>

                    <Form.Item
                        label={__('使用用途')}
                        name="use_purpose"
                        hidden={foldInfo[0]}
                        rules={[
                            {
                                pattern: keyboardReg,
                                message: ErrorInfo.EXCEPTEMOJI,
                            },
                        ]}
                    >
                        <Input.TextArea
                            placeholder={__('请输入使用用途')}
                            style={{ height: 76, resize: 'none' }}
                            maxLength={255}
                            disabled={disabledFields?.includes('use_purpose')}
                        />
                    </Form.Item>
                    <Form.Item
                        label={__('资源描述')}
                        name="res_desc"
                        hidden={foldInfo[0]}
                        rules={[
                            {
                                pattern: keyboardReg,
                                message: ErrorInfo.EXCEPTEMOJI,
                            },
                        ]}
                    >
                        <Input.TextArea
                            placeholder={__('请输入资源描述')}
                            style={{ height: 76, resize: 'none' }}
                            maxLength={255}
                        />
                    </Form.Item>
                    {getTitleComp(__('推送规则配置'), 1)}
                    <Row gutter={20} hidden={foldInfo[1]}>
                        <Col span={12}>
                            <Form.Item
                                label={__('开始日期')}
                                name="data_push_time"
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    disabledDate={disabledDate}
                                    getPopupContainer={(node) =>
                                        node.parentNode as HTMLElement
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label={__('更新周期')}
                                name="update_cycle"
                            >
                                <Select
                                    placeholder={__('请选择更新周期')}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                    allowClear
                                >
                                    {updateCycle.map((item) => (
                                        <Select.Option
                                            value={item.value}
                                            key={item.value}
                                        >
                                            {item.label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label={__('时间范围')}
                                name="data_time_range"
                            >
                                <Select
                                    placeholder={__('请选择时间范围')}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                    allowClear
                                >
                                    {dataTimeRange.map((item) => (
                                        <Select.Option
                                            value={item.value}
                                            key={item.value}
                                        >
                                            {item.label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label={__('数据范围')}
                                name="data_space_range"
                            >
                                <Select
                                    placeholder={__('请选择数据范围')}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                    allowClear
                                >
                                    {dataSpaceRange.map((item) => (
                                        <Select.Option
                                            value={item.value}
                                            key={item.value}
                                        >
                                            {item.label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}>
                            <Form.Item
                                label={__('使用期限')}
                                name="service_life"
                                className={styles.horizontalItem}
                                hidden={foldInfo[1]}
                                initialValue={1}
                            >
                                <Radio.Group
                                    className={classnames({
                                        [styles.horizontalRadio]: true,
                                        [styles.serviceLifeRadio]: true,
                                    })}
                                >
                                    <Radio value={1}>{__('永久')}</Radio>
                                    <Radio value={2}>{__('短期')}</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col span={12} className={styles.serviceEndTimeCol}>
                            <Form.Item
                                noStyle
                                shouldUpdate={(pre, cur) =>
                                    pre.service_life !== cur.service_life
                                }
                            >
                                {({ getFieldValue }) => {
                                    return getFieldValue('service_life') ===
                                        2 ? (
                                        <Form.Item
                                            name="service_end_time"
                                            label=""
                                            validateFirst
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('请选择截止日期'),
                                                },
                                                {
                                                    validator: (e, val) =>
                                                        validateEndTime(val),
                                                },
                                            ]}
                                        >
                                            <DatePicker
                                                placeholder={__(
                                                    '请选择截止日期',
                                                )}
                                                disabledDate={disabledDate}
                                                getPopupContainer={(node) =>
                                                    node.parentNode as HTMLElement
                                                }
                                            />
                                        </Form.Item>
                                    ) : null
                                }}
                            </Form.Item>
                        </Col>
                    </Row>

                    {getTitleComp(__('信息项配置'), 2)}
                    <div hidden={foldInfo[2]}>
                        <div className={styles.infoConfigTop}>
                            <div className={styles.infoTitle}>
                                <div
                                    className={classnames({
                                        [styles.infoRequiredFlag]: true,
                                    })}
                                >
                                    *
                                </div>
                                {__('信息项')}
                            </div>
                            {resourceInfo?.res_source ===
                            ResourceSource.SERVICESHOP ? (
                                <div
                                    className={styles.addInfo}
                                    onClick={() => setChooseInfoOpen(true)}
                                    hidden
                                >
                                    <AddOutlined className={styles.addIcon} />
                                    {__('选择')}
                                </div>
                            ) : (
                                <Space size={4}>
                                    <div
                                        className={styles.addInfo}
                                        onClick={handleAddInfoItems}
                                    >
                                        <AddOutlined
                                            className={styles.addIcon}
                                        />
                                        {__('添加')}
                                    </div>
                                    <Divider
                                        type="vertical"
                                        className={styles.divider}
                                    />
                                    <div
                                        className={styles.addInfo}
                                        onClick={handleImportInfoItems}
                                    >
                                        {__('导入')}
                                    </div>
                                </Space>
                            )}
                        </div>
                        {isShowInfoError && infoItems.length === 0 && (
                            <div
                                className={styles.infoItemErrorInfo}
                                ref={errorInfoRef}
                            >
                                {__('请添加信息项')}
                            </div>
                        )}
                        {infoItems.length > 0 ? (
                            <div className={styles.infoItemsWrapper}>
                                <div className={styles.infoItemOperate}>
                                    {resourceInfo?.res_source ===
                                    ResourceSource.SERVICESHOP ? (
                                        <div className={styles.leftOperate}>
                                            {__('已选')}
                                            {`（${selectedRowKeys.length}/${infoItems.length}）`}
                                            <Tooltip title={__('清空已选内容')}>
                                                <ClearOutlined
                                                    className={styles.clearIcon}
                                                    onClick={() =>
                                                        setSelectedRowKeys([])
                                                    }
                                                />
                                            </Tooltip>
                                            <Divider
                                                type="vertical"
                                                orientationMargin={12}
                                                className={styles.divider}
                                            />
                                            <span
                                                className={styles.selectedLabel}
                                            >
                                                {__('只看已选')}
                                            </span>
                                            <Switch
                                                onChange={handleSwitch}
                                                checked={checked}
                                            />
                                            <Tooltip title={__('刷新已选内容')}>
                                                <RefreshOutlined
                                                    hidden={!checked}
                                                    className={
                                                        styles.refreshIcon
                                                    }
                                                    onClick={refreshInfoItems}
                                                />
                                            </Tooltip>
                                        </div>
                                    ) : (
                                        <div className={styles.infoItemCount}>
                                            {__('共 ${count} 个信息项', {
                                                count: infoItems.length,
                                            })}
                                        </div>
                                    )}

                                    <SearchInput
                                        placeholder={
                                            resourceInfo?.res_source ===
                                            ResourceSource.SERVICESHOP
                                                ? __('搜索信息项名称、字段名称')
                                                : __('搜索信息项名称')
                                        }
                                        value={searchValue}
                                        onKeyChange={(kw: string) =>
                                            setSearchValue(kw)
                                        }
                                        className={styles.infoItemSearchInput}
                                    />
                                </div>
                                <Form.Item
                                    name="info_items"
                                    valuePropName="dataSource"
                                >
                                    <Table
                                        columns={infoItemColumns()}
                                        rowKey="item_uuid"
                                        pagination={false}
                                        locale={{ emptyText: <Empty /> }}
                                        rowSelection={
                                            resourceInfo?.res_source ===
                                            ResourceSource.SERVICESHOP
                                                ? rowSelection
                                                : undefined
                                        }
                                    />
                                </Form.Item>

                                <div className={styles.pagination}>
                                    <Pagination
                                        current={current}
                                        pageSize={10}
                                        total={total}
                                        onChange={handleInfoPageChange}
                                        hideOnSinglePage
                                        showQuickJumper={false}
                                        showSizeChanger={false}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className={styles.infoEmpty}>
                                {renderEmpty()}
                            </div>
                        )}
                    </div>

                    {(resourceInfo?.res_source === ResourceSource.SERVICESHOP
                        ? selectedRowKeys.length > 0
                        : infoItems.length > 0) && (
                        <>
                            <FilterRules
                                infoItems={
                                    resourceInfo?.res_source ===
                                    ResourceSource.SERVICESHOP
                                        ? infoItemsInServiceShop
                                        : infoItems
                                }
                                form={form}
                            />
                            <Form.Item
                                label={__('过滤规则描述')}
                                name="filter_description"
                                rules={[
                                    {
                                        pattern: keyboardReg,
                                        message: ErrorInfo.EXCEPTEMOJI,
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    placeholder={__('请输入')}
                                    style={{ height: 76, resize: 'none' }}
                                    maxLength={255}
                                />
                            </Form.Item>
                        </>
                    )}
                </Form>
            </div>

            <AddInfoItem
                open={addInfoOpen}
                onClose={() => setAddInfoOpen(false)}
                getInfoItem={getInfoItem}
            />
            <ChooseInfoItem
                id={resourceInfo?.res_id || ''}
                open={chooseInfoOpen}
                onClose={() => setChooseInfoOpen(false)}
                getInfoItem={getImportInfoItem}
                selectedInfoItem={infoItems}
            />
            <ImportInfoItems
                open={importInfoOpen}
                onClose={() => setImportInfoOpen(false)}
                getImportInfoItem={getImportInfoItem}
            />
        </Drawer>
    )
}

export default SourceConfig
