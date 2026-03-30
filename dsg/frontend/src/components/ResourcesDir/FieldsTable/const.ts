import {
    ErrorInfo,
    entendNameEnReg,
    keyboardInputValidator,
    keyboardReg,
    commReg,
    positiveIntegerReg,
    nameReg,
} from '@/utils'
import { fieldType } from '../const'
import __ from '../locale'

export const governmentKeys = [
    'source_system',
    'source_system_level',
    'info_item_level',
]
export const emptyCatalogValidateKeys = [
    'business_name',
    'technical_name',
    'source_id',
    'open_type',
    'shared_type',
    'sensitive_flag',
    'classified_flag',
]

export const validateRuleInfoItem = {
    business_name: {
        pattern: keyboardReg,
        message: ErrorInfo.EXCEPTEMOJI,
    },
    technical_name: {
        pattern: keyboardReg,
        message: __('输入不能为空'),
    },
    data_type: {
        nullMsg: __('请选择数据类型'),
    },
    data_length: {
        [fieldType.int]: {
            max: 38,
            message: __('请输入1~38之间的整数'),
        },
        [fieldType.char]: {
            max: 65535,
            message: __('请输入1～65535之间的整数'),
        },
    },
    // 不可删除，key用于校验
    data_range: {},
    shared_type: {
        nullMsg: __('请选择共享属性'),
    },
    // shared_condition: {
    //     nullMsg: __('请输入共享条件'),
    //     pattern: keyboardReg,
    //     message: ErrorInfo.EXCEPTEMOJI,
    // },
    open_type: {
        nullMsg: __('请选择开放属性'),
    },
    // open_condition: {
    //     nullMsg: __('请输入开放条件'),
    //     pattern: keyboardReg,
    //     message: ErrorInfo.EXCEPTEMOJI,
    // },
    sensitive_flag: {
        nullMsg: __('请选择敏感属性'),
    },
    classified_flag: {
        nullMsg: __('请选择涉密属性'),
    },
}
