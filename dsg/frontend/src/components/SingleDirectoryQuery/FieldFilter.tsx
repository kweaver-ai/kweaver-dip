import { Checkbox, Switch } from 'antd'
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react'
import {
    arrayMove,
    SortableContainer,
    SortableElement,
} from 'react-sortable-hoc'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { useGetState } from 'ahooks'
import { Empty, SearchInput } from '@/ui'
import { changeFormatToType } from '@/components/IndicatorManage/const'
import dataEmpty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'
import FieldItem from '../DatasheetView/DataPreview/ScrollFilter/ToolSideBar/FieldItem'
import __ from './locale'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { HasAccess } from '@/core'

export type IFieldMeta = any
export const DragDropType = 'FieldBindDataView'

const SortableItem = SortableElement<any>(({ children }: any) => {
    return <div>{children}</div>
})

const SortableBox = SortableContainer<any>(({ children }: any) => {
    return <div className={styles['expand-box-fields-list']}>{children}</div>
})

interface Props {
    fields: any[]
    config: any
    initData?: any[]
    onConfigChange: (params: any) => void
}

const FieldFilter = (props: Props, ref) => {
    const { fields, config, initData, onConfigChange } = props
    const resetRef = useRef<any>()
    const [searchKey, setSearchKey] = useState<string>('')
    const [indeterminate, setIndeterminate] = useState(false)
    const [checkedItems, setCheckedItems] = useState<IFieldMeta[]>([])
    const [checkAll, setCheckAll] = useState(false)
    const [showFields, setShowFields] = useState<any[]>([])
    const [fieldList, setFieldList] = useState<Array<any>>([])
    const [switchState, setSwitchState] = useState<boolean>(false)
    const [selectedFilterData, setSelectedFilterData] = useState<any>()
    // 过滤数据
    const [filterData, setFilterData, getFilterData] = useGetState<Array<any>>(
        [],
    )
    const { checkPermissions } = useUserPermCtx()
    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])
    // 全选
    const handleCheckAll = (e: CheckboxChangeEvent) => {
        const isChecked = e.target.checked
        setCheckedItems(isChecked ? fieldList : [])
        setIndeterminate(false)
        setCheckAll(isChecked)
    }

    useEffect(() => {
        let showList = fieldList || []
        if (switchState) {
            showList = (fieldList || []).filter((o) =>
                checkedItems?.some((c) => c?.id === o?.id),
            )
        }

        if (searchKey) {
            const result = showList?.filter((o) =>
                o?.business_name
                    ?.toLowerCase()
                    ?.includes(searchKey?.toLowerCase()),
            )
            setShowFields(result)
        } else {
            setShowFields(showList)
        }
    }, [fieldList, switchState, searchKey, checkedItems])

    // 只看已选
    const handleSwitch = (isOpen: boolean) => {
        setSwitchState(isOpen)
    }

    const isCheckedId = useCallback(
        (id: string) => checkedItems?.some((o) => o.id === id),
        [checkedItems],
    )

    const handleItemCheck = (isChecked: boolean, item: IFieldMeta) => {
        if (isChecked) {
            if (!isCheckedId(item?.id)) {
                setCheckedItems([...(checkedItems || []), item])
            }
        } else {
            const items = checkedItems?.filter((o) => o.id !== item?.id)
            setCheckedItems(items)
        }
    }

    const onSortEnd = ({ oldIndex, newIndex }) => {
        // 开启只看已选,则转换index为全部排序index
        if (switchState) {
            const showIds = (checkedItems || []).map((o) => o?.id)
            const checkedIdxInList = fieldList?.reduce((prev, cur, idx) => {
                if (showIds.includes(cur?.id)) {
                    return [...prev, idx]
                }
                return prev
            }, [])
            const newCheckedIdSort = arrayMove(
                checkedIdxInList,
                oldIndex,
                newIndex,
            )
            const checkedList = (newCheckedIdSort || []).map(
                (i: any) => fieldList?.[i],
            )

            let flag = -1
            const newOrderList = fieldList?.map((o, idx) => {
                if (newCheckedIdSort?.includes(idx)) {
                    flag += 1
                    return checkedList[flag]
                }
                return o
            })
            setFieldList(newOrderList)
        } else {
            setFieldList((prev) => arrayMove(prev, oldIndex, newIndex))
        }
    }

    const handleConfCondition = (it: any) => {
        setSelectedFilterData(it)
    }

    const handleRemoveCondition = (it: any) => {
        setFilterData(
            filterData.filter((currentData) => currentData?.id !== it?.id),
        )
    }

    const initConfig = (conf: any, tableFields) => {
        const { filters: cFilters, fields: cFields } = conf || {}

        const defaultCheck = cFields?.filter((o) => o.isChecked) // 仅选中项

        const confFields = (defaultCheck?.length > 0 ? defaultCheck : cFields) // 未选中 默认选中全部
            ?.map((o) => {
                const it = tableFields?.find((obj) => obj?.id === o?.id)
                return {
                    ...it,
                    // data_type: o?.data_type,
                    id: o?.id,
                    // business_name: o?.name,
                    // technical_name: o?.name_en,
                }
            })

        // const confFilters = cFilters?.map((o) => {
        //     const it = tableFields?.find((obj) => obj?.id === o?.id)
        //     return {
        //         ...it,
        //         // data_type: o?.data_type,
        //         id: o?.id,
        //         business_name: o?.name,
        //         technical_name: o?.name_en,
        //         operator: o?.operator,
        //         value: o?.value,
        //         conf_data_type: o?.data_type,
        //     }
        // })
        // setFilterData(confFilters)
        setCheckedItems(confFields)
    }

    useEffect(() => {
        let list = (fields || []).filter((o) => o !== undefined)
        if (config?.fields?.length) {
            const commonList: any = []
            const elseList: any = []
            ;(list || []).forEach((o) => {
                if (config?.fields?.some((k) => k?.id === o?.id)) {
                    commonList.push(o)
                } else {
                    elseList.push(o)
                }
            })
            // 针对相同数据做排序
            const orderList = (config?.fields || [])?.map((o) =>
                commonList?.find((k) => k?.id === o?.id),
            )

            list = [...orderList, ...elseList]
            initConfig(config, list)
        } else {
            setCheckedItems(list)
        }
        setFieldList(list)
    }, [fields, config])

    useEffect(() => {
        if (initData && initData.length) {
            setCheckedItems(
                fieldList.filter((o) => o && o.id && initData.includes(o.id)),
            )
        }
    }, [initData, fieldList])

    useEffect(() => {
        const checkedLen = checkedItems?.length || 0
        const dataLen = showFields?.length || 0
        const isIndeterminate = dataLen !== checkedLen && checkedLen !== 0

        setIndeterminate(isIndeterminate)
        setCheckAll(dataLen === checkedLen && dataLen !== 0)
    }, [checkedItems, showFields])

    const getFieldList = () => {
        return fieldList?.map((o) => ({
            data_type: changeFormatToType(o?.data_type),
            id: o?.id,
            name: o?.business_name,
            name_en: o?.technical_name,
            isChecked: checkedItems?.some((k) => k.id === o?.id),
        }))
    }

    useEffect(() => {
        const fieldValues = getFieldList()
        onConfigChange(fieldValues)
    }, [fieldList, checkedItems])

    const onReset = () => {
        const list = (fields || []).filter((o) => o !== undefined)
        setCheckedItems(list)
    }

    useImperativeHandle(ref, () => ({
        getFieldList,
        onReset,
    }))

    const getSortList = (items) => {
        return (items || []).map((item: IFieldMeta, idx: any) => {
            const condition = filterData?.find((o) => o.id === item?.id)
            const isFilterInvalid =
                condition?.conf_data_type &&
                condition?.conf_data_type !==
                    changeFormatToType(condition?.data_type)

            return (
                <SortableItem key={item?.id} index={idx}>
                    <FieldItem
                        item={item}
                        checked={isCheckedId(item?.id)}
                        handleCheck={handleItemCheck}
                        condition={null}
                        isFilterInvalid={isFilterInvalid}
                        handleConfCondition={handleConfCondition}
                        handleRemoveCondition={handleRemoveCondition}
                        canViewChange={hasDataOperRole}
                    />
                </SortableItem>
            )
        })
    }

    return (
        <div className={styles['expand-box-fields']}>
            <div className={styles['expand-box-fields-search']}>
                <SearchInput
                    placeholder={__('搜索字段名称')}
                    value={searchKey}
                    onKeyChange={(key: string) => {
                        setSearchKey(key)
                    }}
                    allowClear
                />
            </div>
            <div className={styles['expand-box-fields-check']}>
                <Checkbox
                    indeterminate={indeterminate}
                    onChange={handleCheckAll}
                    checked={checkAll}
                    disabled={!showFields?.length}
                >
                    {__('全选')}
                </Checkbox>

                <div className={styles.switch}>
                    {__('只看已选')}
                    <Switch
                        size="small"
                        checked={switchState}
                        onChange={handleSwitch}
                    />
                </div>
            </div>
            {showFields?.length > 0 ? (
                <SortableBox onSortEnd={onSortEnd} useDragHandle>
                    {getSortList(showFields)}
                </SortableBox>
            ) : (
                <div className={styles.empty} style={{ flex: '1' }}>
                    <Empty
                        desc={
                            searchKey
                                ? __('抱歉，没有找到相关内容')
                                : __('暂无数据')
                        }
                        iconSrc={searchKey ? undefined : dataEmpty}
                    />
                </div>
            )}
        </div>
    )
}

export default forwardRef(FieldFilter)
