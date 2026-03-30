/**
 * 批量发起请求，获取成功失败的进度
 */
export const scheduleReq = <T = any>(opts: {
    /**
     * 发起请求的参数，需要是一个数组，按序传给请求函数
     */
    params: T[]
    /**
     * 请求函数，接受上面的参数
     */
    request: { (args: T): Promise<any> }
    /**
     * 请求成功的回调，参数分别为当前处于哪个请求以及多少个请求成功返回
     */
    onSuccess: { (current: number, success: number): void }
    /**
     * 失败请求的回调方法，参数为失败请求的参数
     */
    onFail?: { (errParams: T): void }
    onCompleted?: { (): void }
}) => {
    const { params, request, onSuccess, onFail, onCompleted } = opts
    let successReq = 0
    let completeReq = 0
    const totalReq = params.length

    for (let i = 0; i < totalReq; i += 1) {
        request(params[i])
            // eslint-disable-next-line no-loop-func
            .then(() => {
                successReq += 1
                onSuccess(i, successReq)
            })
            // eslint-disable-next-line no-loop-func
            .catch(() => {
                if (onFail) {
                    onFail(params[i])
                }
            })
            // eslint-disable-next-line no-loop-func
            .finally(() => {
                completeReq += 1
                if (completeReq === totalReq && onCompleted) {
                    onCompleted()
                }
            })
    }
}
