import { forEach, trim } from 'lodash'
import { checkIndicatorModelRepeated, formatError, IStandardEnum } from '@/core'
import __ from './locale'
import { OptionModel } from '../MetricModel/const'
/**
 * 检查重复
 * @param rule
 * @param value 当前输入的值
 * @returns
 */
export const checkNameRepeat = async (mid, value, viewType, id = '') => {
    try {
        if (id) {
            const { repeat } = await checkIndicatorModelRepeated(mid, {
                iid: id,
                name: trim(value),
            })

            if (repeat && viewType === OptionModel.CreateModel) {
                return Promise.reject(
                    new Error(__('该指标模型名称已存在，请重新输入')),
                )
            }
        } else {
            const { repeat } = await checkIndicatorModelRepeated(mid, {
                name: trim(value),
            })
            if (repeat && viewType === OptionModel.CreateModel) {
                return Promise.reject(
                    new Error(__('该指标模型名称已存在，请重新输入')),
                )
            }
        }
        return Promise.resolve()
    } catch (ex) {
        formatError(ex)
        return Promise.resolve()
    }
}

// 指标表单的初始数据
export const formDefaultValue = {
    name: '',
    desc: '',
    measure: {
        member: [
            {
                type: 'field',
                object: {
                    field_id: undefined,
                    aggregate: undefined,
                },
            },
        ],
        operator: '+',
    },
    where: [],
    group: [],
}

//  度量的运算
export const measureItems = [
    {
        value: '+',
        label: '加',
    },
    {
        value: '-',
        label: '减',
    },
    {
        value: '*',
        label: '乘',
    },
    {
        value: '/',
        label: '除',
    },
]

/**
 * 校验当前度量是否存在
 * @param currentData
 * @param options
 * @param indicatorList
 * @returns
 */
export const checkCurrentMeasureExist = (
    currentData,
    options,
    indicatorList,
) => {
    let errorIndex: Array<{
        index: number
        type: 'field' | 'indicator'
    }> = []
    currentData?.member?.forEach((currentMember, index) => {
        if (currentMember.type === 'field') {
            const formOption = options?.find(
                (currentOption) =>
                    currentOption?.value === currentMember?.object?.field_id[0],
            )
            if (!formOption) {
                errorIndex = [
                    ...errorIndex,
                    {
                        index,
                        type: 'field',
                    },
                ]
            } else {
                const fieldOption = formOption?.children?.find(
                    (currentOption) =>
                        currentOption?.value ===
                        currentMember?.object?.field_id[1],
                )
                if (!fieldOption) {
                    errorIndex = [
                        ...errorIndex,
                        {
                            index,
                            type: 'field',
                        },
                    ]
                }
            }
        } else {
            const indicatorOption = indicatorList?.find(
                (currentIndicator) =>
                    currentIndicator.id ===
                    currentMember?.object?.parent_indicator,
            )
            if (!indicatorOption) {
                errorIndex = [
                    ...errorIndex,
                    {
                        index,
                        type: 'indicator',
                    },
                ]
            }
        }
    })
    return errorIndex
}

/**
 * 校验当前过滤是否存在
 * @param currentData
 * @param options
 * @returns
 */
export const checkCurrentWhereExist = (currentData, options) => {
    let errorIndex: Array<Array<number>> = []
    currentData?.forEach((currentWhere, outIndex) => {
        currentWhere.member?.forEach((currentMember, index) => {
            const formOption = options?.find(
                (currentOption) =>
                    currentOption?.value === currentMember?.field_id[0],
            )
            if (!formOption) {
                errorIndex = [...errorIndex, [outIndex, index]]
            } else {
                const fieldOption = formOption?.children?.find(
                    (currentOption) =>
                        currentOption?.value === currentMember?.field_id[1],
                )
                if (!fieldOption) {
                    errorIndex = [...errorIndex, [outIndex, index]]
                }
            }
        })
    })
    return errorIndex
}

/**
 * 校验当前分组是否存在
 * @param currentData
 * @param options
 * @returns
 */
export const checkCurrentGroupExist = (currentData, options) => {
    let errorIndex: Array<number> = []
    currentData?.forEach((currentGroup, index) => {
        const formOption = options?.find(
            (currentOption) =>
                currentOption?.value === currentGroup?.field_id[0],
        )
        if (!formOption) {
            errorIndex = [...errorIndex, index]
        } else {
            const fieldOption = formOption?.children?.find(
                (currentOption) =>
                    currentOption?.value === currentGroup?.field_id[1],
            )
            if (!fieldOption) {
                errorIndex = [...errorIndex, index]
            }
        }
    })
    return errorIndex
}
