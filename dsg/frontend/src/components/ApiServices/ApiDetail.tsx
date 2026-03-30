/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Tabs, Radio, Table, Form, Input, Select } from 'antd'
import classnames from 'classnames'
import { LeftOutlined } from '@ant-design/icons'
import {
    getActualUrl,
    getPlatformNumber,
    streamToFile,
    useQuery,
} from '@/utils'
import {
    formatError,
    detailServiceOverview,
    downloadServiceFile,
    getInterfaceDraft,
    PublishStatus,
    LoginPlatform,
} from '@/core'
import styles from './styles.module.less'
import DetailsLabel from '../../ui/DetailsLabel'
import {
    commonTitleList,
    TabKey,
    basicCantainerList,
    paramsTitleList,
    customTypeList,
    datacatalogTypeList,
    operatorList,
    maskingList,
    auditStateAndflowType,
    serviceTypeList,
    VersionType,
    PublishStatusColors,
    PublishStatusText,
    OnlineStatusColors,
    OnlineStatusTexts,
} from './const'
import ServiceTest from '../ConfigDataSerivce/ServiceTest'
import FileIcon from '../FileIcon'
import {
    getStateInfo,
    getState,
    getAuditStateLabel,
} from '../ResourcesDir/helper'
import { htmlDecodeByRegExp } from '../ResourcesDir/const'
import GlobalMenu from '../GlobalMenu'
import __ from './locale'
import {
    BasicCantainer,
    ParamsCantainer,
    ResponseCantainer,
    StatusTextBox,
} from './helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import OwnerDisplay from '../OwnerDisplay'

// 页面路径中获取参数
function ApiDetailContent(props: any) {
    const { code, isAuditDetail } = props
    const query = useQuery()
    const navigator = useNavigate()
    // 左侧树选中tab
    const activeTabKey = query.get('activeTabKey')
    // 列表目录id--不能为空
    const catlgId = query.get('catlgId')
    const serviceId = query.get('serviceId') || code || ''

    const handleReturn = () => {
        const backUrl = `/dataService/interfaceService`
        if (window.history.length > 2) {
            navigator(-1)
        } else {
            navigator(backUrl)
        }
    }
    const [activeKey, setActiveKey] = useState<TabKey>(TabKey.BASIC)
    const [detailData, setDetailData] = useState<any>({})
    const [draftDetailData, setDraftDetailData] = useState<any>(null)
    const [publishDetailData, setPublishDetailData] = useState<any>(null)
    const [paramsData, setParamsData] = useState<any>([])
    const [serviceType, setServiceType] = useState<string>('service_register')
    const [basicCantainerContent, setBasicCantainerContent] =
        useState(basicCantainerList)
    const platformNumber = getPlatformNumber()
    const [commonTitleContent, setCommonTitleContent] = useState(
        commonTitleList.filter((item) => {
            return (
                item.key !== 'owners' ||
                platformNumber !== LoginPlatform.default
            )
        }),
    )
    const testForm = Form.useForm()[0]

    const [showVersionTab, setShowVersionTab] = useState<boolean>(false)

    const [selectedVersion, setSelectedVersion] = useState<VersionType>(
        VersionType.CHANGING_VERSION,
    )

    const [{ using }] = useGeneralConfig()

    useEffect(() => {
        getDraftDetail()
        getPublishDetail()
    }, [])

    useEffect(() => {
        if (draftDetailData) {
            getDetail(draftDetailData, selectedVersion)
            setSelectedVersion(VersionType.CHANGING_VERSION)
        } else if (publishDetailData) {
            getDetail(publishDetailData, selectedVersion)
            setSelectedVersion(VersionType.PUBLISH_VERSION)
        }
    }, [draftDetailData, publishDetailData, showVersionTab])

    const getDraftDetail = async () => {
        try {
            const draftRes = await getInterfaceDraft(serviceId)

            if (
                draftRes &&
                [
                    PublishStatus.CHANGE_REJECT,
                    PublishStatus.CHANGE_AUDITING,
                ].includes(draftRes?.service_info?.publish_status)
            ) {
                setDraftDetailData(draftRes)
                setShowVersionTab(true)
            } else {
                setShowVersionTab(false)
            }
        } catch (err) {
            formatError(err)
        }
    }

    const getPublishDetail = async () => {
        try {
            const detail = await detailServiceOverview(serviceId)
            setPublishDetailData(detail)
        } catch (err) {
            formatError(err)
        }
    }

    const getDetail = async (res, currentTabKey) => {
        setServiceType(res.service_info.service_type)
        setDetailData(res)
        // 头部信息
        const commontitleData = {
            ...res?.service_info,
            data_catalog: res?.service_param?.data_catalog || [],
        }
        getCommonTitle(commontitleData, currentTabKey)
        // 基础信息
        getBasicTitle({
            ...res?.service_info,
            data_view_name: res?.service_param?.data_view_name,
        })
        // 参数配置
        getParamsTitleList(res?.service_param)
    }

    // 头部信息数据
    const getCommonTitle = (res: any, currentTabKey) => {
        setCommonTitleContent(
            commonTitleList
                // 当前为资源目录模式的场景下屏蔽上线的状态
                .filter((item) => {
                    if (
                        showVersionTab &&
                        currentTabKey === VersionType.PUBLISH_VERSION &&
                        ['status', 'publish_status', 'audit_advice'].includes(
                            item.key,
                        )
                    ) {
                        return false
                    }
                    return true
                })
                .map((it: any) => {
                    switch (it.key) {
                        case 'owners':
                            return {
                                ...it,
                                render: () => {
                                    return <OwnerDisplay value={res.owners} />
                                },
                            }

                        case 'status':
                            return {
                                ...it,
                                render: () => {
                                    return (
                                        <StatusTextBox
                                            color={
                                                OnlineStatusColors[res.status]
                                            }
                                            text={OnlineStatusTexts[res.status]}
                                            advice={res.online_audit_advice}
                                        />
                                    )
                                },
                            }

                        case 'publish_status':
                            return {
                                ...it,
                                render: () => {
                                    return (
                                        <StatusTextBox
                                            color={
                                                PublishStatusColors[
                                                    res.publish_status
                                                ]
                                            }
                                            text={
                                                PublishStatusText[
                                                    res.publish_status
                                                ]
                                            }
                                            advice={res.audit_advice}
                                        />
                                    )
                                },
                            }

                        default:
                            return {
                                ...it,
                                value: it.subKey
                                    ? res[it.key]
                                        ? res[it.key][it.subKey]
                                        : '--'
                                    : res[it.key],
                            }
                    }
                }),
        )
    }

    const download = async (files: { file_id: string; file_name: string }) => {
        const { file_id, file_name } = files

        try {
            if (!file_id) return
            const res = await downloadServiceFile(file_id)
            // 将文件流转换成文件
            streamToFile(res, file_name)
        } catch (error) {
            formatError(error)
        }
    }

    // 基本信息数据
    const getBasicTitle = (res: any) => {
        const generateFilterData = [
            'backend_service_host',
            'backend_service_path',
            'file',
        ]
        const auditFilterData = ['audit_status', 'status', 'audit_advice']
        const createFilterData = ['data_view_name']
        const category_info = res?.category_info || []
        const basicConfig = basicCantainerContent.map((item) => {
            return {
                ...item,
                list: isAuditDetail
                    ? item.list.filter(
                          (it) => !auditFilterData.includes(it.key),
                      )
                    : item.list.filter((it) => {
                          return it.key === 'audit_advice'
                              ? !!res?.audit_advice
                              : true
                      }),
            }
        })

        setBasicCantainerContent(
            basicConfig
                .filter((item) =>
                    category_info.length > 0 ? item.label !== '服务分类' : true,
                )
                .map((item, index) => {
                    const newDataList =
                        res.service_type === 'service_generate'
                            ? item.list.filter(
                                  (info) =>
                                      !generateFilterData.includes(info.key),
                              )
                            : item.list.filter(
                                  (info) =>
                                      !createFilterData.includes(info.key),
                              )
                    if (item.label === '服务分类') {
                        return {
                            ...item,
                            list: category_info.map((it) => ({
                                key: it.category_id,
                                label: it.category_name,
                                value: it.category_node_name,
                            })),
                        }
                    }

                    return {
                        ...item,
                        list: newDataList
                            .map((it: any) => {
                                const { key } = it
                                switch (key) {
                                    case 'tags':
                                        return {
                                            ...it,
                                            value: res[it.key].map(
                                                (i) => i.name,
                                            ),
                                        }
                                    case 'market_publish':
                                        return {
                                            ...it,
                                            render: () => {
                                                return (
                                                    <Radio.Group
                                                        value={res[it.key]}
                                                        disabled
                                                    >
                                                        <Radio value="yes">
                                                            同步
                                                        </Radio>
                                                        <Radio value="no">
                                                            不同步
                                                        </Radio>
                                                    </Radio.Group>
                                                )
                                            },
                                        }
                                    case 'subject_domain_name':
                                        return {
                                            ...it,
                                            render: () => {
                                                return (
                                                    <span title={res[it.key]}>
                                                        {res[it.key]
                                                            .split('/')
                                                            ?.slice(-1)?.[0] ||
                                                            '--'}
                                                    </span>
                                                )
                                            },
                                        }
                                    case 'file':
                                        return {
                                            ...it,
                                            render: () => {
                                                if (
                                                    res.file &&
                                                    res.file.file_name
                                                ) {
                                                    const suffix =
                                                        res.file.file_name.substring(
                                                            res.file.file_name.lastIndexOf(
                                                                '.',
                                                            ) + 1,
                                                        )
                                                    return (
                                                        <div
                                                            className={
                                                                styles.fileWrapper
                                                            }
                                                        >
                                                            <FileIcon
                                                                suffix={suffix}
                                                            />
                                                            <div
                                                                className={
                                                                    styles.fileName
                                                                }
                                                                onClick={() =>
                                                                    download(
                                                                        res.file,
                                                                    )
                                                                }
                                                                title={
                                                                    res.file
                                                                        .file_name
                                                                }
                                                            >
                                                                {
                                                                    res.file
                                                                        .file_name
                                                                }
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return <div />
                                            },
                                        }
                                    case 'rate_limiting':
                                        return {
                                            ...it,
                                            value:
                                                res[it.key] === 0
                                                    ? __('不限制')
                                                    : res[it.key]
                                                    ? `${res[it.key]} ${
                                                          it.unit
                                                      }`
                                                    : '--',
                                        }

                                    case 'timeout':
                                        return {
                                            ...it,
                                            value:
                                                res[it.key] || res[it.key] === 0
                                                    ? `${res[it.key]} ${
                                                          it.unit
                                                      }`
                                                    : '--',
                                        }

                                    case 'audit_advice':
                                        return {
                                            ...it,
                                            render: () => {
                                                return res[it.key] ? (
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: res[it.key],
                                                        }}
                                                    />
                                                ) : (
                                                    '--'
                                                )
                                            },
                                        }
                                    default:
                                        return {
                                            ...it,
                                            value: it.subKey
                                                ? res[it.key]
                                                    ? res[it.key][it.subKey]
                                                    : '--'
                                                : res[it.key],
                                        }
                                }
                            })
                            .filter((it) => {
                                return (
                                    platformNumber !== LoginPlatform.default ||
                                    it.key !== 'app_name'
                                )
                            }),
                    }
                }),
        )
    }

    // 参数配置数据
    const getParamsTitleList = (res: any) => {
        let allParamsList: any[] = []
        if (res?.data_source_select_type === 'custom') {
            allParamsList = [...paramsTitleList, ...customTypeList]
        } else {
            allParamsList = [...paramsTitleList, ...datacatalogTypeList]
        }
        allParamsList.forEach((it: any) => {
            it.value = it.subKey
                ? res[it.key]
                    ? res[it.key][it.subKey]
                    : '--'
                : res[it.key]
            if (it.key === 'data_source_select_type') {
                it.render = () => {
                    return (
                        <Radio.Group value={it.value} disabled>
                            <Radio value="custom">自定义选择</Radio>
                            <Radio value="datacatalog">资源目录选择</Radio>
                        </Radio.Group>
                    )
                }
            }
        })
        setParamsData(allParamsList)
    }

    const tabsItems = [
        {
            label: '基本属性',
            key: TabKey.BASIC,
            children: (
                <BasicCantainer basicCantainerContent={basicCantainerContent} />
            ),
        },
        {
            label: '参数配置',
            key: TabKey.PARAMS,
            children: (
                <ParamsCantainer
                    serviceType={serviceType}
                    detailData={detailData}
                />
            ),
        },
        {
            label: '返回结果',
            key: TabKey.RESPONSE,
            children: <ResponseCantainer detailData={detailData} />,
        },
        {
            label: '测试结果',
            key: TabKey.TEST,
            children: (
                <ServiceTest
                    form={testForm}
                    isDetail
                    defaultValues={detailData?.service_test}
                    serviceData={detailData}
                />
            ),
        },
    ]

    return (
        <div
            className={classnames(
                styles.apiDetailWrapper,
                isAuditDetail && styles.apiAuditDetailWrapper,
            )}
        >
            {!isAuditDetail && (
                <div className={styles.title}>
                    <GlobalMenu />
                    <div onClick={handleReturn} className={styles.returnInfo}>
                        <LeftOutlined className={styles.returnArrow} />
                        <span className={styles.returnText}>返回</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.titleText}>{__('服务详情')}</div>
                    {showVersionTab ? (
                        <div className={styles.versionTab}>
                            <Tabs
                                items={[
                                    {
                                        key: VersionType.CHANGING_VERSION,
                                        label: __('变更中版本'),
                                    },
                                    {
                                        key: VersionType.PUBLISH_VERSION,
                                        label: __('已发布版本'),
                                    },
                                ]}
                                activeKey={selectedVersion}
                                onChange={(key) => {
                                    setSelectedVersion(key as VersionType)
                                    if (key === VersionType.CHANGING_VERSION) {
                                        getDetail(draftDetailData, key)
                                    } else {
                                        getDetail(publishDetailData, key)
                                    }
                                }}
                            />
                        </div>
                    ) : null}
                </div>
            )}
            <div className={styles.detailsContainer}>
                <div className={styles.nameTitleContainer}>
                    <div className={styles.serviceType}>
                        {serviceTypeList.find(
                            (item) =>
                                item.value ===
                                detailData?.service_info?.service_type,
                        )?.label || '--'}
                    </div>
                    <div
                        className={styles.nameText}
                        title={detailData?.service_info?.service_name || ''}
                    >
                        {detailData?.service_info?.service_name || ''}
                    </div>
                </div>
                <DetailsLabel wordBreak detailsList={commonTitleContent} />
                <Tabs
                    activeKey={activeKey}
                    onChange={(e) => setActiveKey(e as TabKey)}
                    getPopupContainer={(node) => node}
                    tabBarGutter={32}
                    // items={
                    //     serviceType === 'service_register'
                    //         ? tabsItems.filter((value, index) => index !== 2)
                    //         : tabsItems
                    // }
                    destroyInactiveTabPane
                >
                    {serviceType === 'service_register'
                        ? tabsItems
                              .filter((value, index) => index !== 2)
                              .map((item: any) => {
                                  return (
                                      <Tabs.TabPane
                                          tab={item.label}
                                          key={item.key}
                                      >
                                          {item.children}
                                      </Tabs.TabPane>
                                  )
                              })
                        : tabsItems.map((item: any) => {
                              return (
                                  <Tabs.TabPane tab={item.label} key={item.key}>
                                      {item.children}
                                  </Tabs.TabPane>
                              )
                          })}
                </Tabs>
            </div>
        </div>
    )
}

export default ApiDetailContent
