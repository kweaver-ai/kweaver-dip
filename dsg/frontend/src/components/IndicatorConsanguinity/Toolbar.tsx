import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button, Input, Select } from 'antd'
import { useDebounce } from 'ahooks'
import { SearchOutlined } from '@ant-design/icons'
import { trim } from 'lodash'
import styles from './styles.module.less'
import __ from './locale'
import { ViewType, VisualType } from './const'
import { SearchInput } from '@/ui'

interface ToolbarType {
    viewMode: ViewType
    onViewModeChange: (value) => void
    onSearch: (value) => void
}

const Toolbar = ({ viewMode, onViewModeChange, onSearch }: ToolbarType) => {
    const options = [
        { label: __('以表查看'), value: ViewType.Form },
        { label: __('以字段查看'), value: ViewType.Field },
    ]
    const [searchKey, setSearchKey] = useState<string>('')

    useEffect(() => {
        onSearch(searchKey)
    }, [searchKey])

    return (
        <div className={styles.toolbarContent}>
            <div className={styles.toolBarBtn}>
                <SearchInput
                    placeholder={__('搜索表名称')}
                    onKeyChange={(kw: string) => {
                        setSearchKey(kw)
                    }}
                />
            </div>
            <div className={styles.toolBarBtn}>
                <Select
                    options={options}
                    style={{
                        width: 135,
                    }}
                    onChange={(value) => {
                        onViewModeChange(value)
                    }}
                    value={viewMode}
                />
            </div>
        </div>
    )
}

export default Toolbar
