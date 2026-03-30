import React, {
    memo,
    useEffect,
    useMemo,
    useRef,
    useState,
    ReactElement,
    cloneElement,
} from 'react'
import {
    DatePicker,
    Button,
    Space,
    Dropdown,
    Checkbox,
    TreeSelect,
    Tooltip,
} from 'antd'
import moment from 'moment'
import {
    CaretDownOutlined,
    CaretUpOutlined,
    DownOutlined,
    UpOutlined,
} from '@ant-design/icons'
import { isEqual, trim } from 'lodash'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import {
    FilterConditionType,
    filterTypeToLwSearchType,
    getAllL2_3Domains,
    IFilterCondition,
} from '../helper'
import { CloseOutlined } from '@/icons'
import SelectTheme from '../SelectTheme'
import { useQuery } from '@/utils'
import { LightweightSearch, SearchInput } from '@/ui'
import { unCategorizedObj } from '../const'

const { RangePicker } = DatePicker
const { SHOW_PARENT } = TreeSelect

const multipleDefaultVal = -1
// 单选默认值
export const singleSelDefVal = ''

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
}

interface IFilterConditionLayout {
    filterConfig?: Array<IFilterCondition>
    isShowSearchInput?: boolean
    placeholder?: string
    // 展开显示搜索框前一个字段key
    beforeSearchInputKey?: string
    isShowExpSwitch?: boolean
    layoutClassName?: string
    updateList: (params: Object, keyword?: string) => void
    getIsShowClearBtn?: (flag: boolean) => void
    hasMoreFilter?: boolean
}

const ExpandFilterConditionLayout: React.FC<IFilterConditionLayout> = ({
    filterConfig = [],
    isShowSearchInput = true,
    placeholder = __('搜索目录名称、编码、描述、信息项'),
    isShowExpSwitch,
    layoutClassName,
    updateList,
    getIsShowClearBtn,
    beforeSearchInputKey,
    hasMoreFilter = false,
}) => {
    const query = useQuery()
    const homeKeyword = query.get('keyword')
    const lightweightSearchRef: any = useRef()

    const [expand, setExpand] = useState(false)
    const [filterConditionConfig, setFilterConditionConfig] = useState<any>()
    const [searchKeyword, setSearchKeyword] = useState<string>()

    const selectThemeRef = useRef<any>(null)
    // 主题域
    const [businThemeList, setBusinThemeList] = useState<any>([])
    // 记录所有多选/时间选择框的展开与关闭
    const [itemsIsOpen, setItemsIsOpen] = useState({})

    const [allValues, setAllValues] = useState<any>({})
    // 添加屏幕宽度状态
    const [isSmallScreen, setIsSmallScreen] = useState(false)

    const multipleDefaultItem = (item) => {
        if (!item.label) return {}
        return {
            key: null,
            value: multipleDefaultVal,
            label: item.label,
            type: item.type,
        }
    }

    useEffect(() => {
        if (homeKeyword) {
            setSearchKeyword(homeKeyword)
            queryCatlgList({
                ...allValues,
                keyword: homeKeyword,
            })
        }
    }, [homeKeyword])

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
            if (!vItem) return
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
                    if (value?.length && value[0]?.value !== singleSelDefVal) {
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

    // 监听屏幕宽度变化
    useEffect(() => {
        // 获取主题域
        getL2_L3Domains()

        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 1660)
        }

        // 初始检查
        checkScreenSize()

        // 添加监听器
        window.addEventListener('resize', checkScreenSize)

        // 清理监听器
        return () => window.removeEventListener('resize', checkScreenSize)
    }, [])

    // 分割过滤条件
    const { mainFilters, dropdownFilters } = useMemo(() => {
        // if (
        //     !isSmallScreen ||
        //     !filterConditionConfig ||
        //     !hasMoreFilter ||
        //     filterConditionConfig.length < 5
        // ) {
        //     return {
        //         mainFilters: filterConditionConfig,
        //         dropdownFilters: [],
        //     }
        // }

        if (!isSmallScreen || filterConditionConfig.length < 5) {
            return {
                mainFilters: filterConditionConfig,
                dropdownFilters: [],
            }
        }

        const mainLength = filterConditionConfig.length - 3
        return {
            mainFilters: filterConditionConfig.slice(0, mainLength),
            dropdownFilters: filterConditionConfig.slice(mainLength),
        }
    }, [filterConditionConfig, isSmallScreen])

    const searchChange = (d, dataKey): any => {
        const dk = dataKey
        if (!dk) {
            initAllValues(dropdownFilters)
        } else {
            const curFilterItem =
                dropdownFilters?.find((item) => item.key === dataKey) || {}
            const searchType = curFilterItem.type

            if (searchType === FilterConditionEleType.MULTIPLE) {
                queryCatlgList({
                    ...allValues,
                    [dataKey]: {
                        type: searchType,
                        value: curFilterItem?.options?.filter((oItem) =>
                            d[dk].split(',').includes(oItem.value?.toString()),
                        ),
                    },
                })
            } else if (searchType === FilterConditionEleType.DATE) {
                handleDatePickerChange(dataKey, d[dk])
            } else {
                queryCatlgList({
                    ...allValues,
                    [dk]: d[dk],
                })
            }
        }

        // const handleSearchItemChange = (itemKey: string, data: any) => {

        //     const curFilterItem =
        //         dropdownFilters?.find((item) => item.key === dataKey) || {}
        //     const searchType = curFilterItem.type
        //     const value = d[itemKey]
        //     let newAllValues = {...allValues}

        //     if (searchType === FilterConditionEleType.MULTIPLE) {
        //         newAllValues = {
        //             ...allValues,
        //             [dataKey]: {
        //                 type: searchType,
        //                 value: curFilterItem?.options?.filter((oItem) =>
        //                     d[itemKey].split(',').includes(oItem.value?.toString()),
        //                 ),
        //             },
        //         }
        //     } else if (searchType === FilterConditionEleType.DATE) {
        //         // return handleDatePickerChange(dataKey, d[itemKey])
        //         const vItem = allValues[itemKey]
        //         const originValue = vItem?.value || {}

        //         // 开始时间戳
        //         const timeStartStamp = moment(value[0]).valueOf()
        //         // 结束时间戳=（被选择日期加一的）时间戳 - 1
        //         const timeEndStamp = moment(value[1]).endOf('day').valueOf()

        //         const timeObj: any = {}
        //         if (timeStartStamp) {
        //             timeObj.start_time = timeStartStamp
        //             if (timeEndStamp) {
        //                 timeObj.end_time = timeEndStamp
        //             }
        //         } else if (timeEndStamp) {
        //             timeObj.end_time = timeEndStamp
        //         }
        //         newAllValues = {
        //             ...allValues,
        //             [dataKey]: {
        //                 type: searchType,
        //                 value: curFilterItem?.options?.filter((oItem) =>
        //                     d[dk].split(',').includes(oItem.value?.toString()),
        //                 ),
        //             },
        //         }
        //     } else {
        //         newAllValues = {
        //             ...allValues,
        //             [dk]: d[dk],
        //         }
        //     }

        //     return newAllValues
        // }
    }

    const renderSearchInput = () => {
        return isShowSearchInput ? (
            <Tooltip title={placeholder}>
                <SearchInput
                    style={{
                        marginLeft: '16px',
                        width: '285px',
                        flexShrink: 0,
                    }}
                    placeholder={placeholder}
                    value={searchKeyword}
                    onKeyChange={(kw: string) => {
                        setSearchKeyword(kw)
                        // loadEntityList(
                        //     filterListCondition,
                        //     kw,
                        // )
                        queryCatlgList({
                            ...allValues,
                            keyword: trim(kw),
                        })
                    }}
                    onChange={(e) => {
                        const { value } = e.target
                        if (!value) {
                            setSearchKeyword(value)
                            queryCatlgList({
                                ...allValues,
                                keyword: trim(value),
                            })
                        }
                    }}
                    onPressEnter={(e: any) => {
                        setSearchKeyword(e.target?.value)
                        // loadEntityList(filterListCondition, e.target?.value)
                        queryCatlgList({
                            ...allValues,
                            keyword: trim(e.target?.value),
                        })
                    }}
                    maxLength={255}
                />
            </Tooltip>
        ) : undefined
    }

    // 渲染下拉菜单中的过滤条件
    const renderDropdownFilters = () => {
        const defaultVal = {}
        dropdownFilters?.forEach((item) => {
            const { key, value } = item
            const searchType = item.type

            if (searchType === FilterConditionEleType.MULTIPLE) {
                defaultVal[key] =
                    allValues[item.key]?.value?.map(
                        (oItem) =>
                            // oItem?.value?.toString?.() || oItem?.toString?.(),
                            oItem.value || oItem,
                    ) || item.value
                return
            }
            if (searchType === FilterConditionEleType.DATE) {
                defaultVal[key] = [
                    allValues[item.key]?.value?.start_time,
                    allValues[item.key]?.value?.end_time,
                ]
                return
            }
            defaultVal[key] = allValues[item.key]?.value
        })
        return (
            <div className={styles.dropdownFilters}>
                <LightweightSearch
                    ref={lightweightSearchRef}
                    width="400px"
                    formData={dropdownFilters?.map((item) => ({
                        ...item,
                        type: filterTypeToLwSearchType[item.type],
                    }))}
                    onChange={(data, key) => searchChange(data, key)}
                    defaultValue={defaultVal}
                    filterTopNode={__('更多筛选:(${text})', {
                        text: dropdownFilters?.length || '0',
                    })}
                />
            </div>
        )
    }

    // 更新目录列表
    const queryCatlgList = (params: any) => {
        if (isEqual(params, allValues)) return
        setAllValues(params)
        const filterFormattedValue = {
            keyword: params.keyword,
        }
        Object.keys(params)?.forEach((vKey) => {
            const vItem = params[vKey]
            if (!vItem || vKey === 'keyword') return
            const itemValue = vItem?.value
            let value: any = ''
            if (vItem.type === FilterConditionEleType.MULTIPLE) {
                value = itemValue.map((mItem) => mItem.value)
                value =
                    value?.filter((fItem) => fItem !== multipleDefaultVal) || []
            } else if (vItem.type === FilterConditionEleType.DROPDOWN) {
                if (vKey === 'data_resource_type') {
                    value = [itemValue?.[0]?.value]
                } else {
                    value = itemValue?.[0]?.value
                }
            } else if (vItem.type === FilterConditionEleType.THEME) {
                value = itemValue
                    ?.map((item) => item.value)
                    ?.filter((item) => item !== multipleDefaultVal)
            } else if (vItem.type === FilterConditionEleType.DATE) {
                value = itemValue
            }

            filterFormattedValue[vKey] = value
        })
        updateList(filterFormattedValue)
    }

    const initAllValues = (dropdownConfig?: Array<any>) => {
        const fValues = {}
        const fOpens = {}
        const initConfig = dropdownConfig || filterConditionConfig
        initConfig?.forEach((item) => {
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
        queryCatlgList({
            ...allValues,
            ...fValues,
        })
        setItemsIsOpen(fOpens)
        selectThemeRef?.current?.handleReset()
        if (dropdownConfig) {
            const defaultVal = {}
            dropdownFilters?.forEach((item) => {
                const { key, value } = item
                defaultVal[key] = value
            })
            lightweightSearchRef?.current?.reset(defaultVal)
        }
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

    const handleDatePickerChange = (key: string, dateString) => {
        const vItem = allValues[key]
        const value = vItem?.value || {}

        // 开始时间戳
        const timeStartStamp = moment(dateString[0]).valueOf()
        // 结束时间戳=（被选择日期加一的）时间戳 - 1
        const timeEndStamp = moment(dateString[1]).endOf('day').valueOf()

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
                        onChange={(dates, dateString) =>
                            handleDatePickerChange(key, dateString)
                        }
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
                            // setSearchKeyword('')
                            queryCatlgList({
                                ...allValues,
                                // keyword: '',
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
                                _i.key === menuKey || `${_i.key}` === menuKey,
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
        // 选中值不在列表中
        if (value.length === newItem.length) {
            const checkedItem = item.options.find(
                (oItem) => `${oItem.value}` === `${menuKey}`,
            )
            if (checkedItem) {
                newItem.push(checkedItem)

                // if (type === FilterConditionEleType.THEME) {
                //     newItem.push(checkedItem?.value)
                // } else {
                //     newItem.push(checkedItem)
                // }
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
                type,
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
                    <Checkbox checked={curItemValue?.includes?.(oItem.value)}>
                        <div onClick={(e) => e.preventDefault()}>
                            {oItem.label}
                        </div>
                    </Checkbox>
                ),
            }
        })
    }

    const renderFilterItem = (item) => {
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
                            selectedKeys: allValues?.[item.key]?.value?.map(
                                (val) => val.key,
                            ),
                            onClick: (props) => handleMenuClick(props, item),
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
                    (item.key === 'is_online' &&
                        allValues?.is_publish?.value[0].value === 2) ||
                    (item.key === 'is_publish' &&
                        allValues?.is_online?.value[0].value === 2)
                ) {
                    options = options.map((oItem) => {
                        if (oItem.value === 2) {
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
                            selectedKeys: allValues?.[item.key]?.value?.map(
                                (val) => val.key,
                            ),
                            onClick: (props) => handleMenuClick(props, item),
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
                        getPopupContainer={(node) => node.parentElement || node}
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
                        unCategorizedObj={unCategorizedObj}
                        value={allValues[key]?.value || []}
                        onChange={(ids) =>
                            queryCatlgList({
                                ...allValues,
                                [key]: {
                                    type: item.type,
                                    value: ids?.map((_id) => {
                                        return {
                                            value: _id,
                                        }
                                    }),
                                },
                            })
                        }
                        placeholder="请选择主题域"
                    />
                )
            default:
                return <div />
        }
    }

    const getL2_L3Domains = async () => {
        const data = await getAllL2_3Domains()
        setBusinThemeList(data)
    }

    return (
        <div className={styles.expandFilterConditionWrapper}>
            <div className={styles.expandPanel} hidden={!expand}>
                {filterConditionConfig?.map((fItem) => {
                    const options =
                        fItem.key === FilterConditionType.THEME
                            ? businThemeList
                            : fItem.options || []
                    return (
                        <div key={fItem?.key} className={styles.filterItem}>
                            <div className={styles.filterLabel}>
                                {fItem.label}
                            </div>
                            <div className={styles.filterOptions}>
                                {fItem.type === FilterConditionEleType.DATE
                                    ? renderDateBox(fItem)?.[0]?.label
                                    : options?.map((oItem) => {
                                          const curValue =
                                              allValues?.[fItem.key]?.value ||
                                              []
                                          const isSelected =
                                              curValue?.includes(oItem.value) ||
                                              curValue?.find(
                                                  (option) =>
                                                      option?.value ===
                                                      oItem?.value,
                                              )
                                          return (
                                              //   <Tooltip
                                              //       title={
                                              //           fItem.key ===
                                              //               FilterConditionType.THEME &&
                                              //           oItem.label
                                              //       }
                                              //       placement="top"
                                              //       overlayStyle={{
                                              //           maxWidth: 350,
                                              //       }}
                                              //       overlayInnerStyle={{
                                              //           whiteSpace: 'normal',
                                              //       }}
                                              //       getPopupContainer={(n) => n}
                                              //   >
                                              <div
                                                  key={oItem.key}
                                                  className={classnames({
                                                      [styles.filterOptionItem]:
                                                          true,
                                                      [styles.active]:
                                                          isSelected,
                                                  })}
                                                  title={
                                                      fItem.key ===
                                                          FilterConditionType.THEME &&
                                                      oItem.label
                                                  }
                                                  onClick={() => {
                                                      handleMenuClick(
                                                          {
                                                              key:
                                                                  oItem.key ||
                                                                  oItem.value,
                                                          },
                                                          {
                                                              ...fItem,
                                                              options,
                                                          },
                                                      )
                                                  }}
                                              >
                                                  {oItem.label}
                                              </div>
                                              //   </Tooltip>
                                          )
                                      })}
                            </div>
                            {fItem.key === beforeSearchInputKey && (
                                <>
                                    {isShowSearchInput && (
                                        <div
                                            className={styles.filterSearchItem}
                                        >
                                            <div className={styles.filterLabel}>
                                                {__('关键词')}
                                            </div>
                                            {renderSearchInput()}
                                        </div>
                                    )}

                                    <div className={styles.resetBtn}>
                                        <Button
                                            onClick={() => {
                                                setSearchKeyword('')

                                                initAllValues()
                                            }}
                                        >
                                            {__('重置')}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className={styles.catlgListHeader} hidden={expand}>
                <div
                    className={classnames(
                        styles.filterConditionLayout,
                        layoutClassName,
                    )}
                >
                    <Space className={styles.filterItemWrapper} size={[16, 0]}>
                        {mainFilters?.map((item) => renderFilterItem(item))}
                        {isSmallScreen &&
                            dropdownFilters?.length > 0 &&
                            renderDropdownFilters()}
                    </Space>
                    {showClearBtn && (
                        <Button
                            onClick={() => {
                                initAllValues()
                                const defaultVal = {}
                                dropdownFilters?.forEach((item) => {
                                    const { key, value } = item
                                    defaultVal[key] = value
                                })
                                lightweightSearchRef?.current?.reset(defaultVal)
                            }}
                            type="link"
                            className={styles.clearBtn}
                        >
                            <CloseOutlined className={styles.clearIcon} />
                            <span>{__('清除条件')}</span>
                        </Button>
                    )}
                </div>
                {renderSearchInput()}
            </div>
            {isShowExpSwitch && (
                <div style={{ position: 'relative' }}>
                    <div
                        className={styles.expandSwitch}
                        onClick={() => {
                            setExpand(!expand)
                        }}
                    >
                        {expand ? <CaretUpOutlined /> : <CaretDownOutlined />}
                    </div>
                </div>
            )}
        </div>
    )
}

export default memo(ExpandFilterConditionLayout)
