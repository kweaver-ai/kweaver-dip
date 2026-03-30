import { Button, List } from 'antd'
import React, { useEffect, useState, useRef } from 'react'
import classnames from 'classnames'
import { useUpdateEffect } from 'ahooks'
import { omit } from 'lodash'
import { LightweightSearch, Loader } from '@/ui'
import {
    getNotifications,
    updateNotifications,
    updateNotificationById,
    INotificationsItem,
    formatError,
    IGetNotifications,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { formatTime } from '@/utils'
import {
    formData,
    initSearch,
    ReadStatusEnum,
    RenderMessageDom,
} from './helper'
import { RefreshBtn } from '../ToolbarComponents'
import styles from './styles.module.less'
import __ from './locale'

const MyMessages: React.FC = (props: {
    onMessageChange?: (messages: INotificationsItem[]) => void
}) => {
    const { onMessageChange } = props
    const [loading, setLoading] = useState(false)
    const [itemLoading, setItemLoading] = useState(false)
    const [messages, setMessages] = useState<INotificationsItem[]>([])
    const [searchCondition, setSearchCondition] = useState<
        IGetNotifications | undefined
    >(undefined)
    const searchRef = useRef<any>(null)

    useUpdateEffect(() => {
        if (searchCondition) {
            updateMessages(searchCondition)
        }
    }, [searchCondition])

    useEffect(() => {
        // 初始化搜索条件
        setSearchCondition(initSearch)
    }, [])

    useEffect(() => {
        if (onMessageChange && messages.length) {
            onMessageChange(messages)
        }
    }, [messages])

    // 更新消息列表
    const updateMessages = async (params) => {
        try {
            setLoading(true)
            const res = await getNotifications(params)
            setMessages(res?.entries)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 全部标记为已读
    const handleMarkAllAsRead = async () => {
        try {
            setLoading(true)
            await updateNotifications() // 调用后端接口标记所有消息为已读
            await updateMessages(searchCondition) // 重新获取最新的消息列表
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 单个消息标记为已读
    const handleMarkItemAsRead = async (item: INotificationsItem) => {
        if (itemLoading || item.read) return
        try {
            setItemLoading(true)
            await updateNotificationById(item?.id)
            // 直接更新本地状态，避免重新请求整个列表
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === item.id ? { ...msg, read: true } : msg,
                ),
            )
        } catch (error) {
            formatError(error)
        } finally {
            setItemLoading(false)
        }
    }

    // 轻量级搜索
    const handleLightWeightSearchChange = (values: any) => {
        const { status } = values

        let searchParams = { ...searchCondition }

        if (status === ReadStatusEnum.All) {
            searchParams = omit(searchParams, 'read')
        } else {
            searchParams.read = status === ReadStatusEnum.Read
        }

        setSearchCondition(searchParams)
    }

    // 刷新
    const handleRefresh = () => {
        updateMessages(searchCondition)
    }

    // TODO:点击消息，跳转到对应页面
    const handleClickMessage = (item: any) => {}

    return (
        <div className={styles.messageWrapper}>
            <div className={styles.title}>{__('数据质量整改告警消息')}</div>
            <div className={styles.header}>
                <Button disabled={loading} onClick={handleMarkAllAsRead}>
                    {__('全部标记为已读')}
                </Button>
                <div className={styles.statusFilter}>
                    <LightweightSearch
                        ref={searchRef}
                        formData={formData}
                        onChange={handleLightWeightSearchChange}
                        defaultValue={{ status: ReadStatusEnum.All }}
                    />
                    <RefreshBtn onClick={handleRefresh} />
                </div>
            </div>
            {loading ? (
                <Loader />
            ) : (
                <List
                    className={styles.messageList}
                    dataSource={messages}
                    renderItem={(item) => (
                        <List.Item
                            onClick={() => handleMarkItemAsRead(item)}
                            className={styles.messageItem}
                        >
                            <div className={styles.messageContent}>
                                <span
                                    className={classnames(
                                        styles.unreadDot,
                                        item?.read && styles.hidden,
                                    )}
                                />
                                <FontIcon
                                    name="icon-gaojingxiaoxi"
                                    type={IconType.COLOREDICON}
                                />
                                <span className={styles.messageText}>
                                    <RenderMessageDom
                                        item={item}
                                        onClick={handleClickMessage}
                                    />
                                </span>
                                <span className={styles.messageTime}>
                                    {formatTime(
                                        item?.time,
                                        'YYYY-MM-DD HH:mm',
                                    ) || ''}
                                </span>
                            </div>
                        </List.Item>
                    )}
                />
            )}
        </div>
    )
}

export default MyMessages
