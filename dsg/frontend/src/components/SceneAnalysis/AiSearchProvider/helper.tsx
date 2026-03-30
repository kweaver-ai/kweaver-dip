import __ from './locale'

export const transformExpand = (data: any, expandCount = 10) => {
    const isExpand = data?.children?.length <= expandCount
    const child = data?.children?.map((n) => transformExpand(n, expandCount))
    return {
        ...data,
        isExpand,
        children: isExpand ? child : undefined,
        tempChild: child,
    }
}

// 引用详情
export interface ICiteItem {
    // id
    id: string

    // 名称
    title: string

    // code
    code: string

    // 类型
    type: string

    // 描述
    description: string
}

// 回答状态
export const enum QAStatus {
    // 加载中
    Loading = 'loading',

    // 正在匹配相关资源
    Search = 'search',

    // 正在调取资源
    Invoke = 'invoke',

    // 回答中
    Answer = 'answer',

    // 回答结束
    Ending = 'ending',

    // 错误
    Error = 'error',
}

// 获取加载状态提示语
export const getStatusMessage = (loadingStatus: QAStatus) => {
    switch (loadingStatus) {
        case QAStatus.Loading:
            return __('加载中')

        case QAStatus.Search:
            return __('正在匹配相关资源')

        case QAStatus.Invoke:
            return __('正在调取资源')

        default:
            return ''
    }
}
// 评价状态
export const enum FeedbackAction {
    // 点赞
    Like = 'like',

    // 取消点赞
    CancelLike = 'cancel-like',

    // 不准确/点踩
    Dislike = 'dislike',

    // 取消点踩
    CancelDislike = 'cancel-dislike',
}

// 初始评价状态
export const initFeedback = {
    // 赞
    like: FeedbackAction.CancelLike,

    // 不准确
    dislike: FeedbackAction.CancelDislike,
}

export const mergeArr = (array1, array2) => {
    const mergedArray = array1.reduce((acc, item1) => {
        const item2 = array2.find((item) => item.id === item1.id)
        if (item2) {
            acc.push({
                ...item1,
                ...item2,
                type: item1.type,
                fields: item1.fields,
            })
        } else {
            acc.push(item1)
        }
        return acc
    }, [])
    return mergedArray
}
