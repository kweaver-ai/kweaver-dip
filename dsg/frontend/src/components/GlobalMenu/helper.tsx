import {
    ConfigCenterOutlined,
    ConfigCenterSideOutlined,
    HomeOutlined,
    HomeColored,
    AssetsViewOutlined,
    AssetsViewColored,
    DataAssetsNewOutlined,
    DataAssetsColored,
    MyAssetsColored,
    MyAssetsOutlined,
    WorkCenterOutlined,
    WorkCenterColored,
    OperationCenterOutlined,
    OperationCenterColored,
} from '@/icons'
import __ from './locale'
import ShenJiZhongXinColored from '@/icons/ShenJiZhongXinColored'
import ShenJiZhongXinOutlined from '@/icons/ShenJiZhongXinOutlined'

// /**
//  * 全局菜单
//  * 优先使用自身label、path，自身没有，根据key在otherMenusItems中查找对应的路由
//  * 全局菜单<GlobalMenu />中使用的菜单列表
//  * detailKey：部分菜单详情路由key，解决进入详情后，全局菜单缺少选中
//  */
// export const globalMenuList = [
//     {
//         key: 'asset-center',
//         label: __('首页'),
//         icon: <HomeOutlined />,
//         activeIcon: <HomeColored />,
//         path: '/asset-center',
//     },
//     {
//         key: 'asset-view',
//         path: '/asset-view',
//         label: __('资产全景'),
//         icon: <AssetsViewOutlined />,
//         activeIcon: <AssetsViewColored />,
//         detailKey: ['architecture'],
//     },
//     {
//         key: 'data-assets',
//         path: '/data-assets',
//         label: __('数据服务超市'),
//         icon: <DataAssetsNewOutlined />,
//         activeIcon: <DataAssetsColored />,
//     },
//     {
//         key: 'app-center',
//         path: '/app-center',
//         label: __('应用中心'),
//         icon: <WorkCenterOutlined />,
//         activeIcon: <WorkCenterColored />,
//         children: [
//             { key: 'sceneAnalysis', detailKey: ['sceneGraph'] },
//             { key: 'intelligentQA' },
//         ],
//     },
//     {
//         key: 'work-center',
//         path: '/work-center',
//         label: __('运营中心'),
//         icon: <OperationCenterOutlined />,
//         activeIcon: <OperationCenterColored />,
//         children: [
//             {
//                 key: 'demandManagement',
//                 path: 'demand-mgt',
//                 detailKey: ['requirementDetails', 'requirementAnalysis'],
//                 children: [
//                     { key: 'demandApplication' },
//                     { key: 'demandHall' },
//                     { key: 'demandMgt' },
//                     {
//                         key: 'cityDemand',
//                         path: 'city-demand/apply',
//                     },
//                     {
//                         key: 'citySharing',
//                         path: 'citySharing/apply',
//                     },
//                 ],
//             },
//             {
//                 key: 'taskCenter',
//                 path: 'taskCenter/project',
//                 secPath: 'doc-audit-client',
//                 detailKey: [
//                     'projectContent',
//                     'complete-task',
//                     'dataSynchronization',
//                     'dataProcess',
//                     'workflow',
//                 ],
//                 children: [
//                     { key: 'project' },
//                     { key: 'task' },
//                     { key: 'docAuditClient' },
//                 ],
//             },
//             {
//                 key: 'planManage',
//                 path: 'planManage/collectionPlan',
//                 children: [
//                     { key: 'collectionPlan' },
//                     { key: 'processingPlan' },
//                     { key: 'understandingPlan' },
//                 ],
//             },
//             {
//                 key: 'business',
//                 path: 'business/architure',
//                 detailKey: ['coreBusiness', 'drawio', 'diagnosisDetails'],
//                 children: [
//                     { key: 'architure' },
//                     { key: 'domain' },
//                     { key: 'diagnosis' },
//                 ],
//             },
//             {
//                 key: 'standards',
//                 path: 'standards/business-domain',
//                 detailKey: ['defineObj'],
//                 children: [
//                     { key: 'businessDomain' },
//                     {
//                         key: 'dataManagement',
//                         path: 'standards/dataelement',
//                     },
//                 ],
//             },
//             {
//                 key: 'datasheetView',
//                 path: 'datasheet-view',
//                 detailKey: ['datasheetViewDetail', 'datasheetViewGraph'],
//             },
//             { key: 'dimensionModel', detailKey: ['dimensionGraph'] },
//             {
//                 key: 'businessIndicatorManage',
//                 detailKey: [
//                     'businessIndicatorManageEdit',
//                     'businessIndicatorManageDetail',
//                 ],
//             },
//             {
//                 key: 'dataServiceList',
//                 detailKey: ['apiServiceDetail', 'createDataService'],
//             },
//             {
//                 key: 'applicationAuth',
//                 path: 'applicationAuth/manage',
//                 children: [
//                     { key: 'applicationAuthManage' },
//                     {
//                         key: 'applicationAuthReport',
//                     },
//                     { key: 'applicationAuthAudit' },
//                     { key: 'applicationAuthReportAudit' },
//                 ],
//             },
//             {
//                 key: 'assetAccess',
//             },
//             {
//                 key: 'applicationCase',
//                 path: 'applicationCase/report',
//                 detailKey: ['caseDetail', 'editCase'],
//                 children: [
//                     { key: 'caseReport' },
//                     {
//                         key: 'provinceCase',
//                     },
//                 ],
//             },
//             {
//                 key: 'dataContent',
//                 path: 'dataService/dataContent',
//                 detailKey: [
//                     'dirContent',
//                     'addResourcesDirList',
//                     'infoCatlgDetail',
//                     'editInfoCatlg',
//                     'infoCatlgAudit',
//                     'openCatalogOverview',
//                     'openCatalog',
//                     'openCatalogAudit',
//                     'createDataServiceRegistry',
//                     'resourceSharingApply',
//                     'resourceSharingSubscribe',
//                     'resourceSharingProcessed',
//                     'resourceSharingAudit',
//                     'resourceSharingApplyDrawer',
//                     'objectionRaise',
//                     'objectionHandle',
//                     'objectionReview',
//                 ],
//                 children: [
//                     {
//                         key: 'infoCatlg',
//                         path: 'dataService/infoRescCatlg',
//                     },
//                     {
//                         key: 'openCatalog',
//                         path: 'openCatalog',
//                     },
//                     { key: 'resourceDirList' },
//                     { key: 'resourceDirReport' },
//                     { key: 'dirReportAudit' },
//                     { key: 'resourceReport' },
//                     { key: 'resourceReportAudit' },
//                     // { key: 'catalogClassifyList' },
//                     {
//                         key: 'resourceSharing',
//                         path: 'dataService/resourceSharing/apply',
//                     },
//                     {
//                         key: 'objectionMgt',
//                         path: 'objection-mgt/objection-raise',
//                     },
//                 ],
//             },
//             // 692061 -- 屏蔽菜单
//             {
//                 label: __('数据探查理解'),
//                 key: 'DataCatalogUnderstanding',
//                 detailKey: ['dataUnderstandingContent'],
//             },
//         ],
//     },
//     {
//         key: 'my-assets',
//         path: '/my-assets',
//         label: __('我的'),
//         icon: <MyAssetsOutlined />,
//         activeIcon: <MyAssetsColored />,
//         // children: [
//         //     {
//         //         key: 'availableAssets',
//         //         path: '/my-assets?menuType=availableAssets',
//         //         label: __('可用资源'),
//         //     },
//         // ],
//     },
//     {
//         key: 'config-center',
//         label: __('配置中心'),
//         icon: <ConfigCenterOutlined />,
//         activeIcon: <ConfigCenterSideOutlined />,
//         path: '/systemConfig/businessArchitecture',
//         access: [
//             accessScene.config_architecture,
//             accessScene.config_role,
//             accessScene.datasource,
//             accessScene.config_pipeline,
//             accessScene.audit_process,
//             accessScene.audit_strategy,
//         ],
//         children: [
//             { key: 'businessArchitecture' },
//             { key: 'userRole' },
//             { key: 'firmList' },
//             { key: 'businSystem' },
//             { key: 'businessDomainLevel' },
//             { key: 'DataSource' },
//             { key: 'assemblyLineConfig' },
//             {
//                 key: 'flowCenter',
//                 path: '/workflow-manage-front',
//                 children: [
//                     { key: 'workflowManage' },
//                     { key: 'workflowManageAuditor' },
//                     { key: 'policy' },
//                 ],
//             },
//             { key: 'codingRuleConfig' },
//             { key: 'GeneralConfig' },
//             { key: 'dataClassificationTag' },
//             { key: 'categoryManage' },
//             { key: 'dataDictionary' },
//         ],
//     },
//     // {
//     //     key: 'audit-center',
//     //     path: '/audit-center',
//     //     label: __('审计中心'),
//     //     icon: <ShenJiZhongXinOutlined />,
//     //     activeIcon: <ShenJiZhongXinColored />,
//     // },
// ]

// // 全局菜单一级菜单布局、顺序
// export const globalMenuClassify = [
//     [
//         'asset-center',
//         'asset-view',
//         'data-assets',
//         'app-center',
//         'my-assets',
//         'audit-center',
//     ],
//     ['work-center'],
//     ['config-center'],
// ]

export const globalMenuClassify = [
    [
        // {
        //     key: 'asset-center',
        //     icon: <HomeOutlined />,
        //     activeIcon: <HomeColored />,
        // },
        // {
        //     key: 'asset-view',
        //     icon: <AssetsViewOutlined />,
        //     activeIcon: <AssetsViewColored />,
        // },
        {
            key: 'data-assets',
            icon: <DataAssetsNewOutlined />,
            activeIcon: <DataAssetsColored />,
        },
        // {
        //     key: 'app-center',
        //     icon: <WorkCenterOutlined />,
        //     activeIcon: <WorkCenterColored />,
        // },
        // {
        //     key: 'my-assets',
        //     icon: <MyAssetsOutlined />,
        //     activeIcon: <MyAssetsColored />,
        // },
        // {
        //     key: 'audit-center',
        //     icon: <ShenJiZhongXinOutlined />,
        //     activeIcon: <ShenJiZhongXinColored />,
        // },
    ],
    [
        {
            key: 'work-center',
            icon: <OperationCenterOutlined />,
            activeIcon: <OperationCenterColored />,
        },
    ],
    [
        {
            key: 'config-center',
            icon: <ConfigCenterOutlined />,
            activeIcon: <ConfigCenterSideOutlined />,
        },
    ],
]

/**
 * 需要指定跳转的路由
 * 查找 path 时查找自身菜单 path 或其子菜单第一个可用路径，如果配置了targetKey，则优先查找 targetKey 的 path
 */
export const jumpRoute = [{ key: 'demandManagement', targetKey: 'demandMgt' }]
