import { ConfigProvider, message } from 'antd'
import 'antd/dist/antd.less'
import enUS from 'antd/lib/locale/en_US'
import zhCN from 'antd/lib/locale/zh_CN'
import zhTW from 'antd/lib/locale/zh_TW'
import 'moment/locale/zh-cn'
import 'normalize.css'
import '../../common.less'
import '../../resetAntd.less'
import { BrowserRouter } from 'react-router-dom'
import { memo, useMemo } from 'react'
import ApiServiceAudit from '@/components/ApiServiceAudit'
import DataViewAudit from '@/components/DataViewAudit'
import PermissionAudit from '@/components/PermissionAudit'
import ResourcesAudit from '@/components/ResourcesAudit'
import { ObjectionAudit } from '@/components/ObjectionMgt'
import { getLanguage, i18n } from '@/utils'
import ResourceShareAudit from '@/components/ResourceSharing/Audit'
import InfoCatlgAudit from '@/components/InfoRescCatlgAudit'
import { PolicyType } from '@/components/AuditPolicy/const'
import BusinessTagAudit from '@/components/BusinessTagAudit'
import DataPushAudit from '@/components/DataPush/Audit'

ConfigProvider.config({
    prefixCls: 'any-fabric-ant',
    iconPrefixCls: 'any-fabric-anticon',
})

message.config({
    maxCount: 1,
    duration: 3,
})

function DataOperationAuditApp(props: any) {
    const {
        props: {
            process: { audit_type },
        },
    } = props
    const catalogList = [
        'af-data-catalog-publish',
        'af-data-catalog-online',
        'af-data-catalog-offline',
        'af-data-catalog-change',
    ]
    const applicationList = [
        'af-data-application-publish',
        'af-data-application-online',
        'af-data-application-offline',
        'af-data-application-change',
        'af-data-application-request',
    ]
    const dataViewList = [
        'af-data-view-publish',
        'af-data-view-online',
        'af-data-view-offline',
        'af-data-view-change',
        'af-data-view-request',
    ]
    // 信息资源目录
    const infoCatlgList = [
        'af-info-catalog-publish',
        'af-info-catalog-online',
        'af-info-catalog-offline',
    ]
    // 业务标签
    const businessTagList = [
        PolicyType.BigdataCreateCategoryLabel,
        PolicyType.BigdataUpdateCategoryLabel,
        PolicyType.BigdataDeleteCategoryLabel,
        PolicyType.BigdataAuthCategoryLabel,
    ]

    const permissionList = ['af-data-permission-request']

    const sszdDemandList = ['af-sszd-demand-escalate']

    const resourceShareList = [
        'af-sszd-share-apply-escalate',
        'af-sszd-share-apply-approve',
    ]

    const dataObjection = ['af-sszd-objection-escalate']

    // 数据推送
    const dataPushList = [PolicyType.DataPushAudit]

    // 租户申请
    const tenantApplicationList = [PolicyType.TenantApplication]

    const language: string = getLanguage() || 'zh-cn'

    const getAntdLocal = (lang: string) => {
        switch (lang) {
            case 'zh-cn':
                return zhCN

            case 'zh-tw':
                return zhTW

            default:
                return enUS
        }
    }

    i18n.setup({
        locale: language,
    })
    const auditContent = useMemo(() => {
        return catalogList.includes(audit_type) ? (
            <ResourcesAudit props={props} />
        ) : applicationList.includes(audit_type) ? (
            <ApiServiceAudit props={props} />
        ) : dataViewList.includes(audit_type) ? (
            <DataViewAudit props={props} />
        ) : infoCatlgList.includes(audit_type) ? (
            <InfoCatlgAudit props={props} />
        ) : permissionList.includes(audit_type) ? (
            <PermissionAudit props={props} />
        ) : resourceShareList.includes(audit_type) ? (
            <ResourceShareAudit props={props} />
        ) : dataObjection.includes(audit_type) ? (
            <ObjectionAudit props={props} />
        ) : businessTagList.includes(audit_type) ? (
            <BusinessTagAudit props={props} />
        ) : dataPushList.includes(audit_type) ? (
            <DataPushAudit props={props} />
        ) : (
            <h1>请配置审核页面</h1>
        )
    }, [audit_type])

    return (
        <BrowserRouter>
            <ConfigProvider
                locale={getAntdLocal(language)}
                prefixCls="any-fabric-ant"
                iconPrefixCls="any-fabric-anticon"
                autoInsertSpaceInButton={false}
                getPopupContainer={() =>
                    document.getElementById('dataOperationAudit') ||
                    document.body
                }
            >
                {auditContent}
            </ConfigProvider>
        </BrowserRouter>
    )
}

export default memo(DataOperationAuditApp)
