import { FC, useState, ReactNode, useEffect } from 'react'
import { Cascader } from 'antd'
import { noop } from 'lodash'
import { formatError, getSubjectDomain } from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { GlossaryIcons } from '../BusinessDomain/GlossaryIcons'
import { BusinessDomainType } from '../BusinessDomain/const'

interface Option {
    value?: string | number | null
    label: ReactNode
    children?: Option[]
    isLeaf?: boolean
    loading?: boolean
    disabled?: boolean
}

interface SelectThemeDomainType {
    onChange?: (value: any) => void
    value?: any
    disabled?: boolean
    placeholder?: string
    defaultDisplay?: string
}

const CommonParams = { limit: 2000, parent_id: '', is_all: false }

const SelectThemeDomain: FC<SelectThemeDomainType> = ({
    onChange = noop,
    value,
    disabled = false,
    placeholder = __('请选择关联主题域'),
    defaultDisplay = '',
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
                        {GlossaryIcons({
                            type: BusinessDomainType.subject_domain,
                            showDot: false,
                            fontSize: '20px',
                        })}
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
        return (
            <span style={{ color: 'rgba(0, 0, 0, 0.35)' }}>
                {__('请选择关联主题域')}
            </span>
        )
    }

    const getDomains = async () => {
        try {
            const res = await getSubjectDomain(CommonParams)

            const businessDomainList = res?.entries?.map((o) => ({
                label: (
                    <div className={styles.selectedOption} title={o.name}>
                        <div style={{ paddingTop: '6px' }}>
                            {GlossaryIcons({
                                type: BusinessDomainType.subject_domain_group,
                                showDot: false,
                                fontSize: '20px',
                            })}
                        </div>

                        <div className={styles.seletedOptionsName}>
                            {o.name}
                        </div>
                    </div>
                ),
                value: o.id,
                // isLeaf: !o?.child_count,
                isLeaf: false,
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
                        <div
                            style={{
                                paddingTop: '6px',
                            }}
                        >
                            {GlossaryIcons({
                                type: BusinessDomainType.subject_domain,
                                showDot: false,
                                fontSize: '20px',
                            })}
                        </div>
                        <div className={styles.seletedOptionsName}>
                            {o.name}
                        </div>
                    </div>
                ),
                value: o.id,
                isLeaf: true,
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
            className={styles.relateBusinessCascaderWrapper}
            placeholder={placeholder}
            options={options}
            loadData={loadData}
            onChange={onChange}
            // changeOnSelect
            getPopupContainer={(node) => node.parentNode}
            disabled={disabled}
            displayRender={displayRender}
            value={value}
            allowClear={false}
            notFoundContent={
                <div className={styles.noData}>{__('暂无数据')}</div>
            }
            {...props}
        />
    )
}

export default SelectThemeDomain
