import { List } from 'antd'
import classnames from 'classnames'
import { memo, useEffect, useState, useMemo } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatError, getFormsFieldsList, transformQuery } from '@/core'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { FieldLabel } from '../FieldLabel'
import { IFieldList } from './index.d'
import __ from './locale'
import styles from './styles.module.less'
import { useBusinessModelContext } from '../../BusinessModelProvider'

const EmptyView = (search: boolean) => {
    return (
        <div style={{ paddingTop: '80px' }}>
            {search ? (
                <Empty iconHeight={100} />
            ) : (
                <Empty desc={<div>{__('暂无数据')}</div>} iconSrc={dataEmpty} />
            )}
        </div>
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
        onCheckNode,
    } = props

    const [data, setData] = useState<any[]>()
    const [list, setList] = useState<any[]>()
    const [searchKey, setSearchKey] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [selectedField, setSelectedField] = useState<any>()
    const { isDraft, selectedVersion } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    // 获取字段属性列表
    const getData = async (tableId: string) => {
        try {
            setLoading(true)
            const result = await getFormsFieldsList(tableId, {
                limit: 100,
                ...versionParams,
            })
            setData(result?.entries || [])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        onCheckNode?.(selectedField)
    }, [selectedField])

    useEffect(() => {
        if (selectedId) {
            getData(selectedId)
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
                    o.name
                        .toLocaleLowerCase()
                        .includes(searchKey.toLocaleLowerCase()) ||
                    o.name_en
                        .toLocaleLowerCase()
                        .includes(searchKey.toLocaleLowerCase()),
            )
            setList(result)
        } else {
            setList(data)
        }
    }, [searchKey, data])

    const handleSearch = (key: string) => {
        setSearchKey(key)
    }

    const handleSelectField = (field: any) => {
        setSelectedField(field)
    }

    return (
        <div
            className={classnames(
                styles['fields-wrapper'],
                showCode && styles['fields-wrapper-codewrapper'],
            )}
        >
            {search && selectedId && (
                <div className={styles['fields-wrapper-search']}>
                    <SearchInput
                        placeholder={__('搜索字段名称')}
                        onKeyChange={handleSearch}
                    />
                </div>
            )}
            {loading ? (
                <div style={{ paddingTop: '56px' }}>
                    <Loader />
                </div>
            ) : (
                <List
                    className={styles['fields-wrapper-list']}
                    split={false}
                    dataSource={list || []}
                    renderItem={(item) => (
                        <List.Item>
                            <div className={styles['fields-wrapper-list-item']}>
                                <FieldLabel
                                    type={item?.data_type}
                                    title={item?.name}
                                    code={item?.name_en}
                                    item={item}
                                    isSelected={selectedField?.id === item?.id}
                                    onSelect={handleSelectField}
                                />
                            </div>
                        </List.Item>
                    )}
                    locale={{
                        emptyText: EmptyView(!!searchKey),
                    }}
                />
            )}
        </div>
    )
}

export default memo(FieldList)
