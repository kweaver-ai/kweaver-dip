import classnames from 'classnames'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { CheckOutlined } from '@ant-design/icons'
import InfiniteScroll from 'react-infinite-scroll-component'
import { List, Pagination, Radio } from 'antd'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { formatError, getDatasheetView, getUserDatasheetView } from '@/core'
import { DatasheetViewColored } from '@/icons'
import { SearchInput, ListPagination, ListType } from '@/ui'
import { ICatalogItem, ICatalogList, IDataCatalogItem } from './index.d'
import __ from '../../locale'
import styles from './styles.module.less'
import { ownerRoleId } from '@/components/BusinessDomain/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

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
                <DatasheetViewColored />
            </div>
            <div className={styles['catalog-item-title']}>
                <div
                    title={`${item?.business_name}（${item?.technical_name}）`}
                    className={styles['catalog-item-title-name']}
                >
                    {`${item?.business_name}（${item?.technical_name}）`}
                </div>
                <div
                    title={item?.technical_name}
                    className={styles['catalog-item-title-code']}
                >
                    {item?.uniform_catalog_code}
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
    limit: 10,
    publish_status: 'publish',
}

const EmptyView = (search: boolean) => {
    const text = (
        <div className={styles.emptyText}>
            <div className={styles.emptyFirstText}>
                {__('抱歉，没有找到相关内容')}
            </div>
            <div>{__('找不到的可能原因是：')}</div>
            <div>{__('1、库表不存在')}</div>
            <div>{__('2、库表存在但未发布')}</div>
        </div>
    )
    return search ? (
        <Empty iconHeight={100} desc={text} />
    ) : (
        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    )
}

/**
 * 数据目录资源列表
 * @param {ICatalogList} props
 * @returns
 */
function CatalogList(props: Partial<ICatalogList>) {
    const { checkPermission } = useUserPermCtx()
    const {
        title,
        search = true,
        bindIds = [],
        selected,
        onSelect,
        onInitEmpty,
        owner = false,
    } = props
    const [data, setData] = useState<IDataCatalogItem[]>()
    const [total, setTotal] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>()
    const nextFlag = useRef<string>()
    const [searchCondition, setSearchCondition] = useState<any>(
        owner ? { ...DEFAULT_CONDITION, owner: false } : DEFAULT_CONDITION,
    )
    const [viewKey, setViewKey] = useState<'giveMe' | 'meOwner'>('giveMe')

    // 获取数据目录列表
    const getData = async (params: any, isLoadMore = false) => {
        try {
            if (!isLoadMore) {
                nextFlag.current = undefined
                setLoading(true)
                setData([])
            }

            let res: any
            if (owner) {
                res = await getUserDatasheetView({ ...params })
            } else {
                res = await getDatasheetView(params)
            }

            nextFlag.current = res.next_flag

            let result = res?.entries || []
            if (isLoadMore) {
                result = data
                    ? [...data, ...(res?.entries || [])]
                    : res?.entries
            }
            setData(result)
            setTotal(res?.total_count)
            if (!(owner && isDataOwner)) {
                onInitEmpty?.(result.length === 0 && !searchCondition.keyword)
            }
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
            owner: key === 'meOwner',
            offset: 1,
        }))
    }

    const itemRender = (item: IDataCatalogItem) => {
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

    const onLoad = () => {
        getData({ ...searchCondition, next_flag: nextFlag.current }, true)
    }

    const isDataOwner = useMemo(
        () => checkPermission('manageDataResourceAuthorization'),
        [checkPermission],
    )

    useMemo(() => {
        handleViewModeChange({ target: { value: 'giveMe' } })
    }, [isDataOwner])

    return (
        <div className={styles['catalog-wrapper']}>
            {!!title && !(owner && isDataOwner) && (
                <div className={styles['catalog-wrapper-title']}>{title}</div>
            )}
            {owner && isDataOwner && (
                <Radio.Group
                    onChange={handleViewModeChange}
                    value={viewKey}
                    className={styles['catalog-wrapper-choose']}
                >
                    <Radio.Button
                        value="giveMe"
                        className={styles['catalog-wrapper-choose-item']}
                    >
                        {__('授权给我的')}
                    </Radio.Button>
                    <Radio.Button
                        value="meOwner"
                        className={styles['catalog-wrapper-choose-item']}
                    >
                        {__('我可授权的')}
                    </Radio.Button>
                </Radio.Group>
            )}
            {search && (
                <div className={styles['catalog-wrapper-search']}>
                    <SearchInput
                        placeholder={__('搜索库表业务名称、技术名称、编码')}
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
                        owner && isDataOwner && styles.ownerList,
                    )}
                >
                    <div
                        id="catalog-list"
                        className={styles['catalog-wrapper-list-box']}
                    >
                        <List dataSource={data} renderItem={itemRender} />
                    </div>
                    <div className={styles['catalog-wrapper-list-page']}>
                        <Pagination
                            total={total}
                            current={searchCondition.offset}
                            size="small"
                            showSizeChanger={false}
                            onChange={(page, pageSize) => {
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: page,
                                    limit: pageSize,
                                })
                            }}
                            hideOnSinglePage
                        />
                    </div>
                </div>
            ) : (
                EmptyView(!!searchCondition.keyword)
            )}
        </div>
    )
}

export default memo(CatalogList)
