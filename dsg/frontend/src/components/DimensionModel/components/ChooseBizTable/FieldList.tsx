import { List, Radio } from 'antd'
import { memo, useEffect, useState } from 'react'
import classnames from 'classnames'
import { useUpdateEffect } from 'ahooks'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { SearchInput } from '@/ui'
// import { FormatType } from '../../const'
import { useCatalogColumn } from '../../helper'
import __ from '../../locale'
import { FieldLabel } from '../FieldLabel'
import { IFieldItem, IFieldList } from './index.d'
import styles from './styles.module.less'
import FormViewExampleData from '@/components/DatasheetView/FormViewExampleData'
import { IVirtualEngineExample, getDataPreviewConfig } from '@/core'
import { stateType } from '@/components/DatasheetView/const'
import ScrollTable from '@/components/DatasheetView/DataPreview/ScrollFilter/ScrollTable'
import { cancelRequest } from '@/utils'

const EmptyView = (
    search: boolean,
    selectedId?: string,
    mode?: string,
    list?: any[],
) => {
    return search ? (
        <Empty iconHeight={100} />
    ) : (
        <Empty
            desc={
                selectedId ? (
                    list?.length === 0 ? (
                        <div>{`${__('选择的库表无')}${
                            mode === 'field' ? __('字段信息') : __('样例数据')
                        }${__('，请重新选择')}`}</div>
                    ) : (
                        <div>{__('暂无数据')}</div>
                    )
                ) : (
                    <div>{__('请从左侧选择所需库表')}</div>
                )
            }
            iconSrc={dataEmpty}
        />
    )
}

/**
 * 字段属性列表
 * @param {IFieldList} props
 * @returns
 */
function FieldList(props: Partial<IFieldList>) {
    const {
        title,
        search = true,
        selectedId,
        showCode = false,
        checkReadablePerm = false,
        useDataPreviewApi = false,
        onSwitchNode,
    } = props

    const [data, setData] = useState<IFieldItem[]>()
    const [list, setList] = useState<IFieldItem[]>()
    const [previewConfig, setPreviewConfig] = useState<any>()
    const [searchKey, setSearchKey] = useState<string>('')
    const [mode, setMode] = useState<string>('field')
    const [exampleParams, setExampleParams] = useState<IVirtualEngineExample>({
        catalog: '',
        schema: '',
        table: '',
    })
    const { loading, getColumnsById } = useCatalogColumn(true)

    // 获取字段属性列表
    const getData = async (tableId: string) => {
        if (exampleParams.catalog) {
            cancelRequest(
                `/api/virtual_engine_service/v1/preview/${exampleParams.catalog}/${exampleParams.schema}/${exampleParams.table}`,
                'get',
            )
        }
        const result = await getColumnsById(tableId)
        // 过滤已删除字段
        const columns = result.data.filter((item) => {
            if (checkReadablePerm) {
                return item.status !== stateType.delete && item.is_readable
            }
            return item.status !== stateType.delete
        })
        const table = result.technical_name
        const [catalog, schema] = result.view_source_catalog_name.split('.')
        setExampleParams({ table, catalog, schema })
        setData(columns)
    }

    useEffect(() => {
        if (selectedId) {
            getData(selectedId)
            if (useDataPreviewApi) {
                getConfig()
            }
        } else {
            setData([])
            setList([])
            setSearchKey('')
        }
    }, [selectedId])

    useEffect(() => {
        if (searchKey) {
            const result = data?.filter(
                (o) =>
                    o.business_name
                        .toLocaleLowerCase()
                        .includes(searchKey.toLocaleLowerCase()) ||
                    o.technical_name
                        .toLocaleLowerCase()
                        .includes(searchKey.toLocaleLowerCase()),
            )
            setList(result)
        } else {
            setList(data)
        }
    }, [searchKey, data])

    useUpdateEffect(() => {
        onSwitchNode?.(list)
    }, [list])

    const handleSearch = (key: string) => {
        setSearchKey(key)
    }

    const getConfig = async () => {
        try {
            const res = await getDataPreviewConfig(selectedId || '')
            const conf = JSON.parse(res?.config || '{}')
            setPreviewConfig(conf)
        } catch (error) {
            // formatError(error)
        }
    }

    return (
        <div
            className={classnames(
                styles['fields-wrapper'],
                showCode && styles['fields-wrapper-codewrapper'],
                mode === 'example' && styles['fields-wrapper-example'],
            )}
        >
            {!!title && (
                <div className={styles['fields-wrapper-title']}>
                    <div>{title}</div>
                    {showCode && list?.length ? (
                        <Radio.Group
                            onChange={(e) => setMode(e.target.value)}
                            value={mode}
                            className={styles['fields-wrapper-radio']}
                            size="middle"
                        >
                            <Radio.Button value="field">
                                {__('字段')}
                            </Radio.Button>
                            {/* <Radio.Button value="example">
                                {__('样例数据')}
                            </Radio.Button> */}
                        </Radio.Group>
                    ) : null}
                </div>
            )}
            {search && selectedId && (
                <div className={styles['fields-wrapper-search']}>
                    <SearchInput
                        placeholder={__('搜索字段业务名称、字段技术名称')}
                        onKeyChange={handleSearch}
                    />
                </div>
            )}
            {loading && mode === 'field' ? (
                // <div style={{ paddingTop: '56px' }}>
                <Loader />
            ) : // </div>
            mode === 'field' || !selectedId ? (
                <List
                    className={styles['fields-wrapper-list']}
                    split={false}
                    dataSource={list || []}
                    renderItem={(item) => (
                        <List.Item>
                            <div className={styles['fields-wrapper-list-item']}>
                                <FieldLabel
                                    type={item?.data_type}
                                    title={item?.business_name}
                                    code={
                                        showCode
                                            ? item?.technical_name
                                            : undefined
                                    }
                                />
                            </div>
                        </List.Item>
                    )}
                    locale={{
                        emptyText: EmptyView(
                            !!searchKey,
                            selectedId,
                            mode,
                            list,
                        ),
                    }}
                />
            ) : useDataPreviewApi ? (
                <ScrollTable
                    id={selectedId}
                    config={previewConfig}
                    fields={list}
                    scrollY="394px"
                />
            ) : (
                <FormViewExampleData id={selectedId} scrollY={394} />
            )}
        </div>
    )
}

export default memo(FieldList)
