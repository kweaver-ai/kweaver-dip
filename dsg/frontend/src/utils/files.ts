import Cookies from 'js-cookie'
import { formatError } from '@/core/errors/formatError'

// 需要在post请求配置 第三个参数{responseType: 'arraybuffer'},
export const streamToFile = (res: any, fileName?: string) => {
    const b = new Blob([res], {
        type: 'application/octet-stream',
    })
    // 根据传入的参数b创建一个指向该参数对象的URL
    const url = URL.createObjectURL(b)
    const link = document.createElement('a')
    // 设置导出的文件名
    if (fileName) {
        link.download = fileName
    }
    link.href = url
    // 点击获取文件
    link.click()
}

export const downloadFile = async (url: string, fileName?: string) => {
    const link = document.createElement('a')
    link.href = url
    if (fileName) {
        link.download = fileName
    }
    link.click()
}

interface IDownloadFileBlob {
    url: string
    fileName?: string
    realIp?: string
    type?: string
    token?: string
}

export const downloadFileBlob = async ({
    url,
    fileName,
    realIp,
    type,
    token,
}: IDownloadFileBlob) => {
    const xhr = new XMLHttpRequest()
    let linkUrl = `${url}${
        url.indexOf('?') >= 0 ? '&' : '?'
    }t=${new Date().valueOf()}`

    if (realIp) {
        linkUrl = realIp + linkUrl
    }

    xhr.open('GET', linkUrl, true)
    xhr.setRequestHeader('Content-Type', `application/${type};chartset=UTF-8`)
    if (token) {
        xhr.setRequestHeader('Authorization', token)
    }
    xhr.setRequestHeader('If-Modified-Since', '0')
    xhr.responseType = 'blob'
    xhr.onload = () => {
        if (xhr.status === 200) {
            const blob = xhr.response
            const link = document.createElement('a')
            link.style.display = 'none'
            let href = blob
            if (typeof blob === 'string') {
                link.target = '_blank'
            } else {
                href = window.URL.createObjectURL(blob)
            }

            link.href = href
            link.setAttribute('download', `${fileName}.${type}`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            if (typeof blob !== 'string') {
                window.URL.revokeObjectURL(href)
            }
        }
    }
    xhr.send()
}

/**
 * 获取文件后缀
 * @param filename 文件名
 * @returns 后缀
 */
export const getFileExtension = (filename) => {
    return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)![0] : undefined
}

export const getOssResourceUrl = async (id: string) => {
    try {
        const response = await fetch(`/api/task-center/v1/oss/${id}`, {
            headers: {
                Authorization: `Bearer ${Cookies.get('af.oauth2_token') || ''}`,
            },
        })
        const blob = await response.blob()
        return URL.createObjectURL(blob)
    } catch (error) {
        formatError(error)
        return ''
    }
}

export const getConfigCenterOssResourceUrl = async (
    id: string,
    returnBlob?: boolean,
) => {
    try {
        const response = await fetch(
            `/api/configuration-center/v1/carousels/oss/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${
                        Cookies.get('af.oauth2_token') || ''
                    }`,
                },
            },
        )
        const blob: any = await response.blob()
        return returnBlob ? blob : URL.createObjectURL(blob)
    } catch (error) {
        formatError(error)
        return ''
    }
}

/**
 * 解析 content-disposition 头部中的文件名
 * @param contentDisposition content-disposition 头部值
 * @returns 解码后的文件名
 */
const parseFileName = (contentDisposition: string): string => {
    // 处理 filename*=utf-8''encoded-filename 格式
    const filenameStarMatch = contentDisposition.match(
        /filename\*=utf-8''(.+)/i,
    )
    if (filenameStarMatch) {
        try {
            return decodeURIComponent(filenameStarMatch[1])
        } catch (e) {
            // console.warn('Failed to decode filename:', e)
        }
    }

    // 处理 filename="filename" 格式
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
    if (filenameMatch) {
        return filenameMatch[1]
    }

    return 'download.pdf'
}

/**
 * 下载PDF文件
 * @param res 响应数据 (需要配置 responseType: 'arraybuffer')
 * @param contentDisposition response header中的content-disposition值
 * @param fileName 可选的自定义文件名，如果不提供则从content-disposition中解析
 */
export const downloadPdf = (
    res: any,
    contentDisposition?: string,
    fileName?: string,
) => {
    // 如果没有提供自定义文件名，则从content-disposition中解析
    let finalFileName = fileName
    if (!finalFileName && contentDisposition) {
        finalFileName = parseFileName(contentDisposition)
    }
    if (!finalFileName) {
        finalFileName = 'download.pdf'
    }

    // 创建PDF类型的Blob
    const blob = new Blob([res], {
        type: 'application/pdf',
    })

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = finalFileName
    link.href = url
    link.style.display = 'none'

    // 添加到DOM并触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
