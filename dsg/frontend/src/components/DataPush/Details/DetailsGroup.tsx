import React, { useMemo, CSSProperties } from 'react'
import { clone } from 'lodash'
import __ from '../locale'
import { DetailsLabel } from '@/ui'

interface IDetailsGroup {
    data?: any
    config: any
    style?: CSSProperties
    labelWidth?: string
    wordBreak?: boolean
    overflowEllipsis?: boolean
    gutter?: number
}

/**
 * 单组详情
 */
const DetailsGroup = ({
    data,
    config = [],
    style = {},
    labelWidth = '108px',
    wordBreak = true,
    overflowEllipsis = false,
    gutter = 0,
}: IDetailsGroup) => {
    // 适配数据与展示方式
    const adaptiveData = useMemo(() => {
        return config
            .filter((item) => !item.hidden?.(data))
            .map((item) => {
                const newItem = clone(item)
                newItem.value = data?.[newItem.key]
                if (item.render) {
                    newItem.render = () =>
                        item.render(data?.[newItem.key], data)
                }
                return {
                    ...newItem,
                    hidden: false,
                    labelStyles: {
                        color: 'rgb(0 0 0 / 45%)',
                    },
                }
            })
    }, [data, config])

    return (
        <DetailsLabel
            wordBreak={wordBreak}
            detailsList={adaptiveData}
            labelWidth={labelWidth}
            style={style}
            overflowEllipsis={overflowEllipsis}
            gutter={gutter}
        />
    )
}

export default DetailsGroup
