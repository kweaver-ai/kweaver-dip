import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import { allRescTypeList } from '../helper'
import __ from './locale'
import { checkRescPolicyRepeat, formatError } from '@/core'

export const filterItems: IformItem[] = [
    {
        label: __('类型'),
        key: 'rescType',
        options: allRescTypeList,
        type: SearchType.Radio,
    },
]

/**
 * 检查重复
 * @param rule
 * @param value 当前输入的值
 * @returns
 */
export const checkNameRepeat = async (id, name) => {
    try {
        const res = await checkRescPolicyRepeat({
            id,
            name,
        })

        if (res.repeat) {
            return Promise.reject(new Error(__('此名称已存在，请重新输入')))
        }
        return Promise.resolve()
    } catch (e) {
        // formatError(e)
        return Promise.reject(new Error(__('此名称已存在，请重新输入')))
    }
}
