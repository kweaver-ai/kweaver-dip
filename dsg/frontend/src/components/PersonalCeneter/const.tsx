import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import __ from './locale'
import MyFavoriteList from '../Favorite'
import AssetsVisitorList from '../MyAssets/AssetsVisitorList'
import MyScore from '../MyAssets/MyScore'
import IntegralPreview from '../MyAssets/IntegralPreview'
import MyMessages from '../MyMessages'
import { MyFeedbackList } from '../DataCatalogFeedback'
import MyApplication from './MyApplication'
import MyDataset from '../Dataset'
import AvailableAsset from '../MyAssets/AvailableAsset'
import DocAuditClient from './DocAuditClient'
import App from '../MyAssets/App'
import MyResForCS from '../MyAssets/MyResForCS'
import ResForApply from '../MyAssets/MyResForCS/ResForApply'
import ResForDep from '../MyAssets/MyResForCS/ResForDep'

export const menus = [
    // {
    //     label: __('我的资源'),
    //     key: 'myAssets',
    //     icon: <FontIcon name="icon-shujuziyuan" type={IconType.COLOREDICON} />,
    // },
    // {
    //     label: __('我的资源'),
    //     key: 'myResForCS',
    //     icon: <FontIcon name="icon-shujuziyuan" type={IconType.COLOREDICON} />,
    //     children: [
    //         {
    //             label: __('申请通过的'),
    //             key: 'apply',
    //         },
    //         {
    //             label: __('本部门的'),
    //             key: 'department',
    //         },
    //     ],
    // },
    {
        label: __('我的收藏'),
        key: 'myCollections',
        icon: <FontIcon name="icon-wodeshoucang" type={IconType.COLOREDICON} />,
    },
    // {
    //     label: __('我的数据集'),
    //     key: 'myDataset',
    //     icon: <FontIcon name="icon-wodeshujuji" type={IconType.COLOREDICON} />,
    // },
    // {
    //     label: __('我的申请'),
    //     key: 'myApplys',
    //     icon: <FontIcon name="icon-wodexuqiu" type={IconType.COLOREDICON} />,
    // },
    {
        label: __('审核待办'),
        key: 'docAuditClient',
        icon: <FontIcon name="icon-shenhedaiban" type={IconType.COLOREDICON} />,
    },
    // {
    //     label: __('我的应用'),
    //     key: 'integratedApp',
    //     icon: (
    //         <FontIcon
    //             name="icon-jichengyingyongziyuan"
    //             type={IconType.COLOREDICON}
    //         />
    //     ),
    // },
    {
        label: __('我的反馈'),
        key: 'myFeedback',
        icon: <FontIcon name="icon-wodefankui" type={IconType.COLOREDICON} />,
    },
    {
        label: __('我的评分'),
        key: 'myRating',
        icon: <FontIcon name="icon-wodepingfen" type={IconType.COLOREDICON} />,
    },
    // {
    //     label: __('我的消息'),
    //     key: 'myMsg',
    //     icon: <FontIcon name="icon-wodexiaoxi" type={IconType.COLOREDICON} />,
    // },
    // {
    //     label: __('积分概览'),
    //     key: 'pointsOverview',
    //     icon: <FontIcon name="icon-jifenjilu" type={IconType.COLOREDICON} />,
    // },
]

export const routes = [
    {
        key: 'myAssets',
        element: AvailableAsset,
    },
    // {
    //     key: 'myResForCS',
    //     element: MyResForCS,
    // },
    {
        key: 'apply',
        element: ResForApply,
    },
    {
        key: 'department',
        element: ResForDep,
    },
    {
        key: 'department',
        element: MyResForCS,
        props: (params: any) => params,
    },
    {
        key: 'myApplys',
        element: MyApplication,
    },
    {
        key: 'myCollections',
        element: MyFavoriteList,
    },
    {
        key: 'docAuditClient',
        element: DocAuditClient,
    },
    {
        key: 'myDataset',
        element: MyDataset,
    },
    {
        key: 'integratedApp',
        // element: AssetsVisitorList,
        element: App,
        props: (params: any) => params,
    },
    {
        key: 'myMsg',
        element: MyMessages,
        props: (params: any) => params,
    },
    {
        key: 'myFeedback',
        element: MyFeedbackList,
    },
    {
        key: 'myRating',
        element: MyScore,
    },
    {
        key: 'pointsOverview',
        element: IntegralPreview,
    },
]
