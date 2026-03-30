// 业务表和业务指标选择组件
import React, { useEffect, useMemo, useState } from 'react'
import { Checkbox, Select, SelectProps, Space, Spin } from 'antd'
import { trim } from 'lodash'
import { useSelections } from 'ahooks'
import styles from './styles.module.less'
import __ from './locale'

interface IFreeTaskRelateForms extends SelectProps {
    data?: any[]
    loading?: boolean
    onSelectAll: (values, items?) => void
    placeholder?: string
}
const FreeTaskRelateForms: React.FC<IFreeTaskRelateForms> = ({
    data,
    loading,
    onSelectAll,
    placeholder = __('请选择关联业务表'),
    ...props
}) => {
    const { value } = props
    const [searchKey, setSearchKey] = useState('')
    const [forms, setForms] = useState<any[]>([])

    const filterForms = useMemo(() => {
        if (trim(searchKey) === '') {
            return data || []
        }
        return forms!.filter((info) =>
            info.name?.match(new RegExp(trim(searchKey), 'ig')),
        )
    }, [searchKey, data])

    const {
        allSelected,
        partiallySelected,
        isSelected,
        toggle,
        toggleAll,
        unSelectAll,
    } = useSelections(
        filterForms.map((f) => f.id),
        value,
    )

    useEffect(() => {
        if (data && data.length > 0) {
            setForms(data)
        }
    }, [data])

    // 搜索过滤
    const filterSearchValue = (inputValue: string, option) => {
        const res = forms!
            .filter((info) =>
                info.name?.match(new RegExp(trim(inputValue), 'ig')),
            )
            .filter((info) => info.id === option?.value)
        return res.length > 0
    }

    // 全选按钮click
    const handleCheckAll = () => {
        if (trim(searchKey)) {
            onSelectAll(!allSelected, filterForms)
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
                hidden={filterForms.length === 0}
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
            className={styles.freeTaskRelateFormsWrapper}
            showSearch
            mode="multiple"
            allowClear
            filterOption={filterSearchValue}
            optionLabelProp="label"
            placeholder={placeholder}
            maxTagCount="responsive"
            dropdownRender={customDropdown}
            notFoundContent={
                loading ? (
                    <Spin />
                ) : data ? (
                    data.length === 0 ? (
                        <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                            <div>{__('暂无数据')}</div>
                        </div>
                    ) : (
                        <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                            {__('抱歉，没有找到相关内容')}
                        </div>
                    )
                ) : (
                    <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        {__('请先选择关联业务模型')}
                    </div>
                )
            }
            getPopupContainer={(node) => node.parentNode}
            searchValue={searchKey}
            onSearch={(val) => {
                if (val.length <= 128) {
                    setSearchKey(val)
                }
            }}
            maxTagTextLength={10}
            menuItemSelectedIcon={null}
            maxTagPlaceholder={(omittedValues) => maxTagContent(omittedValues)}
            onDropdownVisibleChange={(op) => {
                setOpen(op)
                if (!op) {
                    setSearchKey('')
                } else {
                    // const el = document.getElementById('freeTaskRelateForms')
                    // el?.scrollIntoView({
                    //     behavior: 'smooth',
                    //     inline: 'start',
                    // })
                    // setTimeout(() => {
                    //     setOpen(op)
                    // }, 200)
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
            {forms.map((f) => (
                <Select.Option value={f.id} label={f.name} key={f.id}>
                    <div className={styles.rowWrapper} title={f.name}>
                        <Space size={12}>
                            <Checkbox checked={isSelected(f.id)} />
                            <div className={styles.title}>{f.name || ''}</div>
                        </Space>
                    </div>
                </Select.Option>
            ))}
        </Select>
    )
}

export default FreeTaskRelateForms
