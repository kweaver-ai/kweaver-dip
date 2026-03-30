/* eslint-disable */

// 支持中文、英文、数字、下划线及中划线,且不能以下划线和中划线开头
export const commReg =
    /^[\u4e00-\u9fa5a-zA-Z0-9][a-zA-Z0-9-_\u4e00-\u9fa5]{0,}$/

// 支持中英文、数字、下划线及中划线
export const nameReg = /^[-a-zA-Z0-9_\u4e00-\u9fa5]+$/

// 支持中英文、数字、下划线、分号及中划线
export const infoItemReg = /^[-a-zA-Z0-9_;\u4e00-\u9fa5]+$/

// 支持中文、数字、下划线及中划线,且不能以下划线和中划线开头
export const nameCnReg = /^[\u4e00-\u9fa50-9][0-9-_\u4e00-\u9fa5]{0,}$/

// 支持英文、数字、下划线
export const nameEnReg = /^[a-zA-Z0-9_-]+$/

// 支持中文、英文、数字、下划线及中划线,且不能以下划线和中划线开头,如数据元-同义词字段，用'，'分隔开
export const commRegWithChineseComma =
    /^[\u4e00-\u9fa5a-zA-Z0-9][a-zA-Z0-9-_\u4e00-\u9fa5，]{0,}$/

// 表情
export const emojiReg =
    /[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[\A9|\AE]\u3030|\uA9|\uAE|\u3030/gi

// 键盘上允许输入的字符
export const keyboardCharactersReg =
    /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\\\\s]*$/

// 键盘上允许输入的字符允许空格
export const keyboardReg =
    /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/

// 键盘上允许输入的字符允许空格、回车
export const keyboardRegEnter =
    /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s\n]+$/

// 数字
export const numberReg = /^\d+$/

// 以0开始
export const beginWith0 = /\b(0+)/gi

// 支持中英文、数字、下划线及中划线,且不能以下划线和中划线开头
export const extendNameCnReg =
    /^[\u4e00-\u9fa5a-zA-Z0-9][a-zA-Z0-9-_\u4e00-\u9fa5]{0,}$/

// 支持英文、数字、下划线、中划线，且不能以下划线和中划线开头
export const entendNameEnReg = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,}$/

// 支持英文、数字、下划线、中划线，且不能以下划线开头(如用于码表码值校验)
export const entendEnumEnReg = /^[a-zA-Z0-9-][a-zA-Z0-9_-]{0,}$/

export const uniformCreditCodeReg =
    /^([0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}|[1-9]\d{14})$/

export const phoneNumberReg = /^[0-9-+]{3,20}$/
// 支持英文、数字、下划线、中划线，且必须以字母开头
export const enBeginNameReg = /^[a-zA-Z][a-zA-Z0-9_-]{0,}$/

// 支持中文、英文、数字
export const cnOrEnBeginAndNumberName = /^[\u4e00-\u9fa5a-zA-Z0-9]*$/

// 仅支持英文、数字以及键盘上的特殊字符，且只能以 （/）开头
export const pathNameReg =
    /^([\/]+[!-~a-zA-Z0-9_！￥……（）——“”：；，。？、‘’《》｛｝【】·\\\\s]+\/?)+$/
export const beginningIsNotASlashReg =
    /^([!-.~a-zA-Z0-9_！￥……（）——“”：；，。？、‘’《》｛｝【】·]+\/?)+$/

// 邮箱
export const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// 身份证
export const icReg = /^(\d{15}|\d{17}[0-9Xx])$/

// 正整数
export const positiveIntegerReg = /^[1-9]\d*$/

// ip地址
export const ipReg =
    /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/

// 支持中英文、数字、下划线、中划线、点、斜杠及冒号
export const cnEnPathReg = /^[-a-zA-Z0-9./\[\]\-:]+$/

// ipV6地址
export const ipV6Reg = /^[a-zA-Z0-9.:]+$/

// 支持英文、数字、下划线，且必须以字母开头
export const enBeginNameRegNew = /^[a-zA-Z][a-zA-Z0-9_]{0,}$/

// 仅支持英文数字
export const codeIDReg = /^[a-zA-Z0-9\-]+$/
// 千分位分隔
export const thousandsReg = /(\d)(?=(\d{3})+\.)/g

// 支持小写字母、数字及下划线，且不能以数字开头
export const lowercaseEnNumNameReg = /^[a-z_][a-z0-9_]{0,}$/

// 支持中文、小写字母、数字及下划线，且不能以数字开头
export const cnLowercaseEnNumNameReg =
    /^[\u4e00-\u9fa5a-z_][\u4e00-\u9fa5a-z0-9_]{0,}$/
// 英文月份
export const monthsReg =
    /^(January|Jan|February|Feb|March|Mar|April|Apr|May|June|Jun|July|Jul|August|Aug|September|Sep|Sept|October|Oct|November|Nov|December|Dec)(?=\s|$)/i
// 校验中文
export const chineseReg = /[\u4e00-\u9fa5]+/g

// 支持中文、英文
export const chineseEnglishReg = /^[A-Za-z\u4e00-\u9fa5]+$/
// 不能包含 空格 或 \ / : * ? " < > | 特殊字符,
export const invalidCharsRegex = /^[^\\/:*?"<>| ]*$/
// 不能包含 \ / : * ? " < > | 特殊字符,
export const invalidCharsRegex2 = /^[^\\/:*?"<>|]*$/

/**
 * 密码校验
 * 只能包含 英文、数字或 ~！%#$@-！字符，长度范围6~100个字符
 */
export const passwordCharsRegex = /^[A-Za-z0-9~！%#$@-！]{6,100}$/

// 仅支持英文数字
export const wordNumberRegex = /^[a-zA-Z0-9]+$/

// excel单元格范围
export const excelCellRangeRegex = /^[A-Z]{1,2}[1-9][0-9]*$/
// excel数据元技术名称校验
export const excelTechnicalNameReg = /^[^\\/:*?"<>|A-Z]+$/

// 数据模型名称校验
export const dataModelNameReg = /^[a-zA-Z]+[a-zA-Z0-9_]*$/

// 支持中英文、数字、下划线及中划线
export const modelBusinessNameReg = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/

// 不包含\的正则
export const notBackslashReg = /^[^\\]+$/
