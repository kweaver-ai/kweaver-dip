import { isUndefined } from 'lodash'

// 转换请求查询参数
export const transformQuery = ({
    isDraft,
    selectedVersion,
}: {
    isDraft?: boolean
    selectedVersion?: string
}) => {
    const params: Record<string, any> = {}

    if (!isUndefined(isDraft)) {
        params.is_draft = isDraft
    }

    if (
        !isUndefined(selectedVersion) &&
        selectedVersion !== '' &&
        selectedVersion !== 'undefined'
    ) {
        params.version_id = selectedVersion
    }

    return params
}

// 获取画布url
export const getDrawioUrl = ({
    isDraft,
    selectedVersion,
}: {
    isDraft?: boolean
    selectedVersion?: string
}) => {
    let url = ''
    if (!isUndefined(isDraft)) {
        url += `&isDraft=${isDraft}`
    }
    if (
        !isUndefined(selectedVersion) &&
        selectedVersion !== '' &&
        selectedVersion !== 'undefined'
    ) {
        url += `&versionId=${selectedVersion}`
    }
    return url
}

// 获取查询参数布尔值
export const getQueryBooleanValue = (value: string | null) => {
    if (value === 'true') {
        return true
    }
    if (value === 'false') {
        return false
    }
    return undefined
}

// 获取版本id
export const getVersionId = (value: string | null) => {
    if (
        value === '' ||
        value === 'undefined' ||
        value === null ||
        isUndefined(value)
    ) {
        return ''
    }
    return value
}
