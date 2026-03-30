import { isNumber } from 'lodash'
import { formatError, getDataEleDetailById } from '@/core'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import __ from './locale'

import {
    exChangeRangeDataToString,
    ValueRangeType,
} from '@/components/FormTableMode/const'

// 标准化过滤项
export const standardizingSearchData: IformItem[] = [
    {
        label: __('需要标准化'),
        key: 'standard_required',
        options: [
            {
                value: 'all',
                label: __('不限'),
            },
            {
                value: true,
                label: __('是'),
            },
            {
                value: false,
                label: __('否'),
            },
        ],
        type: SearchType.Radio,
    },
    {
        label: __('标准化状态'),
        key: 'data_element',
        options: [
            {
                value: 'all',
                label: __('不限'),
            },
            {
                value: false,
                label: __('未标准化'),
            },
            {
                value: true,
                label: __('已标准化'),
            },
        ],
        type: SearchType.Radio,
    },
]

/**
 *
 * @param recommendId
 * @param initInfo
 * @param value 若type为1，为id， 若type为2，则为code
 * @returns
 */
export const transformDataOptions = async (
    recommendId: string,
    initInfo: any,
    type?: number,
): Promise<any> => {
    try {
        if (!recommendId) return initInfo
        const { data } = await getDataEleDetailById({
            type: isNumber(type) ? type : 2,
            value: recommendId,
        })
        let valueInfo = {}
        if (data?.rule_id) {
            valueInfo = {
                value_range_type: ValueRangeType.CodeRule,
                value_range: exChangeRangeDataToString({
                    id: data.rule_id,
                    name: data.rule_name,
                }),
            }
        } else if (data?.dict_id) {
            valueInfo = {
                value_range_type: ValueRangeType.CodeTable,
                value_range: exChangeRangeDataToString({
                    id: data.dict_id,
                    name: data.dict_name_cn,
                }),
            }
        } else {
            valueInfo = {
                value_range_type: ValueRangeType.None,
                value_range: '',
            }
        }

        return {
            ...initInfo,
            ...valueInfo,
        }
    } catch (ex) {
        formatError(ex)
        return Promise.resolve({
            ...initInfo,
            value_range_type: ValueRangeType.None,
            value_range: '',
        })
    }
}
