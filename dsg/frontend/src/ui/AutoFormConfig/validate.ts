import { trim } from 'lodash'
import { keyboardCharactersReg } from '@/utils'
import __ from '../locale'

/**
 * 描述，计量单位等校验
 */
const checkNormalInput = (rule, value) => {
    if (keyboardCharactersReg.test(trim(value))) {
        return Promise.resolve()
    }
    return Promise.reject(
        new Error(__('仅支持中英文、数字、及键盘上的特殊字符')),
    )
}

export { checkNormalInput }
