import { Select, SelectProps } from 'antd'
import { FC, useEffect, useState } from 'react'
import { uniqBy, values } from 'lodash'
import classnames from 'classnames'
import { useDebounce } from 'ahooks'
import __ from '../locale'
import {
    BizModelType,
    formatError,
    getBusinessDomainProcessTree,
    getBusinessDomainTreeNodeDetails,
} from '@/core'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { BusinessProcessProvider } from './BusinessProcessProvider'
import TreeSelectContainer from './TreeSelectContainer'
import { useBusinessModelContext } from '../BusinessModelProvider'

const { Option } = Select
interface BusinessProcessSelectProps extends SelectProps {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
}
const BusinessProcessSelect: FC<BusinessProcessSelectProps> = ({
    value,
    onChange,
    placeholder,
    ...props
}) => {
    // 下拉框是否打开
    const [open, setOpen] = useState(false)
    // 搜索关键字
    const [searchValue, setSearchValue] = useState('')
    // 搜索关键字防抖
    const debouncedSearchValue = useDebounce(searchValue, { wait: 500 })
    // 搜索结果
    const [data, setData] = useState<Array<any>>([])

    const [initValueLoading, setInitValueLoading] = useState(true)

    const { businessModelType } = useBusinessModelContext()

    // 树结构展开的选项
    const [treesExpandedOptions, setTreesExpandedOptions] = useState<
        Array<any>
    >([])

    useEffect(() => {
        getBusinessDomainProcessData(debouncedSearchValue)
    }, [debouncedSearchValue])

    useEffect(() => {
        if (value) {
            loadValueByOptions()
        } else {
            setInitValueLoading(false)
        }
    }, [value])

    /**
     * 更新树结构展开的选项
     * @param newOptions
     */
    const updateTreesExpandedOptions = (newOptions: Array<any>) => {
        const newSelectOptions = combineOptions(newOptions)
        setTreesExpandedOptions(
            uniqBy([...treesExpandedOptions, ...newSelectOptions], 'value'),
        )
    }
    /**
     * 根据选项加载业务流程
     */
    const loadValueByOptions = async () => {
        try {
            if (!treesExpandedOptions.find((o) => o.value === value)) {
                setInitValueLoading(true)
                const res = await getBusinessDomainTreeNodeDetails(value || '')
                updateTreesExpandedOptions([res])
            }
        } catch (error) {
            formatError(error)
        } finally {
            setInitValueLoading(false)
        }
    }

    /**
     * 获取业务流程树
     * @param keyword 搜索关键字
     */
    const getBusinessDomainProcessData = async (keyword: string) => {
        const res = await getBusinessDomainProcessTree({
            keyword,
            offset: 999,
        })
        setData(res.entries)
    }

    /**
     * 搜索结果选中
     * @param id 业务流程id
     */
    const handleSelect = (id: string) => {
        onChange?.(id)
        setOpen(false)
    }
    /**
     * 下拉框渲染模板
     * @returns
     */
    const dropdownRenderTemplate = (originNode: any) => {
        if (debouncedSearchValue) {
            if (data.length > 0) {
                return (
                    <div className={styles.searchProcessWrapper}>
                        <div className={styles.searchTitle}>
                            {__('搜索结果')}
                        </div>
                        <div className={styles.resultWrapper}>
                            {data.map((item, index) => (
                                <div
                                    className={classnames({
                                        [styles.searchResultWrapper]: true,
                                        [styles.selectedSearchProcessWrapper]:
                                            value === item.id,
                                        [styles.selectedSearchDisabled]:
                                            (businessModelType ===
                                                BizModelType.BUSINESS &&
                                                item.model_id) ||
                                            (businessModelType ===
                                                BizModelType.DATA &&
                                                item.data_model_id),
                                    })}
                                    onClick={() => {
                                        if (
                                            (businessModelType ===
                                                BizModelType.BUSINESS &&
                                                item.model_id) ||
                                            (businessModelType ===
                                                BizModelType.DATA &&
                                                item.data_model_id)
                                        ) {
                                            return
                                        }
                                        handleSelect(item.id)
                                        updateTreesExpandedOptions(data)
                                    }}
                                >
                                    <div className={styles.iconWrapper}>
                                        <FontIcon
                                            name="icon-yewuliucheng16"
                                            type={IconType.COLOREDICON}
                                        />
                                    </div>
                                    <div className={styles.nameWrapper}>
                                        <span
                                            className={styles.name}
                                            title={item.name}
                                        >
                                            {item.name}
                                        </span>
                                        <span
                                            className={styles.text}
                                            title={item.path}
                                        >
                                            {item.path}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
            return (
                <div
                    style={{
                        padding: '0 20px',
                    }}
                >
                    {__('抱歉，没有找到相关内容')}
                </div>
            )
        }
        return (
            <BusinessProcessProvider
                value={{
                    allOptions: treesExpandedOptions,
                    setAllOptions: updateTreesExpandedOptions,
                }}
            >
                <TreeSelectContainer
                    value={value}
                    onSelect={(id) => {
                        handleSelect(id)
                    }}
                />
            </BusinessProcessProvider>
        )
    }

    /**
     * 组合下拉框选项
     * @returns
     */
    const combineOptions = (combineData: Array<any>) => {
        return combineData.map((item) => ({
            label: <span title={item.path}>{item.name}</span>,
            value: item.id,
        }))
    }

    return (
        <Select
            showSearch
            placeholder={placeholder || __('请选择业务流程')}
            open={open}
            onDropdownVisibleChange={(status) => {
                setOpen(status)
            }}
            value={initValueLoading ? undefined : value}
            options={treesExpandedOptions}
            onSearch={(key) => {
                setSearchValue(key)
            }}
            loading={initValueLoading}
            dropdownRender={dropdownRenderTemplate}
            {...props}
        />
    )
}

export default BusinessProcessSelect
