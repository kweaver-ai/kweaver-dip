import { FC, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Col, Divider, message, Row, Space, Table, Tooltip } from 'antd'
import moment from 'moment'
import classnames from 'classnames'
import Icon from '@ant-design/icons/lib/components/Icon'
import __ from '../locale'
import styles from './styles.module.less'
import { ReactComponent as icon1 } from '@/assets/DataAssetsCatlg/icon1.svg'
import { detailFrontendServiceOverview, formatError } from '@/core'
import { MicroWidgetPropsContext } from '@/context'
import { InterfaceColored } from '@/icons'
import { serviceTypeList } from '@/components/ApiServices/const'
import {
    getPublishStatus,
    UnpublishedStatusList,
} from '../ApplicationService/helper'
import { TextAreaView } from '@/components/AutoFormView/baseViewComponents'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { getRequestParamExample, itemOtherInfo } from './helper'
import JSONCodeView from '@/ui/JSONCodeView'
import { Loader } from '@/ui'
import OwnerDisplay from '@/components/OwnerDisplay'

interface TitleBarType {
    title: string
}
const TitleBar = ({ title }: TitleBarType) => {
    return (
        <div className={styles.titleBar}>
            <Icon component={icon1} className={styles.label} />
            <div className={styles.tilte}>{title}</div>
        </div>
    )
}

interface IApiDetails {
    apiId: string
}
const ApiDetails: FC<IApiDetails> = ({ apiId }) => {
    const [loading, setLoading] = useState(true)
    const [applicationInfo, setApplicationInfo] = useState<any>(null)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    const header = useRef<any>(null)
    const container = useRef<any>(null)

    const [{ using }] = useGeneralConfig()

    // 发布状态
    const publishedStatus = useMemo(() => {
        const status = getPublishStatus(
            applicationInfo?.service_info?.publish_status,
        )
        return status ? __('（') + status + __('）') : ''
    }, [applicationInfo])

    useEffect(() => {
        if (apiId) {
            initApplicationInfo()
        }
    }, [apiId])

    const columns = [
        {
            title: __('英文名称'),
            dataIndex: 'en_name',
            key: 'en_name',
            render: (text) => (
                <div className={styles.tableTrContainer} title={text || ''}>
                    <div className={styles.itemTitle}>{text || '--'}</div>
                </div>
            ),
            width: '15%',
        },
        {
            title: __('中文名称'),
            dataIndex: 'cn_name',
            key: 'cn_name',
            width: '25%',
            render: (text) => (
                <div className={styles.tableTrContainer} title={text || ''}>
                    <div className={styles.itemTitle}>{text || '--'}</div>
                </div>
            ),
        },
        {
            title: __('类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            width: '10%',
            render: (text) => text || '--',
        },
        {
            title: __('是否必填'),
            dataIndex: 'required',
            key: 'required',
            width: '10%',
            render: (text) =>
                text === 'yes' ? '必填' : text === 'no' ? '非必填' : '--',
        },
        {
            title: __('描述'),
            dataIndex: 'description',
            key: 'description',
            width: '40%',
            render: (text) => text || '--',
        },
    ]

    const initApplicationInfo = async () => {
        if (apiId) {
            try {
                setLoading(true)
                const data = await detailFrontendServiceOverview(apiId)
                setApplicationInfo(data)
            } catch (error) {
                switch (true) {
                    case error?.data?.code ===
                        'DataApplicationService.Service.ServiceOffline':
                        message.error('当前接口已下线')

                        break
                    case error?.data?.code ===
                        'DataApplicationService.Service.ServiceCodeNotExist':
                        message.error('当前接口不存在')

                        break
                    default:
                        formatError(error, microWidgetProps?.components?.toast)
                }
            } finally {
                setLoading(false)
            }
        }
    }

    const showDivder = (divdStyle?: any) => {
        return (
            <Divider
                style={{
                    height: '12px',
                    borderRadius: '1px',
                    borderLeft: '1px solid rgba(0,0,0,0.24)',
                    margin: '0px 2px 0px 12px',
                    ...divdStyle,
                }}
                type="vertical"
            />
        )
    }

    // render
    const renderOtherInfo = (item: any, data: any) => {
        const { firstKey, infoKey, type, title, toolTipTitle } = item
        let showContent = data?.[firstKey]?.[infoKey] || ''
        if (infoKey === 'department') {
            const fullPath =
                applicationInfo?.service_info?.department.name || '--'
            const departmentName =
                applicationInfo?.service_info?.department.name?.split('/') || []
            showContent = departmentName?.slice(-1)?.[0] || '--'
            return showToolTip(title, toolTipTitle, showContent, fullPath)
        }
        if (infoKey === 'subject_domain_name') {
            const fullPath = showContent || '--'
            const domainName = showContent?.split('/') || []
            showContent = domainName?.slice(-1)?.[0] || '--'
            return showToolTip(title, toolTipTitle, showContent, fullPath)
        }
        if (infoKey === 'online_time') {
            showContent = `${moment(showContent).format('YYYY-MM-DD')}`
            return (
                <>
                    <div
                        style={{
                            flexShrink: 0,
                        }}
                    >
                        {`${__('上线于')} ${showContent}`}
                    </div>
                    {showDivder()}
                </>
            )
        }

        // if (infoKey === 'owners') {
        //     return (
        //         <OwnerDisplay value={applicationInfo?.service_info?.owners} />
        //     )
        // }

        return showToolTip(title, toolTipTitle, showContent)
    }

    const showToolTip = (
        title: any,
        toolTipTitle: any,
        value: any,
        toolTipContent?: any,
    ) => {
        return (
            <Tooltip
                title={
                    title ? (
                        <div className={styles.unitTooltip}>
                            <div>{toolTipTitle}</div>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: toolTipContent || value || '--',
                                }}
                            />
                        </div>
                    ) : (
                        value
                    )
                }
                overlayClassName={styles.toolTipWrapper}
                className={styles.toolTip}
                getPopupContainer={(n) => n.parentElement?.parentElement || n}
                placement="bottom"
            >
                <div className={styles.itemDetailInfo} key={title}>
                    <span>{title}</span>
                    <span
                        className={styles.itemDetailInfoValue}
                        dangerouslySetInnerHTML={{
                            __html: value || '--',
                        }}
                    />
                </div>
            </Tooltip>
        )
    }

    return (
        <div className={styles.bodyContainer}>
            <div className={styles.applicationDetail}>
                {loading && (
                    <div className={styles.detailLoading}>
                        <Loader />
                    </div>
                )}
                <div className={styles.header} ref={header} hidden={loading}>
                    <div
                        className={classnames({
                            [styles.headerContent]: true,
                        })}
                    >
                        <Space
                            direction="vertical"
                            wrap={false}
                            style={{ width: '100%' }}
                        >
                            <div className={styles.headerBox}>
                                <div className={styles.rescIcon}>
                                    <InterfaceColored />
                                </div>
                                <div className={styles.rescTopInfoWrapper}>
                                    <div
                                        className={styles.applicationName}
                                        title={
                                            applicationInfo?.service_info
                                                ?.service_name
                                        }
                                    >
                                        <div className={styles.serviceType}>
                                            {serviceTypeList.find(
                                                (item) =>
                                                    item.value ===
                                                    applicationInfo
                                                        ?.service_info
                                                        ?.service_type,
                                            )?.label || '--'}
                                        </div>
                                        <span className={styles.nameWrapper}>
                                            <span
                                                className={styles.nameArea}
                                                title={
                                                    applicationInfo
                                                        ?.service_info
                                                        ?.service_name || ''
                                                }
                                            >
                                                {applicationInfo?.service_info
                                                    ?.service_name || '--'}
                                            </span>
                                            {UnpublishedStatusList?.includes(
                                                applicationInfo?.service_info
                                                    ?.publish_status,
                                            ) && (
                                                <div
                                                    className={
                                                        styles.publishState
                                                    }
                                                >
                                                    {__('未发布') +
                                                        publishedStatus}
                                                </div>
                                            )}
                                        </span>
                                    </div>
                                    <div className={styles.rescCodeInfoWrapper}>
                                        {__('编码：')}
                                        <span>
                                            {applicationInfo?.service_info
                                                ?.service_code || '--'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.descriptionWrapper}>
                                <span className={styles.textTitle}>
                                    {__('描述：')}
                                </span>
                                <div className={styles.descContent}>
                                    <TextAreaView
                                        initValue={
                                            applicationInfo?.service_info
                                                ?.description ||
                                            __('[暂无说明]')
                                        }
                                        rows={1}
                                        placement="end"
                                        onExpand={() => {
                                            // if (
                                            //     header.current?.clientHeight
                                            // ) {
                                            //     setTargetOffset(
                                            //         Number(
                                            //             header.current
                                            //                 .clientHeight,
                                            //         ) + 80,
                                            //     )
                                            // }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className={styles.itemOtherInfo}>
                                <div
                                    style={{
                                        flexShrink: 0,
                                    }}
                                >
                                    {`${
                                        using === 1
                                            ? __('发布时间')
                                            : __('上线时间')
                                    } ${
                                        applicationInfo?.service_info?.[
                                            using === 1
                                                ? 'publish time'
                                                : 'online_time'
                                        ]?.substring?.(0, 10) || '--'
                                    }`}
                                </div>
                                {showDivder()}
                                <div className={styles.iconLabel}>
                                    {itemOtherInfo.map((oItem) => {
                                        return renderOtherInfo(
                                            oItem,
                                            applicationInfo,
                                        )
                                    })}
                                </div>
                            </div>
                        </Space>
                    </div>
                </div>
                <div
                    className={styles.content}
                    ref={container}
                    hidden={loading}
                >
                    <div className={styles.contentContainer}>
                        <div id="basic-info">
                            <TitleBar title={__('基本信息')} />
                            <div className={styles.basicContent}>
                                <Space
                                    direction="vertical"
                                    wrap={false}
                                    style={{ width: '100%' }}
                                >
                                    <Row gutter={16}>
                                        <Col
                                            span={12}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <span className={styles.label}>
                                                {__('接口编号：')}
                                            </span>
                                            <div className={styles.nameWrapper}>
                                                <div>
                                                    {applicationInfo
                                                        ?.service_info
                                                        ?.service_code || '--'}
                                                </div>
                                            </div>
                                        </Col>

                                        <Col span={12}>
                                            <span className={styles.label}>
                                                {__('调用频率：')}
                                            </span>
                                            <span>
                                                {applicationInfo?.service_info
                                                    ?.rate_limiting === 0
                                                    ? __('不限制')
                                                    : __('${count} 秒/次', {
                                                          count: applicationInfo?.service_info?.rate_limiting.toString(),
                                                      })}
                                            </span>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <span className={styles.label}>
                                                {__('超时时间：')}
                                            </span>
                                            <span>
                                                {`${
                                                    applicationInfo
                                                        ?.service_info
                                                        ?.timeout || '--'
                                                } ${__('秒')}`}
                                            </span>
                                        </Col>
                                        <Col span={12}>
                                            <span className={styles.label}>
                                                {__('所属部门')}：
                                            </span>
                                            <span>
                                                {applicationInfo?.service_info
                                                    ?.department.name || '--'}
                                            </span>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col
                                            span={12}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <span className={styles.label}>
                                                {__('更新时间：')}
                                            </span>
                                            <span
                                                className={styles.name}
                                                title={
                                                    applicationInfo
                                                        ?.service_info
                                                        ?.update_time || ''
                                                }
                                            >
                                                {applicationInfo?.service_info
                                                    ?.update_time || '--'}
                                            </span>
                                        </Col>
                                    </Row>
                                </Space>
                            </div>
                        </div>
                        <div id="param-info">
                            <TitleBar title={__('参数信息')} />
                            <div className={styles.paramBasicInfo}>
                                <Space
                                    direction="vertical"
                                    wrap={false}
                                    style={{ width: '100%' }}
                                >
                                    <div
                                        id="param-info-address"
                                        className={styles.address}
                                        title={`${applicationInfo?.service_info?.gateway_url}${applicationInfo?.service_info?.service_path}`}
                                    >
                                        <span className={styles.label}>
                                            {__('接口地址：')}
                                        </span>
                                        <span className={styles.text}>
                                            {!applicationInfo?.service_info
                                                ?.gateway_url &&
                                            !applicationInfo?.service_info
                                                ?.service_path
                                                ? '--'
                                                : `${applicationInfo?.service_info?.gateway_url}${applicationInfo?.service_info?.service_path}`}
                                        </span>
                                    </div>
                                    <div id="param-info-protocol">
                                        <span className={styles.label}>
                                            {__('接口协议：')}
                                        </span>
                                        <span>
                                            {applicationInfo?.service_info?.protocol.toLocaleUpperCase() ||
                                                '--'}
                                        </span>
                                    </div>
                                    <div id="param-info-method">
                                        <span className={styles.label}>
                                            {__('请求方式：')}
                                        </span>
                                        <span>
                                            {applicationInfo?.service_info?.http_method?.toLocaleUpperCase() ||
                                                '--'}
                                        </span>
                                    </div>
                                    <div id="param-info-return">
                                        <span className={styles.label}>
                                            {__('返回类型：')}
                                        </span>
                                        <span>
                                            {applicationInfo?.service_info?.return_type?.toLocaleUpperCase() ||
                                                '--'}
                                        </span>
                                    </div>
                                </Space>
                            </div>
                            {applicationInfo?.service_param
                                ?.data_table_request_params?.length ? (
                                <div
                                    className={styles.paramsContent}
                                    id="param-info-request"
                                >
                                    <div className={styles.title}>
                                        {__('请求参数')}
                                    </div>
                                    <div className={styles.table}>
                                        <Table
                                            columns={columns}
                                            dataSource={
                                                applicationInfo.service_param
                                                    .data_table_request_params
                                            }
                                            pagination={false}
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {applicationInfo?.service_test?.request_example && (
                                <div
                                    className={styles.paramsContent}
                                    id="param-info-request-example"
                                >
                                    <div className={styles.title}>
                                        {__('请求示例')}
                                    </div>
                                    {getRequestParamExample(
                                        applicationInfo?.service_info
                                            ?.http_method,
                                        applicationInfo,
                                    )}
                                </div>
                            )}
                            {applicationInfo?.service_param
                                ?.data_table_response_params?.length ? (
                                <div
                                    className={styles.paramsContent}
                                    id="param-info-response"
                                >
                                    <div className={styles.title}>
                                        {__('返回参数')}
                                    </div>
                                    <div className={styles.table}>
                                        <Table
                                            columns={columns.filter(
                                                (currentData) =>
                                                    currentData.key !==
                                                    'required',
                                            )}
                                            dataSource={
                                                applicationInfo.service_param
                                                    .data_table_response_params
                                            }
                                            pagination={false}
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {applicationInfo?.service_test?.response_example ? (
                                <div
                                    className={styles.paramsContent}
                                    id="param-info-response-example"
                                >
                                    <div className={styles.title}>
                                        {__('返回示例')}
                                    </div>
                                    <JSONCodeView
                                        code={
                                            applicationInfo?.service_test
                                                ?.response_example
                                        }
                                        className={styles.codeBox}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ApiDetails
