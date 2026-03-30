import { CheckOutlined } from '@ant-design/icons'
import { List, Radio } from 'antd'
import classnames from 'classnames'
import { memo, useEffect, useState, useMemo } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    BizModelType,
    formatError,
    formsQuery,
    IFormItem,
    transformQuery,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { ICatalogItem, ICatalogList } from './index.d'
import __ from './locale'
import styles from './styles.module.less'
import { FormTableKind } from '@/components/Forms/const'
import { useBusinessModelContext } from '../../BusinessModelProvider'
/**
 * 目录项
 * @param {ICatalogItem} props
 * @returns
 */
const CatalogItem = (props: ICatalogItem) => {
    const { item, selected, checked, onCheck } = props
    return (
        <div
            className={classnames({
                [styles['catalog-item']]: true,
                [styles['is-selected']]: selected,
                [styles['is-checked']]: checked,
            })}
            onClick={() => !selected && onCheck?.(!checked, item)}
        >
            <div className={styles['catalog-item-icon']}>
                <FontIcon
                    name="icon-yewubiao_suanzi"
                    type={IconType.FONTICON}
                />
            </div>
            <div className={styles['catalog-item-title']}>
                <div
                    title={item?.name}
                    className={styles['catalog-item-title-name']}
                >
                    {item?.name}
                </div>
                <div
                    title={item?.description}
                    className={styles['catalog-item-title-code']}
                >
                    {item?.description || '暂无描述'}
                </div>
            </div>
            <div
                className={styles['catalog-item-link']}
                style={{ display: checked || selected ? 'block' : 'none' }}
            >
                {selected ? (
                    <div className={styles['catalog-item-link-bind']}>
                        {__('已关联')}
                    </div>
                ) : (
                    <div className={styles['catalog-item-link-check']}>
                        <CheckOutlined />
                    </div>
                )}
            </div>
        </div>
    )
}

// 默认条件
const DEFAULT_CONDITION = {
    keyword: '',
    offset: 1,
    limit: 2000,
}

const EmptyView = (search: boolean) => {
    const text = (
        <div className={styles.emptyText}>
            <div className={styles.emptyFirstText}>
                {__('抱歉，没有找到相关内容')}
            </div>
        </div>
    )
    return search ? (
        <Empty iconHeight={100} desc={text} />
    ) : (
        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    )
}

/**
 * 资源列表
 * @param {ICatalogList} props
 * @returns
 */
function CatalogList(props: Partial<ICatalogList>) {
    const {
        title,
        mid,
        search = true,
        bindIds = [],
        selected,
        onSelect,
        onInitEmpty,
        isDataModel = false,
    } = props
    const [data, setData] = useState<IFormItem[]>()
    const [total, setTotal] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>()
    const [searchCondition, setSearchCondition] =
        useState<any>(DEFAULT_CONDITION)
    const [viewKey, setViewKey] = useState<FormTableKind>(
        FormTableKind.STANDARD,
    )
    const { isDraft, selectedVersion, businessModelType } =
        useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])
    // 获取数据目录列表
    const getData = async (params: any) => {
        try {
            setLoading(true)
            const res = await formsQuery(mid!, {
                // table_kind: viewKey,
                ...params,
                ...versionParams,
            })
            const result = res?.entries || []
            setData(result)
            setTotal(res?.total_count)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getData(searchCondition)
    }, [searchCondition])

    const handleSearch = (key: string) => {
        if (key === searchCondition.keyword) return
        setSearchCondition((prev) => ({ ...prev, keyword: key }))
    }

    const handleViewModeChange = (e) => {
        const key = e.target.value
        setViewKey(key)
        setSearchCondition((prev) => ({
            ...prev,
            table_kind: key,
            offset: 1,
            limit: 2000,
        }))
    }

    const itemRender = (item: IFormItem) => {
        return (
            <CatalogItem
                key={item.id}
                item={item}
                selected={bindIds?.includes(item.id)}
                checked={selected?.id === item.id}
                onCheck={onSelect}
            />
        )
    }

    return (
        <div className={styles['catalog-wrapper']}>
            {search && (
                <div className={styles['catalog-wrapper-search']}>
                    <SearchInput
                        placeholder={
                            businessModelType === BizModelType.DATA
                                ? __('搜索数据表')
                                : __('搜索业务表')
                        }
                        onKeyChange={handleSearch}
                    />
                </div>
            )}

            {loading ? (
                <div style={{ paddingTop: '56px' }}>
                    <Loader />
                </div>
            ) : data?.length ? (
                <div
                    className={classnames(
                        styles['catalog-wrapper-list'],
                        isDataModel && styles.dataList,
                    )}
                    style={{
                        height: isDataModel
                            ? 'calc(100% - 76px)'
                            : 'calc(100% - 40px)',
                    }}
                >
                    <div
                        id="catalog-list"
                        className={styles['catalog-wrapper-list-box']}
                    >
                        <List dataSource={data} renderItem={itemRender} />
                    </div>
                </div>
            ) : (
                EmptyView(!!searchCondition.keyword)
            )}
        </div>
    )
}

export default memo(CatalogList)
