import {
    ReactNode,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react'
import { Checkbox, Col, Row, Tooltip } from 'antd'
import styles from './styles.module.less'
import { SearchInput, Empty, Loader } from '@/ui'
import __ from '../locale'
import { filterSymbol, getTypeText } from '@/utils'
import { IDatasheetField } from '@/core'
import AttrIcon from '../AttrIcon'
import { LabelOutlined } from '@/icons'
import dataEmpty from '@/assets/dataEmpty.svg'

export type IColFieldItem = IDatasheetField

/** 默认标题渲染方法 */
export const FieldRender = (field: IColFieldItem) => {
    const {
        business_name,
        data_type,
        primary_key,
        label_icon,
        label_id,
        label_name,
        label_path,
    } = field
    const type = filterSymbol(data_type)
    return (
        <div className={styles['field-wrapper']}>
            <Tooltip
                title={
                    <span
                        style={{ color: 'rgba(0,0,0,0.85)', fontSize: '12px' }}
                    >
                        {getTypeText(type, false)}
                    </span>
                }
                placement="top"
                color="#fff"
                getPopupContainer={(node) =>
                    document.getElementById('row-col') ||
                    node.parentElement ||
                    node
                }
                overlayClassName={styles['field-wrapper-tooltip']}
            >
                <div style={{ display: 'inline-flex' }}>
                    <AttrIcon type={type} />
                </div>
            </Tooltip>
            <div className={styles['field-wrapper-title']}>
                <div
                    title={business_name}
                    className={styles['field-wrapper-title-text']}
                >
                    {business_name}
                </div>
                {primary_key && (
                    <div className={styles['field-wrapper-title-tag']}>
                        {__('主键')}
                    </div>
                )}
                <div
                    className={styles['field-wrapper-title-label']}
                    hidden={
                        !(label_icon || label_id || label_name || label_path)
                    }
                >
                    <Tooltip
                        title={
                            <div
                                className={
                                    styles['field-wrapper-title-label-tip']
                                }
                            >
                                <span>数据分级:</span> {label_path || '--'}
                            </div>
                        }
                        getPopupContainer={(node) =>
                            document.getElementById('row-col') ||
                            node.parentElement ||
                            node
                        }
                        showArrow={false}
                        overlayClassName={styles.label}
                    >
                        {/* <FontIcon
                            name="icon-biaoqianicon"
                            style={{ color: label_icon }}
                        /> */}
                        <LabelOutlined
                            className={styles.tagIcon}
                            style={{
                                color: label_icon,
                                fontSize: '16px',
                            }}
                        />
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}

/**
 * 列筛选定义
 */
export interface IColFilter {
    /** 每行显示个数 默认: 6个 */
    countPerLine?: number
    /** 待筛选数据 */
    value: IColFieldItem[]
    /** 筛选数据 唯一key、标题、主键  默认： { id: 'id'  name: 'title', primaryKey: 'primary_key' } */
    field?: {
        id?: string
        name?: string
        primaryKey?: string
    }
    loading?: boolean
    /** 初始选中项 */
    initCheck?: string[]
    /** 是否默认勾选主键 并无法取消勾选   默认: true */
    defaultCheckPrimaryKey?: boolean
    /** 筛选项标题渲染 默认: 优先renderItem  其次field.name  再其次field.id */
    renderItem?: (item: IColFieldItem) => ReactNode

    onChange?: () => void
}

const PrimaryKeySort = (primaryKey: string) => (a, b) =>
    b[primaryKey] - a[primaryKey]

/**
 * 列筛选
 * @param props IColFilter
 * @returns
 */
const ColFilter = forwardRef((props: IColFilter, ref) => {
    const {
        value,
        initCheck = [],
        countPerLine = 6,
        defaultCheckPrimaryKey = true,
        field,
        renderItem = FieldRender,
        onChange,
        loading,
    } = props

    const fieldAttr = {
        id: 'id',
        name: 'title',
        primaryKey: 'primary_key',
        type: 'data_type',
        ...(field || {}),
    }
    // 原字段数据
    const [fields, setFields] = useState<IColFieldItem[]>([])
    // 显示字段数据
    const [showFields, setShowFields] = useState<IColFieldItem[]>([])
    const [showChecked, setShowChecked] = useState<string[]>([])
    // 启用主键勾选下的 主键key
    const [primaryKeys, setPrimaryKeys] = useState<string[]>([])
    const [indeterminate, setIndeterminate] = useState(false)
    const [checkedFields, setCheckedFields] = useState<string[]>([])
    const [searchKey, setSearchKey] = useState<string>()
    const [checkedAll, setCheckedAll] = useState(false)
    const [canCheckAll, setCanCheckAll] = useState(true)
    // 不支持类型的字段ID (假定不支持的类型最初就不支持，即无勾选情况)
    const [unOperateId, setUnOperateId] = useState<string[]>([])

    useEffect(() => {
        const data = value?.sort(PrimaryKeySort(fieldAttr.primaryKey!))

        // 默认主键靠前排序
        setFields(data)
        setShowFields(data)

        // 未知类型字段ID统计
        const noOptIds = data?.reduce((prev: string[], cur) => {
            const hasType = getTypeText(filterSymbol(cur?.[fieldAttr.type]))
            return hasType ? prev : [...prev, cur?.[fieldAttr.id]]
        }, [])

        setUnOperateId(noOptIds)
    }, [value])

    useEffect(() => {
        if (onChange) {
            onChange()
        }
    }, [checkedFields])

    useEffect(() => {
        let checks: string[] = []
        if (!defaultCheckPrimaryKey) {
            checks = initCheck || []
            setCheckedFields(checks)
        } else {
            const keys = (value || [])
                .filter((o) => o?.[fieldAttr.primaryKey])
                .map((o) => o?.[fieldAttr.id])
            checks = Array.from(new Set([...(initCheck || []), ...keys]))
            setCheckedFields(checks)
            setPrimaryKeys(keys)
        }

        if (checks?.length) {
            if (
                checks?.length !==
                (value?.length || 0) - (unOperateId?.length || 0)
            ) {
                setIndeterminate(true)
            } else {
                setCheckedAll(true)
            }
        } else {
            setIndeterminate(false)
        }
    }, [initCheck, defaultCheckPrimaryKey, unOperateId])

    // 设置展示字段
    useEffect(() => {
        setShowFields(
            searchKey
                ? fields.filter((it) => {
                      return it?.[fieldAttr.name!]
                          .toLocaleLowerCase()
                          .includes(searchKey.toLocaleLowerCase())
                  }) || []
                : fields,
        )
    }, [searchKey, fields])

    // 选中变动
    useEffect(() => {
        if (!showFields?.length) {
            setCanCheckAll(false)
            return
        }
        setCanCheckAll(true)
        // 当前展示的可选字段
        const curFields = searchKey ? showFields : fields
        const curShowChecks = curFields
            ?.map((o) => o[fieldAttr.id])
            .filter(
                (k) => checkedFields?.includes(k) && !unOperateId.includes(k),
            )

        const curShowForbiddenLen = unOperateId.filter((k) =>
            curFields.some((o) => o[fieldAttr.id] === k),
        )

        // 设置展示列表选中
        setShowChecked(curShowChecks)
        setIndeterminate(
            !!curShowChecks.length &&
                curShowChecks.length + curShowForbiddenLen.length <
                    curFields.length,
        )

        setCheckedAll(
            curShowChecks.length + curShowForbiddenLen.length ===
                curFields.length,
        )
    }, [checkedFields, searchKey, showFields, fields, unOperateId])

    const onFinish = () => {
        const items = fields?.filter((o) => checkedFields?.includes(o.id))
        return items
    }

    const clearSearch = () => {
        setSearchKey('')
    }

    useImperativeHandle(ref, () => ({
        onFinish,
        clearSearch,
    }))

    const handleCheck = (e: any, item: IColFieldItem) => {
        // const curFields = searchKey ? showFields : fields
        const { checked } = e.target
        const keys = checked
            ? [...checkedFields, item[fieldAttr.id!]]
            : checkedFields.filter((it) => it !== item[fieldAttr.id!])

        setCheckedFields(keys)
    }

    const handleCheckAll = (e: any) => {
        const curFields = searchKey ? showFields : fields
        const isCheck = e.target.checked

        let checks: any[] = []

        if (isCheck) {
            checks = curFields
                .map((item) => item[fieldAttr.id!])
                .filter((k) => !unOperateId.includes(k))
        } else {
            checks = defaultCheckPrimaryKey ? primaryKeys : []
        }

        const curIds = curFields?.map((it) => it[fieldAttr.id!])

        const filterIds = checkedFields.filter((o) => !curIds?.includes(o))

        const checkFilter = isCheck
            ? Array.from(new Set([...checkedFields, ...checks]))
            : Array.from(new Set([...filterIds, ...primaryKeys]))

        setCheckedFields(searchKey ? checkFilter : checks)
    }

    const ItemSpan = useMemo(() => {
        return Math.floor(24 / countPerLine)
    }, [countPerLine])

    return (
        <div className={styles['col-filter']}>
            <div className={styles['col-filter-top']}>
                <Checkbox
                    indeterminate={indeterminate}
                    onChange={handleCheckAll}
                    checked={checkedAll}
                    disabled={!canCheckAll}
                >
                    {__('全选')}
                </Checkbox>
                <SearchInput
                    maxLength={255}
                    value={searchKey}
                    onKeyChange={(kw: string) => {
                        setSearchKey(kw)
                    }}
                    style={{ width: 272 }}
                    placeholder={__('搜索字段名称')}
                />
            </div>
            {loading ? (
                <div style={{ height: '100px' }}>
                    <Loader />
                </div>
            ) : (
                <div>
                    <Checkbox.Group
                        value={showChecked}
                        className={styles['col-filter-list']}
                    >
                        <Row>
                            {(showFields || []).length ? (
                                (showFields || []).map(
                                    (item: IColFieldItem) => {
                                        return (
                                            <Col
                                                key={item[fieldAttr.id!]}
                                                span={ItemSpan}
                                            >
                                                <Checkbox
                                                    onChange={(e) =>
                                                        handleCheck(e, item)
                                                    }
                                                    value={item[fieldAttr.id!]}
                                                    disabled={
                                                        (defaultCheckPrimaryKey &&
                                                            item[
                                                                fieldAttr.primaryKey!
                                                            ]) ||
                                                        unOperateId?.includes(
                                                            item?.id,
                                                        ) // 无法识别的类型禁止交互
                                                    }
                                                >
                                                    {renderItem?.(item) ||
                                                        item?.[
                                                            fieldAttr.name!
                                                        ] ||
                                                        item?.[fieldAttr.id!]}
                                                </Checkbox>
                                            </Col>
                                        )
                                    },
                                )
                            ) : (
                                <div className={styles['filter-empty']}>
                                    {searchKey ? (
                                        <Empty />
                                    ) : (
                                        <Empty
                                            desc={__('暂无数据')}
                                            iconSrc={dataEmpty}
                                        />
                                    )}
                                </div>
                            )}
                        </Row>
                    </Checkbox.Group>
                </div>
            )}
        </div>
    )
})

export default ColFilter
