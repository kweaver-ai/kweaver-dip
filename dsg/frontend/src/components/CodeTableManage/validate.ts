import { NumericDictionary, trim } from 'lodash'
import { nameCnReg } from '@/utils'

/**
 * 名称合法性校验
 * @returns
 */
export const validateNameLegitimacy = () => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (!trimValue) {
                reject(new Error('输入不能为空'))
            }
            if (trimValue && !nameCnReg.test(trimValue)) {
                reject(new Error('仅支持中英文、数字、下划线及中划线'))
            }
            resolve(1)
        })
    }
}

/**
 * 输入值合法性校验
 * @returns
 */
export const validateValueLegitimacy = (regReg: RegExp, msg: string) => {
    return (_: any, value: any) => {
        return new Promise((resolve, reject) => {
            if (Array.isArray(value)) {
                if (value.length > 0 && !regReg.test(value.pop())) {
                    reject(new Error(msg))
                }
                resolve(1)
                return
            }
            if (value && !regReg.test(value)) {
                reject(new Error(msg))
            }
            resolve(1)
        })
    }
}

/**
 * 空校验
 * @returns
 */
export const validateEmpty = (msg: string) => {
    return (_: any, value: string | number) => {
        const newValue = typeof value === 'string' ? value.trim() : value
        return new Promise((resolve, reject) => {
            // 如果填入或选中的值为0，仍通过校验
            if (typeof newValue === 'number' && newValue === 0) {
                resolve(1)
            } else if (
                !newValue ||
                (Array.isArray(newValue) && newValue.length === 0)
            ) {
                // 值为空或值为空数组
                reject(new Error(msg))
            }
            resolve(1)
        })
    }
}

/**
 * 校验整数
 * @returns
 */
export const validateValueInteger = (msg: string) => {
    return (_: any, value: string | number) => {
        return new Promise((resolve, reject) => {
            // 如果填入或选中的值为0，仍通过校验
            if (
                typeof value === 'number' &&
                value === parseInt(value.toString(), 10)
            ) {
                resolve(1)
            } else {
                reject(new Error(msg))
            }
        })
    }
}

/**
 * 数据精度需小于等于数据长度
 * @returns
 */
export const validateLessThan = (compValue: number, msg: string) => {
    return (_: any, value: number) => {
        return new Promise((resolve, reject) => {
            // 当前值小于等于比较值
            if (value <= compValue) {
                resolve(1)
            } else {
                reject(new Error(msg))
            }
        })
    }
}
