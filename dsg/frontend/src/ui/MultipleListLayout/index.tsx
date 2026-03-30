import { FC, ReactNode, useEffect, useRef, useState } from 'react'
import { chunk } from 'lodash'
import { Col, Row } from 'antd'
import { useDebounce, useSize } from 'ahooks'
import styles from './styles.module.less'

interface IMultipleListLayout {
    // 最大列数
    maxListCount?: number
    // 列最小宽度
    listMinWidth: number

    // 是否显示序号
    showSequence?: boolean

    // 数据内容
    data: Array<{
        label: string | ReactNode
    }>

    // 排列顺序
    sortOrder?: 'cross' | 'vertical'

    rowGap?: number
}

const MultipleListLayout: FC<IMultipleListLayout> = ({
    maxListCount = 3,
    listMinWidth,
    showSequence = true,
    data,
    sortOrder = 'vertical',
    rowGap = 12,
}) => {
    const ref = useRef<HTMLDivElement>(null)
    const size = useSize(ref.current)
    const widthDebounce = useDebounce(size?.width, { wait: 500 })
    const [listCount, setListCount] = useState<number>(0)
    const [displayData, setDisplayData] = useState<
        Array<
            Array<{
                label: ReactNode | string
                sequence: number
            }>
        >
    >([])

    const [itemWidth, setItemWith] = useState<string>('320px')

    useEffect(() => {
        calculateListCount()
    }, [maxListCount, widthDebounce])

    useEffect(() => {
        if (listCount) {
            sortCurrentData()
        }
    }, [data, sortOrder, listCount])

    /**
     * 计算当前按照多少列展示
     */
    const calculateListCount = () => {
        const currentWidth = widthDebounce || ref?.current?.clientWidth
        if (currentWidth) {
            const result = Math.floor(currentWidth / listMinWidth)
            if (result > maxListCount) {
                setListCount(maxListCount)
            } else {
                setListCount(result)
            }
        }
    }

    /**
     * 数据根据排序顺序重新排序
     */
    const sortCurrentData = () => {
        const listHeight = Math.ceil(data.length / listCount)
        const newData = data.reduce((pre: Array<any>, current, index) => {
            const newPre = [...pre]
            const listIndex =
                sortOrder === 'vertical'
                    ? Math.floor(index / listHeight)
                    : index % listCount
            newPre[listIndex] = newPre[listIndex]
                ? [
                      ...newPre[listIndex],
                      {
                          label: current.label,
                          sequence: index + 1,
                      },
                  ]
                : [
                      {
                          label: current.label,
                          sequence: index + 1,
                      },
                  ]
            return newPre
        }, Array.from({ length: listCount }).fill([]))
        setItemWith(
            `calc((100% - ${(newData.length - 1) * 48}px) / ${newData.length})`,
        )
        setDisplayData(newData)
    }

    return (
        <div ref={ref} className={styles.boxContainer}>
            {displayData.map((currentData, index) =>
                index === 0 ? (
                    <div
                        style={{
                            width: itemWidth,
                            rowGap,
                        }}
                        className={styles.listItem}
                    >
                        {currentData.map((item) => (
                            <div className={styles.item}>
                                {showSequence ? (
                                    <span className={styles.number}>
                                        {item.sequence}
                                    </span>
                                ) : null}
                                {item.label}
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className={styles.splitLines}>
                            {currentData?.length ? (
                                <div className={styles.line} />
                            ) : null}
                        </div>
                        <div
                            style={{
                                width: itemWidth,
                                rowGap,
                            }}
                            className={styles.listItem}
                        >
                            {currentData.map((item) => (
                                <div className={styles.item}>
                                    {showSequence ? (
                                        <span className={styles.number}>
                                            {item.sequence}
                                        </span>
                                    ) : null}
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </>
                ),
            )}
        </div>
    )
}

export default MultipleListLayout
