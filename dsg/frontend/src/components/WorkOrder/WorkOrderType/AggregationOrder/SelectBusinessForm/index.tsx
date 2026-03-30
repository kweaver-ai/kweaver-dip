import { Select } from 'antd'
import React, { useEffect, useState } from 'react'
import __ from './locale'
import styles from './styles.module.less'
import SelectFormModal from './SelectFormModal'

function SelectBusinessForm({ placeholder, value, onChange }: any) {
    const [dataSource, setDataSource] = useState<any[]>([])
    const [optOpen, setOptOpen] = useState<boolean>(false)
    const [options, setOptions] = useState<any[]>([])

    useEffect(() => {
        const opts = (dataSource || []).map((o) => ({
            label: o?.name,
            key: o?.id,
            value: o?.id,
        }))
        setOptions(opts)
    }, [dataSource])

    useEffect(() => {
        if (!value || JSON.stringify(value) !== JSON.stringify(options)) {
            onChange?.(options)
        }
    }, [options])

    useEffect(() => {
        const needUpdate = (value || []).some(
            (item) => !(dataSource || []).some((ds) => ds.id === item.value),
        )
        if (needUpdate) {
            const trasValue = (value || [])
                .filter(
                    (item) =>
                        !(dataSource || []).some((ds) => ds.id === item.value),
                )
                .map((o) => ({
                    id: o?.value,
                    name: o?.label,
                }))

            if (trasValue.length > 0) {
                setDataSource((prev) => [...(prev || []), ...trasValue])
            }
        }
    }, [value])

    return (
        <>
            <div className={styles.bizFormSelect}>
                <Select
                    labelInValue
                    mode="multiple"
                    placeholder={placeholder || __('请选择业务表名称')}
                    value={value}
                    options={options}
                    onChange={(val) =>
                        setDataSource(
                            (val || []).map((o) => ({
                                name: o?.label,
                                id: o?.value,
                                key: o?.value,
                            })),
                        )
                    }
                />
                <a
                    onClick={(e) => {
                        e.stopPropagation()
                        setOptOpen(true)
                    }}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        lineHeight: '32px',
                    }}
                >
                    选择
                </a>
            </div>

            {optOpen && (
                <SelectFormModal
                    open={optOpen}
                    bindItems={dataSource}
                    onClose={() => {
                        setOptOpen(false)
                    }}
                    onSure={(items) => {
                        // 设置选中view
                        setDataSource((prev) => [...(prev ?? []), ...items])
                        setOptOpen(false)
                    }}
                />
            )}
        </>
    )
}

export default SelectBusinessForm
