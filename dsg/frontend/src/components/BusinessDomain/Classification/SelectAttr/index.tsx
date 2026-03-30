import { Select } from 'antd'
import { FC, useEffect, useState } from 'react'
import classnames from 'classnames'
import { uniqBy } from 'lodash'
import { useDebounce } from 'ahooks'
import __ from '../../locale'
import { SelectAttrProvider } from './SelectAttrProvider'
import TreeSelectContainer from './TreeSelectContainer'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { formatError, getAttributesByParentId } from '@/core'

interface SelectAttrProps {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    allAttributes?: Array<any>
}
const SelectAttr: FC<SelectAttrProps> = ({
    value,
    onChange,
    placeholder,
    allAttributes = [],
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

    // 树结构展开的选项
    const [treesExpandedOptions, setTreesExpandedOptions] = useState<
        Array<any>
    >([])

    useEffect(() => {
        if (allAttributes.length > 0) {
            updateTreesExpandedOptions(allAttributes)
        } else {
            setInitValueLoading(false)
        }
    }, [allAttributes])

    useEffect(() => {
        if (!value) {
            setInitValueLoading(false)
        }
    }, [value])

    useEffect(() => {
        getAttrData(debouncedSearchValue)
    }, [debouncedSearchValue])

    /**
     * 搜索结果选中
     * @param id 业务流程id
     */
    const handleSelect = (id: string) => {
        onChange?.(id)
        setOpen(false)
    }

    /**
     * 组合下拉框选项
     * @returns
     */
    const combineOptions = (combineData: Array<any>) => {
        return combineData.map((item) => ({
            label: (
                <div className={styles.selectOptionWrapper}>
                    <FontIcon
                        name="icon-shuxing"
                        style={{
                            fontSize: 20,
                            color: 'rgba(245, 137, 13, 1)',
                        }}
                    />
                    <span>{item.name}</span>
                </div>
            ),
            value: item.id,
        }))
    }
    /**
     * 更新树结构展开的选项
     * @param newOptions
     */
    const updateTreesExpandedOptions = (newOptions: Array<any>) => {
        const newSelectOptions = combineOptions(newOptions)
        setTreesExpandedOptions(
            uniqBy([...treesExpandedOptions, ...newSelectOptions], 'value'),
        )
        setInitValueLoading(false)
    }

    /**
     * 获取属性数据
     * @param keyword 搜索关键字
     */
    const getAttrData = async (keyword: string) => {
        const res = await getAttributesByParentId({
            keyword,
        })
        setData(res.attributes)
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
                                    })}
                                    onClick={() => {
                                        handleSelect(item.id)
                                        updateTreesExpandedOptions(data)
                                    }}
                                >
                                    <div className={styles.iconWrapper}>
                                        <FontIcon
                                            name="icon-shuxing"
                                            style={{
                                                fontSize: 20,
                                                color: 'rgba(245, 137, 13, 1)',
                                            }}
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
                                            title={item.path_name}
                                        >
                                            {item.path_name}
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
            <SelectAttrProvider
                value={{
                    allOptions: treesExpandedOptions,
                    setAllOptions: updateTreesExpandedOptions,
                    allAttributes,
                }}
            >
                <TreeSelectContainer
                    value={value}
                    onSelect={(id) => {
                        handleSelect(id)
                    }}
                />
            </SelectAttrProvider>
        )
    }

    return (
        <Select
            showSearch
            placeholder={placeholder || __('请选择属性')}
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
        />
    )
}

export default SelectAttr
