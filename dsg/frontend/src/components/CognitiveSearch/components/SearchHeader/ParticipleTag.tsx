import { Popover, Tooltip } from 'antd'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import classnames from 'classnames'
import { isEqual } from 'lodash'
import styles from './styles.module.less'
import __ from '../../locale'
import { useCongSearchContext } from '../../CogSearchProvider'

const TagItem = memo(
    ({
        item,
        stopKeys,
        onCalcWidth,
        onStopKey,
    }: {
        item: ITagItem
        stopKeys?: string[]
        onCalcWidth?: (width: number) => void
        onStopKey?: (key: string) => void
    }) => {
        const ref = useRef<any>()
        useEffect(() => {
            onCalcWidth?.(ref.current.offsetWidth)
        }, [item])

        const isUseless = useMemo(() => {
            const hasKeyUse = [...(item?.synonym || []), item?.source]?.some(
                (o) => !stopKeys?.includes(o),
            )
            return item?.is_stopword || !hasKeyUse
        }, [item, stopKeys])

        return isUseless ? (
            <span
                ref={ref}
                className={classnames(
                    styles['tag-label'],
                    styles['is-useless'],
                )}
            >
                {item?.source}
            </span>
        ) : (
            <Tooltip
                placement="bottom"
                color="#fff"
                title={
                    <div
                        className={styles['group-wrapper']}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            key={item?.source}
                            className={classnames(
                                styles['group-wrapper-item'],
                                stopKeys?.includes(item?.source) &&
                                    styles['is-stop'],
                            )}
                        >
                            <span>{__('词源')}</span>
                            <span className={styles['key-label']}>
                                {item?.source}
                            </span>

                            <span
                                className={styles['key-btn']}
                                onClick={() => {
                                    onStopKey?.(item?.source)
                                }}
                            >
                                {__('忽略')}
                            </span>
                        </div>
                        {item?.synonym?.map((o) => (
                            <div
                                key={o}
                                className={classnames(
                                    styles['group-wrapper-item'],
                                    stopKeys?.includes(o) && styles['is-stop'],
                                )}
                            >
                                <span>{__('同义词')}</span>
                                <span className={styles['key-label']}>{o}</span>
                                <span
                                    className={styles['key-btn']}
                                    onClick={() => {
                                        onStopKey?.(o)
                                    }}
                                >
                                    {__('忽略')}
                                </span>
                            </div>
                        ))}
                    </div>
                }
            >
                <span className={styles['tag-label']} ref={ref}>
                    {item?.source}
                    {(item?.synonym || []).length > 1 &&
                        `(${(item?.synonym || []).length})`}
                </span>
            </Tooltip>
        )
    },
)

export type ITagItem = {
    /** 标签名 */
    source: string
    /** 是否无效词 默认有效词 */
    is_stopword?: boolean
    /** 词源及相关同义词组 */
    synonym?: string[]
}

interface IParticipleTag {
    data?: ITagItem[]
    onStopKeys?: (keys: string[]) => void
}

function ParticipleTag(props: IParticipleTag) {
    const { commomWord } = useCongSearchContext()
    const { data, onStopKeys } = props
    const [widths, setWidths] = useState<number[]>([])
    const [splitIdx, setSplitIdx] = useState<number>()
    const [splitItems, setSplitItems] = useState<[ITagItem[], ITagItem[]]>([
        [],
        [],
    ])
    const [stopWord, setStopWord] = useState<string[]>([])

    useEffect(() => {
        if (!isEqual(stopWord, commomWord)) {
            setStopWord(commomWord)
        }
    }, [commomWord])

    useEffect(() => {
        const keys = Array.from(new Set(stopWord))
        onStopKeys?.(keys)
    }, [stopWord])

    useEffect(() => {
        setSplitIdx(undefined)
        setWidths([])
        setStopWord([])
    }, [data])

    useEffect(() => {
        if (widths?.length && data?.length === widths?.length && !splitIdx) {
            let index = 0
            ;(widths || []).reduce((prev, cur, idx) => {
                const curLen = 8 + prev + cur
                if (curLen > 560 && !index) {
                    index = idx
                }
                return curLen
            }, 34)
            setSplitIdx(index)
        }
    }, [widths, data, splitIdx])

    useEffect(() => {
        if (splitIdx) {
            const showItems = (data || []).slice(0, splitIdx)
            const overflowItems = (data || []).slice(splitIdx)
            setSplitItems([showItems, overflowItems])
        } else {
            setSplitItems([data || [], []])
        }
    }, [splitIdx, data])

    const handleKeyStop = (key: string) => {
        setStopWord([...stopWord, key])
    }

    const PopContent = useMemo(
        () => (
            <div
                className={styles['pop-tags']}
                onClick={(e) => e.stopPropagation()}
            >
                {splitItems?.[1]?.map((item: ITagItem, idx: number) => {
                    return (
                        <TagItem
                            key={`${item.source}-${idx}`}
                            item={item}
                            stopKeys={stopWord}
                            onStopKey={handleKeyStop}
                        />
                    )
                })}
            </div>
        ),
        [splitItems?.[1], handleKeyStop],
    )

    return (
        <div className={styles['participle-tags']}>
            {splitItems?.[0]?.map((item: ITagItem, idx: number) => (
                <TagItem
                    key={`${item.source}-${idx}`}
                    item={item}
                    stopKeys={stopWord}
                    onStopKey={handleKeyStop}
                    onCalcWidth={(width: number) => {
                        const temp = widths
                        temp[idx] = width
                        setWidths([...temp])
                    }}
                />
            ))}
            {!!splitItems?.[1]?.length && (
                <Popover content={PopContent} placement="bottom">
                    <span
                        key="more"
                        className={classnames(
                            styles['tag-label'],
                            styles['is-more'],
                        )}
                    >
                        ...
                    </span>
                </Popover>
            )}
        </div>
    )
}

export default memo(ParticipleTag)
