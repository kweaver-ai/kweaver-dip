import { downloadFileBlob, getActualUrl } from '@/utils'

export const downloadApiFile = async () => {
    const url =
        process.env.NODE_ENV === 'development'
            ? `/downloadFiles/RESTfulAPI.zip`
            : getActualUrl('/downloadFiles/RESTfulAPI.zip', false)
    downloadFileBlob({
        url,
        type: 'zip',
        fileName: 'RESTfulAPI',
    })
}
