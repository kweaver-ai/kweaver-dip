import { trim } from 'lodash'
import { flowchartCheckUniqueness } from '@/core'
import { keyboardCharactersReg, nameReg } from '@/utils'
import __ from './locale'

/**
 * 流程图名称合法性校验
 * @returns
 */
export const validateFlowchartNameLegitimacy = () => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (!trimValue) {
                reject(new Error(__('输入不能为空')))
            }
            if (trimValue && !nameReg.test(trimValue)) {
                reject(new Error(__('仅支持中英文、数字、下划线及中划线')))
            }
            resolve(1)
        })
    }
}

/**
 * 流程图唯一性校验
 * @param mid number 业务模型ID
 * @param fid number 流程图ID
 * @param originName string? 流程图初始名称
 * @returns
 */
export const validateFlowchartUniqueness = (
    mid: string,
    fid: string,
    originName?: string,
) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (originName && originName === trimValue) {
                resolve(1)
                return
            }
            if (!trimValue) {
                reject(new Error(__('输入不能为空')))
                return
            }
            if (trimValue && !nameReg.test(trimValue)) {
                reject(new Error(__('仅支持中英文、数字、下划线及中划线')))
                return
            }
            const errorMsg = __('该流程图名称已存在，请重新输入')
            flowchartCheckUniqueness(mid, {
                name: value,
                id: fid,
            })
                .then(() => {
                    resolve(1)
                })
                .catch(() => {
                    reject(new Error(errorMsg))
                })
        })
    }
}

/**
 * 流程图描述合法性校验
 * @returns
 */
export const validateFlowchartDescLegitimacy = () => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            if (!value) {
                resolve(1)
            }
            if (!keyboardCharactersReg.test(value)) {
                reject(new Error(__('仅支持中英文、数字、及键盘上的特殊字符')))
            }
            resolve(1)
        })
    }
}
