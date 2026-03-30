/* eslint-disable */
import {
    nameReg,
    numberReg,
    emojiReg,
    keyboardCharactersReg,
    ipV6Reg,
} from '@/utils/regExp'
import { trim } from 'lodash'

export const roleNameValidator = (
    isRepeat = false,
    requiredMessage = '输入不能为空',
    message = '支持中英文、数字、下划线及中划线',
    repeatMessage = '角色名称不能重复',
) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            if (!value) {
                reject(requiredMessage)
            }
            if (!nameReg.test(value)) {
                reject(message)
            }
            if (isRepeat) {
                reject(repeatMessage)
            }
            resolve(1)
        })
    }
}

export const roleDescValidator = (
    message = '支持中英文、数字及键盘上的特殊符号',
) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            if (emojiReg.test(value)) {
                reject(message)
            } else {
                resolve(1)
            }
        })
    }
}

export const keyboardInputValidator = (
    message = '支持中英文、数字及键盘上的特殊符号',
) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            if (!keyboardCharactersReg.test(trim(value))) {
                reject(message)
            } else {
                resolve(1)
            }
        })
    }
}

/**
 * 文本合法性校验
 * @param reg RegExp 校验规则
 * @param msg string 错误信息
 * @returns
 */
export const validateTextLegitimacy = (reg: RegExp, msg: string) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            if (!value) {
                resolve(1)
            }
            if (!reg.test(value)) {
                reject(new Error(msg))
            }
            resolve(1)
        })
    }
}

/**
 * 名称校验（中英文、数字、下划线及中划线）
 * @returns
 */
export const validateEnNullName = () => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (trimValue && !nameReg.test(trimValue)) {
                reject(new Error('仅支持中英文、数字、下划线及中划线'))
            }
            resolve(1)
        })
    }
}
/**
 * 名称校验（空、中英文、数字、下划线及中划线）
 * @returns
 */
export const validateName = () => {
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
 * 名称校验（空、中英文、数字、下划线及中划线）
 * @returns
 */
export const validateCascader = () => {
    return (_: any, value: any) => {
        return new Promise((resolve, reject) => {
            if (Array.isArray(value) && value[0] && value[1]) {
                resolve(1)
            } else {
                reject(new Error('请选择字段'))
            }
            reject(new Error('请选择字段'))
        })
    }
}
/**
 * 名称校验（空、中英文、数字、下划线及中划线）
 * @returns
 */
export const validateGroupCascader = (form, index) => {
    return (_: any, value: any) => {
        const values = form.getFieldsValue()
        const { group } = values
        return new Promise((resolve, reject) => {
            if (
                group.length === 2 &&
                group[0].field_id?.[1] === group[1].field_id?.[1] &&
                index === 1
            ) {
                reject(new Error('不允许同样的表重复字段进行分组'))
            }
            if (Array.isArray(value) && value?.[0] && value?.[1]) {
                resolve(1)
            } else {
                reject(new Error('请选择字段名称'))
            }
            reject(new Error('请选择字段名称'))
        })
    }
}

/**
 * 空校验
 * @param msg string 错误信息
 * @returns
 */
export const validateEmpty = (msg: string) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (!trimValue) {
                reject(new Error(msg))
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
 * 校验重名
 * @param action 调用接口查询是否重名
 * @param repeatMessage 提示信息
 * @param params 接口请求参数
 * @param validateMsg 接口返回错误信息提示
 * @param showBackendTips 是否显示接口返回错误信息
 * @param nameRegFlag 是否启用名称校验规则
 * @param maxLength 超过字符长度，不调用接口
 * @returns
 */
export const nameRepeatValidator = ({
    action,
    params = {},
    repeatMessage = '名称不能重复',
    validateMsg = '请求参数错误',
    showBackendTips = false,
    nameRegFlag = false,
    maxLength = 0,
    throwErrorCallback,
}: any) => {
    return (_: any, name: string) => {
        return new Promise((resolve, reject) => {
            if (!name) {
                resolve(1)
            } else if (nameRegFlag && !nameReg.test(name)) {
                reject(new Error(validateMsg))
            } else {
                if (maxLength && maxLength > 0 && name.length > maxLength) {
                    return
                }
                action({ ...params, name })
                    .then((res) => {
                        if (res.repeat) {
                            reject(repeatMessage)
                        }
                        resolve(1)
                    })
                    .catch((e) => {
                        if (throwErrorCallback) {
                            resolve(1)
                            throwErrorCallback?.(e)
                            return
                        }
                        reject(
                            new Error(
                                showBackendTips
                                    ? e?.data?.description
                                    : validateMsg,
                            ),
                        )
                    })
            }
        })
    }
}

// 校验限定的值
export const validateLimitNumber = (e, value, fieldValue) => {
    const { operator } = fieldValue
    return new Promise((resolve, reject) => {
        if (operator === 'null') {
            resolve(1)
        }
        const trimValue = trim(value)
        if (!trimValue) {
            reject(new Error('输入不能为空'))
        }
        if (trimValue && !numberReg.test(trimValue)) {
            reject(new Error('仅支持数字'))
        }
        resolve(1)
    })
}
// 校验限定的值
export const validateLimitString = (e, value, fieldValue) => {
    const { operator } = fieldValue
    return new Promise((resolve, reject) => {
        if (operator === 'null') {
            resolve(1)
        }
        const trimValue = trim(value)
        if (!trimValue) {
            reject(new Error('输入不能为空'))
        }
        // if (trimValue && !nameReg.test(trimValue)) {
        //     reject(new Error('仅支持中英文、数字、下划线及中划线'))
        // }
        resolve(1)
    })
}

export const validateNumber = () => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (!trimValue) {
                reject(new Error('输入不能为空'))
            }
            const num = Number(value)
            if (num < 1 || num > 65535 || !Number.isInteger(num)) {
                return reject('仅支持输入1~65535整数')
            }
            return resolve(1)
        })
    }
}
export const validatePort = () => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (!trimValue) {
                reject(new Error('请输入连接地址'))
            }
            // if (trimValue && !ipV6Reg.test(trimValue)) {
            //     reject(new Error(' 仅支持英文、数字、点及冒号'))
            // }
            return resolve(1)
        })
    }
}
