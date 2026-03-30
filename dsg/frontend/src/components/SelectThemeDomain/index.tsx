import { FC, useState, ReactNode, useEffect } from 'react'
import { Cascader } from 'antd'
import { noop } from 'lodash'
import classNames from 'classnames'
import { formatError, getSubjectDomain } from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { GlossaryIcon, GlossaryIcons } from '../BusinessDomain/GlossaryIcons'
import { BusinessDomainType } from '../BusinessDomain/const'

interface Option {
    value?: string | number | null
    label: ReactNode
    children?: Option[]
    isLeaf?: boolean
    loading?: boolean
    disabled?: boolean
    unCategorizedObj?: any
}

interface SelectThemeDomainType {
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
    multiple?: boolean
    // 多选是否显示子级
    showChild?: any
    // 未分配
    unCategorizedObj?: any
    width?: string | number
}

const CommonParams = { limit: 2000, parent_id: '', is_all: false }

const SelectThemeDomain: FC<SelectThemeDomainType> = ({
    onChange = noop,
    value,
    disabled = false,
    placeholder = __('请选择所属主题'),
    defaultDisplay = '',
    allowClear = false,
    multiple = false,
    showChild,
    unCategorizedObj,
    width,
    ...props
}) => {
    const [options, setOptions] = useState<Option[]>([])

    useEffect(() => {
        getDomains()
    }, [])

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
                {__('请选择所属主题')}
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
                // isLeaf: !o?.child_count,
                isLeaf: o.id === unCategorizedObj?.id,
                name: o.name,
            }))

            const commonHeader: any[] = []
            commonHeader.push(getTitleNode(__('主题域分组')))

            // 设置第一层级数据
            setOptions(
                res.entries?.length > 0
                    ? [...commonHeader, ...businessDomainList]
                    : [],
            )
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
        // 当前点击节点
        const targetOption = selectedOptions?.[selectedOptions.length - 1]
        // 存在子节点则无需加载
        if (targetOption?.children) {
            return Promise.resolve()
        }

        // 业务域查询主题域
        if (
            selectedOptions?.length === 1 &&
            firstSelectedNode?.value !== 'unassigned'
        ) {
            const parent_id = firstSelectedNode?.value as string
            const res = await getSubjectDomain({
                ...CommonParams,
                parent_id,
            })
            const subjectDomainList = (res?.entries || []).map((o) => ({
                label: (
                    <div className={styles.selectedOption} title={o.name}>
                        <GlossaryIcon
                            width="20px"
                            type={BusinessDomainType.subject_domain}
                            fontSize="20px"
                        />
                        <div className={styles.seletedOptionsName}>
                            {o.name}
                        </div>
                    </div>
                ),
                value: o.id,
                isLeaf: true,
                name: o.name,
            }))
            const childOptions = [
                getTitleNode(
                    subjectDomainList?.length ? __('主题域') : __('暂无数据'),
                ),
                ...subjectDomainList,
            ]
            targetOption.children = childOptions
            setOptions([...options])
            return Promise.resolve()
        }
        return Promise.resolve()
    }

    return (
        <Cascader
            className={classNames(
                styles.relateBusinessCascaderWrapper,
                unCategorizedObj?.id && styles.hasUnCategorized,
            )}
            placeholder={placeholder}
            options={options}
            loadData={loadData}
            onChange={onChange}
            // changeOnSelect
            getPopupContainer={(node) => node.parentNode}
            disabled={disabled}
            displayRender={displayRender}
            value={value}
            allowClear={allowClear}
            multiple={multiple}
            showCheckedStrategy={showChild ? Cascader.SHOW_CHILD : undefined}
            notFoundContent={
                <div className={styles.noData}>{__('暂无数据')}</div>
            }
            style={{ width }}
            {...props}
        />
    )
}

export default SelectThemeDomain
