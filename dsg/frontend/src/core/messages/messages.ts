import { message } from 'antd'

export const messageError = (errorContent) => {
    return message.error({ content: errorContent, duration: 5 })
}

export const messageInfo = (infoContent) => {
    return message.info({ content: infoContent, duration: 5 })
}

export const messageSuccess = (infoContent) => {
    return message.success({ content: infoContent, duration: 3 })
}
