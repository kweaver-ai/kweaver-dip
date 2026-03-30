import React, {
    useState,
    ReactNode,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { Button, Cascader, Space } from 'antd'
import { noop, uniqBy } from 'lodash'
import { DownOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import { formatError, getSubjectDomain } from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { GlossaryIcon, GlossaryIcons } from '../../BusinessDomain/GlossaryIcons'
import { BusinessDomainType } from '../../BusinessDomain/const'

interface Option {
    value?: string | number | null
    label: ReactNode
    children?: Option[]
    isLeaf?: boolean
    loading?: boolean
    disabled?: boolean
    unCategorizedObj?: any
}

interface SelectThemeType {
    // 数据变更
    onChange?: (value: any, valueObj?: any) => void

    // 当前选中的业务域。 该组件只支持选中到L2
    value?: any

    // 禁用状态
    disabled?: boolean

    // placehodler
    placeholder?: string

    // 默认显示的数据
    defaultDisplay?: string
    allowClear?: boolean
    // 未分配
    unCategorizedObj?: any
}

const CommonParams = { limit: 2000, parent_id: '', is_all: false }

const SelectTheme = forwardRef((props: SelectThemeType, ref) => {
    const {
        onChange = noop,
        value,
        disabled = false,
        placeholder = __('请选择关联主题域'),
        defaultDisplay = '',
        allowClear = false,
        unCategorizedObj,
    } = props
    const [options, setOptions] = useState<Option[]>([])
    const [selectList, setSelectList] = useState<any[]>([])
    const [label, setLabel] = useState<string>('')

    useEffect(() => {
        getDomains()
    }, [])

    useEffect(() => {
        if (!value?.length) {
            handleClear()
        }
    }, [value])

    useImperativeHandle(ref, () => ({
        handleClear,
    }))

    // casder面板只展示最后一级目录
    const displayRender = (labels: string[]) => {
        if (labels && labels[0] && labels[1]) {
            if (typeof labels[1] === 'string') {
                return (
                    <div
                        className={styles.selectedOption}
                        title={defaultDisplay}
                    >
                        <GlossaryIcon
                            width="20px"
                            type={BusinessDomainType.subject_domain}
                            fontSize="20px"
                        />
                        <div className={styles.seletedOptionsName}>
                            {defaultDisplay}
                        </div>
                    </div>
                )
            }
            return (
                <div className={styles.ellipsis}>
                    {labels[labels.length - 1]}
                </div>
            )
        }
        if (labels && labels[0] && labels[0] === unCategorizedObj?.name) {
            return <div className={styles.ellipsis}>{labels[0]}</div>
        }
        return (
            <span style={{ color: 'rgba(0, 0, 0, 0.35)' }}>
                {__('请选择关联主题域')}
            </span>
        )
    }

    const getDomains = async () => {
        try {
            const res = await getSubjectDomain(CommonParams)
            const data = unCategorizedObj?.id
                ? [...res.entries, unCategorizedObj]
                : res.entries || []
            const businessDomainList = data.map((o) => ({
                label:
                    o.id !== unCategorizedObj?.id ? (
                        <div className={styles.selectedOption} title={o.name}>
                            <GlossaryIcon
                                width="20px"
                                type={BusinessDomainType.subject_domain_group}
                                fontSize="20px"
                            />
                            <div className={styles.seletedOptionsName}>
                                {o.name}
                            </div>
                        </div>
                    ) : (
                        o.name
                    ),
                value: o.id,
                isLeaf: !o?.child_count,
                // isLeaf: o.id === unCategorizedObj?.id,
                name: o.name,
            }))

            const commonHeader: any[] = []
            commonHeader.push(getTitleNode(__('主题域分组')))

            // 设置第一层级数据
            setOptions(businessDomainList)
        } catch (error) {
            formatError(error)
        }
    }

    const getTitleNode = (name: string) => {
        return {
            label: (
                <div
                    style={{
                        color: 'rgba(0, 0, 0, 0.45)',
                        fontSize: 12,
                    }}
                >
                    {name}
                </div>
            ),
            value: name,
            disabled: true,
        }
    }

    const loadData = async (selectedOptions: Option[]) => {
        // 第一个节点
        const firstSelectedNode = selectedOptions?.[0]
        const secondSelectedNode = selectedOptions?.[1]
        // 当前点击节点
        const targetOption = selectedOptions?.[selectedOptions.length - 1]
        // 存在子节点则无需加载
        if (targetOption?.children) {
            return Promise.resolve()
        }

        // 业务域查询主题域，只查询到L2
        if (
            firstSelectedNode?.value !== 'unassigned' &&
            !targetOption.isLeaf &&
            selectedOptions.length < 2
        ) {
            const parent_id = targetOption?.value as string
            const res = await getSubjectDomain({
                ...CommonParams,
                parent_id,
            })
            const subjectDomainList = (res?.entries || []).map((o) => ({
                label: (
                    <div className={styles.selectedOption} title={o.name}>
                        <GlossaryIcon
                            width="20px"
                            type={
                                secondSelectedNode?.value
                                    ? BusinessDomainType.business_object
                                    : BusinessDomainType.subject_domain
                            }
                            fontSize="20px"
                        />
                        <div className={styles.seletedOptionsName}>
                            {o.name}
                        </div>
                    </div>
                ),
                value: o.id,
                // isLeaf: selectedOptions.length < 2 ? !o?.child_count : true,
                isLeaf: true,
                name: o.name,
            }))
            const childOptions = [
                // getTitleNode(
                //     subjectDomainList?.length ? __('主题域') : __('暂无数据'),
                // ),
                ...subjectDomainList,
            ]
            targetOption.children = childOptions
            setOptions([...options])
            return Promise.resolve()
        }
        return Promise.resolve()
    }

    const selectChange = (values, selectedOptions) => {
        setSelectList(values)
        // 获取所选最后一项
        const list = selectedOptions.map((item) => {
            return item[item.length - 1]
        })
        setLabel(list?.map((item: any) => item?.name).join('、'))
        onChange?.(list.map((item: any) => item?.value))
    }

    const handleReset = () => {
        setLabel('')
        onChange?.([])
        setSelectList([])
    }
    const handleClear = () => {
        setLabel('')
        setSelectList([])
    }

    const dropdownRender = (menus) => {
        return (
            <div className={styles.customDropdown}>
                <div className={styles.filterButtons}>
                    <span>{__('筛选')}</span>
                    <Button
                        size="small"
                        disabled={!selectList.length}
                        onClick={handleReset}
                        type="link"
                    >
                        {__('重置筛选')}
                    </Button>
                </div>
                {menus}
            </div>
        )
    }

    return (
        <div className={styles.cascaderWrapper}>
            <Cascader
                popupClassName={classNames(
                    styles.relateBusinessCascaderWrapper,
                    unCategorizedObj?.id && styles.hasUnCategorized,
                )}
                showCheckedStrategy={Cascader.SHOW_CHILD}
                placeholder={placeholder}
                options={options}
                loadData={loadData}
                value={selectList}
                onChange={selectChange}
                getPopupContainer={(node) => node.parentNode}
                displayRender={displayRender}
                multiple
                allowClear={allowClear}
                // showCheckedStrategy={Cascader.SHOW_CHILD}
                notFoundContent={
                    <div className={styles.noData}>{__('暂无数据')}</div>
                }
                dropdownRender={dropdownRender}
            >
                <div title={label} className={styles.textBtn}>
                    <span>{label || __('所属业务对象不限')}</span>
                    <DownOutlined className={styles.icon} />
                </div>
            </Cascader>
        </div>
    )
})

export default SelectTheme
