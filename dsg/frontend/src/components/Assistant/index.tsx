import React, { useState, useRef, useMemo, useEffect } from 'react'
import { Button, Input, message, Spin, Tooltip } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useInfiniteScroll, useDebounceFn } from 'ahooks'
import { useNavigate } from 'react-router-dom'
import __ from './locale'
import styles from './styles.module.less'
import Card from './Card'
import {
    formatError,
    getAssistantList,
    IGetAssistantListParams,
    IAgentItem,
    IAgentList,
    pullOffAssistant,
    getMenuResourceActions,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty, Loader } from '@/ui'
import AddAssistant from './AddAssistant'
import { listedSearchParams } from './helper'
import Category from './Category'

const Assistant: React.FC = () => {
    // 搜索参数
    const searchParamsRef = useRef<IGetAssistantListParams>(listedSearchParams)
    // 搜索关键词（用于 UI 显示）
    const [searchName, setSearchName] = useState('')
    // 添加助手弹窗状态
    const [addModalOpen, setAddModalOpen] = useState(false)
    // 滚动容器引用
    const containerRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    // 菜单资源动作权限
    const [menuActions, setMenuActions] = useState<string[]>([])

    // 获取助手列表
    const fetchAssistantList = async (
        paginationMarker?: string,
    ): Promise<IAgentList & { list: IAgentItem[] }> => {
        const params = {
            ...searchParamsRef.current,
            pagination_marker_str: paginationMarker || '',
        }
        const res = await getAssistantList(params)
        return {
            ...res,
            list: res?.entries || [],
        }
    }

    // 使用无限滚动
    const { data, loading, loadingMore, noMore, reload } = useInfiniteScroll<
        IAgentList & { list: IAgentItem[] }
    >((d) => fetchAssistantList(d?.pagination_marker_str), {
        target: containerRef,
        isNoMore: (d) => d?.is_last_page ?? false,
        onError: (error) => {
            formatError(error)
        },
    })

    // 助手列表数据
    const assistantList = data?.list || []

    // 防抖搜索
    const { run: debouncedSearch } = useDebounceFn(
        (value: string) => {
            searchParamsRef.current = {
                ...searchParamsRef.current,
                name: value,
            }
            reload()
        },
        { wait: 300 },
    )

    // 处理搜索
    const handleSearch = (value: string) => {
        setSearchName(value)
        debouncedSearch(value)
    }

    // 上架新助手
    const handleAddAssistant = () => {
        setAddModalOpen(true)
    }

    // 下架助手
    const handleRemoveAssistant = async (afAgentId: string) => {
        try {
            await pullOffAssistant({ af_agent_id: afAgentId })
            message.success(__('下架成功'))
            reload() // 重新加载列表
        } catch (error) {
            formatError(error)
        }
    }

    // 点击卡片
    const handleCardClick = (item: IAgentItem) => {
        // 跳转到聊天页面，agentId 作为路径参数，agentName 和 businessDomain 作为查询参数
        const params = new URLSearchParams({
            agentName: item.name,
            agentKey: item.key,
            businessDomain: item.business_domain_id || '',
        })

        const newUrl = `/chatkit/${item.key}?${params.toString()}`
        navigate(newUrl)
    }

    // 添加助手成功后刷新列表
    const handleAddSuccess = () => {
        reload()
    }

    // 获取菜单资源动作权限
    const getMenuResourceActionsFn = async () => {
        try {
            const res = await getMenuResourceActions({
                resource_id: 'smartDataQuery',
                resource_type: 'smart_data_query',
            })
            setMenuActions(res?.actions || [])
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getMenuResourceActionsFn()
    }, [])

    // 权限判断（可扩展）
    const permissions = useMemo(
        () => ({
            online: menuActions.includes('online'),
            offline: menuActions.includes('offline'),
            classify: menuActions.includes('classify'),
        }),
        [menuActions],
    )

    const renderHeader = () => {
        return (
            <div className={styles.header}>
                <div className={styles.leftSection}>
                    <Tooltip title={__('返回')}>
                        <div
                            className={styles.chatKitLeftIcon}
                            onClick={() => {
                                navigate('/')
                            }}
                        >
                            <FontIcon
                                type={IconType.COLOREDICON}
                                name="icon-zhuye"
                                style={{ fontSize: 24 }}
                            />
                        </div>
                    </Tooltip>
                    <div className={styles.logo}>
                        <FontIcon
                            name="icon-quanbuzhushou"
                            type={IconType.COLOREDICON}
                            style={{ fontSize: 24 }}
                        />
                    </div>
                    <div className={styles.title}>{__('全部助手')}</div>
                </div>
                <div className={styles.rightSection}>
                    {permissions.online && (
                        <Button type="primary" onClick={handleAddAssistant}>
                            {__('上架新助手')}
                        </Button>
                    )}
                    <Input
                        className={styles.searchInput}
                        placeholder={__('搜索助手')}
                        prefix={<SearchOutlined />}
                        value={searchName}
                        onChange={(e) => handleSearch(e.target.value)}
                        allowClear
                    />
                </div>
            </div>
        )
    }

    // 渲染加载更多
    const renderLoadMore = () => {
        if (loadingMore) {
            return (
                <div className={styles.loadMoreWrapper}>
                    <Spin size="small" />
                    <span className={styles.loadMoreText}>
                        {__('加载中...')}
                    </span>
                </div>
            )
        }
        if (noMore && assistantList.length > 0) {
            return (
                <div className={styles.loadMoreWrapper}>
                    <span className={styles.noMoreText}>
                        {__('没有更多了')}
                    </span>
                </div>
            )
        }
        return null
    }

    // 选择助手分类
    const handleCategoryChange = (selected: Record<string, string | null>) => {
        const categoryIds = Object.values(selected).filter(
            (id): id is string => id !== null,
        )

        searchParamsRef.current = {
            ...searchParamsRef.current,
            category_ids: categoryIds,
        }
        reload()
    }

    return (
        <div className={styles.assistantContainer}>
            {renderHeader()}
            {/* <Category onChange={handleCategoryChange} /> */}
            {loading ? (
                <Loader tip={__('加载中...')} />
            ) : assistantList.length > 0 ? (
                <div className={styles.content} ref={containerRef}>
                    <div className={styles.cardGrid}>
                        {assistantList.map((item, index) => (
                            <Card
                                key={item.id}
                                data={item}
                                onClick={handleCardClick}
                                onRemove={handleRemoveAssistant}
                                permissions={permissions}
                            />
                        ))}
                    </div>
                    {renderLoadMore()}
                </div>
            ) : (
                <div className={styles.emptyContainer}>
                    <Empty
                        desc={
                            searchName ? __('暂未找到相关数据') : __('暂无数据')
                        }
                    />
                    {!searchName && permissions.online && (
                        <Button
                            type="primary"
                            className={styles.emptyAddBtn}
                            onClick={handleAddAssistant}
                        >
                            {__('上架新助手')}
                        </Button>
                    )}
                </div>
            )}
            {addModalOpen && (
                <AddAssistant
                    open={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    onSuccess={handleAddSuccess}
                />
            )}
        </div>
    )
}

export default Assistant
