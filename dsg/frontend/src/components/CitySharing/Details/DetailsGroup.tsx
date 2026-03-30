import React, { useMemo, CSSProperties } from 'react'
import { clone } from 'lodash'
import __ from '../locale'
import { DetailsLabel } from '@/ui'
import { useDict } from '@/hooks/useDict'

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
    const [dict, getDict] = useDict()

    // 适配数据与展示方式
    const adaptiveData = useMemo(() => {
        return config.map((item) => {
            const newItem = clone(item)
            newItem.value = data?.[newItem.key]
            if (item.render) {
                newItem.render = () =>
                    item.render(data?.[newItem.key], { ...data }, dict)
            }
            return newItem
        })
    }, [data, config, dict])

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
