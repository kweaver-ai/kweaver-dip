import __ from '../locale'
import { DepartmentOutlined, FontIcon, ThemeOutlined } from '@/icons'
import styles from '../styles.module.less'
import JSONCodeView from '@/ui/JSONCodeView'
import { IconType } from '@/icons/const'
import { PublishStatus, OnlineStatus, PolicyActionEnum } from '@/core'

// 业务逻辑实体列表项参数
export const itemOtherInfo = [
    // {
    //     firstKey: 'service_info',
    //     infoKey: 'online_time',
    //     type: 'timestamp',
    //     title: `${__('发布时间')} `,
    // },
    {
        firstKey: 'service_info',
        infoKey: 'subject_domain_name',
        title: <ThemeOutlined style={{ fontSize: 16 }} />,
        toolTipTitle: `${__('所属业务对象')}：`,
    },
    {
        firstKey: 'service_info',
        infoKey: 'department',
        title: (
            <DepartmentOutlined
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('所属部门')}：`,
    },
    // {
    //     firstKey: 'service_info',
    //     infoKey: 'owners',
    //     title: (
    //         <Icon
    //             component={userOutlined}
    //             className={styles.commonIcon}
    //             style={{ fontSize: 16 }}
    //         />
    //     ),
    //     toolTipTitle: `${__('数据Owner')}：`,
    // },
    // 接口权限不能给到用户，先屏蔽
    // {
    //     infoKey: 'access',
    //     title: (
    //         <FontIcon
    //             name="icon-ziyuanquanxian"
    //             className={styles.commonIcon}
    //             type={IconType.FONTICON}
    //             style={{ fontSize: 16, marginRight: '8px' }}
    //         />
    //     ),
    //     toolTipTitle: `${__('权限')}：`,
    // },
]

// 接口列表-卡片-参数详情项
export const interfaceCardParamsInfoList = [
    {
        label: __('接口地址：'),
        value: '',
        key: 'service_info',
        subKey: 'service_path',
        span: 24,
    },
    {
        label: __('接口协议：'),
        value: '',
        key: 'service_info',
        subKey: 'protocol',
        span: 12,
    },
    {
        label: __('请求方式：'),
        value: '',
        key: 'service_info',
        subKey: 'http_method',
        span: 12,
    },
    {
        label: __('返回类型：'),
        value: '',
        key: 'service_info',
        subKey: 'return_type',
        span: 12,
    },
    {
        label: __('调用频率：'),
        value: '',
        key: 'service_info',
        subKey: 'rate_limiting',
        span: 12,
        unit: __('次/秒'),
    },
    {
        label: __('超时时间：'),
        value: '',
        key: 'service_info',
        subKey: 'timeout',
        span: 24,
        unit: __('秒'),
    },
]

/**
 * 组装query
 */
export const combQuery = (queryData: string) => {
    try {
        const queryJSON = JSON.parse(queryData)
        if (queryData) {
            const queryString = Object.keys(queryJSON)
                .map((value) => `${value}=${queryJSON[value]}`)
                .join('&')
            return queryString ? `?${queryString}` : ''
        }
        return ''
    } catch (ex) {
        return ''
    }
}

// 接口详情-请求用例
export const getRequestParamExample = (
    method: string,
    applicationInfo: any,
) => {
    switch (method) {
        case 'get':
            return (
                <div className={styles.codeBox}>
                    {!applicationInfo?.service_info?.gateway_url &&
                    !applicationInfo?.service_info?.service_path
                        ? '--'
                        : `${applicationInfo?.service_info?.gateway_url}${
                              applicationInfo?.service_info?.service_path
                          }${combQuery(
                              applicationInfo?.service_test?.request_example,
                          )}`}
                </div>
            )
        default:
            return (
                <JSONCodeView
                    code={applicationInfo?.service_test?.request_example}
                    className={styles.codeBox}
                />
            )
    }
}

// 定义接口内容类型的枚举，用于标识接口的类型
export enum InterfaceContentType {
    // 参数属性
    PARAM_ATTR = 'param_attr',

    // 授权策略
    AUTH_POLICY = 'auth_policy',
}

// 定义了一个接口内容标签数组，用于UI界面的选项卡导航
export const InterfaceContentTabs = [
    {
        // 第一个标签，展示“参数信息”内容
        label: __('参数信息'),
        key: InterfaceContentType.PARAM_ATTR,
    },
    {
        // 第二个标签，展示“权限信息”内容
        label: __('权限信息'),
        key: InterfaceContentType.AUTH_POLICY,
    },
]

export const ActionText = {
    [PolicyActionEnum.View]: __('查看'),
    [PolicyActionEnum.Read]: __('读取'),
    [PolicyActionEnum.Download]: __('下载'),
    [PolicyActionEnum.Auth]: __('授权'),
    [PolicyActionEnum.Allocate]: __('授权(仅分配)'),
}

// 发布状态
export const publishStatus = [
    PublishStatus.PUBLISHED,
    PublishStatus.CHANGE_AUDITING,
    PublishStatus.CHANGE_REJECT,
]

// 上线状态
export const onlineStatus = [
    OnlineStatus.ONLINE,
    OnlineStatus.DOWN_AUDITING,
    OnlineStatus.DOWN_REJECT,
]

/**
 * 获取收藏禁用提示信息
 */
export const getDisabledTooltip = ({
    applicationInfo,
    action,
}: {
    applicationInfo: any
    action: 'favorite' | 'feedback'
}) => {
    const { service_info } = applicationInfo || {}

    // 检查发布状态
    const isPublished = publishStatus.includes(service_info?.publish_status)

    // 检查上线状态
    const isOnline = onlineStatus.includes(service_info?.status)

    // 如果未发布，提示未发布
    if (!isPublished) {
        return action === 'favorite'
            ? __('资源未发布，不能进行收藏')
            : __('资源未发布，不能进行反馈')
    }

    // 如果未上线，提示未上线
    if (!isOnline) {
        return action === 'favorite'
            ? __('资源未上线，不能进行收藏')
            : __('资源未上线，不能进行反馈')
    }

    return ''
}
