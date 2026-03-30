import React, {
    useEffect,
    useState,
    forwardRef,
    useImperativeHandle,
    useRef,
    useMemo,
} from 'react'
import {
    Button,
    Form,
    Row,
    Col,
    Select,
    DatePicker,
    Tooltip,
    Tabs,
    Tag,
} from 'antd'
import { debounce, cloneDeep, isEmpty } from 'lodash'
import classnames from 'classnames'
import moment from 'moment'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { CloseOutlined, FiltersOutlined, FontIcon } from '@/icons'
import { IFormData, SearchType, IFormItem } from './const'
import styles from './styles.module.less'
import __ from './locale'
import { ReactComponent as fold } from '@/icons/svg/outlined/fold.svg'
import { ReactComponent as unfold } from '@/icons/svg/outlined/unfold.svg'
import CommonIcon from '@/components/CommonIcon'
import { RefreshBtn } from '../ToolbarComponents'
import SearchInput from '../../ui/SearchInput'
import MultipleSelect from '../MultipleSelect'
import SelectThemeDomain from '@/components/SelectThemeDomain'
import DepartmentAndOrgSelect from '@/components/DepartmentAndOrgSelect'
import ScrollLoadInfoSystemSelect from '../ScrollLoadInfoSystemSelect'
import TreeSelectThemeDomain from '@/components/TreeSelectThemeDomain'

const { RangePicker } = DatePicker

/**
 * @param IFormData form属性,继承antd form
 * @param formData 表单项列表数据，遍历生成查询条件
 * @param onSearch 查询事件
 * @param getExpansionStatus 获取是否是展开状态，可用于计算页面或者表格高度
 * @param getMoreExpansionStatus 超过8个搜索条件，是否展开更多
 * @param prefixNode 搜索栏前缀组件，例如：新增按钮、状态切换
 * @param suffixNode 搜索栏后缀组件，例如：排序
 * @param itemValueChange 获取当前变化的属性和值，{type:1}，可用于控制联动效果
 * @param onReset 重置事件
 */
const SearchLayout: React.FC<IFormData> = forwardRef(
    (props: IFormData, ref) => {
        const {
            formData,
            onSearch,
            prefixNode,
            suffixNode,
            beforeSearchInputNode,
            getExpansionStatus,
            getMoreExpansionStatus,
            isShowRefreshBtn = true,
            expansion = false,
            itemValueChange,
            onReset,
            ...other
        } = props
        const [form] = Form.useForm()
        const multipleSelectRefs = useRef<{ [key: string]: any }>({})
        const [expansionStatus, setExpansionStatus] = useState<boolean>(false)
        // 时间查询条件
        const timesItem: IFormItem[] = formData.filter(
            (item) => item.type === SearchType.RangePicker,
        )
        // input输入框查询条件
        const inputItems: any[] = formData
            .filter((item) => item.type === SearchType.Input)
            .map((item) => item.key)
        const defaultDataType = 'YYYY-MM-DD'
        // 单行显示items个数
        const [formItemsRowSum, setFormItemsRowSum] = useState<number>(4)
        const [showExpansion, setShowExpansion] = useState<boolean>(
            formData.length > 12,
        )

        const getFormInitValues = () => {
            const values = {}
            formData?.forEach((fItem) => {
                const { key, itemProps } = fItem
                const value = itemProps?.value
                if (value) {
                    values[key] = value
                }
            })
            return values
        }

        const [formValues, setFormValues] = useState<any>(getFormInitValues())
        const [isShow, setIsShow] = useState<boolean>(false)
        const [isActive, setIsActive] = useState<boolean>(false)
        // 是否显示重置按钮占位标签
        const [isShowPlaceholderTag, setIsShowPlaceholderTag] =
            useState<boolean>(true)

        const [selectedFileds, setSelectedFileds] = useState<any[]>([])
        const [selectedThemeDomain, setSelectedThemeDomain] = useState<any>()
        const [treeSelectedThemeDomain, setTreeSelectedThemeDomain] =
            useState<any>()
        const [selectedDepartment, setSelectedDepartment] = useState<any>()
        const [selectedInfoSystem, setSelectedInfoSystem] = useState<any>()

        // 是否显示筛选按钮
        const isShowFilterBtn = useMemo(() => {
            return !!formData.filter((item) => !item.isAlone)?.length
        }, [formData])

        useEffect(() => {
            setExpansionStatus(expansion)
            setShowExpansion(
                formData.filter((item) => !item.isAlone).length > 12,
            )
        }, [formData])

        useEffect(() => {
            getMoreExpansionStatus?.(expansionStatus)
        }, [expansionStatus])

        useEffect(() => {
            if (getExpansionStatus) {
                getExpansionStatus(isShow)
            }
            // const box = document.getElementById('searchFormId')
            // if (box) {
            //     // 有时间查询 && 查询条件大于3个
            //     if (timesItem.length > 0 && formData.length > 3) {
            //         // 屏幕过小，导致重置按钮换行，需要去除占位标签
            //         setIsShowPlaceholderTag(box.offsetWidth > 900)
            //         /**
            //          * 分辨率太小，导致第一行需要换行时，需要增加占位符
            //          * 超过4个搜索项，需要显示占位符
            //          */
            //         if (box.offsetWidth < 702 || formData.length > 4) {
            //             setIsShowPlaceholderTag(true)
            //         }
            //     }
            // }
        }, [isShow])

        useImperativeHandle(ref, () => ({
            formValues,
            changeFormValues,
            onReset,
            resetHandel,
        }))

        useEffect(() => {
            if (!isEmpty(formValues)) {
                searchHandel()
            }
        }, [formValues])

        // 变更单个表单值
        const changeFormValues = (val: any) => {
            const keys = Object.keys(val)
            keys.forEach((item) => form.setFieldValue(item, val[item]))
            setFormValues((newFormValues) => ({ ...newFormValues, ...val }))
        }

        // 查询
        const searchHandel = (data?: any, isRefresh = false) => {
            const obj: any = {}
            const searchData = data || formValues
            // 主题域传值需单独处理
            const selectThemeDomainItem = formData?.find(
                (item) => item.type === SearchType.SelectThemeDomain,
            )
            // eslint-disable-next-line no-restricted-syntax, guard-for-in
            for (const key in searchData) {
                if (Object.prototype.hasOwnProperty.call(searchData, key)) {
                    if (key === selectThemeDomainItem?.key && searchData[key]) {
                        const [domain, theme = undefined] = searchData[key]
                        // 配置未分类 && 已选未分类 时，选第一个参数
                        obj[key] =
                            selectThemeDomainItem?.itemProps?.unCategorizedObj
                                ?.id === domain
                                ? domain
                                : theme
                    } else {
                        obj[key] =
                            searchData[key] === 0
                                ? searchData[key]
                                : searchData[key] || undefined
                    }
                }
            }
            // 处理时间选择，支持多个时间选择框

            timesItem.forEach((item: IFormItem) => {
                const dataType = item?.itemProps?.dataType || defaultDataType
                if (!item?.itemProps?.unFormat) {
                    if (obj[item.key] && obj[item.key]?.length > 0) {
                        const [startVal, endVal] = obj[item.key]
                        // 是否传入开始、结束字段名称
                        obj[item?.startTime || 'start_time'] =
                            dataType.length > 10
                                ? startVal.format(dataType)
                                : `${startVal.format(dataType)} 00:00:00`
                        obj[item?.endTime || 'end_time'] =
                            dataType.length > 10
                                ? endVal.format(dataType)
                                : `${endVal.format(dataType)} 23:59:59`
                        delete obj[item.key]
                        // 转时间戳
                        if (item.isTimestamp) {
                            obj[item?.startTime || 'start_time'] = Date.parse(
                                obj[item?.startTime || 'start_time'],
                            )
                            obj[item?.endTime || 'end_time'] = Date.parse(
                                obj[item?.endTime || 'end_time'],
                            )
                        }
                    } else {
                        obj[item?.startTime || 'start_time'] = undefined
                        obj[item?.endTime || 'end_time'] = undefined
                    }
                }
            })
            getSelectedFields(obj)
            onSearch(obj, isRefresh)
        }

        const getSelectedFields = (data) => {
            const arry: any[] = []
            // eslint-disable-next-line no-restricted-syntax, guard-for-in
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    if (data[key] || data[key] === 0) {
                        const itemFiled: any =
                            formData.find((item) => item.key === key) || {}
                        if (!itemFiled.isAlone) {
                            let optionLabel: string
                            let optionLabelList: any[]
                            switch (itemFiled.type) {
                                case SearchType.Input:
                                    arry.push({
                                        key,
                                        value: data[key],
                                        label: itemFiled?.label,
                                        optionLabel: data[key],
                                    })
                                    break
                                case SearchType.DepartmentAndOrgSelect:
                                    arry.push({
                                        key,
                                        value: data[key],
                                        label: itemFiled?.label,
                                        optionLabel:
                                            selectedDepartment?.[key]?.title ||
                                            selectedDepartment
                                                ?.defaultDepartment?.name,
                                    })
                                    break
                                case SearchType.SelectThemeDomain:
                                    arry.push({
                                        key,
                                        value: data[key],
                                        label: itemFiled?.label,
                                        optionLabel: selectedThemeDomain?.name,
                                    })
                                    break
                                case SearchType.SelectThemeDomainTree:
                                    arry.push({
                                        key,
                                        value: data[key],
                                        label: itemFiled?.label,
                                        optionLabel:
                                            treeSelectedThemeDomain?.name,
                                    })
                                    break
                                case SearchType.Select:
                                    optionLabel =
                                        itemFiled?.itemProps?.options.find(
                                            (item) =>
                                                item[
                                                    itemFiled?.itemProps
                                                        ?.fieldNames?.value ||
                                                        'value'
                                                ] === data[key],
                                        )
                                    arry.push({
                                        key,
                                        value: data[key],
                                        label: itemFiled?.label,
                                        optionLabel:
                                            optionLabel[
                                                itemFiled?.itemProps?.fieldNames
                                                    ?.textLabel ||
                                                    itemFiled?.itemProps
                                                        ?.fieldNames?.label ||
                                                    'label'
                                            ],
                                        clearKey: itemFiled?.clearKey,
                                    })
                                    break
                                case SearchType.MultipleSelect:
                                    // 按照已选顺序显示，与表现顺序一致
                                    optionLabelList = data[key]
                                        ?.split(',')
                                        ?.map((it) => {
                                            return itemFiled?.itemProps?.options.find(
                                                (k) =>
                                                    k[
                                                        itemFiled?.itemProps
                                                            ?.fieldNames
                                                            ?.value || 'id'
                                                    ] === it,
                                            )
                                        })
                                    arry.push({
                                        key,
                                        value: data[key],
                                        label: itemFiled?.label,
                                        optionLabel: optionLabelList
                                            .map(
                                                (it) =>
                                                    it[
                                                        itemFiled?.itemProps
                                                            ?.fieldNames
                                                            ?.label || 'name'
                                                    ],
                                            )
                                            .join('、'),
                                    })
                                    break
                                case SearchType.InfoSystem:
                                    arry.push({
                                        key,
                                        value: data[key],
                                        label: itemFiled?.label,
                                        optionLabel: selectedInfoSystem
                                            ?.map((o) => o.name)
                                            .join('、'),
                                    })
                                    break
                                default:
                                    setSelectedFileds(arry)
                            }
                        }
                    }
                }
            }
            if (timesItem.length > 0) {
                timesItem.forEach((it) => {
                    const time = formValues[it.key]
                    if (time) {
                        arry.push({
                            key: it.key,
                            label: it.label,
                            type: it.type,
                            optionLabel: `${
                                time[0]
                                    ? moment(time[0])?.format('YYYY-MM-DD')
                                    : '--'
                            } ${__('至')} ${
                                time[1]
                                    ? moment(time[1])?.format('YYYY-MM-DD')
                                    : '--'
                            }`,
                        })
                    }
                })
            }
            setSelectedFileds(arry)
        }

        // 重置
        const resetHandel = () => {
            form.resetFields()
            const key = formData.find((item) => item.isAlone)?.key || ''
            if (formValues[key]) {
                setFormValues({
                    ...formInitialValues,
                    [key]: formValues[key],
                })
            } else {
                setFormValues(formInitialValues)
            }
            onReset?.()
        }

        const getInitialForamData = (data) => {
            const initSearchFormDataTemp = {}
            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < data.length; i++) {
                const { defaultValue } = data[i]
                initSearchFormDataTemp[data[i].key] = defaultValue
            }
            return initSearchFormDataTemp
        }

        // 表单初始值
        const formInitialValues = getInitialForamData(
            formData.filter((item) => !item.isAlone),
        )

        // 表单初始值
        const isAloneKey: string =
            formData.find((item) => item.isAlone)?.key || ''

        useEffect(() => {
            if (
                formValues &&
                Object.keys(formValues).length > 0 &&
                formInitialValues
            ) {
                const values = cloneDeep(formValues)
                if (isAloneKey) {
                    delete values[isAloneKey]
                }
                const flag: boolean = Object.values(values).some((item) => item)
                setIsActive(flag)
            }
        }, [formValues, formInitialValues])

        const getFields = (data) => {
            const children: Array<any> = []
            const arry = !expansionStatus
                ? data.filter((item, index) => index < 8)
                : data
            arry.forEach((item: IFormItem) => {
                children.push(
                    <Col
                        key={item.key}
                        span={showExpansion && !expansionStatus ? 5 : 6}
                        className={classnames(
                            styles.searchCol,
                            item.type === SearchType.RangePicker &&
                                styles.timeSearchCol,
                        )}
                    >
                        <Form.Item
                            label={item.label}
                            name={item.key}
                            className={classnames(
                                styles.searchColItem,
                                // 存在时间查询，同时查询条件超过4个
                                timesItem.length > 0 &&
                                    formData.filter((it) => !it.isAlone)
                                        .length > 3 &&
                                    styles.searchTimeColItem,
                            )}
                            {...item.formItemProps}
                        >
                            {getItems(item)}
                        </Form.Item>
                    </Col>,
                )
            })
            return children
        }

        const getAloneField = () => {
            const [field] = formData.filter((item) => item.isAlone)
            if (!field || !field?.key) {
                return null
            }
            return (
                <SearchInput
                    placeholder={`${__('搜索')}${field.label}`}
                    style={{ width: 282 }}
                    className={styles.searchInput}
                    onKeyChange={(value: string) => {
                        if (
                            (!formValues?.[field.key] && !value) ||
                            value === formValues?.[field.key]
                        )
                            return
                        changeFormValues({
                            [field.key]: value,
                        })
                    }}
                    onChange={(e) => {
                        const { value } = e.target
                        if (!value) {
                            changeFormValues({
                                [field.key]: value,
                            })
                        }
                    }}
                    {...field.itemProps}
                />
            )
        }

        const getItems = (item: IFormItem) => {
            switch (item.type) {
                case SearchType.Input:
                    return (
                        <SearchInput
                            placeholder={__('请输入关键字')}
                            showIcon={false}
                            {...item.itemProps}
                        />
                    )
                case SearchType.Select:
                    return (
                        <Select
                            getPopupContainer={(node) => node.parentNode}
                            placeholder={__('请选择')}
                            notFoundContent={
                                <div style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                                    {__('暂无数据')}
                                </div>
                            }
                            allowClear
                            {...item.itemProps}
                        />
                    )

                case SearchType.DatePicker:
                    return (
                        <DatePicker
                            getPopupContainer={(node) => node.parentNode}
                            {...item.itemProps}
                        />
                    )
                case SearchType.RangePicker:
                    return (
                        <RangePicker
                            getPopupContainer={(node) => node.parentNode}
                            placeholder={[__('开始时间'), __('结束时间')]}
                            {...item.itemProps}
                        />
                    )
                case SearchType.SelectThemeDomain:
                    return (
                        <SelectThemeDomain
                            onChange={(id, val) => {
                                if (val) {
                                    // 目前组件仅支持选第二级主题
                                    const [domain, theme = undefined] = val
                                    // 配置未分类信息时，选第一个参数
                                    setSelectedThemeDomain(
                                        item.itemProps?.unCategorizedObj?.id
                                            ? domain
                                            : theme,
                                    )
                                }
                            }}
                            {...item.itemProps}
                        />
                    )
                case SearchType.SelectThemeDomainTree:
                    return (
                        <TreeSelectThemeDomain
                            onChange={(val, label) => {
                                setTreeSelectedThemeDomain({
                                    value: val,
                                    name: label,
                                })
                            }}
                            allowClear
                            {...item.itemProps}
                        />
                    )
                case SearchType.InfoSystem:
                    return (
                        <ScrollLoadInfoSystemSelect
                            onChange={(val, option) => {
                                setSelectedInfoSystem(option)
                            }}
                            {...item.itemProps}
                        />
                    )
                case SearchType.DepartmentAndOrgSelect:
                    return (
                        <DepartmentAndOrgSelect
                            onSelect={(id, val, key) => {
                                if (key) {
                                    setSelectedDepartment((prev) => ({
                                        ...prev,
                                        [key]: val,
                                    }))
                                } else {
                                    setSelectedDepartment({
                                        defaultDepartment: val,
                                    })
                                }
                            }}
                            {...item.itemProps}
                            selectKey={item.key}
                        />
                    )
                case SearchType.MultipleSelect:
                    return (
                        <MultipleSelect
                            placeholder={__('请选择')}
                            onChange={(val) => {
                                changeFormValues({
                                    [item.key]:
                                        val
                                            .map(
                                                (it) =>
                                                    it[
                                                        item?.itemProps
                                                            ?.fieldNames
                                                            ?.value || 'id'
                                                    ],
                                            )
                                            .join() || undefined,
                                })
                            }}
                            value={form.getFieldValue(item.key)}
                            fieldLabel={item?.itemProps?.fieldNames?.label}
                            fieldValue={item?.itemProps?.fieldNames?.value}
                            {...item.itemProps}
                            ref={(el) => {
                                multipleSelectRefs.current[item.key] = el
                            }}
                        />
                    )
                case SearchType.Other:
                    return item.render ? item.render(item) : null
                default:
                    return null
            }
        }

        const expansionHandel = () => {
            getFields(formData.filter((item) => !item.isAlone))
            setExpansionStatus(!expansionStatus)
        }

        const onDebounceValuesChange = debounce(
            (allValues) => {
                setFormValues(allValues)
            },
            1000,
            {
                leading: false,
            },
        )

        const getTypeBykey = (key: string) => {
            return formData.find((item) => item.key === key)?.type
        }

        return (
            <div className={styles.searchFormWrapper}>
                <div className={styles.btnBox}>
                    <div className={styles.leftBtn}>
                        {prefixNode && prefixNode}
                    </div>
                    <div className={styles.rightBtn}>
                        {beforeSearchInputNode && beforeSearchInputNode}
                        {getAloneField()}
                        {isShowFilterBtn && (
                            <Button
                                onClick={() => {
                                    setIsShow(!isShow)
                                }}
                                className={classnames(
                                    isActive && styles.active,
                                )}
                                style={{ padding: '4px 12px' }}
                            >
                                <span className={styles.prefixIcon}>
                                    <FontIcon
                                        name="icon-shaixuan"
                                        style={{ fontSize: 14 }}
                                    />
                                </span>
                                {isShow ? __('筛选') : __('筛选')}
                                <span className={styles.suffixIcon}>
                                    {!isShow && <DownOutlined />}
                                    {isShow && <UpOutlined />}
                                </span>
                            </Button>
                        )}
                        {/* <span className={styles.line} /> */}
                        <div className={styles.suffixNode}>
                            {suffixNode && suffixNode}
                        </div>
                        {isShowRefreshBtn && (
                            <RefreshBtn
                                onClick={() => searchHandel(undefined, true)}
                            />
                        )}
                    </div>
                </div>

                {isShow && (
                    <Form
                        className={styles.searchForm}
                        form={form}
                        layout="vertical"
                        initialValues={formInitialValues}
                        autoComplete="off"
                        {...other}
                        onValuesChange={async (values, allValues) => {
                            const [key] = Object.keys(values)
                            if (inputItems.includes(key)) {
                                onDebounceValuesChange(allValues)
                            } else {
                                await setFormValues(allValues)
                            }
                            itemValueChange?.(values)
                        }}
                        id="searchFormId"
                    >
                        <Row gutter={24}>
                            {getFields(
                                formData.filter((item) => !item.isAlone),
                            )}
                            {showExpansion && (
                                <Col
                                    span={
                                        expansionStatus
                                            ? 24 -
                                              (formData.filter(
                                                  (item) => !item.isAlone,
                                              ).length %
                                                  4) *
                                                  6
                                            : 2
                                    }
                                    className={classnames(
                                        styles.searchBtnBox,
                                        formData.filter((item) => !item.isAlone)
                                            .length %
                                            formItemsRowSum ===
                                            0 &&
                                            expansionStatus &&
                                            styles.mb,
                                        expansionStatus && styles.end,
                                    )}
                                >
                                    <Form.Item>
                                        {/* 占位标签 */}
                                        {isShowPlaceholderTag &&
                                            showExpansion && (
                                                <div
                                                    className={
                                                        styles.placeholderTag
                                                    }
                                                />
                                            )}
                                        {/* <Space> */}
                                        {/* <Button
                                            className={styles.resetBtn}
                                            onClick={resetHandel}
                                        >
                                            {__('重置')}
                                        </Button> */}
                                        {showExpansion && (
                                            <Button
                                                type="link"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    expansionHandel()
                                                }}
                                            >
                                                {expansionStatus
                                                    ? __('收起')
                                                    : __('展开')}
                                                <CommonIcon
                                                    icon={
                                                        expansionStatus
                                                            ? fold
                                                            : unfold
                                                    }
                                                />
                                            </Button>
                                        )}
                                        {/* </Space> */}
                                    </Form.Item>
                                </Col>
                            )}
                        </Row>

                        <Tooltip
                            placement="bottom"
                            title={__('清除并收起筛选')}
                        >
                            <Button
                                className={styles.closeBtn}
                                type="text"
                                onClick={() => {
                                    resetHandel()
                                    setIsShow(false)
                                }}
                                icon={<FontIcon name="icon-yichu" />}
                            />
                        </Tooltip>
                    </Form>
                )}
                {selectedFileds.length > 0 && (
                    <div className={styles.bottomBox}>
                        <span>{__('筛选条件：')}</span>
                        <Tabs
                            popupClassName={styles.selectedTabsBox}
                            items={
                                selectedFileds?.map((item, index) => {
                                    return {
                                        label: (
                                            <Tag
                                                key={item.key}
                                                title={item.optionLabel}
                                                className={styles.selectedTags}
                                            >
                                                <span className={styles.title}>
                                                    {item.label}
                                                </span>
                                                ：
                                                <span>
                                                    {item.optionLabel}
                                                    &nbsp;&nbsp;
                                                </span>
                                                <span
                                                    className={classnames(
                                                        styles.closeBtn,
                                                        'closeBtn',
                                                    )}
                                                    onClick={async () => {
                                                        // 清除与之关联的key
                                                        if (item?.clearKey) {
                                                            // 清除过滤状态，显示所有筛选状态
                                                            await itemValueChange?.(
                                                                {
                                                                    [item.key]:
                                                                        undefined,
                                                                },
                                                            )
                                                            changeFormValues({
                                                                [item.key]:
                                                                    undefined,
                                                                [item.clearKey]:
                                                                    undefined,
                                                            })
                                                        } else if (
                                                            // 选择数据源类型需要手动清空
                                                            getTypeBykey(
                                                                item.key,
                                                            ) ===
                                                            SearchType.MultipleSelect
                                                        ) {
                                                            multipleSelectRefs.current[
                                                                item.key
                                                            ]?.reset()
                                                        } else {
                                                            changeFormValues({
                                                                [item.key]:
                                                                    undefined,
                                                            })
                                                        }
                                                    }}
                                                >
                                                    <CloseOutlined
                                                        title={__('关闭')}
                                                        style={{
                                                            fontSize: '12px',
                                                        }}
                                                    />
                                                </span>
                                            </Tag>
                                        ),
                                        key: `${index}`,
                                    }
                                }) || []
                            }
                        />
                        <span
                            className={styles.clearAllBtn}
                            onClick={resetHandel}
                        >
                            {__('清除条件')}
                        </span>
                    </div>
                )}
            </div>
        )
    },
)
export default SearchLayout
