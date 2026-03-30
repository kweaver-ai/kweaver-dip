import { trim } from 'lodash'
import { formsCheckUniqueness } from '@/core'
import { nameReg } from '@/utils'

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
            if (trimValue && !nameReg.test(trimValue)) {
                reject(new Error('仅支持中英文、数字、下划线及中划线'))
            }
            resolve(1)
        })
    }
}

/**
 * 唯一性校验
 * @param mid number 业务模型ID
 * @param fid number 表单ID
 * @returns
 */
export const validateUniqueness = (mid: string, fid?: string) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (!trimValue) {
                reject(new Error('输入不能为空'))
                return
            }
            if (trimValue && !nameReg.test(trimValue)) {
                reject(new Error('仅支持中英文、数字、下划线及中划线'))
                return
            }
            const errorMsg = '该表单名称已存在，请重新输入'
            formsCheckUniqueness(mid, {
                form_id: fid,
                name: value,
            })
                .then((result) => {
                    if (result.repeat) {
                        reject(new Error(errorMsg))
                    }
                    resolve(1)
                })
                .catch(() => {
                    reject(new Error(errorMsg))
                })
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
export const validateValueEmpty = (msg: string) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            if (!value) {
                reject(new Error(msg))
            }
            resolve(1)
        })
    }
}
