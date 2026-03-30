import React, { useState, useRef, useEffect } from 'react'
import { Tooltip } from 'antd'
import styles from './styles.module.less'
import { getTagByIds, formatError } from '@/core'
import { getTextWidth } from '@/components/DatasheetView/DataQuality/helper'

interface ITagList {
    tags: any[]
    containerWidth?: number
    maxTagWidth?: number
    maxRows?: number
    moreTagStyle?: any
    containerStyle?: any
    useAipQueryTags?: boolean
}

/**
 * 标签列表
 * @param tags 标签列表
 * @param containerWidth 容器宽度，默认200px
 * @param maxTagWidth 最大标签宽度，默认80px
 * @param maxRows 最大行数，默认2行，为0时，不限制行数，自动换行显示
 * @param moreTagStyle 更多标签样式
 * @param containerStyle 容器样式
 * @returns
 */
const TagList = (prams: ITagList) => {
    const {
        tags = [],
        containerWidth = 200,
        maxTagWidth = 80,
        maxRows = 2,
        moreTagStyle,
        containerStyle,
        useAipQueryTags,
    } = prams
    const [visibleTags, setVisibleTags] = useState<any[]>([])
    const [hiddenCount, setHiddenCount] = useState(0)
    const containerRef = useRef(null)

    useEffect(() => {
        if (useAipQueryTags) {
            getTagDataByIds()
        } else {
            calculateVisibleTags()
        }
    }, [])

    const calculateVisibleTags = () => {
        if (!containerRef.current || !tags?.length) return

        let currentWidth = 0
        let currentRow = 1
        const visible: any = []
        if (maxRows === 0) {
            setVisibleTags(tags)
            setHiddenCount(0)
            return
        }
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < tags.length; i++) {
            const padding = 16
            // 估算标签宽度（根据内容长度简s单估算）
            const tagWidth =
                getTextWidth(tags[i].name) + padding > maxTagWidth
                    ? maxTagWidth
                    : getTextWidth(tags[i].name) + padding
            // 检查是否超出当前行
            if (currentWidth + tagWidth > containerWidth) {
                // eslint-disable-next-line no-plusplus
                currentRow++
                currentWidth = 0

                // 如果超过最大行，停止添加
                if (currentRow > maxRows) {
                    setHiddenCount(tags.length - i)
                    break
                }
            }

            // 添加标签到可见列表
            visible.push(tags[i])
            currentWidth += tagWidth + 4 // 4px margin
        }

        setVisibleTags(visible)
        if (visible.length === tags.length) {
            setHiddenCount(0)
        }
    }

    const getTagDataByIds = async () => {
        try {
            if (!tags?.length) return
            const res = await getTagByIds(tags || [])
            setVisibleTags(res?.label_resp || [])
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div
            className={styles['tag-container']}
            style={{
                ...containerStyle,
                width: containerStyle?.width || containerWidth + 4,
            }}
            ref={containerRef}
        >
            {!visibleTags?.length
                ? '--'
                : visibleTags.map((tag: any, index) => (
                      <span
                          key={index}
                          className={styles.tag}
                          style={{ maxWidth: maxTagWidth }}
                      >
                          <Tooltip
                              key={index}
                              title={
                                  tag.path
                                      ? `${tag.path}/${tag.name}`
                                      : tag.name
                              }
                              color="white"
                              placement="bottomLeft"
                              overlayInnerStyle={{ color: 'rgba(0,0,0,0.85)' }}
                          >
                              <span>{tag.name}</span>
                          </Tooltip>
                      </span>
                  ))}

            {hiddenCount > 0 && (
                <div className={styles['more-tags-container']}>
                    <Tooltip
                        title={
                            <div
                                className={styles['tags-tooltip']}
                                style={{ width: maxTagWidth }}
                            >
                                {tags
                                    .slice(visibleTags.length)
                                    .map((tag, index) => (
                                        <span
                                            key={index + visibleTags.length}
                                            className={styles.tag}
                                            style={{ maxWidth: maxTagWidth }}
                                            title={
                                                tag.path
                                                    ? `${tag.path}/${tag.name}`
                                                    : tag.name
                                            }
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                            </div>
                        }
                        color="white"
                        placement="bottom"
                    >
                        <span
                            className={styles['more-tags']}
                            style={moreTagStyle}
                        >
                            +{hiddenCount}
                        </span>
                    </Tooltip>
                </div>
            )}
        </div>
    )
}

export default TagList
