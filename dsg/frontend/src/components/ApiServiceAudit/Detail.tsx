/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react'
import { Row, Col, Tabs, Radio, Table, Form, Input, Select } from 'antd'
import classnames from 'classnames'
import { LeftOutlined } from '@ant-design/icons'
import { includes } from 'lodash'
import { getActualUrl, streamToFile, useQuery } from '@/utils'
import {
    formatError,
    detailServiceOverview,
    downloadServiceFile,
    getInterfaceDraft,
} from '@/core'
import DetailsLabel from '../../ui/DetailsLabel'
import {
    commonTitleList,
    TabKey,
    basicCantainerList,
    paramsTitleList,
    customTypeList,
    datacatalogTypeList,
    auditStateAndflowType,
} from '../ApiServices/const'
import ServiceTest from '../ConfigDataSerivce/ServiceTest'
import FileIcon from '../FileIcon'
import { getState, getAuditStateLabel } from '../ResourcesDir/helper'
import GlobalMenu from '../GlobalMenu'
import __ from '../ApiServices/locale'
import {
    BasicCantainer,
    ParamsCantainer,
    PublishStatusColors,
    PublishStatusText,
    ResponseCantainer,
    StatusTextBox,
} from './helper'

// 页面路径中获取参数
function ApiDetail(props: any) {
    const { code, isAuditDetail } = props
    const query = useQuery()
    // 左侧树选中tab
    const activeTabKey = query.get('activeTabKey')
    // 列表目录id--不能为空
    const catlgId = query.get('catlgId')
    const serviceCode = query.get('serviceCode') || code || ''

    const handleReturn = () => {
        // returnCallback()
        let backUrl = `/dataService/interfaceService`
        // 数据资源目录跳转到此页面后返回
        if (query.get('backUrl')) {
            backUrl =
                query.get('backUrl') +
                (query.get('id') ? `&id=${query.get('id')}` : '')
        }

        window.open(getActualUrl(backUrl), '_self')
    }
    const [activeKey, setActiveKey] = useState<TabKey>(TabKey.BASIC)
    const [detailData, setDetailData] = useState<any>({})
    const [paramsData, setParamsData] = useState<any>([])
    const [serviceType, setServiceType] = useState<string>('service_register')
    const [basicCantainerContent, setBasicCantainerContent] =
        useState(basicCantainerList)
    const [newCommonTitleList, setNewCommonTitleList] =
        useState<any>(commonTitleList)
    const testForm = Form.useForm()[0]

    useEffect(() => {
        getDetail()
    }, [])

    const getDetail = async () => {
        try {
            const res = await detailServiceOverview(serviceCode)
            setServiceType(res.service_info.service_type)
            setDetailData(res)
            // 头部信息
            const commontitleData = {
                ...res?.service_info,
                data_catalog: res?.service_param?.data_catalog || [],
            }
            getCommonTitle(commontitleData)
            // 基础信息
            getBasicTitle({
                ...res?.service_info,
                data_view_name: res?.service_param?.data_view_name,
            })
            // 参数配置
            getParamsTitleList(res?.service_param)
        } catch (error) {
            formatError(error)
        }
    }

    // 头部信息数据
    const getCommonTitle = (res: any) => {
        setNewCommonTitleList(
            commonTitleList
                .filter((item) => {
                    return !['status', 'audit_advice', 'audit_status'].includes(
                        item.key,
                    )
                })
                .map((it) => {
                    if (it.key === 'publish_status') {
                        return {
                            ...it,
                            render: () => {
                                return (
                                    <StatusTextBox
                                        color={PublishStatusColors[res[it.key]]}
                                        text={PublishStatusText[res[it.key]]}
                                        advice={res.audit_advice}
                                    />
                                )
                            },
                        }
                    }
                    return {
                        ...it,
                        value: it.subKey
                            ? res[it.key]
                                ? res[it.key][it.subKey]
                                : '--'
                            : res[it.key],
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
                        list: newDataList.map((it: any) => {
                            const { key } = it
                            switch (key) {
                                case 'tags':
                                    return {
                                        ...it,
                                        value: res[it.key].map((i) => i.name),
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
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <FileIcon
                                                            suffix={suffix}
                                                        />
                                                        <div
                                                            style={{
                                                                marginLeft:
                                                                    '8px',
                                                            }}
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
                                                            {res.file.file_name}
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
                                                ? `${res[it.key]} ${it.unit}`
                                                : '--',
                                    }

                                case 'timeout':
                                    return {
                                        ...it,
                                        value:
                                            res[it.key] || res[it.key] === 0
                                                ? `${res[it.key]} ${it.unit}`
                                                : '--',
                                    }

                                case 'audit_status':
                                    return {
                                        ...it,
                                        render: () => {
                                            const audit_status =
                                                auditStateAndflowType.find(
                                                    (s) =>
                                                        s.type ===
                                                            'audit_status' &&
                                                        s.key === res[it.key],
                                                )?.value
                                            const audit_type =
                                                auditStateAndflowType.find(
                                                    (s) =>
                                                        s.type ===
                                                            'audit_type' &&
                                                        s.key ===
                                                            res[it.subKey],
                                                )?.value
                                            return getAuditStateLabel(
                                                Number(audit_status),
                                                Number(audit_type),
                                            )
                                        },
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
    // 审核代办 下样式不加载，不能使用class，全局使用style行内样式
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: '#eff2f5',
            }}
        >
            <div
                style={{
                    height: 'auto',
                    padding: '24px 10%',
                    paddingTop: 0,
                    margin: 0,
                    background: '#fff',
                    overflowY: 'auto',
                }}
            >
                <DetailsLabel
                    wordBreak
                    detailsList={newCommonTitleList.filter((item) => {
                        return ![
                            'status',
                            'audit_advice',
                            'audit_status',
                        ].includes(item.key)
                    })}
                />
                <Tabs
                    activeKey={activeKey}
                    onChange={(e) => setActiveKey(e as TabKey)}
                    getPopupContainer={(node) => node}
                    tabBarGutter={32}
                    items={
                        serviceType === 'service_register'
                            ? tabsItems.filter((value, index) => index !== 2)
                            : tabsItems
                    }
                    destroyInactiveTabPane
                />
            </div>
        </div>
    )
}

export default ApiDetail
