import { registerMicroApps, start } from 'qiankun'
import Cookies from 'js-cookie'
import { message } from 'antd'
import { refreshOauth2Token, getActualUrl, onTokenExpired } from '@/utils'
import addReviewerInWorkflow from './components/AddReviewerInWorkflow'

/** 审核常规属性配置 */
export const AuditGeneralProps: any = {
    tenantId: 'af_workflow',
    irrevocableAuditType: ['af-data-catalog-online'],
    microWidgetProps: {
        token: {
            getToken: {
                access_token: Cookies.get('af.oauth2_token'),
            },
            refreshOauth2Token: () => refreshOauth2Token(),
            onTokenExpired: () => refreshOauth2Token(),
        },
        language: {
            getLanguage: 'zh-cn',
        },
        config: {
            systemInfo: {
                platform: 'web',
                realLocation: window.location,
            },
            getTheme: {
                normal: '#126ee3',
                hover: '#3a8ff0',
                active: '#064fbd',
                disabled: '#65b1fc',
            },
        },
        component: {
            toast: message,
        },
        history: {
            getBasePath: getActualUrl('/doc-audit-client').substring(1),
        },
        contextMenu: {
            addAccessorFn: addReviewerInWorkflow,
        },
    },
}

/** workflow 常规参数属性 */
export const WorkflowGeneralProps: any = {
    // protocol: window.location.protocol,
    // host: window.location.hostname,
    port: window.location.port,
    lang: 'zh-cn',
    getToken: () => Cookies.get('af.oauth2_token') || '',
    refreshToken: () => refreshOauth2Token(),
    onTokenExpired,
    getUserInfo: () => ({
        id: '',
        user: {
            loginName: '',
            departmentIds: '',
            pwdControl: false,
        },
    }),
    // 屏蔽加签
    allowAddSign: true, // 允许加签
    // 屏蔽转审
    allowTransfer: true, // 允许转审
    // 屏蔽动态审核员
    allowDynamicAuditor: true,
    // 屏蔽用户组
    allowUserGroup: false,
    // 允许指定审核策略
    allowExecutingAuditor: false,
    tabLabel: 'AnyFabric',
    tenantId: 'af_workflow',
    deptAuditorRuleUrl: '/workflow-manage-front',
    CSRFToken: Cookies.get('af.oauth2_token'),
}

export const WorkflowManageFrontApp = {
    name: 'workflow-manage-front', // app name registered
    entry: '/workflow-manage-front/',
    container:
        '#workflow-manage-front' ||
        document.getElementById('workflow-manage-front'),
    activeRule: getActualUrl('/workflow-manage-front').substring(1),
    props: WorkflowGeneralProps,
}

export const WorkflowManageFrontAuditorApp = {
    name: 'workflow-manage-front-auditor', // app name registered
    entry: '/workflow-manage-front/',
    container:
        '#workflow-manage-front' ||
        document.getElementById('workflow-manage-front'),
    activeRule: getActualUrl('/workflow-manage-front-auditor').substring(1),
    props: {
        ...WorkflowGeneralProps,
        getRouter: () => 'deptAuditorRule',
    },
}

export const DocAuditClientApp = {
    name: 'doc-audit-client', // app name registered
    entry: '/doc-audit-client/',
    container:
        '#doc-audit-client' || document.getElementById('doc-audit-client'),
    activeRule: getActualUrl('/doc-audit-client').substring(1),
    props: AuditGeneralProps,
    sandbox: {
        strictStyleIsolation: false,
        experimentalStyleIsolation: true,
    },
}

export const MicroAppsArr = [
    DocAuditClientApp,
    WorkflowManageFrontApp,
    WorkflowManageFrontAuditorApp,
]

registerMicroApps(MicroAppsArr)

start({ prefetch: true })
