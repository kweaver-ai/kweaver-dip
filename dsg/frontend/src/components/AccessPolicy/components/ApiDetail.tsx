import Icon, { LeftOutlined } from '@ant-design/icons'
import { Button, Col, Divider, Row, Space, Table, Tooltip, message } from 'antd'
import * as React from 'react'
import { memo, useEffect, useRef, useState } from 'react'
import moment from 'moment'
import { ReactComponent as icon1 } from '@/assets/DataAssetsCatlg/icon1.svg'
import CustomDrawer from '@/components/CustomDrawer'
import __ from '@/components/DataAssetsCatlg/locale'
import {
    AssetTypeEnum,
    detailFrontendServiceOverview,
    formatError,
} from '@/core'
import { CopyOutlined } from '@/icons'
import JSONCodeView from '@/ui/JSONCodeView'
import styles from './styles.module.less'
import { ResIcon, getLastText, itemOtherInfo } from '../helper'
import { ServiceTypeList } from '../const'
import { TextAreaView } from '@/components/AutoFormView/baseViewComponents'
import { copyToClipboard } from '@/components/MyAssets/helper'

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

interface IApiDetail {
    open: boolean
    onClose: () => void
    serviceID?: string
    style?: React.CSSProperties | undefined
}

const ApiDetail = ({ open, onClose, serviceID, style }: IApiDetail) => {
    const [applicationInfo, setApplicationInfo] = useState<any>(null)
    const container = useRef<any>(null)
    const header = useRef<any>(null)
    const [targetOffset, setTargetOffset] = useState<number>(160)

    const columns = [
        {
            title: __('英文名称'),
            dataIndex: 'en_name',
            key: 'en_name',
            render: (text) => text || '--',
            width: '15%',
        },
        {
            title: __('中文名称'),
            dataIndex: 'cn_name',
            key: 'cn_name',
            width: '25%',
            render: (text) => text || '--',
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

    useEffect(() => {
        if (open) {
            initApplicationInfo()
        }
    }, [serviceID, open])

    const initApplicationInfo = async () => {
        if (serviceID) {
            try {
                const data = await detailFrontendServiceOverview(serviceID)
                setApplicationInfo(data)
            } catch (error) {
                switch (true) {
                    case error?.data?.code ===
                        'DataApplicationService.Service.ServiceOffline':
                        message.error('当前接口已下线')
                        onClose()
                        break
                    case error?.data?.code ===
                        'DataApplicationService.Service.ServiceIDNotExist':
                        message.error('当前接口不存在')
                        onClose()
                        break
                    default:
                        onClose()
                        formatError(error)
                }
            }
        }
    }
    const getRequestParamExample = (method: string) => {
        switch (method) {
            case 'get':
                return (
                    <div className={styles.codeBox}>
                        {!applicationInfo?.service_info?.gateway_url &&
                        !applicationInfo?.service_info?.service_path
                            ? '--'
                            : `${applicationInfo?.service_info?.gateway_url}${
                                  applicationInfo?.service_info?.service_path
                              }${combQuery(
                                  applicationInfo?.service_test
                                      ?.request_example,
                              )}`}
                    </div>
                )
            default:
                return (
                    <JSONCodeView
                        code={applicationInfo?.service_test?.request_example}
                        className={styles.codeBox}
                    />
                )
        }
    }

    /**
     * 组装query
     */
    const combQuery = (queryData: string) => {
        try {
            const queryJSON = JSON.parse(queryData)
            if (queryData) {
                const queryString = Object.keys(queryJSON)
                    .map((value) => `${value}=${queryJSON[value]}`)
                    .join('&')
                return `?${queryString}`
            }
            return ''
        } catch (ex) {
            return ''
        }
    }

    const handleReturn = () => {
        onClose?.()
    }

    const showToolTip = (title: any, toolTipTitle: any, value: any) => {
        return (
            <Tooltip
                title={
                    title ? (
                        <div className={styles.unitTooltip}>
                            <div>{toolTipTitle}</div>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: value || '--',
                                }}
                            />
                        </div>
                    ) : (
                        value
                    )
                }
                className={styles.toolTip}
                getPopupContainer={(n) => n}
                placement="bottom"
            >
                <div className={styles.itemDetailInfo} key={title}>
                    <span>{title}</span>
                    <span
                        className={styles.itemDetailInfoValue}
                        dangerouslySetInnerHTML={{
                            __html: value || '--',
                        }}
                        style={{
                            maxWidth: '200px',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                        }}
                    />
                </div>
            </Tooltip>
        )
    }
    // render
    const renderOtherInfo = (item: any, data: any) => {
        const { firstKey, infoKey, type, title, toolTipTitle } = item
        let showContent = data?.[firstKey]?.[infoKey] || ''
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
                    <Divider
                        style={{
                            height: '12px',
                            borderRadius: '1px',
                            borderLeft: '1px solid rgba(0,0,0,0.24)',
                            margin: '0px 2px 0px 12px',
                        }}
                        type="vertical"
                    />
                </>
            )
        }
        if (infoKey === 'subject_domain_name') {
            showContent = getLastText(showContent)
        }
        if (infoKey === 'department') {
            showContent = showContent?.name
        }

        return showToolTip(title, toolTipTitle, showContent)
    }
    return (
        <CustomDrawer
            open={open}
            isShowFooter={false}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
            customHeaderStyle={{ display: 'none' }}
            customBodyStyle={{
                height: 'calc(100% - 51px)',
                borderTop: '1px solid rgb(0 0 0 / 10%)',
            }}
            style={
                style || {
                    position: 'fixed',
                    width: '100vw',
                    height: '100%',
                    top: '52px',
                }
            }
        >
            <div className={styles.dirContentWrapper}>
                <div className={styles.dirContent} ref={container}>
                    <div className={styles.top} ref={header}>
                        <div
                            onClick={handleReturn}
                            className={styles.returnInfo}
                        >
                            <LeftOutlined className={styles.returnArrow} />
                        </div>
                        <div className={styles.headerContent}>
                            <Space
                                direction="vertical"
                                wrap={false}
                                style={{ width: '100%' }}
                            >
                                <div className={styles.headerBox}>
                                    <div className={styles.rescIcon}>
                                        {ResIcon[AssetTypeEnum.Api]}
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
                                                {ServiceTypeList.find(
                                                    (item) =>
                                                        item.value ===
                                                        applicationInfo
                                                            ?.service_info
                                                            ?.service_type,
                                                )?.label || '--'}
                                            </div>
                                            <span
                                                className={styles.name}
                                                title={
                                                    applicationInfo
                                                        ?.service_info
                                                        ?.service_name || ''
                                                }
                                            >
                                                {applicationInfo?.service_info
                                                    ?.service_name || '--'}
                                            </span>
                                            <Tooltip
                                                placement="bottom"
                                                title={__('复制')}
                                            >
                                                <span
                                                    className={styles.copyIcon}
                                                    onClick={() => {
                                                        copyToClipboard(
                                                            applicationInfo
                                                                ?.service_info
                                                                ?.service_name ||
                                                                '--',
                                                        )
                                                        message.success(
                                                            __('复制成功'),
                                                        )
                                                    }}
                                                >
                                                    <CopyOutlined />
                                                </span>
                                            </Tooltip>
                                        </div>
                                        <div
                                            className={
                                                styles.rescCodeInfoWrapper
                                            }
                                        >
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
                                                if (
                                                    header.current?.clientHeight
                                                ) {
                                                    setTargetOffset(
                                                        Number(
                                                            header.current
                                                                .clientHeight,
                                                        ) + 80,
                                                    )
                                                }
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
                                        {`${__('发布时间')} ${
                                            applicationInfo?.service_info?.online_time?.substring?.(
                                                0,
                                                10,
                                            ) || '--'
                                        }`}
                                    </div>
                                    <Divider
                                        style={{
                                            height: '12px',
                                            borderRadius: '1px',
                                            borderLeft:
                                                '1px solid rgba(0,0,0,0.24)',
                                            margin: '0px 2px 0px 12px',
                                        }}
                                        type="vertical"
                                    />
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
                    <div className={styles.content}>
                        <div className={styles.contentContainer}>
                            <div id="param-info">
                                <TitleBar title={__('参数信息')} />
                                <div className={styles.paramBasicInfo}>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <div
                                                id="param-info-address"
                                                className={styles.address}
                                                title={`${applicationInfo?.service_info?.gateway_url}${applicationInfo?.service_info?.service_path}`}
                                            >
                                                <span className={styles.label}>
                                                    {__('接口地址：')}
                                                </span>
                                                <span className={styles.text}>
                                                    {!applicationInfo
                                                        ?.service_info
                                                        ?.gateway_url &&
                                                    !applicationInfo
                                                        ?.service_info
                                                        ?.service_path
                                                        ? '--'
                                                        : `${applicationInfo?.service_info?.gateway_url}${applicationInfo?.service_info?.service_path}`}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div id="param-info-protocol">
                                                <span className={styles.label}>
                                                    {__('接口协议：')}
                                                </span>
                                                <span>
                                                    {applicationInfo?.service_info?.protocol.toLocaleUpperCase() ||
                                                        '--'}
                                                </span>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <div id="param-info-method">
                                                <span className={styles.label}>
                                                    {__('请求方式：')}
                                                </span>
                                                <span>
                                                    {applicationInfo?.service_info?.http_method?.toLocaleUpperCase() ||
                                                        '--'}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div id="param-info-return">
                                                <span className={styles.label}>
                                                    {__('返回类型：')}
                                                </span>
                                                <span>
                                                    {applicationInfo?.service_info?.return_type?.toLocaleUpperCase() ||
                                                        '--'}
                                                </span>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
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
                                    </Row>
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
                                                bordered
                                                dataSource={
                                                    applicationInfo
                                                        .service_param
                                                        .data_table_request_params
                                                }
                                                pagination={false}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                {applicationInfo?.service_test
                                    ?.request_example && (
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
                                                bordered
                                                dataSource={
                                                    applicationInfo
                                                        .service_param
                                                        .data_table_response_params
                                                }
                                                pagination={false}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                {applicationInfo?.service_test
                                    ?.response_example ? (
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
        </CustomDrawer>
    )
}

export default memo(ApiDetail)
