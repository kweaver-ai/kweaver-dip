import React, { useState, useRef, useEffect } from 'react'
import { Input, message, Drawer, Button, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useInfiniteScroll, useDebounceFn } from 'ahooks'
import __ from './locale'
import styles from './styles.module.less'
import Card from './Card'
import {
    formatError,
    getAssistantList,
    IGetAssistantListParams,
    IAgentItem,
    IAgentList,
    putOnAssistant,
} from '@/core'
import { Empty, Loader } from '@/ui'
import { allSearchParams } from './helper'

interface AddAssistantProps {
    // 是否打开
    open: boolean
    // 关闭
    onClose: () => void
    // 成功
    onSuccess?: () => void
}

const AddAssistant: React.FC<AddAssistantProps> = ({
    open,
    onClose,
    onSuccess,
}) => {
    // 搜索参数
    const searchParamsRef = useRef<IGetAssistantListParams>(allSearchParams)
    // 搜索关键词（用于 UI 显示）
    const [searchName, setSearchName] = useState('')
    // 选中的助手 key
    const [selectedKeys, setSelectedKeys] = useState<string[]>([])
    // 滚动容器引用
    const containerRef = useRef<HTMLDivElement>(null)

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
    const { data, loading, loadingMore, noMore, reload, mutate } =
        useInfiniteScroll<IAgentList & { list: IAgentItem[] }>(
            (d) => fetchAssistantList(d?.pagination_marker_str),
            {
                target: containerRef,
                isNoMore: (d) => d?.is_last_page ?? false,
                manual: true, // 手动触发，等抽屉打开后再加载
                onError: (error) => {
                    formatError(error)
                },
            },
        )

    // 抽屉打开时加载数据
    useEffect(() => {
        if (open) {
            reload()
        } else {
            // 关闭时清空数据
            mutate(undefined)
        }
    }, [open])

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

    // 选择/取消选择助手
    const handleSelect = (key: string, selected: boolean) => {
        if (selected) {
            setSelectedKeys((prev) => [...prev, key])
        } else {
            setSelectedKeys((prev) => prev.filter((item) => item !== key))
        }
    }

    // 上架选中的助手
    const handleAddAssistant = async () => {
        if (selectedKeys.length === 0) {
            message.warning(__('请选择要上架的助手'))
            return
        }
        try {
            await putOnAssistant({
                agent_list: selectedKeys.map((key) => ({ agent_key: key })),
            })
            message.success(__('上架成功'))
            setSelectedKeys([])
            onSuccess?.()
            onClose()
        } catch (error) {
            formatError(error)
        }
    }

    // 关闭抽屉时重置状态
    const handleClose = () => {
        setSelectedKeys([])
        setSearchName('')
        searchParamsRef.current = { ...allSearchParams }
        onClose()
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

    return (
        <Drawer
            title={__('上架新助手')}
            open={open}
            onClose={handleClose}
            width={1024}
            className={styles.addAssistantDrawer}
            footer={
                <div className={styles.drawerFooter}>
                    <span className={styles.selectedCount}>
                        {__('已选：')}
                        {selectedKeys.length > 0
                            ? __('${num}个', {
                                  num: selectedKeys.length,
                              })
                            : '--'}
                    </span>
                    <div className={styles.footerButtons}>
                        <Button onClick={handleClose}>{__('取消')}</Button>
                        <Button
                            type="primary"
                            onClick={handleAddAssistant}
                            disabled={selectedKeys.length === 0}
                        >
                            {__('确定')}
                        </Button>
                    </div>
                </div>
            }
        >
            {/* 头部：标题 + 搜索框（始终显示） */}
            <div className={styles.drawerHeader}>
                <span className={styles.drawerSubtitle}>
                    {__('Data Agent 广场')}
                </span>
                <Input
                    className={styles.drawerSearch}
                    placeholder={__('搜索')}
                    prefix={<SearchOutlined />}
                    value={searchName}
                    onChange={(e) => handleSearch(e.target.value)}
                    allowClear
                />
            </div>
            {/* 卡片网格或空状态 */}
            {loading ? (
                <Loader tip={__('加载中...')} />
            ) : assistantList.length > 0 ? (
                <div
                    className={styles.addAssistantGridWrapper}
                    ref={containerRef}
                >
                    <div className={styles.addAssistantGrid}>
                        {assistantList.map((item, index) => (
                            <Card
                                key={item.id}
                                data={item}
                                selectable
                                selected={selectedKeys.includes(item.key)}
                                onSelect={(_, selected) =>
                                    handleSelect(item.key, selected)
                                }
                                disabled={item.list_status === 'put-on'}
                                disabledTooltip={__('已上架')}
                            />
                        ))}
                    </div>
                    {renderLoadMore()}
                </div>
            ) : (
                <Empty
                    desc={
                        searchName
                            ? __('暂未找到相关数据')
                            : __('Data Agent广场暂未发布数据')
                    }
                />
            )}
        </Drawer>
    )
}

export default AddAssistant
