import { PermissionScope } from '../apis'

// 后端固定的角色ID
export const allRoleList = {
    TCSystemMgm: '00001f64-209f-4260-91f8-c61c6f820136', // 系统管理员
    TCDataOwner: '00002fb7-1e54-4ce1-bc02-626cb1f85f62', // 数据Owner
    TCDataButler: '00003148-fbbf-4879-988d-54af7c98c7ed', // 数据管家
    TCDataOperationEngineer: '00004606-f318-450f-bc53-f0720b27acff', // 数据运营工程师
    TCDataGovernEngineer: '00005871-cedd-4216-bde0-94ced210e898', // 数据开发工程师
    TCNormal: '0000663b-46a9-45e4-b6f7-a6bd8c18bd46', // 普通用户
    ApplicationDeveloper: '00007030-4e75-4c5e-aa56-f1bdf7044791', // 应用开发工程师
    SecurityAdmin: '00008516-45b3-44c9-9188-ca656969e20f', // 安全管理员
    PortalAdmin: '00108516-45b3-44c9-9188-ca656969e20g', // 门户管理员
}

// // 角色权限
// export const RoleAccessValueMap = {
//     [allRoleList.TCSystemMgm]: 1, // 系统管理员   (1)
//     [allRoleList.TCDataOwner]: 2, // 数据Owner    (2)
//     [allRoleList.TCDataButler]: 4, // 数据管家     (4)
//     [allRoleList.TCDataOperationEngineer]: 8, // 数据运营工程师 (8)
//     [allRoleList.TCDataGovernEngineer]: 16, // 数据开发工程师 (16)
//     [allRoleList.TCNormal]: 32, // 普通用户     (32)
//     [allRoleList.ApplicationDeveloper]: 64, // 应用开发工程师 (64)
//     [allRoleList.SecurityAdmin]: 128, // 安全管理员   (128)
// }

/** 自定义角色头像颜色 */
export const roleAvatarColor = {
    'color-1': '#0091FF',
    'color-2': '#0296F2',
    'color-3': '#B02DC5',
    'color-4': '#EE4AD6',
    'color-5': '#FF4568',
    'color-6': '#8A79FE',
    'color-7': '#00AB7D',
    'color-8': '#00BDD4',
    'color-9': '#CDDC39',
    'color-10': '#FF8600',
}

// 默认角色的权限
export const rolePermissions = {
    // 系统管理员
    [allRoleList.TCSystemMgm]: [
        { key: 'manageUserAndRole', scope: PermissionScope.All },
        { key: 'manageInformationSystem', scope: PermissionScope.All },
        { key: 'manageBusinessDomain', scope: PermissionScope.All },
        { key: 'manageDataSource', scope: PermissionScope.All },
        { key: 'manageDataClassification', scope: PermissionScope.All },
        { key: 'manageDataOperationProcess', scope: PermissionScope.All },
        { key: 'manageWorkOrderTemplate', scope: PermissionScope.All },
        { key: 'manageAuditStrategy', scope: PermissionScope.All },
        { key: 'manageCodeGenerationRule', scope: PermissionScope.All },
        { key: 'auditUserOperation', scope: PermissionScope.All },
    ],
    // 数据Owner
    [allRoleList.TCDataOwner]: [
        { key: 'accessDataResource', scope: PermissionScope.All },
        {
            key: 'manageDataOperationProject',
            scope: PermissionScope.All,
        },
        {
            key: 'manageBusinessModelAndBusinessDiagnosis',
            scope: PermissionScope.All,
        },
        { key: 'manageDataStandard', scope: PermissionScope.All },
        {
            key: 'manageDataResourceAuthorization',
            scope: PermissionScope.All,
        },
    ],
    // 数据管家
    [allRoleList.TCDataButler]: [
        { key: 'accessDataResource', scope: PermissionScope.All },
        {
            key: 'manageDataOperationProject',
            scope: PermissionScope.All,
        },
        {
            key: 'manageBusinessModelAndBusinessDiagnosis',
            scope: PermissionScope.All,
        },
        { key: 'manageDataStandard', scope: PermissionScope.All },
    ],
    // 数据运营工程师
    [allRoleList.TCDataOperationEngineer]: [
        { key: 'accessDataResource', scope: PermissionScope.All },
        {
            key: 'manageBusinessModelAndBusinessDiagnosis',
            scope: PermissionScope.All,
        },
        {
            key: 'manageDataOperationProcess',
            scope: PermissionScope.All,
        },
        {
            key: 'manageWorkOrderTemplate',
            scope: PermissionScope.All,
        },
        { key: 'manageIndicator', scope: PermissionScope.All },
        { key: 'manageLogicalView', scope: PermissionScope.All },
        { key: 'manageInterfaceService', scope: PermissionScope.All },
        { key: 'manageResourceCatalog', scope: PermissionScope.All },
    ],
    // 数据开发工程师
    [allRoleList.TCDataGovernEngineer]: [
        { key: 'accessDataResource', scope: PermissionScope.All },
        { key: 'manageDataModel', scope: PermissionScope.All },
        { key: 'manageIndicator', scope: PermissionScope.All },
        { key: 'manageLogicalView', scope: PermissionScope.All },
    ],
    // 普通用户
    [allRoleList.TCNormal]: [
        { key: 'accessDataResource', scope: PermissionScope.All },
        {
            key: 'initiateDataAnalysisDemand',
            scope: PermissionScope.Organization,
        },
    ],
    // 应用开发工程师
    [allRoleList.ApplicationDeveloper]: [
        { key: 'accessDataResource', scope: PermissionScope.All },
        {
            key: 'manageIntegrationApplication',
            scope: PermissionScope.Organization,
        },
    ],
    // 安全管理员
    [allRoleList.SecurityAdmin]: [
        { key: 'accessDataResource', scope: PermissionScope.All },
        { key: 'dataSecurityManagement', scope: PermissionScope.All },
    ],
    // 门户管理员
    [allRoleList.PortalAdmin]: [
        { key: 'accessDataResource', scope: PermissionScope.All },
        {
            key: 'managePortalInformationDisplay',
            scope: PermissionScope.All,
        },
    ],
}

export enum HasAccess {
    isHasBusiness = 'isHasBusiness',
    // 是否是资源owner，启用包含特殊情况用户是应用开发者，但之前被赋予了owner角色并将资源owner设置为当前用户
    isOwner = 'isHasDownloadPermisOper',
    // 是否是数据开发/运营工程师
    isGovernOrOperation = 'isGovernOrOperationEngineer',
}

export const accessRolesIds = {
    [HasAccess.isHasBusiness]: [
        rolePermissions[allRoleList.TCNormal],
        rolePermissions[allRoleList.TCDataButler],
        rolePermissions[allRoleList.TCDataGovernEngineer],
        rolePermissions[allRoleList.TCDataOperationEngineer],
        rolePermissions[allRoleList.TCDataOwner],
    ],
    [HasAccess.isOwner]: [
        rolePermissions[allRoleList.TCNormal],
        rolePermissions[allRoleList.TCDataButler],
        rolePermissions[allRoleList.TCDataGovernEngineer],
        rolePermissions[allRoleList.TCDataOperationEngineer],
        rolePermissions[allRoleList.TCDataOwner],
        rolePermissions[allRoleList.ApplicationDeveloper],
    ],
    [HasAccess.isGovernOrOperation]: [
        rolePermissions[allRoleList.TCDataGovernEngineer],
        rolePermissions[allRoleList.TCDataOperationEngineer],
    ],
}

// /**
//  * 计算角色权限值
//  * @param roleIds
//  * @returns
//  */
// export const calcRoleAccessValue = (roleIds: Array<string>) => {
//     return roleIds.reduce((acc, roleId) => acc + RoleAccessValueMap[roleId], 0)
// }

// //  判断当前用户是否拥有需要的权限
// export const calcRoleAccessExist = (
//     roleIds: Array<string>,
//     needRoleIds: Array<string>,
// ) => {
//     /* eslint-disable no-bitwise */
//     // 需要权限的值
//     const roleAccessValue = calcRoleAccessValue(roleIds)
//     // 需要权限的值数组
//     const needRoleAccessValueArr = needRoleIds.map(
//         (value) => RoleAccessValueMap[value],
//     )
//     // 当前用户拥有的权限值
//     const calcResults = needRoleAccessValueArr.filter(
//         (item) => (roleAccessValue & item) === item,
//     )
//     // 判断当前用户是否拥有需要的权限
//     return calcResults.length > 0
// }
// // 获取当前用户角色列表C
// export const getRoleList = () => {
//     const roles = localStorage.getItem('roles')
//     let storageRoles: any
//     try {
//         if (roles) {
//             storageRoles = JSON.parse(roles)
//         }
//     } catch (error) {
//         // console.log('error:', error)
//     } finally {
//         if (!storageRoles) {
//             storageRoles = getUserRoles()
//         }
//     }
//     return storageRoles
// }

// const getUserRoles = async () => {
//     let res: any = []
//     try {
//         res = await getCurUserRoles()
//         localStorage.setItem('roles', JSON.stringify(res))
//     } catch (error) {
//         formatError(error)
//     }
//     return res
// }

/**
 * 检查用户是否拥有至少一个期望的角色
 * @param userRoles 用户拥有的所有角色对象数组
 * @param expectedRoleIds 期望用户拥有的角色ID数组（用户至少需要拥有其中一个）
 * @returns 如果用户拥有至少一个期望的角色返回 true，否则返回 false
 */
export const hasAnyExpectedRole = (
    userRoles: Array<any>,
    expectedRoleIds: Array<any>,
): boolean => {
    // 获取用户角色的所有ID
    const userRoleIds = userRoles.map((role: any) => role?.id)
    // 检查是否有至少一个期望的角色ID在用户的角色ID中
    return expectedRoleIds.some((roleId) => userRoleIds.includes(roleId))
}

/** 同步后端权限值, key为自定义值 */
export const permissionMap: Record<string, any> = {
    manageDataClassification: {
        id: '167d41c2-4b37-47e1-9c29-d103c4873f4f',
        key: 'manageDataClassification',
        name: '管理数据分类分级',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部业务对象、数据分级标签进行增删改操作；对库表进行手动分类分级；可发起数据分类探测；可在「资产全景」中查看所有库表分类分级结果。',
                '可见菜单：「业务对象」「数据分级标签」「库表_数据分类属性」「库表_数据探测_分类分级探测」「资产全景_数据分类分级」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对本组织的数据源和库表发起探查；对本组织的库表进行手动分类分级；可在「资产全景」中查看本组织库表的分类分级结果。',
                '可见菜单：「库表_数据分类属性」「库表_数据探测_分类分级探测」「资产全景_数据分类分级」',
            ],
        },
    },
    auditUserOperation: {
        id: '18abfb60-5b18-4e63-9010-63fce5b5eb3e',
        key: 'auditUserOperation',
        name: '审计用户操作',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可对全部的登录日志、操作日志、任务运行日志进行审计操作。',
                '可见菜单：「登录日志」「操作日志」「任务运行日志」',
            ],
            [PermissionScope.Organization]: [
                '可对本组织的登录日志、操作日志、以及全部的任务运行日志进行审计操作。',
                '可见菜单：「登录日志」「操作日志」「任务运行日志」',
            ],
        },
    },
    dataSecurityManagement: {
        id: '211783fe-b79a-49f3-8a90-3402635b7456',
        key: 'dataSecurityManagement',
        name: '数据安全管理',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可对全部安全策略进行增删改操作。',
                '可见菜单：「隐私数据保护」「敏感数据白名单」「脱敏算法」「算法模版」「数据密级」「识别规则」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「隐私数据保护」「敏感数据白名单」「脱敏算法」「算法模版」「识别规则」',
            ],
        },
    },
    manageDataModel: {
        id: '29d08b27-1974-48de-8979-bcb222b90f72',
        key: 'manageDataModel',
        name: '管理数据模型',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部数据模型进行增删改操作。',
                '可见菜单：「维度模型管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对仅本组织的数据模型进行增删改操作。',
                '可见菜单：「维度模型管理」',
            ],
        },
    },
    manageDataQualityWorkOrder: {
        id: '2c809154-54a9-4bca-9017-92bec902e12a',
        key: 'manageDataQualityWorkOrder',
        name: '管理数据质量工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部数据质量工单信息，并可对其进行转派、催办、反馈操作。',
                '可见菜单：「数据质量整改」',
            ],
            [PermissionScope.Organization]: [
                '可查看关联工单责任人是本组织成员的数据质量工单，并可对其进行转派、催办、反馈操作。',
                '可见菜单：「数据质量整改」',
            ],
        },
    },
    manageBusinessDomain: {
        id: '31c09e56-cf9a-42fd-aea5-9ee7fa781cd0',
        key: 'manageBusinessDomain',
        name: '管理业务域层级',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部业务域层级，并可对其进行增删改操作。',
                '可见菜单：「业务层级」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「业务层级」',
            ],
        },
    },
    auditUnderstandingWorkOrder: {
        id: '3273957b-f811-4639-9e08-3e6133fd891a',
        key: 'auditUnderstandingWorkOrder',
        name: '审核数据理解工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的理解工单进行审核操作。',
                '可见菜单：「理解工单审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的理解工单进行审核操作。',
                '可见菜单：「理解工单审核」',
            ],
        },
    },
    businessMattersManage: {
        id: '3c11eadd-8259-11f0-9f49-0eb42bdf8fb1',
        key: 'businessMattersManage',
        name: '业务事项管理',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部业务事项，并对其进行编辑操作',
                '可见菜单：「业务事项管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「业务事项管理」',
            ],
        },
    },
    handleQualityWorkOrder: {
        id: '3db2f019-678b-4030-b57f-5a7db667b826',
        key: 'handleQualityWorkOrder',
        name: '处理质量工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看责任人是本人的质量工单，并可对其进行处理操作。',
                '可见菜单：「质量整改处理」',
            ],
            [PermissionScope.Organization]: [
                '可查看责任人是本人的质量工单，并可对其进行处理操作。',
                '可见菜单：「质量整改处理」',
            ],
        },
    },
    manageUserAndRole: {
        id: '41095041-05dc-4139-b6cd-e786079db2ab',
        key: 'manageUserAndRole',
        name: '管理用户和角色',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可同步组织架构及用户、对自定义角色和角色组进行增删改操作。',
                '可见菜单：「组织架构」「用户管理」「角色管理」「部门管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。不可对自定义角色和角色组进行增删改操作。',
                '可见菜单：「用户管理」',
            ],
        },
    },
    manageGeneralConfiguration: {
        id: '421d78c1-72e7-477c-8825-7c5cc83fa15b',
        key: 'manageGeneralConfiguration',
        name: '管理通用配置',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可对「通用配置」中的内容进行编辑操作。',
                '可见菜单：「通用配置」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「通用配置」',
            ],
        },
    },
    manageDataOperationProcess: {
        id: '473a7956-25f6-4f1b-846b-94e71dc058cb',
        key: 'manageDataOperationProcess',
        name: '管理数据运营流程',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部数据运营流程，并可对其进行增删改操作。',
                '可见菜单：「工作流程管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「工作流程管理」',
            ],
        },
    },
    manageWorkOrderTemplate: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2890',
        key: 'manageWorkOrderTemplate',
        name: '管理工单模板',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部工单模板，并可对其进行增删改操作。',
                '可见菜单：「工单模板管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「工单模板管理」',
            ],
        },
    },
    auditCollectionPlan: {
        id: '49604f6f-dfc2-4faf-9aa8-69c05cc297b0',
        key: 'auditCollectionPlan',
        name: '审核归集计划',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的归集计划进行审核操作。',
                '可见菜单：「归集计划审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的归集计划进行审核操作。',
                '可见菜单：「归集计划审核」',
            ],
        },
    },
    manageInterfaceService: {
        id: '4ce45b8b-d19c-435b-81ce-f3abf561b21a',
        key: 'manageInterfaceService',
        name: '管理接口服务',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部接口进行增删改操作。',
                '可见菜单：「接口」「接口服务概览」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对仅本组织的接口进行增删改操作。',
                '可见菜单：「接口」「接口服务概览」',
            ],
        },
    },
    // manageInterfaceOverview: {
    //     id: '0077a70c-37c9-46fd-a805-3a4265fb2885',
    //     key: 'manageInterfaceOverview',
    //     name: '管理接口概览',
    //     category: 'Operation',
    //     description: {
    //         [PermissionScope.All]: [
    //             '可查看系统中全部范围的接口数据概览',
    //             '可见菜单：「接口服务概览」',
    //         ],
    //         [PermissionScope.Organization]: [
    //             '可查看系统中仅本组织的接口数据概览',
    //             '可见菜单：「接口服务概览」',
    //         ],
    //     },
    // },
    auditUnderstandingPlan: {
        id: '4cfdc28e-97f4-445b-9968-f575d61896e9',
        key: 'auditUnderstandingPlan',
        name: '审核数据理解计划',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的理解计划进行审核操作。',
                '可见菜单：「理解计划审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的理解计划进行审核操作。',
                '可见菜单：「理解计划审核」',
            ],
        },
    },
    demandAnalysisAndImplement: {
        id: '5c100c9e-5f93-48fb-92ef-d5a898aa3fe0',
        key: 'demandAnalysisAndImplement',
        name: '需求分析和实施',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可获取全部待签收、待实施的需求申请、以及自己已签收、实施中的需求申请，并可签收全部待分析、待实施的需求申请，以及分析、实施自己已签收的需求申请。',
                '可见菜单：「需求大厅」(企业版)   「需求处理」(企业版)',
            ],
            [PermissionScope.Organization]: [
                '可获取全部待签收、待实施的需求申请、以及自己已签收、实施中的需求申请，并可签收全部待分析、待实施的需求申请，以及分析、实施自己已签收的需求申请。',
                '可见菜单：「需求大厅」(企业版)   「需求处理」(企业版)',
            ],
        },
    },
    auditDataPush: {
        id: '67b4198b-4dd4-4029-a716-286e378d14b7',
        key: 'auditDataPush',
        name: '审核数据推送',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的数据推送进行审核操作。',
                '可见菜单：「数据推送审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的数据推送进行审核操作。',
                '可见菜单：「数据推送审核」',
            ],
        },
    },
    manageDataUnderstandingWorkOrderAndTask: {
        id: '68e247dd-831b-4b5d-8f13-6c5ae5983c07',
        key: 'manageDataUnderstandingWorkOrderAndTask',
        name: '管理数据理解工单和任务',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看责任人是本人的理解工单和任务，并可对其进行签收、处理操作。',
                '可见菜单：「数据理解工单」「理解工单任务」',
            ],
            [PermissionScope.Organization]: [
                '可查看责任人是本人的理解工单和任务，并可对其进行签收、处理操作。',
                '可见菜单：「数据理解工单」「理解工单任务」',
            ],
        },
    },
    manageIndicator: {
        id: '68e736d6-6a77-4b64-ad89-ead3d6c22c00',
        key: 'manageIndicator',
        name: '管理指标',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部指标进行增删改操作。',
                '可见菜单：「指标管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对仅本组织的指标进行增删改操作。',
                '可见菜单：「指标管理」',
            ],
        },
    },
    manageCodeGenerationRule: {
        id: '7c4f09cb-ab38-45c9-8224-843f8b6a373f',
        key: 'manageCodeGenerationRule',
        name: '管理编码生成规则',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部编码生成规则，并可对其进行编辑操作。',
                '可见菜单：「编码生成规则」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「编码生成规则」',
            ],
        },
    },
    manageFrontendMachine: {
        id: '7efe085c-c675-4517-a276-967d3cfa234d',
        key: 'manageFrontendMachine',
        name: '管理前置机',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部前置机概览信息和待分配列表，并可对其进行分配操作。',
                '可见菜单：「前置机概览」「前置机分配」',
            ],
            [PermissionScope.Organization]: [
                '可查看本部门的前置机概览信息。',
                '可见菜单：「前置机概览」',
            ],
        },
    },
    manageDataStandard: {
        id: '818be06d-d3ea-4f4f-815b-8704ae403ba6',
        key: 'manageDataStandard',
        name: '管理数据标准',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部数据标准，并可对全部数据元、码表、编码规则、标准文件进行增删改操作。',
                '可见菜单：「数据元」「码表」「编码规则」「标准文件」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「数据元」「码表」「编码规则」「标准文件」',
            ],
        },
    },
    manageBusinessArchitecture: {
        id: '834ee866-5ca0-419a-b84d-477694bd5d39',
        key: 'manageBusinessArchitecture',
        name: '管理业务架构',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部业务领域和主干业务进行增删改操作。',
                '可见菜单：「业务领域」「主干业务」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对仅本组织的业务领域和主干业务进行增删改操作。',
                '可见菜单：「业务领域」「主干业务」',
            ],
        },
    },
    basicPermission: {
        id: '8860f32c-e57f-4d01-979a-bd26654596fd',
        key: 'basicPermission',
        name: '基础权限',
        category: 'BasicPermission',
    },
    analysisAndImplementSupplyDemand: {
        id: '8e7406af-482f-4e6d-ac9e-37b19c69c717',
        key: 'analysisAndImplementSupplyDemand',
        name: '分析和实施供需对接',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部待分析的需求、以及自己分析中的需求，并可对全部需求申请进行分析操作。',
                '可见菜单：「需求申请清单」「需求分析」',
            ],
            [PermissionScope.Organization]: [
                '可查看本部门的待分析的需求、以及自己分析中的需求，并可对本部门的需求申请进行分析操作。',
                '可见菜单：「需求申请清单」「需求分析」',
            ],
        },
    },
    manageAuditStrategy: {
        id: '9070e117-273b-4c70-8b93-1aecdee05b28',
        key: 'manageAuditStrategy',
        name: '管理审核策略',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部审核策略，并可对其进行编辑操作。',
                '可见菜单：「审核管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「审核管理」',
            ],
        },
    },
    manageLogicalView: {
        id: '982eaf56-74fb-484a-a390-e205d4c80d95',
        key: 'manageLogicalView',
        name: '管理库表',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部库表进行增删改操作，并可对其发起数据质量探查和业务数据更新时间探查。',
                '可见菜单：「库表」「元数据管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对仅本组织数据源下的库表进行增删改操作，并可对其发起数据质量探查和业务数据更新时间探查。',
                '可见菜单：「库表」「元数据管理」',
            ],
        },
    },
    dataQualityOverview: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2907',
        key: 'dataQualityOverview',
        name: '数据质量概览',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部部门库表质量探查情况，并支持导出单个部门的库表质量探查统计情况。',
                '可见菜单：「数据质量概览」',
            ],
            [PermissionScope.Organization]: [
                '仅可查看本部门库表质量探查情况，并支持导出本部门的库表质量探查统计情况。',
                '可见菜单：「数据质量概览」',
            ],
        },
    },
    manageDataQuality: {
        id: '9976db14-47b6-4c55-9d20-a86096635e6b',
        key: 'manageDataQuality',
        name: '管理数据质量',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部数据质量报告。',
                '可见菜单：「数据质量报告」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理属于本组织数据源的数据质量报告。',
                '可见菜单：「数据质量报告」',
            ],
        },
    },
    manageDataResearchReport: {
        id: '9b976ebf-fc9c-4f0d-aff9-af6624881cd9',
        key: 'manageDataResearchReport',
        name: '管理数据调研报告',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部调研报告，并可对其进行增删改操作。',
                '可见菜单：「调研报告」',
            ],
            [PermissionScope.Organization]: [
                '可使用关联工单责任人是本组织成员的调研报告，并可对其进行增删改操作。',
                '可见菜单：「调研报告」',
            ],
        },
    },
    accessDataResource: {
        id: '9c95aa01-6559-48e7-88f3-dbd1b50f1798',
        key: 'accessDataResource',
        name: '访问数据资源',
        category: 'Service',
        description: {
            [PermissionScope.All]: [
                '可使用全部库表、指标、接口、以及自己发起的需求申请。',
                '可见菜单：「数据服务超市」「资产全景」「需求申请」「数据应用」「场景分析」「元模型」「主题模型」「专题模型」「标签关联推荐管理」「模型密级管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准，以及自己发起的需求申请。',
                '可见菜单：「数据服务超市」「资产全景」「需求申请」「数据应用」「场景分析」「元模型」「主题模型」「专题模型」「标签关联推荐管理」「模型密级管理」',
            ],
        },
    },
    manageDataCollectionWorkOrder: {
        id: '9cf7c7c8-7b75-47a8-b390-245072dcffb1',
        key: 'manageDataCollectionWorkOrder',
        name: '管理数据归集工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用责任人或创建人是自己的归集工单，并可对其进行签收、处理操作。',
                '可见菜单：「数据归集工单」',
            ],
            [PermissionScope.Organization]: [
                '可使用责任人或创建人是自己的归集工单，并可对其进行签收、处理操作。',
                '可见菜单：「数据归集工单」',
            ],
        },
    },
    manageDataDictionary: {
        id: '9f20e636-d09d-4439-b74d-6db0f5cd420f',
        key: 'manageDataDictionary',
        name: '管理数据字典',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部数据字典，并可对其进行编辑操作。',
                '可见菜单：「字典管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「字典管理」',
            ],
        },
    },
    manageDataUnderstandingTemplate: {
        id: 'a5603c74-569e-4a75-bac4-d15d76c84a56',
        key: 'manageDataUnderstandingTemplate',
        name: '管理理解模板',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部理解模板，并可对其进行增删改操作。',
                '可见菜单：「数据理解模板」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「数据理解模板」',
            ],
        },
    },
    manageDataOperationProject: {
        id: 'a9aea8b6-8961-49b4-92ea-453ce2408470',
        key: 'manageDataOperationProject',
        name: '管理数据运营项目',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部数据运营项目，并可对其进行增删改操作。',
                '可见菜单：「项目管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用仅本组织的数据运营项目，并可对其进行增删改操作。',
                '可见菜单：「项目管理」',
            ],
        },
    },
    manageIntegrationApplication: {
        id: 'ab9ce811-e5fd-4b44-9d93-926a90427ab6',
        key: 'manageIntegrationApplication',
        name: '管理集成应用',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部集成应用进行增删改操作。',
                '可见菜单：「应用管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用用户自己创建的集成应用，并可对其进行增删改操作。',
                '可见菜单：「应用管理」',
            ],
        },
    },
    auditQualityWorkOrder: {
        id: 'af703060-4f7a-4638-ac4a-c0d3c3af00d0',
        key: 'auditQualityWorkOrder',
        name: '审核质量工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的质量工单进行审核操作。',
                '可见菜单：「质量整改审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的质量工单进行审核操作。',
                '可见菜单：「质量整改审核」',
            ],
        },
    },
    manageDataResourceAuthorization: {
        id: 'afbcdb6c-cb85-4a0c-82ee-68c9f1465684',
        key: 'manageDataResourceAuthorization',
        name: '管理数据资源授权',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部库表、接口和指标，并可对其进行授权操作。',
                '可见菜单：「授权管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用本组织的库表、接口和指标，并可对其进行授权操作。',
                '可见菜单：「授权管理」',
            ],
        },
    },
    auditCollectionWorkOrder: {
        id: 'c4be2537-7d5e-494f-890f-4ecf6d958476',
        key: 'auditCollectionWorkOrder',
        name: '审核归集工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的归集工单进行审核操作。',
                '可见菜单：「归集工单审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的归集工单进行审核操作。',
                '可见菜单：「归集工单审核」',
            ],
        },
    },
    dataAssetMonitor: {
        id: 'cee432b2-8de8-11f0-b8d2-c6218609b697',
        key: 'dataAssetMonitor',
        name: '数据资产监测',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部的数据资产监测相关数据统计。',
                '可见菜单：「数据资产监测」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部的数据资产监测相关数据统计。',
                '可见菜单：「数据资产监测」',
            ],
        },
    },
    // analysisAndImplementDataAnalysisDemand: {
    //     id: 'ce83dad2-567c-487c-aa7a-f231d32cb93b',
    //     key: 'analysisAndImplementDataAnalysisDemand',
    //     name: '分析和实施数据分析需求',
    //     category: 'Operation',
    //     description: {
    //         [PermissionScope.All]: [
    //             '可对全部数据分析需求进行分析和实施操作。',
    //             '可见菜单：「分析完善」「数据资源实施」',
    //         ],
    //         [PermissionScope.Organization]: [
    //             '可对本组织数据分析需求进行分析和实施操作。',
    //             '可见菜单：「分析完善」「数据资源实施」',
    //         ],
    //     },
    // },
    manageDataCollectionPlan: {
        id: 'dc9cb4f2-ff4b-4b7f-a8ae-3747071b7dd0',
        key: 'manageDataCollectionPlan',
        name: '管理数据归集计划',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部归集计划清单，责任人不需要配置权限也可以访问自己的「数据归集计划」，并可创建、管理归集计划，分配给任意用户。',
                '可见菜单：「数据归集计划」',
            ],
            [PermissionScope.Organization]: [
                '可使用本组织归集计划清单，责任人不需要配置权限也可以访问自己的「数据归集计划」，并可创建、管理归集计划，分配给本组织用户。',
                '可见菜单：「数据归集计划」',
            ],
        },
    },
    manageDataPush: {
        id: 'df5733b3-40bf-4edd-8ce4-e8f540f8cf90',
        key: 'manageDataPush',
        name: '管理数据推送',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理所有数据推送。',
                '可见菜单：「数据推送概览」「数据推送管理」「数据推送监控」',
            ],
            [PermissionScope.Organization]: [
                '可查看责任人属于本组织的数据推送。',
                '可见菜单：「数据推送监控」',
            ],
        },
    },
    viewDataUnderstandingReport: {
        id: 'dfd1ef75-6cea-4cf8-8827-cfdad6414aec',
        key: 'viewDataUnderstandingReport',
        name: '查看理解报告',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部理解报告清单。',
                '可见菜单：「数据理解报告」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织的理解报告清单。',
                '可见菜单：「数据理解报告」',
            ],
        },
    },
    manageDataUnderstandingPlan: {
        id: 'e2883f33-466c-4e86-a151-fdd291a9a892',
        key: 'manageDataUnderstandingPlan',
        name: '管理数据理解计划',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部理解计划清单，责任人不需要配置权限也可以访问自己的「数据理解计划」，并可创建、管理理解计划，分配给任意用户。',
                '可见菜单：「数据理解计划」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织的理解计划清单，责任人不需要配置权限也可以访问自己的「数据理解计划」，并可创建、管理理解计划，分配给本组织用户。',
                '可见菜单：「数据理解计划」',
            ],
        },
    },
    analysisAndImplementSharedApplication: {
        id: 'e2c2f816-1454-4e8f-b11d-1e99bff07702',
        key: 'analysisAndImplementSharedApplication',
        name: '分析和实施共享申请',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部待签收和已分析的共享申请、以及自己待分析和分析中的共享申请，并可对全部待分析、待实施的共享申请进行签收操作、对自己签收的共享申请进行分析和实施操作。',
                '可见菜单：「分析完善」「数据资源实施」',
            ],
            [PermissionScope.Organization]: [
                '可查看本部门的待签收和已分析的共享申请、以及自己待分析和分析中的共享申请，并可对本部门的待分析、待实施的共享申请进行签收操作、对自己签收的共享申请进行分析和实施操作。',
                '可见菜单：「分析完善」「数据资源实施」',
            ],
        },
    },
    viewDataResourceDemandOverview: {
        id: 'e814e7f7-8df3-11f0-8508-460704bf4dfc',
        key: 'viewDataResourceDemandOverview',
        name: '数据资源需求概览',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部的业务分析数据统计。',
                '可见菜单：「数据资源需求概览」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部的业务分析数据统计。',
                '可见菜单：「数据资源需求概览」',
            ],
        },
    },
    manageDataSource: {
        id: 'e9a9bdc9-bc2e-4222-87ba-5d3751ec6a04',
        key: 'manageDataSource',
        name: '管理数据源',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部数据源进行增删改操作。',
                '可见菜单：「数据源管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对本组织的数据源进行增删改操作。',
                '可见菜单：「数据源管理」',
            ],
        },
    },
    initiateDataAnalysisDemand: {
        id: 'ecb6e712-1b7f-492a-8cb3-0f7fc299a0f2',
        key: 'initiateDataAnalysisDemand',
        name: '发起数据分析需求',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部分析需求清单，对自己发起数据分析需求的分析结论进行确认操作。',
                '可见菜单：「需求申请清单」「分析结论确认」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理本组织的分析需求清单，对自己发起数据分析需求的分析结论进行确认操作。',
                '可见菜单：「需求申请清单」「分析结论确认」',
            ],
        },
    },
    auditUnderstandingReport: {
        id: 'edb4492e-a69c-4fc9-9609-2ba88b1624ca',
        key: 'auditUnderstandingReport',
        name: '审核数据理解报告',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的理解报告进行审核操作。',
                '可见菜单：「理解报告审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的理解报告进行审核操作。',
                '可见菜单：「理解报告审核」',
            ],
        },
    },
    initiateDataSupplyDemand: {
        id: 'efb46db2-02f0-46a9-902e-ca587685785f',
        key: 'initiateDataSupplyDemand',
        name: '发起数据供需对接',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可发起供需对接，查看全部需求申报清单，并可对已完成的供需对接进行共享申请操作。',
                '可见菜单：「需求申请清单」',
            ],
            [PermissionScope.Organization]: [
                '可发起供需对接，查看本部门的需求申报清单，并可对已完成的供需对接进行共享申请操作。',
                '可见菜单：「需求申请清单」',
            ],
        },
    },
    auditDataSupplyDemand: {
        id: 'f1019a3a-8e99-49f6-bf3a-bf350fcb2b87',
        key: 'auditDataSupplyDemand',
        name: '审核供需对接',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的需求进行审核操作。',
                '可见菜单：「需求审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的需求进行审核操作。',
                '可见菜单：「需求审核」',
            ],
        },
    },
    manageBusinessModelAndBusinessDiagnosis: {
        id: 'f34ea9b3-0121-4e4e-8303-df989ee958da',
        key: 'manageBusinessModelAndBusinessDiagnosis',
        name: '管理业务模型、数据模型和业务诊断',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部业务模型、数据模型和业务诊断，并可对全部业务模型和数据模型进行增删改操作，对关联任意部门业务流程的业务模型发起业务诊断。',
                '可见菜单：「业务模型」「数据模型」「业务诊断」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对仅本组织的业务模型和数据模型进行增删改操作，对关联本组织业务流程的业务模型发起业务诊断。',
                '可见菜单：「业务模型」「数据模型」「业务诊断」',
            ],
        },
    },
    manageResourceCatalog: {
        id: 'f9138813-cb42-408e-993b-9de758c0e6f9',
        key: 'manageResourceCatalog',
        name: '管理资源目录',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部信息资源目录和数据资源目录，并可对其进行增删改操作。',
                '可见菜单：「信息资源目录概览」「信息资源目录」「数据资源目录概览」「数据资源目录」「目录反馈」',
            ],
            [PermissionScope.Organization]: [
                '可使用本组织的信息资源目录和数据资源目录，并可对其进行增删改操作。',
                '可见菜单：「信息资源目录概览」「信息资源目录」「数据资源目录概览」「数据资源目录」「目录反馈」',
            ],
        },
    },
    operateResourceCatalog: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2908',
        key: 'operateResourceCatalog',
        name: '实施资源目录',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部数据资源目录，并可对全部数据资源目录进行操作',
                '可见菜单：「数据资源目录」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部数据资源目录，并可对全部数据资源目录进行操作',
                '可见菜单：「数据资源目录」',
            ],
        },
    },
    operateInterfaceService: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2909',
        key: 'operateInterfaceService',
        name: '实施接口服务',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部接口服务，并可对全部接口服务进行操作。',
                '可见菜单：「接口」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部接口服务，并可对全部接口服务进行操作。',
                '可见菜单：「接口」',
            ],
        },
    },
    manageDataVerification: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2910',
        key: 'manageDataVerification',
        name: '管理数据校核',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部的校核数据、校核配置、校核任务，并可对全部的校核配置、校核任务进行增删改操作。',
                '可见菜单:「主题模型目录管理，「数据目录管理，「校核配置!「校核任务!',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织的校核数据、校核配置、校核任务，并可对本组织的校核配置、校核任务进行增删改操作。',
                '可见菜单:「主题模型目录管理，「数据目录管理，「校核配置!「校核任务!',
            ],
        },
    },
    businessVerification: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2911',
        key: 'businessVerification',
        name: '业务分析数据统计',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部的业务分析数据统计。',
                '可见菜单：「数据查询统计」，「数据校核统计」，「数据关联统计」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部的业务分析数据统计。',
                '可见菜单：「数据查询统计」，「数据校核统计」，「数据关联统计」',
            ],
        },
    },
    initiateSharedApplication: {
        id: 'f99d1a54-5e2f-42cc-b35c-614a57c2a6ad',
        key: 'initiateSharedApplication',
        name: '发起共享申请',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部共享申请清单、以及自己发起的共享申请和待确认的分析结论，并可对全部共享申请进行编辑、提交、删除操作，对自己发起共享申请的分析结论、实施方案、实施成果进行确认。',
                '可见菜单：「共享申请清单」「分析结论确认」「实施方案确认」「实施成果确认」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织成员发起的共享申请、以及自己发起的共享申请和待确认的分析结论，并可对本组织成员发起的共享申请进行编辑、提交、删除操作，对自己发起共享申请的分析结论、实施方案、实施成果进行确认。',
                '可见菜单：「共享申请清单」「分析结论确认」「实施方案确认」「实施成果确认」',
            ],
        },
    },
    manageInformationSystem: {
        id: 'fa77a70c-37c9-46fd-a805-3a4265fb28b9',
        key: 'manageInformationSystem',
        name: '管理信息系统',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部信息系统进行增删改操作。',
                '可见菜单：「信息系统」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对仅本组织的信息系统进行增删改操作。',
                '可见菜单：「信息系统」',
            ],
        },
    },
    manageInformationSystemRegister: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2891',
        key: 'manageInformationSystemRegister',
        name: '管理负责人注册',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部已注册的负责人，并对负责人进行注册。',
                '可见菜单：「负责人注册」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理本组织已注册的负责人，并对负责人进行注册。',
                '可见菜单：「负责人注册」',
            ],
        },
    },
    manageOrganizationRegister: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2892',
        key: 'manageOrganizationRegister',
        name: '管理机构注册',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部已注册的部门，并对部门进行注册。',
                '可见菜单：「机构注册」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理本组织已注册的部门，并对子部门进行注册。',
                '可见菜单：「机构注册」',
            ],
        },
    },
    manageSystemRegister: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2895',
        key: 'manageSystemRegister',
        name: '管理系统注册',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部已注册的信息系统，并对信息系统进行注册。',
                '可见菜单：「系统注册」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理本组织已注册的信息系统，并对本部门的信息系统进行注册。',
                '可见菜单：「系统注册」',
            ],
        },
    },
    manageAppRegister: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2894',
        key: 'manageAppRegister',
        name: '管理应用注册',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部已注册的网关应用，并对网关应用进行注册。',
                '可见菜单：「应用注册」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理本组织已注册的网关应用，并对本部门的网关应用进行注册。',
                '可见菜单：「应用注册」',
            ],
        },
    },
    manageGatewayAppRegister: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2893',
        key: 'manageGatewayAppRegister',
        name: '管理网关应用',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部的网关应用。',
                '可见菜单：「网关应用管理」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理本组织的网关应用。',
                '可见菜单：「网关应用管理」',
            ],
        },
    },
    manageServiceMonitor: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2897',
        key: 'manageServiceMonitor',
        name: '管理服务监控',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部的接口服务调用日志。',
                '可见菜单：「服务监控」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理本组织的接口服务调用日志。',
                '可见菜单：「服务监控」',
            ],
        },
    },
    manageSystemAccess: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2896',
        key: 'manageSystemAccess',
        name: '管理系统接入',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部的接口接入应用的记录，并对其应用进行启用/停用服务。',
                '可见菜单：「系统接入」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理本组织的接口接入应用的记录，并对其应用进行启用/停用服务。',
                '可见菜单：「系统接入」',
            ],
        },
    },
    dataGetOverview: {
        id: '680d50d8-50c9-11f0-a6cd-daa7e4d41f1d',
        key: 'dataGetOverview',
        name: '数据获取概览',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部的数据获取相关数据统计。',
                '可见菜单：「数据获取概览」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织的数据获取相关数据统计。',
                '可见菜单：「数据获取概览」',
            ],
        },
    },
    dataAssetOverview: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2904',
        key: 'dataAssetOverview',
        name: '数据资产概览',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部的数据资产相关数据统计。',
                '可见菜单：「数据资产概览」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部的数据资产相关数据统计。',
                '可见菜单：「数据资产概览」',
            ],
        },
    },
    dataProcessOverview: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2905',
        key: 'dataProcessOverview',
        name: '数据处理概览',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部的数据处理相关数据统计。',
                '可见菜单：「数据处理概览」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织的数据处理相关数据统计。',
                '可见菜单：「数据处理概览」',
            ],
        },
    },
    dataUnderstandOverview: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2906',
        key: 'dataUnderstandOverview',
        name: '数据理解概览',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部的数据理解相关数据统计。',
                '可见菜单：「数据理解概览」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织的数据理解相关数据统计。',
                '可见菜单：「数据理解概览」',
            ],
        },
    },
    managePortalInformationDisplay: {
        id: 'f077a70c-37c9-46fd-a805-3a4265fb28b0',
        key: 'managePortalInformationDisplay',
        name: '管理门户的信息展示',
        category: 'Information',
        description: {
            [PermissionScope.All]: [
                '可在内容管理中对首页、工作专区、平台服务进行信息展示配置操作。',
                '可见菜单：「内容管理」',
            ],
        },
    },
    manageVendorCatalog: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2800',
        key: 'manageVendorCatalog',
        name: '管理厂商名录',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部厂商名录，并可对其进行新建、导入和删除操作。',
                '可见菜单：「厂商名录管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的厂商名录，并可对其进行新建、导入和删除操作。',
                '可见菜单：「厂商名录管理」',
            ],
        },
    },
    manageMessageSetting: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2801',
        key: 'manageMessageSetting',
        name: '管理消息设置',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可对「消息设置」中内容进行编辑操作。',
                '可见菜单：「消息设置」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「消息设置」',
            ],
        },
    },
    managePointRule: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2802',
        key: 'managePointRule',
        name: '管理积分规则',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部积分规则，并可对其进行增删改操作。',
                '可见菜单：「积分规则配置」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「积分规则配置」',
            ],
        },
    },
    manageContact: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2803',
        key: 'manageContact',
        name: '管理通讯录',
        category: 'Basic',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部通讯录，并可对其进行新建、导入和删除操作。',
                '可见菜单：「通讯录管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的通讯录，并可对其进行新建、导入和删除操作。',
                '可见菜单：「通讯录管理」',
            ],
        },
    },
    manageBusinessFile: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2804',
        key: 'manageBusinessFile',
        name: '管理业务文件',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部业务文件进行增删改操作。',
                '可见菜单：「文件管理」(业务认知应用平台下的文件管理，非文件资源)',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对本组织的业务文件进行增删改操作。',
                '可见菜单：「文件管理」(业务认知应用平台下的文件管理，非文件资源)',
            ],
        },
    },
    manageBusinessLabel: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2805',
        key: 'manageBusinessLabel',
        name: '管理业务标签',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部业务标签分类进行增删改操作，以及对全部业务标签进行添加授权应用操作。',
                '可见菜单：「标签分类」「标签授权」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「标签分类」「标签授权」',
            ],
        },
    },
    manageFileResource: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2806',
        key: 'manageFileResource',
        name: '管理文件资源',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部范围的数据，并可对全部文件资源进行增删改操作。',
                '可见菜单：「文件」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。并可对仅本组织的文件资源进行增删改操作。',
                '可见菜单：「文件」',
            ],
        },
    },
    manageDataSandbox: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2807',
        key: 'manageDataSandbox',
        name: '管理数据沙箱',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部数据沙箱空间和日志。',
                '可见菜单：「数据沙箱空间」「数据沙箱日志」',
            ],
            [PermissionScope.Organization]: [
                '可查看本部门的数据沙箱空间和日志。',
                '可见菜单：「数据沙箱空间」「数据沙箱日志」',
            ],
        },
    },
    manageDataValueAssessment: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2808',
        key: 'manageDataValueAssessment',
        name: '管理数据价值评估',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部价值评估报告。',
                '可见菜单：「数据价值评估」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理属于本组织数据源的价值评估报告。',
                '可见菜单：「数据价值评估」',
            ],
        },
    },
    manageDataCollectionList: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2809',
        key: 'manageDataCollectionList',
        name: '管理数据归集清单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部数据归集清单，并可对其进行增删改操作。',
                '可见菜单：「数据归集清单」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织的数据归集清单，并可对其进行增删改操作、及仅可选择属于本组织的库表。',
                '可见菜单：「数据归集清单」',
            ],
        },
    },
    manageDataProcessingPlan: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2810',
        key: 'manageDataProcessingPlan',
        name: '管理数据处理计划',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部数据处理计划，责任人无需配置权限即可访问本人的「数据处理计划」，并可创建、管理数据处理计划分配给任意用户。',
                '可见菜单：「数据处理计划」',
            ],
            [PermissionScope.Organization]: [
                '可使用本组织的数据处理计划，责任人无需配置权限即可访问本人的「数据处理计划」，并可创建、管理数据处理计划分配给本组织的用户。',
                '可见菜单：「数据处理计划」',
            ],
        },
    },
    manageStandardWorkOrder: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2811',
        key: 'manageStandardWorkOrder',
        name: '管理标准化工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部标准化工单，责任人无需配置权限即可访问本人的「标准化工单」，并可创建、管理标准化工单分配给任意用户。',
                '可见菜单：「标准化工单」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织的标准化工单，责任人无需配置权限即可访问本人的「标准化工单」，并可创建、管理标准化工单分配给本组织的用户。',
                '可见菜单：「标准化工单」',
            ],
        },
    },
    manageQualityDetectionWorkOrder: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2812',
        key: 'manageQualityDetectionWorkOrder',
        name: '管理质量检测工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部质量检测工单，责任人无需配置权限即可访问本人的「质量检测工单」，并可创建、管理质量检测工单分配给任意用户。',
                '可见菜单：「质量检测工单」',
            ],
            [PermissionScope.Organization]: [
                '可使用本组织的质量检测工单，责任人无需配置权限即可访问本人的「质量检测工单」，并可创建、管理质量检测工单分配给本组织的用户。',
                '可见菜单：「质量检测工单」',
            ],
        },
    },
    manageDataFusionWorkOrder: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2813',
        key: 'manageDataFusionWorkOrder',
        name: '管理数据融合工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部数据融合工单，责任人无需配置权限即可访问本人的「数据融合工单」，并可创建、管理数据融合工单分配给任意用户。',
                '可见菜单：「数据融合工单」',
            ],
            [PermissionScope.Organization]: [
                '可使用本组织的数据融合工单，责任人无需配置权限即可访问本人的「数据融合工单」，并可创建、管理数据融合工单分配给本组织的用户。',
                '可见菜单：「数据融合工单」',
            ],
        },
    },
    manageTenantApplication: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2814',
        key: 'manageTenantApplication',
        name: '管理租户申请',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部租户申请清单，并可对其进行增删改操作。',
                '可见菜单：「租户申请清单」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织用户发起的租户申请清单，并可对其进行增删改操作。',
                '可见菜单：「租户申请清单」',
            ],
        },
    },
    initiateDataAchievementFeedback: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2815',
        key: 'initiateDataAchievementFeedback',
        name: '发起数据成效反馈',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部已实施的共享申请，并可对其发起成效反馈。',
                '可见菜单：「发起成效反馈」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部已实施的共享申请，并可对其发起成效反馈。',
                '可见菜单：「发起成效反馈」',
            ],
        },
    },
    handleDataAchievementFeedback: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2816',
        key: 'handleDataAchievementFeedback',
        name: '处理数据成效反馈',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可查看自己创建共享申请的成效反馈，并可对其进行处理操作。',
                '可见菜单：「处理成效反馈」',
            ],
            [PermissionScope.Organization]: [
                '仅可查看自己创建共享申请的成效反馈，并可对其进行处理操作。',
                '可见菜单：「处理成效反馈」',
            ],
        },
    },
    manageDataTrustAssessment: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2817',
        key: 'manageDataTrustAssessment',
        name: '管理数据可信度评估',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部数据可信度评估报告。',
                '可见菜单：「数据可信度评估」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理属于本组织数据源的数据可信度评估报告。',
                '可见菜单：「数据可信度评估」',
            ],
        },
    },
    manageResourceNegativeList: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2818',
        key: 'manageResourceNegativeList',
        name: '管理资源负面清单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部资源负面清单。',
                '可见菜单：「资源负面清单」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理属于本组织数据源的资源负面清单。',
                '可见菜单：「资源负面清单」',
            ],
        },
    },
    manageWorkOrderInfo: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2819',
        key: 'manageWorkOrderInfo',
        name: '管理工单信息',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可查看并管理本人创建和负责的工单。',
                '可见菜单：「工单管理」',
            ],
            [PermissionScope.Organization]: [
                '仅可查看并管理本人创建和负责的工单。',
                '可见菜单：「工单管理」',
            ],
        },
    },
    manageWorkOrderTask: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2820',
        key: 'manageWorkOrderTask',
        name: '管理工单任务',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对本人创建和负责的工单任务进行执行操作。',
                '可见菜单：「任务管理-第三方任务」',
            ],
            [PermissionScope.Organization]: [
                '仅可对本人创建和负责的工单任务进行执行操作。',
                '可见菜单：「任务管理-第三方任务」',
            ],
        },
    },
    auditBusinessLabel: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2821',
        key: 'auditBusinessLabel',
        name: '审核业务标签',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的业务标签进行审核操作。',
                '可见菜单：「标签审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的业务标签进行审核操作。',
                '可见菜单：「标签审核」',
            ],
        },
    },
    auditBusinessArchitecture: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2822',
        key: 'auditBusinessArchitecture',
        name: '审核业务架构',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的业务领域和主干业务进行审核操作。',
                '可见菜单：「主干业务审核」「业务领域审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的业务领域和主干业务进行审核操作。',
                '可见菜单：「主干业务审核」「业务领域审核」',
            ],
        },
    },
    auditBusinessModel: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2823',
        key: 'auditBusinessModel',
        name: '审核业务模型',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的业务模型进行审核操作。',
                '可见菜单：「业务模型审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的业务模型进行审核操作。',
                '可见菜单：「业务模型审核」',
            ],
        },
    },
    auditDataModel: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2824',
        key: 'auditDataModel',
        name: '审核数据模型',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的数据模型进行审核操作。',
                '可见菜单：「数据模型审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的数据模型进行审核操作。',
                '可见菜单：「数据模型审核」',
            ],
        },
    },
    auditBusinessDiagnosisReport: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2825',
        key: 'auditBusinessDiagnosisReport',
        name: '审核业务诊断报告',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的业务诊断进行审核操作。',
                '可见菜单：「业务诊断审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的业务诊断进行审核操作。',
                '可见菜单：「业务诊断审核」',
            ],
        },
    },
    auditWorkOrderInfo: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2826',
        key: 'auditWorkOrderInfo',
        name: '审核工单信息',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的工单信息进行审核操作。',
                '可见菜单：「工单审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的工单信息进行审核操作。',
                '可见菜单：「工单审核」',
            ],
        },
    },
    auditIntegratedApplication: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2827',
        key: 'auditIntegratedApplication',
        name: '审核集成应用',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的集成应用进行审核操作。',
                '可见菜单：「应用审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的集成应用进行审核操作。',
                '可见菜单：「应用审核」',
            ],
        },
    },
    auditDataCollectionReport: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2830',
        key: 'auditDataCollectionReport',
        name: '审核调研报告',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的调研报告进行审核操作。',
                '可见菜单：「调研报告审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的调研报告进行审核操作。',
                '可见菜单：「调研报告审核」',
            ],
        },
    },
    auditDataCollectionList: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2831',
        key: 'auditDataCollectionList',
        name: '审核归集清单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的归集清单进行审核操作。',
                '可见菜单：「归集清单审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的归集清单进行审核操作。',
                '可见菜单：「归集清单审核」',
            ],
        },
    },
    auditFileResource: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2832',
        key: 'auditFileResource',
        name: '审核文件资源',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的文件资源进行审核操作。',
                '可见菜单：「文件审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的文件资源进行审核操作。',
                '可见菜单：「文件审核」',
            ],
        },
    },
    auditInformationResourceCatalog: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2833',
        key: 'auditInformationResourceCatalog',
        name: '审核信息资源目录',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的信息资源目录进行审核操作。',
                '可见菜单：「信息资源目录审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的信息资源目录进行审核操作。',
                '可见菜单：「信息资源目录审核」',
            ],
        },
    },
    auditDataResourceCatalog: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2834',
        key: 'auditDataResourceCatalog',
        name: '审核数据资源目录',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的数据资源目录进行审核操作。',
                '可见菜单：「数据资源目录审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的数据资源目录进行审核操作。',
                '可见菜单：「数据资源目录审核」',
            ],
        },
    },
    auditOpenDirectory: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2835',
        key: 'auditOpenDirectory',
        name: '审核开放目录',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的开放目录进行审核操作。',
                '可见菜单：「开放目录审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的开放目录进行审核操作。',
                '可见菜单：「开放目录审核」',
            ],
        },
    },
    auditFrontendApplication: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2836',
        key: 'auditFrontendApplication',
        name: '审核前置机申请',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的前置机进行审核操作。',
                '可见菜单：「前置机审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的前置机进行审核操作。',
                '可见菜单：「前置机审核」',
            ],
        },
    },
    auditStandardWorkOrder: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2837',
        key: 'auditStandardWorkOrder',
        name: '审核标准化工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的标准化工单进行审核操作。',
                '可见菜单：「标准化工单审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的标准化工单进行审核操作。',
                '可见菜单：「标准化工单审核」',
            ],
        },
    },
    auditDataProcessingPlan: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2838',
        key: 'auditDataProcessingPlan',
        name: '审核数据处理计划',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的数据处理计划进行审核操作。',
                '可见菜单：「处理计划审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的数据处理计划进行审核操作。',
                '可见菜单：「处理计划审核」',
            ],
        },
    },
    auditQualityDetectionWorkOrder: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2839',
        key: 'auditQualityDetectionWorkOrder',
        name: '审核质量检测工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的检测工单进行审核操作。',
                '可见菜单：「检测工单审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的检测工单进行审核操作。',
                '可见菜单：「检测工单审核」',
            ],
        },
    },
    auditDataFusionWorkOrder: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2840',
        key: 'auditDataFusionWorkOrder',
        name: '审核数据融合工单',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的融合工单进行审核操作。',
                '可见菜单：「融合工单审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的融合工单进行审核操作。',
                '可见菜单：「融合工单审核」',
            ],
        },
    },
    auditTenantApplication: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2842',
        key: 'auditTenantApplication',
        name: '审核租户申请',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的租户申请进行审核操作。',
                '可见菜单：「租户申请审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的租户申请进行审核操作。',
                '可见菜单：「租户申请审核」',
            ],
        },
    },
    auditSharedApplicationDeclaration: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2847',
        key: 'auditSharedApplicationDeclaration',
        name: '审核共享申请申报',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的申报进行审核操作。',
                '可见菜单：「申报审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的申报进行审核操作。',
                '可见菜单：「申报审核」',
            ],
        },
    },
    auditSharedApplicationAnalysisConclusion: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2848',
        key: 'auditSharedApplicationAnalysisConclusion',
        name: '审核共享申请分析结论',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的分析结论进行审核操作。',
                '可见菜单：「分析结论审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的分析结论进行审核操作。',
                '可见菜单：「分析结论审核」',
            ],
        },
    },
    auditSharedApplicationDataProvider: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2849',
        key: 'auditSharedApplicationDataProvider',
        name: '共享申请数据提供方审核',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对本部门的审核待办中的数据提供进行审核操作。',
                '可见菜单：「数据提供方审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对本部门的审核待办中的数据提供进行审核操作。',
                '可见菜单：「数据提供方审核」',
            ],
        },
    },
    auditDataAchievementFeedback: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2850',
        key: 'auditDataAchievementFeedback',
        name: '审核数据成效反馈',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的成效反馈进行审核操作。',
                '可见菜单：「成效反馈审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的成效反馈进行审核操作。',
                '可见菜单：「成效反馈审核」',
            ],
        },
    },
    auditDataAnalysisDemandDeclaration: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2851',
        key: 'auditDataAnalysisDemandDeclaration',
        name: '审核数据分析需求申报',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的申报进行审核操作。',
                '可见菜单：「申报审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的申报进行审核操作。',
                '可见菜单：「申报审核」',
            ],
        },
    },
    auditDataAnalysisDemandConclusion: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2852',
        key: 'auditDataAnalysisDemandConclusion',
        name: '审核数据分析需求结论',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的分析结论进行审核操作。',
                '可见菜单：「分析结论审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的分析结论进行审核操作。',
                '可见菜单：「分析结论审核」',
            ],
        },
    },
    auditDataSandbox: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2854',
        key: 'auditDataSandbox',
        name: '审核数据沙箱',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的数据沙箱进行审核操作。',
                '可见菜单：「数据沙箱审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的数据沙箱进行审核操作。',
                '可见菜单：「数据沙箱审核」',
            ],
        },
    },
    auditDataCatalogReport: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2855',
        key: 'auditDataCatalogReport',
        name: '审核数据目录上报',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的目录上报进行审核操作。',
                '可见菜单：「目录上报审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的目录上报进行审核操作。',
                '可见菜单：「目录上报审核」',
            ],
        },
    },
    auditDataResourceReport: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2856',
        key: 'auditDataResourceReport',
        name: '审核数据资源上报',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的资源上报进行审核操作。',
                '可见菜单：「资源上报审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的资源上报进行审核操作。',
                '可见菜单：「资源上报审核」',
            ],
        },
    },
    auditDataDemand: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2857',
        key: 'auditDataDemand',
        name: '审核数据需求',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的需求进行审核操作。',
                '可见菜单：「需求审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的需求进行审核操作。',
                '可见菜单：「需求审核」',
            ],
        },
    },
    auditSharedResource: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2858',
        key: 'auditSharedResource',
        name: '审核共享资源',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的资源共享进行审核操作。',
                '可见菜单：「资源审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的资源共享进行审核操作。',
                '可见菜单：「资源审核」',
            ],
        },
    },
    auditDataDisagreement: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2859',
        key: 'auditDataDisagreement',
        name: '审核数据异议',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的数据异议进行审核操作。',
                '可见菜单：「数据异议审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的数据异议进行审核操作。',
                '可见菜单：「数据异议审核」',
            ],
        },
    },
    auditIntegratedApplicationReport: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2860',
        key: 'auditIntegratedApplicationReport',
        name: '审核集成应用上报',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的应用上报进行审核操作。',
                '可见菜单：「应用上报审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的应用上报进行审核操作。',
                '可见菜单：「应用上报审核」',
            ],
        },
    },
    initiateDataCatalogReport: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2861',
        key: 'initiateDataCatalogReport',
        name: '发起数据目录上报',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '可查看全部目录待上报、已上报、已撤销上报、上报记录的数据，并可对任意目录发起上报操作。',
                '可见菜单：「数据资源目录上报」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织目录待上报、已上报、已撤销上报、上报记录的数据，并可对本组织的目录发起上报操作。',
                '可见菜单：「数据资源目录上报」',
            ],
        },
    },
    initiateDataResourceReport: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2862',
        key: 'initiateDataResourceReport',
        name: '发起数据资源上报',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '可查看全部数据资源待上报、已上报、上报记录的数据，并可对任意数据资源发起上报操作。',
                '可见菜单：「数据资源上报」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织数据资源待上报、已上报、上报记录的数据，并可对本组织的数据资源发起上报操作。',
                '可见菜单：「数据资源上报」',
            ],
        },
    },
    initiateDataDemand: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2863',
        key: 'initiateDataDemand',
        name: '发起需求申请',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '可查看全部已提交的需求申请，并可对其进行增删改操作。',
                '可见菜单：「需求申请」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织成员发起的需求申请，并可对其进行增删改操作。',
                '可见菜单：「需求申请」',
            ],
        },
    },
    implementDataDemand: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2864',
        key: 'implementDataDemand',
        name: '需求签收和实施',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '可查看全部已提交的需求申请，并可对其进行处理操作。',
                '可见菜单：「需求大厅」「需求处理」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部已提交的需求申请，并可对其进行处理操作。',
                '可见菜单：「需求大厅」「需求处理」',
            ],
        },
    },
    manageSharedApplicationAndSubscription: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2865',
        key: 'manageSharedApplicationAndSubscription',
        name: '管理共享申请和订阅',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '可对全部资源进行申请、订阅以及提出数据异议。',
                '可见菜单：「资源申请」「资源订阅」「数据异议提出」',
            ],
            [PermissionScope.Organization]: [
                '可对本部门的资源进行申请、订阅以及提出数据异议。',
                '可见菜单：「资源申请」「资源订阅」「数据异议提出」',
            ],
        },
    },
    managePendingSharedApplication: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2866',
        key: 'managePendingSharedApplication',
        name: '管理待处理共享申请',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '可对全部共享申请进行数据异议处理。',
                '可见菜单：「共享申请列表」「数据异议处理」',
            ],
            [PermissionScope.Organization]: [
                '可对本部门的共享申请进行数据异议处理。',
                '可见菜单：「共享申请列表」「数据异议处理」',
            ],
        },
    },
    initiateApplicationCaseReport: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2867',
        key: 'initiateApplicationCaseReport',
        name: '发起应用案例上报',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部已上报的应用案例，并可发起任意部门的应用案例上报。',
                '可见菜单：「应用案例上报」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理本部门已上报的应用案例，并仅可发起本部门的应用案例上报。',
                '可见菜单：「应用案例上报」',
            ],
        },
    },
    viewProvincialApplicationCase: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2868',
        key: 'viewProvincialApplicationCase',
        name: '查看省级应用案例',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '可查看全部省级应用案例。',
                '可见菜单：「省级应用案例」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部省级应用案例。',
                '可见菜单：「省级应用案例」',
            ],
        },
    },
    manageIntegratedApplication: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2869',
        key: 'manageIntegratedApplication',
        name: '管理集成应用',
        category: 'SszdZone',
        description: {
            [PermissionScope.All]: [
                '可查看全部集成应用及上报记录、管理全部集成应用，并可发起任意集成应用上报。',
                '可见菜单：「应用管理」「应用系统上报」',
            ],
            [PermissionScope.Organization]: [
                '可查看本部门的集成应用及上报记录、管理全部集成应用，并可发起本部门的集成应用上报。',
                '可见菜单：「应用管理」「应用系统上报」',
            ],
        },
    },
    applicationFrontMachine: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2870',
        key: 'applicationFrontMachine',
        name: '申请前置机',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部前置机申请列表，并可对其进行申请和签收操作。',
                '可见菜单：「前置机申请」',
            ],
            [PermissionScope.Organization]: [
                '可查看本部门的前置机申请列表，并可对其进行申请和签收操作。',
                '可见菜单：「前置机申请」',
            ],
        },
    },
    auditDataAnalysisResultsOutDatabase: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2871',
        key: 'auditDataAnalysisResultsOutDatabase',
        name: '审核数据分析成果出库',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的分析成果出库进行审核操作。',
                '可见菜单：「分析成果出库审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的分析成果出库进行审核操作。',
                '可见菜单：「分析成果出库审核」',
            ],
        },
    },
    handleAnalysisDemandAchievementFeedback: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2872',
        key: 'handleAnalysisDemandAchievementFeedback',
        name: '处理分析需求成效反馈',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可查看自己创建的分析需求的成效反馈，并可对其进行处理操作。',
                '可见菜单：「处理成效反馈」',
            ],
            [PermissionScope.Organization]: [
                '仅可查看自己创建的分析需求的成效反馈，并可对其进行处理操作。',
                '可见菜单：「处理成效反馈」',
            ],
        },
    },
    auditAnalysisDemandAchievementFeedback: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2873',
        key: 'auditAnalysisDemandAchievementFeedback',
        name: '审核分析需求成效反馈',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '仅可对用户自己的审核待办中的成效反馈进行审核操作。',
                '可见菜单：「成效反馈审核」',
            ],
            [PermissionScope.Organization]: [
                '仅可对用户自己的审核待办中的成效反馈进行审核操作。',
                '可见菜单：「成效反馈审核」',
            ],
        },
    },
    manageElectronicCertificateCatalog: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2874',
        key: 'manageElectronicCertificateCatalog',
        name: '管理电子证照目录',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部电子证照目录，并可对其进行增删改及导出操作。',
                '可见菜单：「电子证照目录」',
            ],
            [PermissionScope.Organization]: [
                '可使用本组织的电子证照目录，并可对其进行增删改及导出操作。',
                '可见菜单：「电子证照目录」',
            ],
        },
    },
    manageCatalogClassification: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2875',
        key: 'manageCatalogClassification',
        name: '管理目录分类',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用系统中全部目录分类，并可对其进行增删改操作。',
                '可见菜单：「目录分类管理」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「目录分类管理」',
            ],
        },
    },
    manageOpenCatalog: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2876',
        key: 'manageOpenCatalog',
        name: '管理开放目录',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部开放目录，并可对其进行增删改操作。',
                '可见菜单：「开放目录概览」「开放目录」',
            ],
            [PermissionScope.Organization]: [
                '可使用本组织的开放目录，并可对其进行增删改操作。',
                '可见菜单：「开放目录概览」「开放目录」',
            ],
        },
    },
    improveDataAnalysisDemand: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2877',
        key: 'improveDataAnalysisDemand',
        name: '完善数据分析需求',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部数据分析需求分析清单，并可对所有待签收的分析需求进行签收操作，对自己签收的分析需求进行分析操作。',
                '可见菜单：「分析完善」',
            ],
            [PermissionScope.Organization]: [
                '可查看本部门的数据分析需求分析清单，并可对待签收的分析需求进行签收操作，对自己签收的分析需求进行分析操作。',
                '可见菜单：「分析完善」',
            ],
        },
    },
    implementDataAnalysisDemand: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2878',
        key: 'implementDataAnalysisDemand',
        name: '实施数据分析需求',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部数据分析需求实施清单，并可对全部待签收的分析需求进行签收操作、对自己签收的需求进行实施操作。',
                '可见菜单：「数据资源实施」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织的数据分析需求实施清单，并可对待签收的分析需求进行签收操作、对自己签收的需求进行实施操作。',
                '可见菜单：「数据资源实施」',
            ],
        },
    },
    confirmDataAnalysisDemandAchievement: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2879',
        key: 'confirmDataAnalysisDemandAchievement',
        name: '确认数据分析需求成果',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部需求分析成果，并可对其进行确认操作。',
                '可见菜单：「分析成果确认」',
            ],
            [PermissionScope.Organization]: [
                '可查看本组织成员发起的需求分析成果，并可对其进行确认操作。',
                '可见菜单：「分析成果确认」',
            ],
        },
    },
    handleDataAnalysisDemandAchievementOutDatabase: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2880',
        key: 'handleDataAnalysisDemandAchievementOutDatabase',
        name: '处理数据分析需求成果出库',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部待申请和已申请的分析成果，并可对全部数据分析成果进行出库申请操作。',
                '可见菜单：「分析成果出库」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部待申请和已申请的分析成果，并可对全部数据分析成果进行出库申请操作。',
                '可见菜单：「分析成果出库」',
            ],
        },
    },
    feedbackDataAnalysisDemandAchievement: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2881',
        key: 'feedbackDataAnalysisDemandAchievement',
        name: '反馈数据分析需求成效',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部需求分析成果，并可对其发起成效反馈操作。',
                '可见菜单：「发起成效反馈」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部需求分析成果，并可对其发起成效反馈操作。',
                '可见菜单：「发起成效反馈」',
            ],
        },
    },
    manageAnalysisDemandAchievementCatalog: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2882',
        key: 'manageAnalysisDemandAchievementCatalog',
        name: '管理需求分析成果目录',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部需求分析成果目录，并可对其进行编目操作。',
                '可见菜单：「数据资源编目」（需求分析成果编目）',
            ],
            [PermissionScope.Organization]: [
                '可查看全部需求分析成果目录，并可对其进行编目操作。',
                '可见菜单：「数据资源编目」（需求分析成果编目）',
            ],
        },
    },
    applyDataSandbox: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2883',
        key: 'applyDataSandbox',
        name: '申请数据沙箱',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部数据沙箱申请清单，并可对其进行申请操作。',
                '可见菜单：「数据沙箱清单」',
            ],
            [PermissionScope.Organization]: [
                '可查看本部门的数据沙箱申请清单，并可对其进行申请操作。',
                '可见菜单：「数据沙箱清单」',
            ],
        },
    },
    implementDataSandbox: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2884',
        key: 'implementDataSandbox',
        name: '实施数据沙箱',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部数据沙箱实施清单，并可对其进行实施操作。',
                '可见菜单：「数据沙箱实施」',
            ],
            [PermissionScope.Organization]: [
                '可使用系统中仅本组织的数据，以及全部的角色角色组、业务域、主题定义、数据分级标签、编码生成规则、数据标准。',
                '不可见菜单：「数据沙箱实施」',
            ],
        },
    },
    confirmDataPush: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2886',
        key: 'confirmDataPush',
        name: '确认数据推送',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看全部已推送的需求，并可对其进行确认操作。',
                '可见菜单：「数据推送确认」',
            ],
            [PermissionScope.Organization]: [
                '可查看全部已推送的需求，并可对其进行确认操作。',
                '可见菜单：「数据推送确认」',
            ],
        },
    },
    confirmDemandResource: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2887',
        key: 'confirmDemandResource',
        name: '确认需求资源',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看本部门的需求资源，并可对其进行确认操作。',
                '可见菜单：「需求资源确认」',
            ],
            [PermissionScope.Organization]: [
                '可查看本部门的需求资源，并可对其进行确认操作。',
                '可见菜单：「需求资源确认」',
            ],
        },
    },
    manageSystemEvaluation: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2888',
        key: 'manageSystemEvaluation',
        name: '管理系统进行评价',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看并管理全部运行评价。',
                '可见菜单：「系统运行评价」',
            ],
            [PermissionScope.Organization]: [
                '可查看并管理属于本组织的运行评价。',
                '可见菜单：「系统运行评价」',
            ],
        },
    },
    manageDataQualityDetectionTemplate: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2889',
        key: 'manageDataQualityDetectionTemplate',
        name: '数据质量检测模板',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可使用全部数据质量检测模版，并可创建、管理全部数据质量检测模版。',
                '可见菜单：「数据质量检测模版」',
            ],
            [PermissionScope.Organization]: [
                '可使用全部数据质量检测模版，并可创建、管理全部数据质量检测模版。',
                '可见菜单：「数据质量检测模版」',
            ],
        },
    },
    viewDepartmentAssessmentOverview: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2898',
        key: 'viewDepartmentAssessmentOverview',
        name: '查看部门数据考核概览',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看用户自己部门目标的数据考核情况。',
                '可见菜单：「部门数据考核概览」',
            ],
            [PermissionScope.Organization]: [
                '可查看用户自己部门目标的数据考核情况。',
                '可见菜单：「部门数据考核概览」',
            ],
        },
    },
    manageDepartmentAssessmentTarget: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2899',
        key: 'manageDepartmentAssessmentTarget',
        name: '管理部门考核目标',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看用户自己所在部门的目标和自己给部门创建的目标，并可对其进行增删改操作。',
                '可见菜单：「部门考核目标」',
            ],
            [PermissionScope.Organization]: [
                '可查看用户自己所在部门的目标和自己给部门创建的目标，并可对其进行增删改操作。',
                '可见菜单：「部门考核目标」',
            ],
        },
    },
    manageDepartmentAssessmentPlan: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2900',
        key: 'manageDepartmentAssessmentPlan',
        name: '管理部门考核计划',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看用户自己部门的考核计划，并可对其进行增删改操作。',
                '可见菜单：「部门考核计划」',
            ],
            [PermissionScope.Organization]: [
                '可查看用户自己部门的考核计划，并可对其进行增删改操作。',
                '可见菜单：「部门考核计划」',
            ],
        },
    },
    viewOperationAssessmentOverview: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2901',
        key: 'viewOperationAssessmentOverview',
        name: '查看运营数据考核概览',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看用户自己负责/参与的运营目标的数据考核情况。',
                '可见菜单：「运营数据考核概览」',
            ],
            [PermissionScope.Organization]: [
                '可查看用户自己负责/参与的运营目标的数据考核情况。',
                '可见菜单：「运营数据考核概览」',
            ],
        },
    },
    manageOperationAssessmentTarget: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2902',
        key: 'manageOperationAssessmentTarget',
        name: '管理运营考核目标',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看用户自己创建/负责/参与的运营考核目标，并可对其进行增删改操作。',
                '可见菜单：「运营考核目标」',
            ],
            [PermissionScope.Organization]: [
                '可查看用户自己创建/负责/参与的运营考核目标，并可对其进行增删改操作。',
                '可见菜单：「运营考核目标」',
            ],
        },
    },
    manageOperationAssessmentPlan: {
        id: '0077a70c-37c9-46fd-a805-3a4265fb2903',
        key: 'manageOperationAssessmentPlan',
        name: '管理运营考核计划',
        category: 'Operation',
        description: {
            [PermissionScope.All]: [
                '可查看用户自己负责/参与的运营考核计划，并可对其进行增删改操作。',
                '可见菜单：「运营考核计划」',
            ],
            [PermissionScope.Organization]: [
                '可查看用户自己负责/参与的运营考核计划，并可对其进行增删改操作。',
                '可见菜单：「运营考核计划」',
            ],
        },
    },
}

/** 将内置角色转换为权限 */
export const convertRoleToPermissions = (roleIds: string[]) => {
    return roleIds.map((roleId) =>
        rolePermissions[roleId].map((per) => ({
            ...per,
            ...permissionMap[per.key],
        })),
    )
}
