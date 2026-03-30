import Icon, { InfoCircleFilled, LeftOutlined } from '@ant-design/icons'
import { Button, Divider, Dropdown, Space, Tabs, Tooltip } from 'antd'
import { noop, toNumber } from 'lodash'
import moment from 'moment'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useUnmount, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { ReactComponent as icon1 } from '@/assets/DataAssetsCatlg/icon1.svg'
import { TextAreaView } from '@/components/AutoFormView/baseViewComponents'
import { useCongSearchContext } from '@/components/CognitiveSearch/CogSearchProvider'
import CustomDrawer from '@/components/CustomDrawer'
import { formatError, getFileCatalogDetail, HasAccess } from '@/core'
import { FontIcon } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { useQuery } from '@/utils'

import { IconType } from '@/icons/const'
import { Loader } from '@/ui'

import { itemOtherInfo } from './helper'

import { MicroWidgetPropsContext } from '@/context'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import FileInfoDetail from '@/components/ResourcesDir/FileInfoDetail'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

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

interface IFileInfoDetail {
    open: boolean
    onClose: (flag?: boolean) => void
    id?: string
    isIntroduced?: boolean
    // 是否来自审核待办
    isAudit?: boolean
    // 是否来自授权页
    isFromAuth?: boolean
    // 是否拥有此数据资源的权限
    hasPermission?: boolean
    returnInDrawer?: () => void
    getContainer?: HTMLElement | false
    showShadow?: boolean
    // 是否显示数据下载功能
    showDataDownload?: boolean
    style?: React.CSSProperties | undefined
    // 是否显示详情需要原有按钮
    isNeedComExistBtns?: boolean
    extraBtns?: React.ReactNode
    canChat?: boolean // 是否可以问答
    hasAsst?: boolean // 是否有认知助手
    headerStyle?: React.CSSProperties | undefined
    headerTitle?: string
    isShowHeader?: boolean
    isFromAi?: boolean
    aiStyle?: React.CSSProperties | undefined
    fullHeight?
    maskClosable?: boolean
}

const FileDetail = ({
    open,
    onClose,
    id = '',
    isIntroduced,
    isFromAuth,
    hasPermission = false,
    returnInDrawer = noop,
    getContainer = false,
    isAudit = false,
    showShadow = true,
    showDataDownload = true,
    style,
    isNeedComExistBtns = true,
    extraBtns,
    canChat = false,
    hasAsst = false,
    headerStyle = { display: 'none' },
    headerTitle,
    isShowHeader = false,
    isFromAi = false,
    aiStyle,
    fullHeight = false,
    maskClosable = false,
}: IFileInfoDetail) => {
    const [{ using }] = useGeneralConfig()

    const [loading, setLoading] = useState(true)

    const container = useRef<any>(null)
    const header = useRef<any>(null)
    const [isApply, setIsApply] = useState<boolean>(false)

    const [baseInfoData, setBaseInfoData] = useState<any>({})
    // const [tabActiveKey, setTabActiveKey] = useState<detailTabKey | string>(
    //     detailTabKey.dataPreview,
    // )
    const { bigHeader } = useCongSearchContext()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    // useCogAsstContext 已移除，相关功能已下线

    const query = useQuery()
    const dataviewId = query.get('dataviewId') || ''
    // 库表id--不能为空  如果参数中有id就使用id，否则使用页面路径dataviewId参数
    const [rescId, setRescId] = useState<string>('')

    useEffect(() => {
        if (id) {
            setRescId(id || '')
        } else {
            setRescId(dataviewId)
        }
    }, [id])

    const { checkPermissions } = useUserPermCtx()
    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    // 抽屉 top
    const styleTop = useMemo(() => {
        if (style?.top === 0) {
            return 0
        }
        if (style?.top) {
            if (typeof style.top === 'number') {
                return style.top
            }
            return Number(style.top.replace('px', ''))
        }
        return bigHeader ? 62 : 52
    }, [style])

    useEffect(() => {
        if (open) {
            getDetails()
        }
    }, [rescId, open])

    useUnmount(() => {
        // useCogAsstContext 已移除
    })

    const getDetails = async () => {
        if (!rescId) return
        try {
            setLoading(true)
            const res = await getFileCatalogDetail(rescId)
            setBaseInfoData(res)
        } catch (err) {
            formatError(err, microWidgetProps?.components?.toast)
            onClose()
        } finally {
            setLoading(false)
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

    // render
    const renderOtherInfo = (item: any, data: any) => {
        const { firstKey, infoKey, type, title, toolTipTitle } = item

        const showContent = data?.[infoKey] || ''
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
                width: '100%',
            }}
            onClose={(e: any) => onClose(e)}
            title={headerTitle}
            customHeaderStyle={{ display: 'none' }}
            customBodyStyle={{
                height: fullHeight ? '100%' : `calc(100% - ${styleTop}px)`,
                background: '#f0f2f6',
                position: 'relative',
                overflow: 'hidden',
            }}
            headerStyle={headerStyle}
            isShowHeader={isShowHeader}
            // getContainer={() => document.body}
            style={
                style ||
                (isIntroduced
                    ? {
                          position: 'relative',
                          width: '100%',
                          //   height: 'calc(100% - 55px)',
                          height: '100%',
                          top: 0,
                      }
                    : {
                          position: 'fixed',
                          width: '100vw',
                          // height: 'calc(100vh - 64px)',
                          // top: '64px',
                          height: '100vh',
                          top: styleTop,
                          //   borderTop: '1px solid rgb(0 0 0 / 10%)',
                      })
            }
            getContainer={getContainer}
            maskClosable={maskClosable}
        >
            {showShadow && (
                <div hidden={loading} className={styles.bodyShadow} />
            )}
            <div
                className={styles.fileDetail}
                ref={container}
                style={{
                    height: isIntroduced ? '100%' : undefined,
                    borderTop:
                        !style && !isIntroduced
                            ? '1px solid rgb(0 0 0 / 10%)'
                            : '',
                }}
            >
                {loading && (
                    <div className={styles.detailLoading}>
                        <Loader />
                    </div>
                )}
                <div className={styles.header} ref={header} hidden={loading}>
                    <div
                        onClick={() => {
                            returnInDrawer()
                            onClose(isApply)
                        }}
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
                                    <FontIcon
                                        type={IconType.COLOREDICON}
                                        name="icon-wenjianziyuan"
                                    />
                                </div>
                                <div className={styles.rescTopInfoWrapper}>
                                    <div
                                        className={styles.fileDetailName}
                                        title={baseInfoData?.name}
                                    >
                                        <span
                                            className={styles.name}
                                            title={baseInfoData?.name || '--'}
                                        >
                                            {baseInfoData?.name || '--'}
                                        </span>
                                        {hasDataOperRole &&
                                            // 库表2005版发布不经过审核，仅有未发布、已发布状态，详情接口中仅能通过是否有发布时间判断是否发布
                                            !baseInfoData?.published_at && (
                                                <div
                                                    className={
                                                        styles.publishState
                                                    }
                                                >
                                                    {
                                                        __('未发布')
                                                        //   + publishedStatus
                                                    }
                                                </div>
                                            )}
                                    </div>
                                    <div className={styles.logicSubInfo}>
                                        <div
                                            className={
                                                styles.rescCodeInfoWrapper
                                            }
                                        >
                                            {__('编码：')}
                                            <span
                                                title={
                                                    baseInfoData?.code || '--'
                                                }
                                            >
                                                {baseInfoData?.code || '--'}
                                            </span>
                                        </div>
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
                                            baseInfoData?.description || '--'
                                        }
                                        rows={1}
                                        placement="end"
                                        onExpand={() => {}}
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
                                        baseInfoData?.published_at
                                            ? moment(
                                                  baseInfoData?.published_at,
                                              ).format('YYYY-MM-DD')
                                            : '--'
                                    }`}
                                </div>
                                {showDivder()}
                                <div className={styles.iconLabel}>
                                    {itemOtherInfo.map((oItem) => {
                                        return renderOtherInfo(
                                            oItem,
                                            baseInfoData,
                                        )
                                    })}
                                </div>
                            </div>
                        </Space>
                    </div>
                </div>
                <div className={styles.contentTabsWrapper} hidden={loading}>
                    {/* <Tabs
                        activeKey={tabActiveKey}
                        onChange={(key: any) => {
                            setTabActiveKey(key)
                        }}
                        tabBarGutter={32}
                        items={detailTabItems}
                        className={classnames(
                            styles.contentTabs,
                            tabActiveKey === detailTabKey.dataPreview &&
                                styles.dataPreviewTab,
                        )}
                    /> */}

                    <div className={styles.viewDetailsWrapper}>
                        <FileInfoDetail isMarket fileId={id} />
                    </div>
                </div>
            </div>
        </CustomDrawer>
    )
}

export default FileDetail
