import { InfoCircleFilled, LeftOutlined } from '@ant-design/icons'
import { Button, Divider, Dropdown, Space, Tabs, Tooltip } from 'antd'
import { noop, toNumber } from 'lodash'
import moment from 'moment'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { TextAreaView } from '@/components/AutoFormView/baseViewComponents'
import { useCongSearchContext } from '@/components/CognitiveSearch/CogSearchProvider'
import CustomDrawer from '@/components/CustomDrawer'
import DataConsanguinity from '@/components/DataConsanguinity'
import DelFieldsModal from '@/components/DatasheetView/DelFieldsModal'
import FieldList from '@/components/DatasheetView/FieldList'
import FormViewExampleData from '@/components/DatasheetView/FormViewExampleData'
import {
    IEditFormData,
    detailTabKey,
    filterEmptyProperties,
    stateType,
} from '@/components/DatasheetView/const'
import {
    IGradeLabel,
    LogicViewType,
    formatError,
    getDataGradeLabel,
    getDataViewBaseInfo,
    getDatasheetViewDetails,
    queryFrontendInterfaceServiceList,
} from '@/core'
import { DatasheetViewColored } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'

import DataQuality from '@/components/DatasheetView/DataQuality'
import { validateRepeatName } from '@/components/DatasheetView/helper'
import { DataServiceType } from '@/components/ResourcesDir/const'
import { getInnerUrl } from '@/utils'
import { Empty, Loader } from '@/ui'
import { getTagsData } from '@/components/DataClassificationTag/const'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import {
    itemOtherInfo,
    TimeRender,
} from '@/components/DataAssetsCatlg/LogicViewDetail/helper'
import dataEmpty from '@/assets/dataEmpty.svg'
import { MicroWidgetPropsContext } from '@/context'
import { getIsNeedPermisControl } from '@/components/DataAssetsCatlg/helper'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import DataPreview from '@/components/DatasheetView/DataPreview'

interface ILogicViewDetail {
    open: boolean
    onClose: (flag?: boolean) => void
    id?: string
    isIntroduced?: boolean
    returnInDrawer?: () => void
    getContainer?: HTMLElement | false
    showShadow?: boolean
    style?: React.CSSProperties | undefined
}

const LogicViewDetail = ({
    open,
    onClose,
    id = '',
    isIntroduced,
    returnInDrawer = noop,
    getContainer = false,
    showShadow = true,
    style,
}: ILogicViewDetail) => {
    const [{ using }] = useGeneralConfig()

    const [loading, setLoading] = useState(true)

    const container = useRef<any>(null)
    const header = useRef<any>(null)
    const [openDelFields, setOpenDelFields] = useState<boolean>(false)

    const [detailsData, setDetailsData] = useState<any>()
    const [delfieldList, setDelFieldList] = useState<any[]>([])
    const [fieldsTableData, setFieldsTableData] = useState<any[]>([])
    const [baseInfoData, setBaseInfoData] = useState<any>({})
    const [tabActiveKey, setTabActiveKey] = useState<detailTabKey | string>(
        detailTabKey.view,
    )

    // 点击接口
    const [selInterface, setSelInterface] = useState<any>({})
    // 接口详情
    const [interfaceDetailOpen, setInterfaceDetailOpen] =
        useState<boolean>(false)
    const [hasTimestamp, setHasTimestamp] = useState<boolean>(false)
    const [formViewIdNotExist, setFormViewIdNotExist] = useState<boolean>(false)
    const { bigHeader } = useCongSearchContext()
    const [isGradeOpen] = useGradeLabelState()
    const [tagData, setTagData] = useState<IGradeLabel[]>([])
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    const detailTabItems = useMemo(() => {
        return [
            {
                label: __('字段'),
                key: detailTabKey.view,
            },
            // {
            //     label: __('数据预览'),
            //     key: detailTabKey.dataPreview,
            // },
            // {
            //     label: __('样例数据'),
            //     key: detailTabKey.sampleData,
            // },
            // {
            //     label:
            //         baseInfoData.type === LogicViewType.DataSource
            //             ? __('数据血缘')
            //             : undefined,
            //     key: detailTabKey.dataConsanguinity,
            // },
            // {
            //     label: __('数据质量'),
            //     key: detailTabKey.dataQuality,
            // },
        ]?.filter((tab) => tab.label)
    }, [baseInfoData])

    // 获取分级标签
    const getTags = async () => {
        try {
            const result = await getDataGradeLabel({ keyword: '' })
            const tagArr = []
            getTagsData(result.entries, tagArr)
            setTagData(tagArr)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (isGradeOpen) {
            getTags()
        }
    }, [isGradeOpen])

    useEffect(() => {
        if (open) {
            getDetails()
        }
    }, [id, open])

    const getDetails = async () => {
        if (!id) return
        try {
            setLoading(true)
            const res = await getDatasheetViewDetails(id)
            const baseRes = await getDataViewBaseInfo(id)
            const { entries: asscoiateInterfaces } =
                await queryFrontendInterfaceServiceList(id)

            // 去除空字段
            const baseResValue: IEditFormData = filterEmptyProperties(baseRes)
            setBaseInfoData({
                ...baseResValue,
                id,
                business_name: res?.business_name,
                technical_name: res?.technical_name,
                viewStatus: res?.status,
                datasource_id: res?.datasource_id,
                last_publish_time: res?.last_publish_time,
                // 关联接口
                asscoiateInterfaces,
            })
            setHasTimestamp(res.fields?.some((o) => o.business_timestamp))
            setDetailsData({ ...res, owner_id: baseResValue?.owner_id })
            const delFields = res?.fields
                ?.filter((item) => item.status === stateType.delete)
                .sort((a, b) =>
                    a.business_name.localeCompare(b.business_name, 'pinyin', {
                        numeric: true,
                    }),
                )
            setDelFieldList(delFields)
            // setOptionType(!res?.last_publish_time ? 'edit' : model)
            const data = res?.fields.map((item) => {
                return {
                    ...item,
                    tips:
                        validateRepeatName(
                            res?.fields?.filter(
                                (it) => it.status !== stateType.delete,
                            ),
                            item,
                        ) && item.status !== stateType.delete
                            ? __('此名称和其他字段的业务名称重复，请修改')
                            : '',
                }
            })
            setFieldsTableData(data)
        } catch (err) {
            const { code } = err?.data ?? {}
            if (code === 'DataView.FormView.FormViewIdNotExist') {
                setFormViewIdNotExist(
                    err?.data?.code === 'DataView.FormView.FormViewIdNotExist',
                )
                onClose()
                return
            }

            setFieldsTableData([])
            // formatError(err, microWidgetProps?.components?.toast)
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

    const notExist = () => {
        return (
            <div className={styles.noData}>
                <div
                    onClick={() => {
                        returnInDrawer()
                        onClose()
                    }}
                    className={styles.returnInfo}
                >
                    <LeftOutlined className={styles.returnArrow} />
                </div>
                <div className={styles.empty}>
                    <Empty desc={__('库表不存在')} iconSrc={dataEmpty} />
                </div>
            </div>
        )
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
                height: bigHeader ? 'calc(100% - 62px)' : 'calc(100% - 52px)',
                background: '#f0f2f6',
                position: 'relative',
                overflow: 'hidden',
            }}
            style={
                style ||
                (isIntroduced
                    ? {
                          position: 'relative',
                          width: '100%',
                          height: '100%',
                          top: 0,
                      }
                    : {
                          position: 'fixed',
                          width: '100vw',
                          height: '100vh',
                          top: bigHeader ? '62px' : '52px',
                      })
            }
            getContainer={getContainer}
        >
            {showShadow && (
                <div hidden={loading} className={styles.bodyShadow} />
            )}
            {formViewIdNotExist ? (
                notExist()
            ) : (
                <div
                    className={styles.logicViewDetail}
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
                    <div
                        className={styles.header}
                        ref={header}
                        hidden={loading}
                    >
                        <div
                            onClick={() => {
                                returnInDrawer()
                                onClose()
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
                                        <DatasheetViewColored />
                                    </div>
                                    <div className={styles.rescTopInfoWrapper}>
                                        <div
                                            className={styles.logicViewName}
                                            title={baseInfoData?.business_name}
                                        >
                                            <span
                                                className={styles.name}
                                                title={
                                                    baseInfoData?.business_name ||
                                                    '--'
                                                }
                                            >
                                                {baseInfoData?.business_name ||
                                                    '--'}
                                            </span>
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
                                                        baseInfoData?.uniform_catalog_code ||
                                                        '--'
                                                    }
                                                >
                                                    {baseInfoData?.uniform_catalog_code ||
                                                        '--'}
                                                </span>
                                            </div>
                                            <div
                                                className={styles.rescTechName}
                                            >
                                                {__('技术名称：')}
                                                <span
                                                    title={
                                                        baseInfoData?.technical_name ||
                                                        '--'
                                                    }
                                                >
                                                    {baseInfoData?.technical_name ||
                                                        '--'}
                                                </span>
                                            </div>
                                            <div className={styles.rescGenview}>
                                                {__('生成接口：')}

                                                <div
                                                    className={
                                                        styles.viewWrapper
                                                    }
                                                >
                                                    {toNumber(
                                                        baseInfoData
                                                            ?.asscoiateInterfaces
                                                            ?.length,
                                                    ) > 0 ? (
                                                        <span
                                                            className={
                                                                styles.viewTag
                                                            }
                                                            title={
                                                                baseInfoData
                                                                    ?.asscoiateInterfaces?.[0]
                                                                    ?.service_name ||
                                                                '--'
                                                            }
                                                        >
                                                            <a
                                                                className={
                                                                    styles.serviceLink
                                                                }
                                                                onClick={() => {
                                                                    setSelInterface(
                                                                        baseInfoData
                                                                            ?.asscoiateInterfaces?.[0],
                                                                    )
                                                                    setInterfaceDetailOpen(
                                                                        true,
                                                                    )
                                                                }}
                                                            >
                                                                {baseInfoData
                                                                    ?.asscoiateInterfaces?.[0]
                                                                    ?.service_name ||
                                                                    '--'}
                                                            </a>
                                                        </span>
                                                    ) : (
                                                        '--'
                                                    )}
                                                    {toNumber(
                                                        baseInfoData
                                                            ?.asscoiateInterfaces
                                                            ?.length,
                                                    ) > 1 && (
                                                        <Dropdown
                                                            menu={{
                                                                items: baseInfoData?.asscoiateInterfaces
                                                                    ?.slice(
                                                                        1,
                                                                        11,
                                                                    )
                                                                    ?.map(
                                                                        (
                                                                            sItem,
                                                                        ) => ({
                                                                            ...sItem,
                                                                            label: sItem.service_name,
                                                                            key: sItem.service_id,
                                                                        }),
                                                                    ),
                                                                onClick: (
                                                                    sItem,
                                                                ) => {
                                                                    const selService =
                                                                        baseInfoData?.asscoiateInterfaces?.find(
                                                                            (
                                                                                _item,
                                                                            ) =>
                                                                                _item.service_id ===
                                                                                sItem.key,
                                                                        )
                                                                    setSelInterface(
                                                                        selService,
                                                                    )
                                                                    setInterfaceDetailOpen(
                                                                        true,
                                                                    )
                                                                },
                                                            }}
                                                            trigger={['click']}
                                                            getPopupContainer={(
                                                                n,
                                                            ) => n}
                                                            placement="bottomRight"
                                                        >
                                                            <span
                                                                className={
                                                                    styles.viewOtherNumTag
                                                                }
                                                            >
                                                                <a
                                                                    className={
                                                                        styles.moreLink
                                                                    }
                                                                >
                                                                    {`+${
                                                                        toNumber(
                                                                            baseInfoData
                                                                                ?.asscoiateInterfaces
                                                                                ?.length,
                                                                        ) - 1
                                                                    }`}
                                                                </a>
                                                            </span>
                                                        </Dropdown>
                                                    )}
                                                </div>
                                            </div>
                                            {hasTimestamp && (
                                                <div
                                                    className={
                                                        styles.rescTechName
                                                    }
                                                >
                                                    {__('业务数据更新时间：')}
                                                    <span>
                                                        <TimeRender
                                                            formViewId={id}
                                                            placement="bottom"
                                                        />
                                                    </span>
                                                </div>
                                            )}
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
                                                baseInfoData?.description ||
                                                '--'
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
                                            baseInfoData?.updated_at
                                                ? moment(
                                                      baseInfoData?.updated_at,
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
                        <Tabs
                            activeKey={tabActiveKey}
                            onChange={(key: any) => {
                                setTabActiveKey(key)
                            }}
                            tabBarGutter={32}
                            items={detailTabItems}
                            className={styles.contentTabs}
                        />
                        {tabActiveKey === detailTabKey.view ? (
                            <div className={styles.viewDetailsWrapper}>
                                {/* <div className={styles.detailFields}>
                                    {delfieldList.length > 0 && (
                                        <div>
                                            <InfoCircleFilled
                                                className={styles.titleIcon}
                                            />
                                            <span>
                                                {__('提示：有')}
                                                {delfieldList.length}
                                                {__('个标记删除的字段。')}
                                            </span>
                                            <span
                                                onClick={() =>
                                                    setOpenDelFields(true)
                                                }
                                                className={styles.deltext}
                                            >
                                                {__('查看删除字段')}
                                            </span>
                                        </div>
                                    )}
                                </div> */}
                                <FieldList
                                    fieldList={fieldsTableData}
                                    currentData={detailsData}
                                    isStart={isGradeOpen}
                                    tagData={tagData}
                                    style={{
                                        // margin: '0  0 24px 0',
                                        margin: '0',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: 'calc(100vh - 267px)',
                                    }}
                                    tableScroll={{
                                        y: 'calc(100vh - 448px)',
                                    }}
                                    getContainer={document.getElementById(
                                        'serviceWrap',
                                    )}
                                    isMarket
                                    hiddenFilters
                                />
                            </div>
                        ) : tabActiveKey === detailTabKey.sampleData ? (
                            <div className={styles.sampleDataWrapper}>
                                <FormViewExampleData
                                    id={id}
                                    // 688138 - 审核待办样例数据不需要验证权限
                                    isNeedPermisControl={false}
                                    // isNeedPermisControl={getIsNeedPermisControl(
                                    //     microWidgetProps,
                                    // )}
                                    isMarket
                                />
                            </div>
                        ) : tabActiveKey === detailTabKey.dataConsanguinity ? (
                            <DataConsanguinity
                                id={id}
                                dataServiceType={DataServiceType.DirContent}
                                isMarket
                            />
                        ) : tabActiveKey === detailTabKey.dataQuality ? (
                            <DataQuality dataViewId={id} isMarket />
                        ) : tabActiveKey === detailTabKey.dataPreview ? (
                            <div
                                style={{
                                    margin: '0 24px',
                                    width: 'calc(100% - 48px)',
                                }}
                            >
                                <DataPreview
                                    isAudit
                                    isMarket
                                    dataViewId={id || ''}
                                />
                            </div>
                        ) : null}

                        {openDelFields && (
                            <DelFieldsModal
                                fieldData={delfieldList}
                                onClose={() => setOpenDelFields(false)}
                                open={openDelFields}
                                sum={delfieldList.length}
                            />
                        )}
                    </div>
                </div>
            )}
            {interfaceDetailOpen && selInterface?.service_id && (
                <ApplicationServiceDetail
                    open={interfaceDetailOpen}
                    onClose={() => {
                        setInterfaceDetailOpen(false)
                    }}
                    serviceCode={selInterface?.service_id}
                    isIntroduced
                    showShadow={false}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: '52px',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                        color: '#123456,',
                        zIndex: '1001',
                    }}
                />
            )}
        </CustomDrawer>
    )
}

export default LogicViewDetail
