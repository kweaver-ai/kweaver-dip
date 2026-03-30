import React from 'react'
import { reqInfoSystemList, formatError } from '@/core'
import ScrollLoadSelect from '../ScrollLoadSelect'

const ScrollLoadInfoSystemSelect = (props: any) => {
    const { onChange } = props

    const getInfoSystem = async (params: any) => {
        try {
            const res = await reqInfoSystemList({
                limit: 50,
                offset: 1,
                ...params,
            })
            return res.entries || []
        } catch (error: any) {
            formatError(error)
            return []
        }
    }

    return (
        <ScrollLoadSelect
            fetchOptions={getInfoSystem}
            allowClear
            getPopupContainer={(node) => node.parentNode}
            onChange={onChange}
            {...props}
        />
    )
}
export default ScrollLoadInfoSystemSelect
