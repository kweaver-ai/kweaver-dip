import React, { memo, useEffect, useState } from 'react'
import AssetCard from './AssetPanorama/components/AssetCard'
import { ICardItem, TopItems } from './AssetPanorama/helper'
import { formatError, getGlossaryCount } from '@/core'
import styles from './styles.module.less'
/**
 * 数据资源架构
 */
function DataSource() {
    const [loading, setLoading] = useState<boolean>(false)
    const [data, setData] = useState<ICardItem[]>([])
    const onLoad = async () => {
        try {
            setLoading(true)
            const countRes = await getGlossaryCount('')
            const items = TopItems.map((o) => ({
                ...o,
                value:
                    o.value === 'subject_domain_group'
                        ? countRes?.[o.value]?.length
                        : o.value === 'level_business_obj'
                        ? countRes[o.value] + countRes.level_business_act
                        : countRes?.[o.value],
            }))
            setData(items)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        onLoad()
    }, [])

    return (
        <div className={styles.cards}>
            {data?.map((item) => (
                <AssetCard key={item.key} data={item} />
            ))}
        </div>
    )
}

export default memo(DataSource)
