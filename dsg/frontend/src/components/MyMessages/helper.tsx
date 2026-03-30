import React from 'react'
import { SearchType } from '@/ui/LightweightSearch/const'
import __ from './locale'
import styles from './styles.module.less'

// 初始化搜索条件
export const initSearch = {
    limit: 10,
    offset: 1,
}

/**
 * 消息状态
 */
export enum ReadStatusEnum {
    // 全部
    All = 'all',
    // 已读
    Read = 'read',
    // 未读
    Unread = 'unread',
}

/**
 * 消息状态选项
 */
export const readStatusOptions = [
    {
        value: ReadStatusEnum.All,
        label: __('不限'),
    },
    {
        value: ReadStatusEnum.Read,
        label: __('已读'),
    },
    {
        value: ReadStatusEnum.Unread,
        label: __('未读'),
    },
]

/**
 * 消息状态表单数据
 */
export const formData = [
    {
        label: __('消息状态'),
        key: 'status',
        options: readStatusOptions,
        type: SearchType.Radio,
    },
]

// 将后端返回的带标签标识的字符串处理成dom节点渲染
export const RenderMessageDom = ({
    item,
    onClick,
}: {
    item: any
    onClick: (item: any) => void
}) => {
    if (!item.message) return null

    // 递归处理内容
    const renderContent = (content: string): React.ReactNode[] => {
        const result: React.ReactNode[] = []
        let currentText = content

        // 匹配最内层的标签
        const regex = /<(a|b|c)>(.*?)<\/\1>/

        while (currentText) {
            const match = currentText.match(regex)
            if (!match) {
                result.push(currentText)
                break
            }

            const [fullMatch, tag, innerContent] = match
            const index = currentText.indexOf(fullMatch)

            // 添加标签前的文本
            if (index > 0) {
                result.push(currentText.slice(0, index))
            }

            // 递归处理标签内容并包装
            const children = renderContent(innerContent)
            switch (tag) {
                case 'a':
                    result.push(
                        <a
                            key={result.length}
                            onClick={(e) => {
                                e.stopPropagation()
                                onClick(item)
                            }}
                            className={styles.messageLink}
                        >
                            {children}
                        </a>,
                    )
                    break
                case 'b':
                    result.push(
                        <span
                            key={result.length}
                            className={styles.messageName}
                            title={innerContent}
                        >
                            {children}
                        </span>,
                    )
                    break
                case 'c':
                    result.push(
                        <span
                            key={result.length}
                            className={styles.messageDeadline}
                        >
                            {children}
                        </span>,
                    )
                    break

                default:
                    result.push(currentText)
                    break
            }

            // 继续处理剩余文本
            currentText = currentText.slice(index + fullMatch.length)
        }

        return result
    }

    return renderContent(item.message)
}
