import { FC, forwardRef, useEffect, useState } from 'react'
import { Table, Pagination } from 'antd'
import { FilterItem, RefStatus, StandardDataDetail, ViewModel } from './const'
import { IFormEnumConfigModel, formsEnumConfig } from '@/core'
import { filterSingleData, getViewColumns } from './helper'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import __ from './locale'
import { LightweightSearch, SearchInput } from '@/ui'
import styles from './styles.module.less'
import { FormTableKind, NewFormType } from '../Forms/const'

interface IViewFieldsTable {
    fields: Array<any>
    // 字段信息的相关的后端枚举映射
    dataEnumOptions: IFormEnumConfigModel | null

    // 标准规则详情Map
    standardRuleDetail: StandardDataDetail

    formType?: FormTableKind

    needFilter?: boolean
}

const ViewFieldsTable: FC<IViewFieldsTable> = ({
    fields,
    formType = FormTableKind.BUSINESS,
    dataEnumOptions,
    standardRuleDetail,
    needFilter = true,
}) => {
    const [viewFieldData, setViewFieldData] = useState<Array<any>>([])
    // 表头数据
    const [columns, setColumns] = useState<Array<any>>([])
    // 搜索条件
    const [searchKey, setSearchKey] = useState<string>('')

    // 过滤条件
    const [filterKey, setFilterKey] = useState<RefStatus | ''>('')

    useEffect(() => {
        setViewFieldData(fields || [])
    }, [fields])

    useEffect(() => {
        if (dataEnumOptions) {
            setColumns(getViewColumns(dataEnumOptions, formType))
        }
    }, [dataEnumOptions, formType])

    useEffect(() => {
        // 根据中文名或者英文匹配，统一转为小写比较
        setViewFieldData(
            fields?.filter((currentData) =>
                filterSingleData(currentData, searchKey, filterKey),
            ) || [],
        )
    }, [searchKey, filterKey])

    return (
        <div>
            <div className={styles.viewTableTool}>
                <SearchInput
                    value={searchKey}
                    placeholder={__('搜索字段中文名称、英文名称')}
                    className={styles.searchField}
                    onKeyChange={(kw: string) => {
                        setSearchKey(kw)
                    }}
                />
                {needFilter ? (
                    <LightweightSearch
                        formData={FilterItem}
                        onChange={(data, key) => {
                            setFilterKey((key && data?.[key]) || '')
                        }}
                        defaultValue={{ refStatus: '' }}
                    />
                ) : null}
            </div>
            <div>
                <Table
                    dataSource={viewFieldData}
                    columns={columns}
                    scroll={{
                        x: 1950,
                        y: `calc(100vh - 320px)`,
                    }}
                    locale={{
                        emptyText:
                            fields?.length === 0 ? (
                                <Empty
                                    desc={__('暂无数据')}
                                    iconSrc={dataEmpty}
                                />
                            ) : (
                                <Empty />
                            ),
                    }}
                    pagination={false}
                />
            </div>
        </div>
    )
}

export default ViewFieldsTable
