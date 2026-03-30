import React, { useRef, useState } from 'react'
import { Input } from 'antd'
import ChooseDataSource from '../ChooseDataSource'
import __ from '../locale'
import styles from './styles.module.less'
import { ISourceDetail } from '@/core'

/**
 * 数据来源选择组件
 */
const DataSourceSelect: React.FC<{
    value?: string
    onChange?: (value: string, item: ISourceDetail) => void
    selectedItem?: ISourceDetail // 选中的数据来源
}> = ({ selectedItem, value, onChange }) => {
    const vRef: any = useRef(null)
    const [showChooseDataSource, setShowChooseDataSource] =
        useState<boolean>(false)

    return (
        <>
            <Input
                ref={vRef}
                placeholder={__('请选择源端资源')}
                readOnly
                value={value}
                title={value}
                suffix={
                    <a
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowChooseDataSource(true)
                            vRef?.current?.blur()
                        }}
                    >
                        {__('选择')}
                    </a>
                }
                onClick={(e) => {
                    e.stopPropagation()
                    setShowChooseDataSource(true)
                    vRef?.current?.blur()
                }}
                className={styles.dataSourceSelect}
            />
            <ChooseDataSource
                open={showChooseDataSource}
                checkedId={selectedItem?.table_id}
                onClose={() => setShowChooseDataSource(false)}
                onSure={(data) => {
                    const detail = {
                        catalog_id: data?.catalog_id,
                        catalog_name: data?.catalog_name,
                        db_type: data?.datasource_type,
                        department_name: data?.department,
                        encoding: data?.code,
                        table_display_name: data?.name,
                        table_id: data?.resource_id,
                        table_technical_name: data?.technical_name,
                    }
                    onChange?.(data?.name, detail)
                    setShowChooseDataSource(false)
                }}
            />
        </>
    )
}

export default DataSourceSelect
