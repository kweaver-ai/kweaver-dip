import React, { useEffect, useMemo, useState } from 'react'
import { Checkbox, Select, SelectProps, Space, Spin } from 'antd'
import { trim } from 'lodash'
import { useDebounce, useSelections } from 'ahooks'
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

    const filterCats = useMemo(() => {
        if (trim(debounceSearchKey) === '') {
            return data || []
        }
        return cats!.filter((info) =>
            info.name?.match(new RegExp(trim(debounceSearchKey), 'ig')),
        )
    }, [debounceSearchKey, cats, data])

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

    // 搜索过滤
    const filterSearchValue = (inputValue: string, option) => {
        const res = cats!
            .filter((info) =>
                info.name?.match(new RegExp(trim(inputValue), 'ig')),
            )
            .filter((info) => info.id === option?.value)
        return res.length > 0
    }

    // 全选按钮click
    const handleCheckAll = () => {
        if (trim(searchKey)) {
            onSelectAll(!allSelected, filterCats)
            toggleAll()
            return
        }
        onSelectAll(!allSelected)
        toggleAll()
    }

    // 单个按钮click
    const handleCheckSingle = (val: string) => {
        toggle(val)
    }

    const [open, setOpen] = useState(false)

    const customDropdown = (menu) => (
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
    )

    const maxTagContent = (omittedValues) => (
        <div title={omittedValues.map((o) => o.label).join('；')}>
            + {omittedValues.length} ...
        </div>
    )

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
            {cats.map((f) => (
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
            ))}
        </Select>
    )
}

export default FreeTaskRelateCats
