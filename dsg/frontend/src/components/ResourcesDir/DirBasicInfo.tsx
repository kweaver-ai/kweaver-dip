import { Tooltip, Button, Tag } from 'antd'
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useMemo,
} from 'react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import { uniq } from 'lodash'
import { FontIcon, AppDataContentColored } from '@/icons'
import { IconType } from '@/icons/const'
import { ICatlgContent } from '@/core/apis/dataCatalog/index.d'
import styles from './styles.module.less'
import {
    formatError,
    getRescDirDetail,
    reqDataCatlgBasicInfo,
    getDataCatalogMount,
    getDataCatalogMountFrontend,
    getCategory,
    SystemCategory,
    detailFrontendServiceOverview,
    getDatasheetViewDetails,
    getFileCatalogDetail,
    getDataGradeLabel,
    DataGradeLabelType,
    getApplyScopeConfig,
} from '@/core'
import __ from './locale'
import {
    basicInfoDetailsList,
    getDataRangeOptions,
    getDepartmentName,
    getScheduling,
    flattenChildrenEnhanced,
    governmentInfoKeys,
    UndsLabel,
} from './helper'
import { getState } from '../DatasheetView/helper'
import { Expand, DetailsLabel, Loader } from '@/ui'
import { LabelTitle } from './BaseInfo'
import LogicViewDetail from '../DataAssetsCatlg/LogicViewDetail'
import {
    ResourceType,
    publishStatus,
    publishStatusList,
    onLineStatus,
    onLineStatusList,
    OpenTypeEnum,
    ShareTypeEnum,
    ScheduleType,
    ScheduleTypeTips,
    ScheduleTypeList,
    updateCycle,
    UseScene,
    resourceTypeList,
    onlinedRejectList,
    publishedRejectList,
} from './const'
import ApplicationServiceDetail from '../DataAssetsCatlg/ApplicationServiceDetail'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import ApiEditTable, { ColumnKeys } from './MountResource/ApiEditTable'
import { buildTreeFromSubjectInfo, getActualUrl, useQuery } from '@/utils'
import MountResourceTable from './MountResource/MountResourceTable'
import FileDetail from '@/components/DataAssetsCatlg/FileInfoDetail'
import { useResourcesCatlogContext } from './ResourcesCatlogProvider'

interface IDirBasicInfo {
    catalogId: string
    isAudit?: boolean
    isMarket?: boolean
}
// DirDetailContent传参数
const DirBasicInfo = forwardRef((props: IDirBasicInfo, ref) => {
    const { catalogId, isAudit, isMarket } = props
    const navigator = useNavigate()
    const query = useQuery()
    const { isFileRescType, setIsFileRescType, setLabelList, labelList } =
        useResourcesCatlogContext()
    const isResourcesList = query.get('isResourcesList') || ''
    const [loading, setLoading] = useState(true)
    const [loginViewOpen, setLoginViewOpen] = useState(false)
    const [applicationServiceOpen, setApplicationServiceOpen] = useState(false)
    const [logicViewId, setLoginViewId] = useState<string>('')

    const [dirContent, setDirContent] = useState<any>()

    const [basicInfoDetailsData, setBasicInfoDetailsData] =
        useState<any[]>(basicInfoDetailsList)
    const [{ using, governmentSwitch }] = useGeneralConfig()
    const [fileDetailOpen, setFileDetailOpen] = useState(false)

    const governmentStatus = useMemo(() => {
        return governmentSwitch.on
    }, [governmentSwitch])

    const getDirName = () => {
        return dirContent?.name || ''
    }

    useImperativeHandle(ref, () => ({
        getDirName,
    }))

    const getDirContent = async () => {
        if (!catalogId) return
        try {
            // isAudit draft_id
            setLoading(true)
            let draftDetailsRes = {}
            const detailsAction = isMarket
                ? reqDataCatlgBasicInfo
                : getRescDirDetail
            const res = await detailsAction(catalogId)
            if (res?.draft_id !== '0' && isAudit) {
                draftDetailsRes = await detailsAction(res?.draft_id)
            }
            const mountAction = isMarket
                ? getDataCatalogMountFrontend
                : getDataCatalogMount
            const mountRes = await mountAction(
                res?.draft_id !== '0' && isAudit ? res?.draft_id : catalogId,
            )

            const { entries } = await getCategory({})
            const applyScopeConfig = await getApplyScopeConfig()

            const categorys =
                applyScopeConfig.categories.filter(
                    (item) =>
                        item.modules.find(
                            (module) =>
                                module.apply_scope_id ===
                                SystemCategory.InformationSystem,
                        )?.selected,
                ) || []
            const hasBusinessSystem: boolean = !!categorys?.find(
                (item) => item.id === SystemCategory.InformationSystem,
            )?.id
            const mountInfo =
                mountRes?.mount_resource?.find(
                    (o) => o.resource_type === ResourceType.DataView,
                ) || mountRes?.mount_resource?.[0]
            const gradeRes = await getDataGradeLabel({})
            const gradeLabelList = flattenChildrenEnhanced(gradeRes?.entries)
                ?.filter((o) => o.node_type === DataGradeLabelType.Node)
                ?.reverse()
            setLabelList(gradeLabelList)
            // let isRescExist = false
            const resourceType = mountInfo?.resource_type
            const resourceId = mountInfo?.resource_id
            let dataViewResource: any = {}
            // try {
            if (resourceType === ResourceType.DataView) {
                dataViewResource = await getDatasheetViewDetails(resourceId)
                // } else if (resourceType === ResourceType.Api) {
                //     await detailFrontendServiceOverview(resourceId)
                // } else if (resourceType === ResourceType.File) {
                //     await getFileCatalogDetail(resourceId)
            }
            //     isRescExist = true
            // } catch (e) {
            //     // formatError(e)
            //     const errCode = e?.data?.code || ''

            //     if (
            //         [
            //             'DataApplicationService.Service.ServiceIDNotExist',
            //             'DataView.FormView.FormViewIdNotExist',
            //         ].includes(errCode)
            //     ) {
            //         isRescExist = false
            //     }
            // }
            const isFileResc =
                mountRes?.mount_resource?.length &&
                mountRes?.mount_resource?.every(
                    (o) => o.resource_type === ResourceType.File,
                )
            setIsFileRescType(isFileResc)
            const info = {
                ...(res?.draft_id !== '0' && isAudit ? draftDetailsRes : res),
                mountInfo,
                hasBusinessSystem,
                mount_resource: mountRes?.mount_resource?.map((o) => ({
                    ...o,
                    technical_name: dataViewResource?.technical_name,
                })),
                isFileRescType: isFileResc,
                gradeLabelList,
                dataViewResource,
                // resource_type: resourceType,
            }
            setDirContent(info)
            getDetailsInfo(info, categorys)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (catalogId) {
            getDirContent()
        }
    }, [catalogId])

    const toEdit = () => {
        const url = `/dataService/AddResourcesDirList?id=${catalogId}&type=edit&backUrl=/dataService/dirContent?catlgId=${catalogId}&name=${
            dirContent?.name || ''
        }`
        navigator(url)
    }

    const getDetailsInfo = (data: any, categorys?: any[]) => {
        // const resourceType = data?.mountInfo?.resource_type
        const filterKeys: string[] = []
        const list = basicInfoDetailsData?.map((item) => {
            let itemList = item?.list.map((it) => {
                const obj = { ...it, value: data[it.key] }
                if (it.key === 'created_at' || it.key === 'updated_at') {
                    obj.value = data[it.key]
                        ? moment(data[it.key]).format('YYYY-MM-DD HH:mm:ss')
                        : '--'
                }
                if (it.key === 'subject') {
                    if (isMarket) {
                        const domainL2Tree = buildTreeFromSubjectInfo(
                            data?.subject_info,
                            {
                                path_id: 'subject_path',
                                path_name: 'subject_path',
                            },
                        )
                        const domainList: string[] = []
                        domainL2Tree.forEach((dItem) => {
                            if (dItem.children?.length) {
                                dItem.children.forEach((child) => {
                                    return domainList.push(
                                        `${dItem.name}/${child.name}`,
                                    )
                                })
                            } else {
                                domainList.push(dItem.name)
                            }
                        })
                        obj.value = domainList
                    } else {
                        obj.value =
                            data?.subject_info
                                ?.map((o) => o.subject)
                                .join(',') || '--'
                    }
                }
                if (it.key === 'data_classify') {
                    obj.value = data?.gradeLabelList?.find(
                        (o) => o.id === data?.data_classify,
                    )?.name
                }
                if (it.key === 'business_matters') {
                    const businessMattersList =
                        data?.business_matters?.map((o) => o.name) ||
                        data?.data_related_matters?.split(';') ||
                        []
                    obj.render = () => {
                        return businessMattersList?.map((o, index) => {
                            return (
                                <Tag
                                    key={`${o}-${index}`}
                                    className={styles.tagItem}
                                    title={o}
                                >
                                    {o}
                                </Tag>
                            )
                        })
                    }
                }
                // 省直达挂接资源名称
                if (it.key === 'resourceName') {
                    const isRescExist = true
                    obj.render = () => {
                        return data?.mount_resource?.map((o, index) => {
                            const name =
                                o.name +
                                    (index ===
                                    (data?.mount_resource?.length || 0) - 1
                                        ? ''
                                        : '、') || '--'
                            return (
                                <a
                                    key={o.resource_id}
                                    title={o.name || ''}
                                    onClick={() => {
                                        if (isRescExist) {
                                            onResourceClick(
                                                o.resource_type,
                                                o.resource_id,
                                            )
                                        }
                                    }}
                                    className={
                                        isRescExist
                                            ? undefined
                                            : styles.mountNameBtnDisable
                                    }
                                >
                                    {name}
                                </a>
                            )
                        })
                    }
                }
                if (
                    it.key === 'request_format' ||
                    it.key === 'response_format'
                ) {
                    obj.value = it.options?.find(
                        (o) => o.value === data?.mountInfo?.[it.key],
                    )?.label
                }
                if (it.key === 'scheduling_plan') {
                    obj.value = getScheduling(data.mountInfo)
                }
                if (it.key === 'resource_type') {
                    obj.value = uniq(
                        data?.mount_resource?.map(
                            (o) =>
                                resourceTypeList.find(
                                    (i) => o.resource_type === i.value,
                                )?.label,
                        ) || [],
                    )?.join('、')
                    const hasApi =
                        data?.mount_resource?.find(
                            (o) => o.resource_type === ResourceType.DataView,
                        )?.children?.length > 0
                    if (hasApi) {
                        obj.value = `${obj.value}、${__('接口')}`
                    }
                }
                if (it.key === 'data_range') {
                    obj.options = getDataRangeOptions(governmentStatus) || []
                }
                // if (it.key === 'department') {
                //     obj.value = getDepartmentName(data)
                // }
                return {
                    ...obj,

                    labelStyles: isMarket
                        ? {
                              background: '#F4F7FC',
                          }
                        : {},
                }
            })
            if (!data.hasBusinessSystem) {
                filterKeys.push('info_system')
            }
            if (data.open_type !== OpenTypeEnum.HASCONDITION) {
                filterKeys.push('open_condition')
            }
            if (data.shared_type === ShareTypeEnum.NOSHARE) {
                itemList = itemList.map((it: any) => {
                    const itItem = {
                        ...it,
                    }
                    if (it.key === 'shared_condition') {
                        itItem.label = __('不予共享依据')
                    }
                    return itItem
                })
                filterKeys.push('shared_mode')
            }
            if (data.shared_type === ShareTypeEnum.UNCONDITION) {
                filterKeys.push('shared_condition')
            }
            if (
                !governmentStatus ||
                data.app_scene_classify !== UseScene.Other
            ) {
                filterKeys.push('other_app_scene_classify')
            }
            if (!governmentStatus || data.update_cycle !== updateCycle.other) {
                filterKeys.push('other_update_cycle')
            }
            // if (resourceType === ResourceType.Api) {
            //     filterKeys.push('scheduling_plan')
            // } else if (resourceType === ResourceType.DataView) {
            //     filterKeys.push('request_format')
            //     filterKeys.push('response_format')
            // } else if (resourceType === ResourceType.File) {
            //     filterKeys.push(
            //         ...[
            //             'sync_mechanism',
            //             'sync_frequency',
            //             'physical_deletion',
            //         ],
            //     )
            // }
            if (governmentStatus) {
                if (data.isFileRescType) {
                    filterKeys.push(
                        'sync_mechanism',
                        'sync_frequency',
                        'physical_deletion',
                        'scheduling_plan',
                        'request_format',
                        'response_format',
                    )
                } else {
                    filterKeys.push('request_format', 'response_format')
                }
            }

            if (!governmentStatus) {
                filterKeys.push(...governmentInfoKeys)
            }
            itemList = itemList.filter((it) => !filterKeys.includes(it.key))
            const resourcesAttrList =
                categorys
                    ?.filter(
                        (it) =>
                            ![
                                SystemCategory.InformationSystem,
                                SystemCategory.Organization,
                            ].includes(it.id),
                    )
                    ?.map((it) => {
                        return {
                            label: it.name,
                            value:
                                data?.category_infos?.find(
                                    (o) => o.category_id === it.id,
                                )?.category_node || '--',
                            key: it.id,
                        }
                    }) || []
            return {
                ...item,
                list:
                    item.key === 'resourcesAttr' && resourcesAttrList?.length
                        ? resourcesAttrList
                        : itemList,
            }
        })
        // 省市直达挂接资源在中间位置，资源挂接表格在底部
        // ?.filter((item) =>
        //     !governmentStatus
        //         ? item.key !== 'resourcesMount'
        //         : item.key !== 'resourcesMountList',
        // )

        setBasicInfoDetailsData(
            list.filter((item) =>
                item.key !== 'resourcesMountList' ? item.list?.length : true,
            ),
        )
    }

    const onResourceClick = (type: ResourceType, id: string) => {
        if (type === ResourceType.DataView) {
            setLoginViewOpen(true)
            setLoginViewId(id)
        } else if (type === ResourceType.Api) {
            setApplicationServiceOpen(true)
            setLoginViewId(id)
        } else if (type === ResourceType.File) {
            setFileDetailOpen(true)
            setLoginViewId(id)
        }
    }

    return loading ? (
        <Loader />
    ) : (
        <div className={styles.basicContentWrapper}>
            {!isMarket && (
                <div className={styles.headerBox}>
                    <div className={styles.headerTitle}>
                        <div className={styles.headerLeft}>
                            <AppDataContentColored className={styles.icon} />
                            <div>
                                <div className={styles.title}>
                                    {dirContent?.name}
                                </div>
                                <div className={styles.info}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.lable}>
                                            {__('编码')}：
                                        </span>
                                        <span className={styles.text}>
                                            {dirContent?.code}
                                        </span>
                                    </div>
                                    {!isAudit && (
                                        <>
                                            <div className={styles.infoItem}>
                                                <span className={styles.lable}>
                                                    {__('发布状态')}：
                                                </span>
                                                <span className={styles.text}>
                                                    {getState(
                                                        dirContent?.publish_status,
                                                        publishStatusList,
                                                    )}
                                                    {dirContent?.audit_advice &&
                                                        publishedRejectList.includes(
                                                            dirContent?.publish_status,
                                                        ) && (
                                                            <Tooltip
                                                                title={
                                                                    dirContent?.audit_advice
                                                                }
                                                                placement="bottom"
                                                            >
                                                                <FontIcon
                                                                    name="icon-shenheyijian"
                                                                    type={
                                                                        IconType.COLOREDICON
                                                                    }
                                                                    className={
                                                                        styles.icon
                                                                    }
                                                                    style={{
                                                                        fontSize: 20,
                                                                        marginLeft: 4,
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.lable}>
                                                    {__('上线状态')}：
                                                </span>
                                                <span className={styles.text}>
                                                    {getState(
                                                        dirContent?.online_status,
                                                        onLineStatusList,
                                                    )}

                                                    {dirContent?.audit_advice &&
                                                        onlinedRejectList.includes(
                                                            dirContent?.online_status,
                                                        ) &&
                                                        !publishedRejectList.includes(
                                                            dirContent?.publish_status,
                                                        ) && (
                                                            <Tooltip
                                                                title={
                                                                    dirContent?.audit_advice
                                                                }
                                                                placement="bottom"
                                                            >
                                                                <FontIcon
                                                                    name="icon-shenheyijian"
                                                                    type={
                                                                        IconType.COLOREDICON
                                                                    }
                                                                    className={
                                                                        styles.icon
                                                                    }
                                                                    style={{
                                                                        fontSize: 20,
                                                                        marginLeft: 4,
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.lable}>
                                                    {__('理解状态')}：
                                                </span>
                                                <span className={styles.text}>
                                                    <UndsLabel
                                                        type={
                                                            dirContent?.comprehension_status ||
                                                            1
                                                        }
                                                    />
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    {/* <div className={styles.infoItem}>
                                        <span className={styles.lable}>
                                            {__('资源名称')}：
                                        </span>
                                        <a
                                            className={styles.text}
                                            onClick={() => {
                                                if (
                                                    dirContent?.mountInfo?.name
                                                ) {
                                                    onResourceClick(
                                                    )
                                                }
                                            }}
                                            title={
                                                dirContent?.mountInfo?.name ||
                                                __('挂接资源已不存在')
                                            }
                                        >
                                            {dirContent?.mountInfo?.name ||
                                                '--'}
                                        </a>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                        {!isAudit &&
                            isResourcesList !== 'true' &&
                            [
                                publishStatus.Unpublished,
                                publishStatus.PublishedAuditReject,
                            ].includes(dirContent?.publish_status) && (
                                <Button
                                    type="default"
                                    icon={
                                        <FontIcon
                                            name="icon-edit"
                                            className={styles.icon}
                                            style={{
                                                marginRight: '8px',
                                                marginTop: -'1px',
                                            }}
                                        />
                                    }
                                    onClick={() => toEdit()}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {__('编辑')}
                                </Button>
                            )}
                    </div>
                    <div className={styles.desc}>
                        <span>{__('数据资源目录描述')}：</span>
                        {dirContent?.description ? (
                            <Expand
                                expandTips={__('展开')}
                                content={dirContent?.description}
                            />
                        ) : (
                            '--'
                        )}
                    </div>
                </div>
            )}
            <div className={styles.basicContent}>
                {basicInfoDetailsData.map((item) => {
                    return (
                        <div key={item.key}>
                            {isMarket ? (
                                <div className={styles.marketLabelTitle}>
                                    {item.label}
                                </div>
                            ) : (
                                <LabelTitle label={item.label} />
                            )}
                            <div style={{ marginBottom: '20px' }}>
                                {item.key !== 'resourcesMountList' ? (
                                    <DetailsLabel
                                        wordBreak
                                        labelWidth="160px"
                                        detailsList={item.list}
                                        border={isMarket}
                                    />
                                ) : (
                                    <MountResourceTable
                                        isMarket={isMarket}
                                        dataSource={dirContent?.mount_resource}
                                        governmentStatus={governmentStatus}
                                        onDetailClick={onResourceClick}
                                    />
                                )}

                                {/* {dirContent?.resource_type ===
                                    ResourceType.Api &&
                                    governmentStatus &&
                                    item.key === 'resourcesMount' && (
                                        <div className={styles.resourceBox}>
                                            <div className={styles.subTitle}>
                                                {__('请求body')}
                                            </div>
                                            <ApiEditTable
                                                columnKeys={[
                                                    ColumnKeys.name,
                                                    ColumnKeys.data_type,
                                                    ColumnKeys.isArray,
                                                ]}
                                                value={
                                                    dirContent?.mountInfo
                                                        ?.request_body
                                                }
                                            />
                                            <div className={styles.subTitle}>
                                                {__('响应参数')}
                                            </div>
                                            <ApiEditTable
                                                value={
                                                    dirContent?.mountInfo
                                                        ?.response_body
                                                }
                                                columnKeys={[
                                                    ColumnKeys.name,
                                                    ColumnKeys.data_type,
                                                    ColumnKeys.isArray,
                                                    ColumnKeys.default_value,
                                                ]}
                                            />
                                        </div>
                                    )} */}
                            </div>
                        </div>
                    )
                })}
            </div>
            {logicViewId && loginViewOpen && (
                <LogicViewDetail
                    showDataConsanguinity={false}
                    open={loginViewOpen}
                    onClose={() => {
                        setLoginViewOpen(false)
                    }}
                    id={logicViewId}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: isAudit ? 'calc(100vw - 220px)' : '100vw',
                        height: '100vh',
                        top: '50px',
                        left: isAudit ? '220px' : '0',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        // zIndex: 1001,
                    }}
                    isAudit={isAudit}
                    showFavoriteOperation={false}
                    showFeedbackOperation={false}
                />
            )}
            {/* {logicViewDetailOpen && selectedId && (
                <LogicViewDetail
                    open={logicViewDetailOpen}
                    onClose={() => {
                        setLogicViewDetailOpen(false)
                    }}
                    id={selectedId}
                />
            )} */}
            {applicationServiceOpen && logicViewId && (
                <ApplicationServiceDetail
                    open={applicationServiceOpen}
                    onClose={() => {
                        setApplicationServiceOpen(false)
                    }}
                    serviceCode={logicViewId}
                    style={{
                        position: 'fixed',
                        width: isAudit ? 'calc(100vw - 220px)' : '100vw',
                        height: '100vh',
                        top: '50px',
                        left: isAudit ? '220px' : '0',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        zIndex: 1001,
                    }}
                />
            )}
            {fileDetailOpen && logicViewId && (
                <FileDetail
                    open={fileDetailOpen}
                    onClose={() => {
                        setFileDetailOpen(false)
                    }}
                    id={logicViewId}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: isAudit ? 'calc(100vw - 220px)' : '100vw',
                        height: '100vh',
                        top: '50px',
                        left: isAudit ? '220px' : '0',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        zIndex: 1001,
                    }}
                />
            )}
        </div>
    )
})

export default DirBasicInfo
