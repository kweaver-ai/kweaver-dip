import moment from 'moment'
import { DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { getActualUrl } from '@/utils'
import __ from './locale'
import { ITabsList } from './const'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

export enum TabKey {
    // 数据资源
    AvailableAssets = 'availableAssets',
    // 我的需求
    MyDemand = 'myDemand',
    // 审核待办
    AuditPending = 'doc-audit-client',
    // 集成应用
    Application = 'application',
    // 我的收藏
    Favorite = 'favorite',
    // 我的数据集
    Dataset = 'dataset',
    // 我的反馈
    Feedback = 'feedback',
    // 我的评分
    Score = 'score',
    // 积分概览
    Integral = 'integral',
    // 我的消息
    Message = 'message',
}

export const TabsList: ITabsList[] = [
    // {
    //     label: __('数据资源'),
    //     key: TabKey.AvailableAssets,
    //     icon: <FontIcon name="icon-shujuziyuan" type={IconType.COLOREDICON} />,
    // },
    // { label: __('我管理的资源'), key: 'manageAssets' },
    // {
    //     label: __('我授权的资源'),
    //     key: 'authorizationAssets',

    // },
    // {
    //     label: __('资源申请记录'),
    //     key: 'applicationAsset',
    //     hasTopLine: true,
    //     icon: <ApplicationAssetColored />,
    // },
    // { label: __('资源收藏'), key: 'collectAsset' },
    // { label: __('我的任务'), key: 'myTask' },
    // {
    //     label: __('我的需求'),
    //     key: TabKey.MyDemand,
    //     icon: <FontIcon name="icon-wodexuqiu" type={IconType.COLOREDICON} />,
    // },
    {
        label: __('审核待办'),
        key: TabKey.AuditPending,
        icon: <FontIcon name="icon-shenhedaiban" type={IconType.COLOREDICON} />,
    },
    // {
    //     label: __('我的应用'),
    //     key: TabKey.Application,
    //     icon: (
    //         <FontIcon
    //             name="icon-jichengyingyongziyuan"
    //             type={IconType.COLOREDICON}
    //         />
    //     ),
    // },
    {
        label: __('我的收藏'),
        key: TabKey.Favorite,
        icon: <FontIcon name="icon-wodeshoucang" type={IconType.COLOREDICON} />,
    },
    {
        label: __('我的数据集'),
        key: TabKey.Dataset,
        icon: <FontIcon name="icon-wodeshujuji" type={IconType.COLOREDICON} />,
    },
    {
        label: __('我的反馈'),
        key: TabKey.Feedback,
        icon: <FontIcon name="icon-wodefankui" type={IconType.COLOREDICON} />,
    },
    {
        label: __('我的评分'),
        key: TabKey.Score,
        icon: <FontIcon name="icon-wodepingfen" type={IconType.COLOREDICON} />,
    },
    {
        label: __('积分概览'),
        key: TabKey.Integral,
        icon: <FontIcon name="icon-jifenjilu" type={IconType.COLOREDICON} />,
    },
    {
        label: __('我的消息'),
        key: TabKey.Message,
        icon: <FontIcon name="icon-wodexiaoxi" type={IconType.COLOREDICON} />,
    },
]

export const copyToClipboard = (str: string) => {
    return navigator?.clipboard?.writeText(str).catch((err) => {
        const el = document.createElement('textarea')
        el.value = str
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
    })
}

// 时间戳->日期
export const stampFormatToDate = (timeStamp?: number) => {
    if (timeStamp) {
        return moment(timeStamp)
    }
    return null
}
export const disabledDate = (current: any, values: any) => {
    const expandStartTime =
        values?.start_time > 0 && current < moment(values?.start_time)
    const expandEndTime =
        values?.end_time > 0 && current > moment(values?.end_time)

    return current > moment().add(0, 'days') || expandStartTime || expandEndTime
}
