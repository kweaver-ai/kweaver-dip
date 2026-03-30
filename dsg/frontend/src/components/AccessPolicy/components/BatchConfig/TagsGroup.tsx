import { Button } from 'antd'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { useSize } from 'ahooks'
import { useEffect, useRef, useState } from 'react'
import { getTextWidth } from '@/components/DatasheetView/DataQuality/helper'
import { FontIcon, UserOutlined } from '@/icons'
import __ from '../../locale'
import styles from './styles.module.less'

interface TagsGroupProps {
    data: Array<{
        name: string
        type: string
    }>
}
const TagsGroup = ({ data }: TagsGroupProps) => {
    const [showExpand, setShowExpand] = useState(false)
    const [maxTagIndex, setMaxTagIndex] = useState(0)
    const tagContainer = useRef<HTMLDivElement>(null)

    const size = useSize(tagContainer) || {
        width: document.body.clientWidth,
        height: document.body.clientHeight,
    }

    useEffect(() => {
        if (data?.length > 0) {
            const dataTextWidList = data.map((item) => {
                const wid = getTextWidth(item.name, 14) + 16 + 18
                return wid > 120 ? 120 : wid
            })
            let maxInd = 0
            const totalWid = dataTextWidList.reduce((cur, pre, index) => {
                if (cur + pre + 12 < size.width - 72) {
                    maxInd = index
                }
                return cur + pre + 12
            }, 0)
            setMaxTagIndex(maxInd)
        }
    }, [data, size])

    return (
        <div ref={tagContainer} className={styles.tagsGroupContainer}>
            {(showExpand ? data : data.slice(0, maxTagIndex + 1)).map(
                (item, index) => {
                    return (
                        <div key={index} className={styles.tagItemContainer}>
                            {item.type === 'app' ? (
                                <FontIcon
                                    name="icon-jichengyingyong-xianxing"
                                    style={{ fontSize: '18px', flexShrink: 0 }}
                                />
                            ) : (
                                <UserOutlined style={{ fontSize: '18px' }} />
                            )}
                            <div className={styles.text} title={item.name}>
                                {item.name}
                            </div>
                        </div>
                    )
                },
            )}
            {maxTagIndex + 1 < data.length && !showExpand && (
                <div className={styles.ellipsisText}>...</div>
            )}
            {maxTagIndex + 1 < data.length ? (
                <div className="flex items-center">
                    {showExpand ? (
                        <Button
                            type="link"
                            onClick={() => setShowExpand(false)}
                        >
                            {__('收起')}
                            <UpOutlined />
                        </Button>
                    ) : (
                        <Button type="link" onClick={() => setShowExpand(true)}>
                            {__('展开')}
                            <DownOutlined />
                        </Button>
                    )}
                </div>
            ) : null}
        </div>
    )
}

export default TagsGroup
