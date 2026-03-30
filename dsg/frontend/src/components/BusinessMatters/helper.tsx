import styles from './styles.module.less'
import __ from './locale'
import {
    getDataDictItems,
    getDictByType,
    IGetDataDictItemsParams,
    formatError,
} from '@/core'

// 获取字典数据
export const getDictItems = async (type: string = 'business-matters-type') => {
    try {
        const pageParams = {
            offset: 1,
            limit: 100,
        }
        // const itemRes = await getDataDictItems({ ...pageParams, ...params })
        // return itemRes?.entries || []
        const res = await getDictByType(type)
        return (
            res.dicts?.[0]?.dict_item_resp?.map((item: any) => ({
                ...item,
                label: item.dict_value,
                value: item.dict_key,
            })) || []
        )
    } catch (error) {
        formatError(error)
        return []
    }
}
