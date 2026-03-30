import React, {
    memo,
    useEffect,
    useMemo,
    useState,
    useRef,
    ReactElement,
    cloneElement,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { DatePicker, Button, Space, Dropdown, Checkbox, TreeSelect } from 'antd'
import moment from 'moment'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { isEqual } from 'lodash'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import { IFilterCondition } from './helper'
import { CloseOutlined } from '@/icons'
import SelectBusinessProcess from './SelectBusinessProcess'
import SelectTheme from './SelectTheme'

const { RangePicker } = DatePicker
const { SHOW_PARENT } = TreeSelect

const multipleDefaultVal = -1
// 单选默认值
export const singleSelDefVal = ''

interface IFilterConditionLayout {
    filterConfig?: Array<IFilterCondition>
    layoutClassName?: string
    ref?: any
    updateList: (params: Object) => void
    getIsShowClearBtn?: (flag: boolean) => void
}

/**
 * 过滤条件类型
 */
export enum FilterConditionEleType {
    MULTIPLE = 'multiple',
    RADIO = 'radio',
    DATE = 'date',
    // 单选
    DROPDOWN = 'dropdown',
    THEME = 'theme',
    BUSINESSPROCESS = 'businessProcess',
}

const FilterConditionLayout: React.FC<IFilterConditionLayout> = forwardRef(
    (props: any, ref) => {
        const {
            filterConfig = [],
            layoutClassName,
            updateList,
            getIsShowClearBtn,
        } = props
        const businessProcessRef: any = useRef()
        const [filterConditionConfig, setFilterConditionConfig] =
            useState<any>()
        const selectThemeRef = useRef<any>(null)
        // 记录所有多选/时间选择框的展开与关闭
        const [itemsIsOpen, setItemsIsOpen] = useState({})

        const [allValues, setAllValues] = useState<any>({})

        const multipleDefaultItem = (item) => {
            if (!item.label) return {}
            return {
                key: null,
                value: multipleDefaultVal,
                label: item.label,
                type: item.type,
            }
        }

        useImperativeHandle(ref, () => ({
            init: () => initAllValues(),
        }))

        useEffect(() => {
            if (!isEqual(filterConditionConfig, filterConfig)) {
                setFilterConditionConfig(filterConfig)
            }
        }, [filterConfig])

        useEffect(() => {
            initAllValues()
        }, [filterConditionConfig])

        const singleSelDefaultItem = (item) => {
            if (!item.label) return {}
            return {
                key: null,
                value: singleSelDefVal,
                label: item.label,
                type: item.type,
            }
        }

        // 清空按钮是否显示
        const showClearBtn = useMemo(() => {
            let flag = false
            Object.keys(allValues)?.forEach((vKey) => {
                const vItem = allValues[vKey]
                const value = vItem?.value
                // 这里仅判断了 多选、单选 和 选择时间 为空的情况
                switch (vItem.type) {
                    case FilterConditionEleType.MULTIPLE:
                        if (
                            value?.length &&
                            value[0].value !== multipleDefaultVal
                        ) {
                            flag = true
                        }
                        break
                    case FilterConditionEleType.DROPDOWN:
                        if (
                            value?.length &&
                            value[0]?.value !== singleSelDefVal
                        ) {
                            flag = true
                        }
                        break
                    case FilterConditionEleType.BUSINESSPROCESS:
                        if (value?.length) {
                            flag = true
                        }
                        break
                    case FilterConditionEleType.DATE:
                        if (JSON.stringify(value) !== '{}') {
                            flag = true
                        }
                        break
                    case FilterConditionEleType.THEME:
                        if (value?.length) {
                            flag = true
                        }
                        break
                    default:
                        break
                }
            })
            return flag
        }, [allValues])

        useEffect(() => {
            getIsShowClearBtn?.(showClearBtn)
        }, [showClearBtn])

        // 更新目录列表
        const queryCatlgList = (params: any) => {
            if (isEqual(params, allValues)) return
            setAllValues(params)
            const filterFormattedValue = {}
            Object.keys(params)?.forEach((vKey) => {
                const vItem = params[vKey]
                const itemValue = vItem?.value
                let value: any = ''
                if (vItem.type === FilterConditionEleType.MULTIPLE) {
                    value = itemValue.map((mItem) => mItem.value)
                    value =
                        value?.filter(
                            (fItem) => fItem !== multipleDefaultVal,
                        ) || []
                } else if (vItem.type === FilterConditionEleType.DROPDOWN) {
                    if (vKey === 'data_resource_type') {
                        value = [itemValue?.[0]?.value]
                    } else {
                        value = itemValue?.[0]?.value
                    }
                } else if (
                    vItem.type === FilterConditionEleType.DATE ||
                    vItem.type === FilterConditionEleType.THEME ||
                    vItem.type === FilterConditionEleType.BUSINESSPROCESS
                ) {
                    value = itemValue
                }

                filterFormattedValue[vKey] = value
            })
            updateList(filterFormattedValue)
        }

        const initAllValues = () => {
            const fValues: any = {}
            const fOpens = {}
            filterConditionConfig?.forEach((item) => {
                const { key, type, value, options } = item
                fOpens[key] = false
                switch (type) {
                    case FilterConditionEleType.RADIO:
                        fValues[key] = {
                            type,
                            value: '',
                        }
                        break
                    case FilterConditionEleType.MULTIPLE:
                        fValues[key] = {
                            type,
                            value: [multipleDefaultItem(item)],
                        }
                        break
                    case FilterConditionEleType.DROPDOWN:
                        fValues[key] = {
                            type,
                            value: value?.length ? value : options?.[0],
                        }
                        break
                    case FilterConditionEleType.DATE:
                        fValues[key] = {
                            type,
                            value: {},
                        }
                        break
                    case FilterConditionEleType.THEME:
                        fValues[key] = {
                            type,
                            value: [],
                        }
                        break
                    default:
                }
            })
            // setAllValues(fValues)
            queryCatlgList(fValues)
            businessProcessRef?.current?.handleClear?.()
            setItemsIsOpen(fOpens)
            selectThemeRef?.current?.handleClear?.()
        }

        const disabledDate = (current: any, values: any) => {
            return current > moment().add(0, 'days')
        }

        // 时间戳->日期
        const stampFormatToDate = (timeStamp?: number) => {
            if (timeStamp) {
                return moment(timeStamp)
            }
            return null
        }

        const renderMultipleContent = (item: any) => {
            const value = allValues[item.key]?.value
            // 是否为默认值
            let isDefaultValue = false
            if (value?.length === 1 && value[0].value === multipleDefaultVal) {
                isDefaultValue = true
            }

            const curItemValue = value?.map?.((vItem) => vItem.label) || []

            const content = isDefaultValue
                ? multipleDefaultItem(item).label + __('不限')
                : (curItemValue?.join?.('、') || '') +
                  (isDefaultValue || !curItemValue?.length
                      ? ''
                      : `(+${curItemValue?.length})`)
            return (
                <div className={styles.mutilpleContent} title={content}>
                    {content}
                </div>
            )
        }

        const renderDateLabel = (item: any) => {
            const { key } = item
            const value = allValues[key]?.value || {}
            // 是否为默认值
            let isDefaultValue = false

            const startTime =
                stampFormatToDate(value?.start_time)?.format('YYYY-MM-DD') || ''
            const endTime =
                stampFormatToDate(value?.end_time)?.format('YYYY-MM-DD') || ''
            if (!value.start_time && !value.end_time) {
                isDefaultValue = true
            }

            const content = isDefaultValue
                ? multipleDefaultItem(item).label
                : `${item.label}${
                      startTime ? `${startTime}${__('至')}` : ''
                  }${endTime}${!startTime ? __('之前') : ''}`

            return (
                <div className={styles.mutilpleContent} title={content}>
                    {content}
                </div>
            )
        }

        const renderDateBox = (item) => {
            const { key } = item
            const vItem = allValues[key]
            const value = vItem?.value || {}
            return [
                {
                    key: item.key,
                    label: (
                        <RangePicker
                            className={styles.filterDatePicker}
                            value={[
                                stampFormatToDate(value?.start_time),
                                stampFormatToDate(value?.end_time),
                            ]}
                            disabledDate={(current: any) =>
                                disabledDate(current, value)
                            }
                            placeholder={[__('开始时间'), __('结束时间')]}
                            getPopupContainer={(triggerNode: any) =>
                                triggerNode.parentNode
                            }
                            onChange={(dates, dateString) => {
                                // 开始时间戳
                                const timeStartStamp = moment(
                                    dateString[0],
                                ).valueOf()
                                // 结束时间戳=（被选择日期加一的）时间戳 - 1
                                const timeEndStamp = moment(dateString[1])
                                    .endOf('day')
                                    .valueOf()

                                const timeObj: any = {}
                                if (timeStartStamp) {
                                    timeObj.start_time = timeStartStamp
                                    if (timeEndStamp) {
                                        timeObj.end_time = timeEndStamp
                                    }
                                } else if (timeEndStamp) {
                                    timeObj.end_time = timeEndStamp
                                }

                                // 仅选择开始时间
                                if (timeObj.start_time && !timeObj.end_time) {
                                    setAllValues({
                                        ...allValues,
                                        [key]: {
                                            ...vItem,
                                            value: timeObj,
                                        },
                                    })
                                } else if (!isEqual(value, timeObj)) {
                                    // 时间清空或仅选择了结束时间
                                    queryCatlgList({
                                        ...allValues,
                                        [key]: {
                                            ...vItem,
                                            value: timeObj,
                                        },
                                    })
                                }
                            }}
                            allowEmpty={[true, true]}
                            onOpenChange={(open) => {
                                setItemsIsOpen({
                                    ...itemsIsOpen,
                                    [key]: open,
                                })
                            }}
                            onBlur={() => {
                                // 当天结束时间-时间戳
                                const curDateTimeStamp = moment()
                                    .endOf('day')
                                    .valueOf()
                                let timeObj: any = {}
                                // 若开始时间存在，则结束时间为为当日时间
                                if (value?.start_time && !value?.end_time) {
                                    timeObj = Object.assign(timeObj, {
                                        start_time: value.start_time,
                                        end_time: curDateTimeStamp,
                                    })
                                    // setAllValues({
                                    //     ...allValues,
                                    //     [key]: {
                                    //         ...vItem,
                                    //         value: timeObj,
                                    //     },
                                    // })
                                    queryCatlgList({
                                        ...allValues,
                                        [key]: {
                                            ...vItem,
                                            value: timeObj,
                                        },
                                    })
                                }
                                setItemsIsOpen({
                                    ...itemsIsOpen,
                                    [key]: false,
                                })
                            }}
                        />
                    ),
                },
            ]
        }

        const renderSingleChoiceCon = (item) => {
            const value = allValues[item.key]?.value
            // 是否为默认值
            let isDefaultValue = false
            if (value?.length === 1 && value[0].value === singleSelDefVal) {
                isDefaultValue = true
            }

            const curItemValue = value?.map?.((vItem) => vItem.label) || []

            const content = isDefaultValue
                ? item.label + __('不限')
                : value?.[0]?.label
            return (
                <div className={styles.mutilpleContent} title={content}>
                    {content || '--'}
                </div>
            )
        }

        const dropdownRender = (dropDownMenu: any, item) => {
            return (
                <div className={styles.filterDropDown}>
                    <div className={styles.clearFilterItem}>
                        <div>{__('筛选')}</div>
                        <Button
                            type="link"
                            disabled={
                                allValues[item.key].value?.length === 1 &&
                                allValues[item.key].value[0].value ===
                                    multipleDefaultVal
                            }
                            className={styles.filterBtn}
                            onClick={() => {
                                // setAllValues({
                                //     ...allValues,
                                //     [item.key]: {
                                //         ...allValues[item.key],
                                //         value: [multipleDefaultItem(item)],
                                //     },
                                // })
                                queryCatlgList({
                                    ...allValues,
                                    [item.key]: {
                                        ...allValues[item.key],
                                        value: [multipleDefaultItem(item)],
                                    },
                                })
                            }}
                        >
                            {__('重置筛选')}
                        </Button>
                    </div>
                    {cloneElement(dropDownMenu as ReactElement, {})}
                </div>
            )
        }

        const handleMenuClick = (e: { key: string }, item) => {
            const { key, type, options } = item
            const value =
                allValues[key]?.value.filter(
                    (vItem) => vItem.value !== multipleDefaultVal,
                ) || []
            const menuKey = e.key

            if (type === FilterConditionEleType.DROPDOWN) {
                // 单选后关闭下拉框
                setItemsIsOpen({
                    ...itemsIsOpen,
                    [key]: false,
                })
                queryCatlgList({
                    ...allValues,
                    [key]: {
                        type,
                        value: [
                            options?.find(
                                (_i) =>
                                    _i.key === menuKey ||
                                    `${_i.key}` === menuKey,
                            ),
                        ],
                    },
                })
                return
            }

            // 去除当前点击对应选项及默认项
            let newItem = value?.filter((vItem) => {
                return (
                    `${vItem.value}` !== `${menuKey}` &&
                    vItem.value !== multipleDefaultVal
                )
            })

            const curItemValue = value.filter(
                (vItem) => vItem.value !== multipleDefaultVal,
            )

            // 选中值不在列表中
            if (value.length === newItem.length) {
                const checkedItem = item.options.find(
                    (oItem) => `${oItem.value}` === `${menuKey}`,
                )
                if (checkedItem) {
                    newItem.push(checkedItem)
                }
            }

            if (newItem?.length === 0) {
                newItem = Object.assign([], [multipleDefaultItem(item)])
            }

            // setAllValues({
            //     ...allValues,
            //     [item.key]: {
            //         ...allValues[item.key],
            //         value: newItem,
            //     },
            // })
            setItemsIsOpen({
                ...itemsIsOpen,
                [item.key]: true,
            })
            queryCatlgList({
                ...allValues,
                [item.key]: {
                    ...allValues[item.key],
                    value: newItem,
                },
            })
        }

        const renderMultiCheckBox = (fItem: any) => {
            const curItemValue = allValues[fItem.key]?.value?.map?.(
                (vItem) => vItem?.value,
            )
            return fItem.options?.map((oItem) => {
                return {
                    key: oItem.value,
                    label: (
                        <Checkbox
                            checked={curItemValue?.includes?.(oItem.value)}
                        >
                            <div onClick={(e) => e.preventDefault()}>
                                {oItem.label}
                            </div>
                        </Checkbox>
                    ),
                }
            })
        }

        const renderFilterCondition = () => {
            return filterConditionConfig?.map((item) => {
                const { key } = item
                let { options } = item

                switch (item.type) {
                    // case FilterConditionEleType.RADIO:
                    //     return (
                    //         <Select
                    //             placeholder={item.label}
                    //             defaultValue={item.label}
                    //             options={item.options}
                    //             className={styles.filterItem}
                    //         />
                    //     )
                    case FilterConditionEleType.MULTIPLE:
                        return (
                            <Dropdown
                                menu={{
                                    items: renderMultiCheckBox(item),
                                    selectable: true,
                                    selectedKeys: allValues?.[
                                        item.key
                                    ]?.value?.map((val) => val.key),
                                    onClick: (prop) =>
                                        handleMenuClick(prop, item),
                                }}
                                dropdownRender={(m) => dropdownRender(m, item)}
                                getPopupContainer={(n) => n}
                                trigger={['click']}
                                open={itemsIsOpen[key]}
                                // icon={
                                //     itemsIsOpen[item.key] ? (
                                //         <DownOutlined />
                                //     ) : (
                                //         <UpOutlined />
                                //     )
                                // }
                                onOpenChange={(open) => {
                                    setItemsIsOpen({
                                        ...itemsIsOpen,
                                        [key]: open,
                                    })
                                }}
                            >
                                <div
                                    className={styles.dropDownLabel}
                                    // onClick={(e) => e.preventDefault()}
                                >
                                    <Space>
                                        {renderMultipleContent(item)}
                                        {itemsIsOpen[item.key] ? (
                                            <UpOutlined />
                                        ) : (
                                            <DownOutlined />
                                        )}
                                    </Space>
                                </div>
                            </Dropdown>
                        )
                    case FilterConditionEleType.DATE:
                        return (
                            <Dropdown
                                menu={{
                                    items: renderDateBox(item),
                                    selectable: true,
                                }}
                                overlayClassName={styles.dateBoxWrapper}
                                getPopupContainer={(n) => n}
                                // dropdownRender={(m) => dropdownRender(m, item)}
                                trigger={['click']}
                                open={itemsIsOpen[key]}
                                onOpenChange={(open) => {
                                    setItemsIsOpen({
                                        ...itemsIsOpen,
                                        [key]: open,
                                    })
                                }}
                            >
                                <div
                                    className={styles.dropDownLabel}
                                    // onClick={(e) => e.preventDefault()}
                                >
                                    <Space>
                                        {renderDateLabel(item)}
                                        {itemsIsOpen[item.key] ? (
                                            <UpOutlined />
                                        ) : (
                                            <DownOutlined />
                                        )}
                                    </Space>
                                </div>
                            </Dropdown>
                        )
                    case FilterConditionEleType.DROPDOWN:
                        if (
                            item.key === 'is_online' &&
                            allValues?.is_publish?.value[0].value === '1'
                        ) {
                            options = options.map((oItem) => {
                                if (oItem.value === '2') {
                                    return { ...oItem, disabled: true }
                                }
                                return oItem
                            })
                        }
                        if (
                            item.key === 'is_publish' &&
                            allValues?.is_online?.value[0].value === '2'
                        ) {
                            options = options.map((oItem) => {
                                if (oItem.value === '1') {
                                    return { ...oItem, disabled: true }
                                }
                                return oItem
                            })
                        }

                        return (
                            <Dropdown
                                menu={{
                                    items: options,
                                    selectable: true,
                                    defaultSelectedKeys: [
                                        item.value?.[0]?.key ||
                                            item.options?.[0]?.key ||
                                            singleSelDefVal,
                                    ],
                                    selectedKeys: allValues?.[
                                        item.key
                                    ]?.value?.map((val) => val?.key),
                                    onClick: (prop) =>
                                        handleMenuClick(prop, item),
                                }}
                                trigger={['click']}
                                onOpenChange={(open) => {
                                    setItemsIsOpen({
                                        ...itemsIsOpen,
                                        [key]: open,
                                    })
                                }}
                                open={itemsIsOpen[key]}
                                placement="bottomLeft"
                                className={styles.filterDropdown}
                                getPopupContainer={(node) =>
                                    node.parentElement || node
                                }
                            >
                                <div
                                    className={styles.dropDownLabel}
                                    // onClick={(e) => e.preventDefault()}
                                >
                                    <Space>
                                        {renderSingleChoiceCon(item)}
                                        {/* {renderMultipleContent(item)} */}
                                        {itemsIsOpen[item.key] ? (
                                            <UpOutlined />
                                        ) : (
                                            <DownOutlined />
                                        )}
                                    </Space>
                                </div>
                            </Dropdown>
                        )
                    case FilterConditionEleType.THEME:
                        return (
                            <SelectTheme
                                unCategorizedObj={{
                                    id: '00000000-0000-0000-0000-000000000001',
                                    name: __('其他'),
                                }}
                                onChange={(ids) =>
                                    queryCatlgList({
                                        ...allValues,
                                        [key]: {
                                            type: item.type,
                                            value: ids,
                                        },
                                    })
                                }
                                ref={selectThemeRef}
                                placeholder="请选择主题域"
                            />
                        )
                    case FilterConditionEleType.BUSINESSPROCESS:
                        return (
                            <SelectBusinessProcess
                                onChange={(ids) =>
                                    queryCatlgList({
                                        ...allValues,
                                        [key]: {
                                            type: item.type,
                                            value: ids,
                                        },
                                    })
                                }
                                ref={businessProcessRef}
                            />
                        )
                    default:
                        return <div />
                }
            })
        }

        return (
            <div
                className={classnames(
                    styles.filterConditionLayout,
                    layoutClassName,
                )}
            >
                <Space className={styles.filterItemWrapper} size={[16, 0]}>
                    {renderFilterCondition()}
                </Space>
                {showClearBtn && (
                    <Button
                        onClick={() => {
                            initAllValues()
                        }}
                        type="link"
                        className={styles.clearBtn}
                    >
                        <CloseOutlined className={styles.clearIcon} />
                        <span>{__('清除条件')}</span>
                    </Button>
                )}
            </div>
        )
    },
)
export default memo(FilterConditionLayout)
