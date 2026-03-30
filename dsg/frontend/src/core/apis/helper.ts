/**
 * api 的参数转换
 */
import { omit } from 'lodash'

export const handleParams = (tmpParams: {}, key: string, val: string) => {
    let tmp = { ...tmpParams }
    if (val === 'uncategory') {
        tmp[key] = ''
    } else if (val === '') {
        tmp = omit(tmp, key)
    }
    return tmp
}
