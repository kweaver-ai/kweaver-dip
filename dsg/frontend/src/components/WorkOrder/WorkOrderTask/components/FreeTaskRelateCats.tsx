import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Checkbox, Select, SelectProps, Space, Spin } from 'antd'
import { trim } from 'lodash'
import { useSelections, useDebounce } from 'ahooks'

import styles from './styles.module.less'
import __ from './locale'

interface IFreeTaskRelateCats extends SelectProps {
    data?: any[]
    loading?: boolean
    onSelectAll: (values, items?) => void
}

const FreeTaskRelateCats: React.FC<IFreeTaskRelateCats> = ({
    data,
    loading,
    onSelectAll,
    ...props
}) => {
    const { value } = props
    const [searchKey, setSearchKey] = useState('')
    const debounceSearchKey = useDebounce(searchKey, { wait: 400 })
    const [cats, setCats] = useState<any[]>([])

    // 优化：使用 useMemo 缓存过滤结果，避免重复计算
    const filterCats = useMemo(() => {
        if (!cats || cats.length === 0) return []

        if (trim(debounceSearchKey) === '') {
            return cats
        }

        // 优化：预编译正则表达式，使用 toLowerCase 提高性能
        const searchTerm = trim(debounceSearchKey).toLowerCase()
        return cats.filter(
            (info) =>
                info.name?.toLowerCase().includes(searchTerm) ||
                info.path?.toLowerCase().includes(searchTerm),
        )
    }, [debounceSearchKey, cats])

    // 优化：只对过滤后的数据进行选择状态管理
    const {
        allSelected,
        partiallySelected,
        isSelected,
        toggle,
        toggleAll,
        unSelectAll,
    } = useSelections(
        filterCats.map((f) => f.id),
        value,
    )

    useEffect(() => {
        if (data && data.length > 0) {
            setCats(data)
        }
    }, [data])

    // 优化：缓存搜索过滤函数，避免重复创建
    const filterSearchValue = useCallback(
        (inputValue: string, option) => {
            if (!cats || cats.length === 0) return false

            const searchTerm = trim(inputValue).toLowerCase()
            const item = cats.find((info) => info.id === option?.value)

            if (!item) return false

            return (
                item.name?.toLowerCase().includes(searchTerm) ||
                item.path?.toLowerCase().includes(searchTerm)
            )
        },
        [cats],
    )

    // 全选按钮click
    const handleCheckAll = useCallback(() => {
        if (trim(searchKey)) {
            onSelectAll(!allSelected, filterCats)
            toggleAll()
            return
        }
        onSelectAll(!allSelected)
        toggleAll()
    }, [searchKey, allSelected, filterCats, onSelectAll, toggleAll])

    // 单个按钮click
    const handleCheckSingle = useCallback(
        (val: string) => {
            toggle(val)
        },
        [toggle],
    )

    const [open, setOpen] = useState(false)

    // 优化：缓存下拉菜单渲染
    const customDropdown = useCallback(
        (menu) => (
            <>
                <div
                    className={styles.rowWrapper}
                    onClick={handleCheckAll}
                    hidden={cats.length === 0}
                >
                    <Space size={12}>
                        <Checkbox
                            checked={allSelected}
                            indeterminate={partiallySelected}
                        />
                        {__('全部')}
                    </Space>
                </div>
                {menu}
            </>
        ),
        [cats.length, allSelected, partiallySelected, handleCheckAll],
    )

    const maxTagContent = useCallback(
        (omittedValues) => (
            <div title={omittedValues.map((o) => o.label).join('；')}>
                + {omittedValues.length} ...
            </div>
        ),
        [],
    )

    // 优化：只渲染过滤后的选项，减少 DOM 节点数量
    const renderOptions = useMemo(() => {
        return filterCats.map((f) => (
            <Select.Option value={f.id} label={f.name} key={f.id}>
                <div className={styles.rowWrapper} title={f.name}>
                    <Space size={12}>
                        <Checkbox checked={isSelected(f.id)} />
                        <div>
                            <div className={styles.title} title={f.name}>
                                {f.name || ''}
                            </div>
                            <div className={styles.path} title={f.path}>
                                {f.path || ''}
                            </div>
                        </div>
                    </Space>
                </div>
            </Select.Option>
        ))
    }, [filterCats, isSelected])

    return (
        <Select
            open={open}
            className={styles.freeTaskRelateCatsWrapper}
            showSearch
            mode="multiple"
            allowClear
            listHeight={220}
            filterOption={filterSearchValue}
            optionLabelProp="label"
            placeholder={__('请选择关联数据资源目录')}
            maxTagCount="responsive"
            dropdownRender={customDropdown}
            notFoundContent={
                loading ? (
                    <Spin />
                ) : data && data.length > 0 ? (
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        {__('抱歉，没有找到相关内容')}
                    </div>
                ) : (
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        <div>{__('暂无数据')}</div>
                    </div>
                )
            }
            maxTagTextLength={10}
            maxTagPlaceholder={(omittedValues) => maxTagContent(omittedValues)}
            getPopupContainer={(node) => node.parentNode}
            searchValue={searchKey}
            onSearch={(val) => {
                if (val.length <= 128) {
                    setSearchKey(val)
                }
            }}
            menuItemSelectedIcon={null}
            onDropdownVisibleChange={(op) => {
                setOpen(op)
                if (!op) {
                    setSearchKey('')
                }
            }}
            onSelect={(val, option) => {
                handleCheckSingle(val)
            }}
            onDeselect={(val, option) => {
                handleCheckSingle(val)
            }}
            onClear={() => {
                unSelectAll()
            }}
            {...props}
        >
            {renderOptions}
        </Select>
    )
}

export default FreeTaskRelateCats
