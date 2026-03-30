import Icon from '@ant-design/icons'
import { ReactComponent as businessSystem } from '@/icons/svg/outlined/businessSystem.svg'
import { ReactComponent as library } from '@/assets/DataAssetsCatlg/library.svg'
import { ReactComponent as buildTree } from '@/assets/DataAssetsCatlg/buildTree.svg'
import { ReactComponent as userOutlined } from '@/assets/DataAssetsCatlg/userOutlined.svg'
import { DepartmentOutlined } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import qaColored from '@/assets/qaColored.png'
import qa from '@/assets/qa.png'

// 业务逻辑实体列表项参数
export const itemOtherInfo = [
    {
        infoKey: 'published_at',
        type: 'timestamp',
        title: `${__('更新于')} `,
    },
    {
        infoKey: 'system_name',
        title: (
            <Icon
                component={businessSystem}
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('信息系统')}：`,
    },
    {
        infoKey: 'data_source_name',
        title: (
            <Icon
                component={library}
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('数据源')}：`,
    },
    {
        infoKey: 'schema_name',
        title: (
            <Icon
                component={buildTree}
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('Schema')}：`,
    },
    {
        infoKey: 'owner_name',
        title: (
            <Icon
                component={userOutlined}
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('数据Owner')}：`,
    },
    {
        infoKey: 'orgname',
        title: (
            <DepartmentOutlined
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('所属部门')}：`,
    },
]

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

// 回答状态
export const enum QAStatus {
    // 无
    Block = 'block',

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

// 问答 tab item
export const answersTabItem = (colored: boolean = true) => {
    return {
        key: 'answers',
        label: (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                }}
            >
                <img
                    src={colored ? qaColored : qa}
                    alt=""
                    style={{
                        margin: '1px 6px -1px 0',
                        width: 24,
                    }}
                />
                <span style={{ lineHeight: '24px' }}>{__('问答')}</span>
            </div>
        ),
    }
}
