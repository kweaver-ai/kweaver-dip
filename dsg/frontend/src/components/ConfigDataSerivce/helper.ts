import e from 'express'
import { trim } from 'lodash'

const getExp = (reg: string) => {
    return new RegExp(reg)
}
const rulersReg = {
    // 精准匹配
    Equal: getExp('='),

    // 模糊匹配
    Like: getExp('\\slike\\s'),

    // 不等于
    Neq: getExp('!='),

    // 大于
    Greater: getExp('>'),

    // 大于等于
    GreaterEqual: getExp('>='),

    // 小于
    Less: getExp('<'),

    // 小于等于
    LessEqual: getExp('<='),

    // 包含
    Includes: getExp('\\sin\\s'),

    // 不包含
    Excludes: getExp('\\snot\\sin\\s'),
}

export const splitRulerData = (rulerString: string) => {
    let rulerData

    switch (true) {
        case rulerString.split(rulersReg.Like).length === 2:
            rulerData = rulerString.split(rulersReg.Like)
            return {
                param: trim(rulerData[0]),
                operator: 'like',
                value: trim(rulerData[1]),
            }
        case rulerString.split(rulersReg.Neq).length === 2:
            rulerData = rulerString.split(rulersReg.Neq)
            return {
                param: trim(rulerData[0]),
                operator: '!=',
                value: trim(rulerData[1]),
            }
        case rulerString.split(rulersReg.GreaterEqual).length === 2:
            rulerData = rulerString.split(rulersReg.GreaterEqual)
            return {
                param: trim(rulerData[0]),
                operator: '>=',
                value: trim(rulerData[1]),
            }
        case rulerString.split(rulersReg.LessEqual).length === 2:
            rulerData = rulerString.split(rulersReg.LessEqual)
            return {
                param: trim(rulerData[0]),
                operator: '<=',
                value: trim(rulerData[1]),
            }
        case rulerString.split(rulersReg.Excludes).length === 2:
            rulerData = rulerString.split(rulersReg.Excludes)
            return {
                param: trim(rulerData[0]),
                operator: 'not in',
                value: trim(rulerData[1]),
            }
        case rulerString.split(rulersReg.Includes).length === 2:
            rulerData = rulerString.split(rulersReg.Includes)
            return {
                param: trim(rulerData[0]),
                operator: 'in',
                value: trim(rulerData[1]),
            }
        case rulerString.split(rulersReg.Equal).length === 2:
            rulerData = rulerString.split(rulersReg.Equal)
            return {
                param: trim(rulerData[0]),
                operator: '=',
                value: trim(rulerData[1]),
            }
        case rulerString.split(rulersReg.Greater).length === 2:
            rulerData = rulerString.split(rulersReg.Greater)
            return {
                param: trim(rulerData[0]),
                operator: '>',
                value: trim(rulerData[1]),
            }
        case rulerString.split(rulersReg.Less).length === 2:
            rulerData = rulerString.split(rulersReg.Less)
            return {
                param: trim(rulerData[0]),
                operator: '<',
                value: trim(rulerData[1]),
            }

        default:
            return ''
    }
}

export const checkCategoryExist = (data, id) => {
    let dataExistId = data.find((currentData) => currentData.id === id)
    if (dataExistId) {
        return true
    }
    dataExistId = data.find((currentData) => {
        if (currentData?.children && currentData?.children?.length) {
            return checkCategoryExist(currentData.children, id)
        }
        return false
    })
    return !!dataExistId
}
