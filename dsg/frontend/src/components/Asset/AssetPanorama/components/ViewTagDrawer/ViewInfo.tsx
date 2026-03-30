import React, {
    memo,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import classnames from 'classnames'
import { useHover, useUpdateEffect } from 'ahooks'
import { List, Radio, Space, Tooltip, message } from 'antd'
import { InfoCircleFilled } from '@ant-design/icons'
import { isEmpty, isNumber, toNumber, trim } from 'lodash'
import { MicroWidgetPropsContext } from '@/context'
import styles from './styles.module.less'
import {
    AssetTypeEnum,
    IPolicyInfo,
    IVisitor,
    formatError,
    getClassificationFields,
    getDataViewBaseInfo,
    getDatasheetViewDetails,
    getSynthData,
    getVirtualEngineExample,
    policyValidate,
    policyDetail,
    PolicyActionEnum,
    HasAccess,
} from '@/core'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import { AssetIcons, AssetNodes } from '../../helper'
import { CopyOutlined, FontIcon, InfotipOutlined } from '@/icons'
import AttrIcon from '@/components/RowAndColFilter/AttrIcon'
import { copyToClipboard } from '@/components/MyAssets/helper'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getActualUrl, filterSymbol, getTypeText, cancelRequest } from '@/utils'
import { AssetNodeType } from '../HierarchyGraph/helper'
import { SampleOptionValue } from '@/components/DataAssetsCatlg/LogicViewDetail/helper'
import __ from './locale'
import { IconType } from '@/icons/const'
import {
    IEditFormData,
    VIEWERRORCODElIST,
    filterEmptyProperties,
} from '@/components/DatasheetView/const'
import ViewScrollList, { PageSize, ScrollViewId } from './ViewScrollList'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const LogicItem = memo(({ item, viewId, isCheck, onClick, showBtn }: any) => {
    const ref = useRef<HTMLDivElement | null>(null)
    const isHovering = useHover(ref)
    const handleToEdit = () => {
        window.open(
            getActualUrl(
                `/datasheet-view/detail?datasourceTab=datasource&id=${viewId}&model=view&isCompleted=true&taskId=&detailsUrl=null&logic=datasource`,
            ),
            '_blank',
            'noreferrer',
        )
    }

    return (
        <div
            ref={ref}
            className={classnames({
                [styles['logic-item']]: true,
                [styles['is-checked']]: isCheck,
            })}
            onClick={onClick}
        >
            <div className={styles['logic-item-top']}>
                <span className={styles.icon}>
                    {AssetIcons[AssetNodes.DATAVIEW]}
                </span>

                <span className={styles.title} title={item?.business_name}>
                    {item?.business_name}
                </span>
            </div>
            <div className={styles['logic-item-bottom']}>
                <span title={item?.technical_name}>{item?.technical_name}</span>
                <span hidden={!(isHovering || isCheck)}>
                    <div>
                        <Tooltip placement="top" title="复制">
                            <CopyOutlined
                                onClick={() => {
                                    copyToClipboard(
                                        item?.technical_name || '--',
                                    )
                                    message.success('复制成功')
                                }}
                            />
                        </Tooltip>
                    </div>
                    <div hidden={!showBtn}>
                        <Tooltip placement="top" title="跳转至库表管理">
                            <FontIcon
                                name="icon-daochu"
                                style={{ fontSize: '14px' }}
                                onClick={handleToEdit}
                            />
                        </Tooltip>
                    </div>
                </span>
            </div>
        </div>
    )
})

const FieldItem = memo(
    ({
        item,
        showTag,
        isSample,
        reqSmpOrSynthError,
        showData,
        isOwnedFullReadPermis,
    }: any) => {
        const type = filterSymbol(item?.data_type)
        return (
            <div className={styles['field-item']}>
                <div className={styles['field-item-title']}>
                    <div>
                        <Tooltip
                            title={
                                <span
                                    style={{
                                        color: 'rgba(0,0,0,0.85)',
                                        fontSize: '12px',
                                    }}
                                >
                                    {getTypeText(type, false)}
                                </span>
                            }
                            placement="top"
                            color="#fff"
                            overlayClassName={styles['field-wrapper-tooltip']}
                        >
                            <span>
                                <AttrIcon type={type} />
                            </span>
                        </Tooltip>
                        <span
                            className={styles.title}
                            title={item?.business_name}
                        >
                            {item?.business_name}
                        </span>
                    </div>
                    <div>
                        {item?.is_primary && (
                            <span className={styles['is-primary']}>主键</span>
                        )}
                        {showTag && item?.hierarchy_tag && (
                            <Tooltip
                                title={item?.hierarchy_tag?.name}
                                color="#fff"
                                overlayClassName={styles['label-tip']}
                            >
                                <FontIcon
                                    name="icon-biaoqianicon"
                                    style={{
                                        fontSize: '18px',
                                        color:
                                            item?.hierarchy_tag?.color ||
                                            'rgba(0,0,0,0.25)',
                                    }}
                                />
                            </Tooltip>
                        )}
                    </div>
                </div>
                <div
                    className={styles['field-item-subtitle']}
                    title={item?.technical_name}
                >
                    {item?.technical_name}
                </div>
                <div className={styles['field-item-property']}>
                    <span className={styles.label}>关联属性:</span>
                    <span
                        className={styles.value}
                        title={item?.property?.path_name}
                    >
                        {item?.property?.path_name}
                    </span>
                </div>
                <div className={styles['field-item-simpledata']}>
                    <span className={styles.label}>样例数据:</span>
                    {/* 样例数据下库表或行列有权限 或 行列有权限 或 合成数据下 */}
                    {(!isSample ||
                        isOwnedFullReadPermis ||
                        item?.is_readable) &&
                    showData?.length ? (
                        showData?.map((sItem, sIdx) => {
                            return (
                                <div
                                    key={sIdx}
                                    className={styles.sampleTag}
                                    title={sItem}
                                >
                                    {sItem}
                                </div>
                            )
                        })
                    ) : (
                        <span>
                            {/* 样例数据为空显示：暂无数据、无权限；合成数据为空显示：库表为空导致无数据 */}
                            {reqSmpOrSynthError ===
                            VIEWERRORCODElIST.VIEWTABLEFIELD
                                ? __('库表存在与源表不一致的字段，无法查看')
                                : isSample
                                ? isOwnedFullReadPermis || item?.is_readable
                                    ? __('暂无数据')
                                    : __('无权限查看')
                                : __('库表数据为空，不生成')}
                        </span>
                    )}
                    {/* <span className={styles.value}>
                    {!item?.sample_data?.length && <span>{__('暂无数据')}</span>}
                    {item?.sample_data?.map((o) => (
                        <div className={styles.tag} title={o}>
                            {o}
                        </div>
                    ))}
                </span> */}
                </div>
            </div>
        )
    },
)

const viewInfoId = 'viewInfoId'

/** unExpand: 分级占比折叠 */
function ViewInfo({
    id,
    type,
    unExpand,
}: {
    id: string
    type: string
    unExpand: boolean
}) {
    const [userID] = useCurrentUser('ID')
    const [userInfo] = useCurrentUser()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    // useCogAsstContext 已移除，相关功能已下线

    // 字段关联库表
    const [viewList, setViewList] = useState<any>()
    const [viewCount, setViewCount] = useState<number>(0)
    const [current, setCurrent] = useState<any>({})
    // 左侧列表laoding
    const [loading, setLoading] = useState<boolean>(false)
    // 库表详情loading
    const [viewInfoLoading, setViewInfoLoading] = useState<boolean>(false)
    const [permisLoading, setPermisLoading] = useState<boolean>(false)
    const [sampleDataLoading, setSampleDataLoading] = useState<boolean>(false)
    const [isGradeOpen] = useGradeLabelState()
    const fieldRef = useRef<any>()
    const { checkPermissions } = useUserPermCtx()
    const viewInfoRef = useRef<any>()
    // 库表详情
    const [viewInfo, setViewInfo] = useState<any>()
    // 样例数据radio
    const [sampleOption, setSampleOption] = useState(SampleOptionValue.Sample)
    // 样例/合成数据错误类型
    const [sampOrSynthError, setSampOrSynthError] = useState<any>()

    // 字段样例数据
    const [sampleData, setSampleData] = useState<any>({})
    // 字段合成数据
    const [synthData, setSynthData] = useState<any>({})
    const [permissions, setPermissions] = useState<IVisitor[]>()
    const [allowRead, setAllowRead] = useState<any>(undefined)
    // 是否有整表权限
    const [isOwnedFullReadPermis, setIsOwnedFullReadPermis] =
        useState<boolean>(false)

    // 是否有所有关联字段的is_readable权限
    const [isOwnedRelateFieldsReadPermis, setIsRelateFieldsReadPermis] =
        useState<boolean>(false)

    const [viewTotal, setViewTotal] = useState<number>(0)
    const [condition, setCondition] = useState<any>({
        limit: PageSize,
        offset: 1,
    })
    const sampleOptions = useMemo(
        () => [
            { label: __('样例数据'), value: SampleOptionValue.Sample },
            {
                label: (
                    <div className={styles.sampleOption}>
                        <FontIcon
                            name="icon-AIhecheng"
                            type={IconType.FONTICON}
                            className={styles.smapleIcon}
                        />
                        <span>{__('合成数据')}</span>
                    </div>
                ),
                value: SampleOptionValue.Synthetic,
                disabled: false,
            },
        ],
        [],
    )

    const isOwner = useMemo(() => {
        return userID === current?.owner_id
    }, [current, userInfo])

    const isTrueRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    // 获取左侧关联库表列表
    const loadData = async () => {
        setLoading(true)
        await onLoadViewMore()
        setLoading(false)
    }

    const getLogicViewInfo = async (viewId) => {
        try {
            setViewInfoLoading(true)

            const res = await getDatasheetViewDetails(viewId)
            const baseRes = await getDataViewBaseInfo(viewId)
            // 去除空字段
            const baseResValue: IEditFormData = filterEmptyProperties(baseRes)
            const viewFields: any = {}

            const viewInfoTemp = {
                // 判断当前库表是否为id指向的id，防止多次切换库表导致错误
                form_view_id: viewId,
                ...res,
                ...baseResValue,
            }
            // 详情信息
            setViewInfo(viewInfoTemp)
            res?.fields?.forEach((fItem) => {
                // 库表所有字段
                viewFields[fItem.id] = fItem
            })

            const currentTemp =
                viewList?.find((_item) => _item.form_view_id === viewId) || {}
            // 样例数据同步
            const cur = {
                ...viewInfoTemp,
                ...currentTemp,
                hadSearch: true, // 设置已查询
                fields: currentTemp?.fields?.map((o, idx) => ({
                    ...(viewFields[o.id || ''] || {}),
                    ...o,
                })),
            }

            const curData = viewList?.map?.((o) =>
                o?.form_view_id === viewId ? cur : o,
            )
            // 更新左侧列表，修改列表中当前选中库表数据
            setViewList(curData)
            if (current?.form_view_id === viewId) {
                changeCurrent(cur)
                setFieldColumns(cur?.fields || [])
                const curFormFields = cur?.fields || []
                const allFieldIsReadable = curFormFields.every(
                    (item) => item.is_readable,
                )
                setIsRelateFieldsReadPermis(allFieldIsReadable)
            }
        } catch (e) {
            const errCode = e?.data?.code || ''
            if (errCode === 'ERR_CANCELED') {
                return
            }
            formatError(e)
        } finally {
            setViewInfoLoading(false)
        }
    }

    const getSampleData = async (viewId) => {
        try {
            setSampleDataLoading(true)
            const curViewId = current?.form_view_id
            // const [catalog, schema] =
            //     viewInfo?.view_source_catalog_name?.split('.') || []
            const currentTemp =
                viewList?.find((_item) => _item.form_view_id === viewId) || {}
            const {
                catalog_name: catalog,
                schema,
                technical_name: table,
            } = current
            const params = {
                catalog,
                schema,
                table,
                limit: 3,
                user_id: userID,
                columns:
                    currentTemp?.fields
                        ?.map((o) => o.technical_name)
                        ?.join(',') || '',
            }

            // 获取样例数据
            let data: any = {}
            if (sampleOption === SampleOptionValue.Sample) {
                if (!allowRead) {
                    setSampleDataLoading(false)
                    return
                }

                data = await getVirtualEngineExample(params)
            } else {
                data = await getSynthData(viewId)
            }

            const names = data?.columns?.map((item) => item.name)

            if (viewId === current?.form_view_id) {
                if (sampleOption === SampleOptionValue.Sample) {
                    const sampleDataObj: Object = {}

                    names?.forEach((name, nIdx) => {
                        const obj: any = []

                        data?.data.forEach((item, idx) => {
                            const val = trim(item[nIdx] || '')
                            // 去前三个非重复有值数据
                            if (val && !sampleDataObj?.[name]?.includes(val)) {
                                if (!sampleDataObj?.[name]?.length) {
                                    sampleDataObj[name] = [val]
                                } else if (
                                    toNumber(sampleDataObj?.[name]?.length) < 3
                                ) {
                                    sampleDataObj?.[name]?.push(val)
                                }
                            }
                        })
                    })
                    setSampleData(sampleDataObj)
                } else {
                    const synthDataObj = {}
                    data?.data?.forEach((rowData, idx) => {
                        rowData.forEach((columnData) => {
                            const { column_name: name, column_value } =
                                columnData
                            const isValNumber = isNumber(column_value)
                            const val = isValNumber
                                ? column_value
                                : trim(column_value || '')
                            if (!val && !isValNumber) return
                            if (!synthDataObj?.[name]) {
                                synthDataObj[name] = [val]
                            } else if (
                                !synthDataObj?.[name]?.includes(val) &&
                                toNumber(synthDataObj?.[name]?.length) < 3
                            ) {
                                synthDataObj?.[name]?.push(val)
                            }
                        })
                    })
                    setSynthData(synthDataObj)
                }
            }
            setSampleDataLoading(false)
        } catch (e) {
            const errCode = e?.data?.code || ''
            // const errCode = e?.data?.code || e?.data?.status

            if (errCode === 'ERR_CANCELED') {
                return
            }

            // 加载失败
            // 样例数据加载失败仍可显示字段，但数据为空，合成数据失败提示重新加载按钮
            setSampOrSynthError(
                errCode ||
                    (sampleOption === SampleOptionValue.Sample
                        ? VIEWERRORCODElIST.VIEWDATAEMPTYERRCODE
                        : 'error'),
            )

            // 合成数据生成中
            if (errCode === VIEWERRORCODElIST.ADGENERATING) {
                // 依旧显示加载中
                // formatError(e, microWidgetProps?.components?.toast)
            } else if (errCode === VIEWERRORCODElIST.VIEWDATAEMPTYERRCODE) {
                setSampleDataLoading(false)
            } else if (errCode === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                setSampleDataLoading(false)
                // message.error(__('库表有更新，请重新发布'))
            } else if (errCode === VIEWERRORCODElIST.VIEWTABLEFIELD) {
                setSampleDataLoading(false)
                // 库表与源表的字段不一致
                message.info({
                    icon: <InfoCircleFilled className={styles.infoIcon} />,
                    content: <span>{e?.data?.description}</span>,
                    duration: 5,
                    className: styles.sampleMsgInfo,
                    getPopupContainer: (n) => {
                        return (
                            document.getElementById(viewInfoId) ||
                            viewInfoRef?.current ||
                            n
                        )
                    },
                })

                // setTimeout(() => {
                //     // 恢复默认container
                //     message.config({
                //         getContainer: () => document.body as HTMLElement,
                //     })
                // }, 6000)
            } else if (errCode === VIEWERRORCODElIST.AFSAILORERROR) {
                setSampleDataLoading(false)
                // af-sailor服务挂掉
                message.warning({
                    getPopupContainer: (n) =>
                        document.getElementById(viewInfoId) ||
                        viewInfoRef?.current ||
                        n,
                    icon: <InfoCircleFilled className={styles.infoIcon} />,
                    content: __('无法连接af-sailor服务，信息获取失败'),
                    className: styles.sampleMsgInfo,
                })

                // setTimeout(() => {
                //     // 恢复默认container
                //     message.config({
                //         getContainer: () => document.body as HTMLElement,
                //     })
                // }, 6000)
            } else {
                setSampleDataLoading(false)
                formatError(e, microWidgetProps?.components?.toast)
            }
        }
    }

    // 库表有read权限才需要需要样例、合成数据
    const checkReadPermission = async (_viewId) => {
        try {
            cancelRequest(`/api/auth-service/v1/enforce`, 'post')
            const res = await policyValidate([
                {
                    action: PolicyActionEnum.Read,
                    object_id: _viewId,
                    object_type: AssetTypeEnum.DataView,
                    subject_id: userID,
                    subject_type: 'user',
                },
            ])

            const validateItem = (res || [])?.find(
                (o) => o.object_id === _viewId,
            )
            const isAllow = validateItem?.effect === 'allow'
            setAllowRead(isAllow)
        } catch (e) {
            const errCode = e?.data?.code || ''

            if (errCode === 'ERR_CANCELED') {
                return
            }
            formatError(e, microWidgetProps?.components?.toast)
        }
    }

    // 获取是否有整表权限
    const checkIsOwnedView = async (_viewId: string, rtype: AssetTypeEnum) => {
        try {
            setPermisLoading(true)
            cancelRequest(
                `/api/auth-service/v1/policy?object_id=${_viewId}&object_type=${rtype}`,
                'get',
            )
            if (isTrueRole) {
                setIsOwnedFullReadPermis(true)
                return
            }
            const res: IPolicyInfo = await policyDetail(_viewId, rtype)
            const owndUserIdList = res?.owner_id ? [res?.owner_id] : []
            res?.subjects?.forEach((item) => {
                const { subject_id } = item
                if (subject_id) {
                    owndUserIdList.push(subject_id)
                }
            })
            setIsOwnedFullReadPermis(owndUserIdList.includes(userID))
            // setPermissions(res?.subjects as any)
        } catch (e) {
            const errCode = e?.data?.code || ''

            if (errCode === 'ERR_CANCELED') {
                return
            }
            formatError(e, microWidgetProps?.components?.toast)
        } finally {
            setPermisLoading(false)
        }
    }

    const isSampleEmpty = useMemo(() => {
        return sampleOption === SampleOptionValue.Sample && isEmpty(sampleData)
    }, [sampleOption, sampleData])

    const isSynthEmpty = useMemo(() => {
        return (
            sampleOption === SampleOptionValue.Synthetic && isEmpty(synthData)
        )
    }, [sampleOption, synthData])

    useEffect(() => {
        loadData()
    }, [id])

    useEffect(() => {
        const curFormId = current?.form_view_id
        if (!curFormId || current?.hadSearch) return

        setViewInfoLoading(true)
        // setSampleDataLoading(true)
        checkReadPermission(curFormId)
        setSampleOption(SampleOptionValue.Sample)
        setAllowRead(undefined)
        setIsOwnedFullReadPermis(false)
        setFieldColumns([])
        setSampleData({})
        setSynthData({})
        // setViewInfo(undefined)
        setSampOrSynthError(undefined)
        checkIsOwnedView(curFormId, AssetTypeEnum.DataView)
        getLogicViewInfo(curFormId)
        // getSampleData(current?.form_view_id)
    }, [current])

    useEffect(() => {
        const curFormId = current?.form_view_id
        // if (!curFormId || !current?.hadSearch) return
        // 多次切换所选库表，去除非当前curFormId库表的请求
        if (viewInfo?.form_view_id && viewInfo?.form_view_id !== curFormId) {
            const [catalog, schema] =
                viewInfo?.view_source_catalog_name?.split('.') || []
            cancelRequest(
                `/api/virtual_engine_service/v1/preview/${catalog}/${schema}/${viewInfo?.technical_name}`,
                'get',
            )
            cancelRequest(
                `/api/data-view/v1/logic-view/${viewInfo?.form_view_id}/synthetic-data`,
                'get',
            )
        } else {
            // getSampleData(curFormId)
        }
    }, [current, viewInfo])

    useEffect(() => {
        if (
            current?.catalog_name &&
            current?.schema &&
            current?.technical_name &&
            current?.fields?.length &&
            typeof allowRead === 'boolean' &&
            !current?.hadSearch // 是否查询过样例数据
        ) {
            getSampleData(current?.form_view_id)
        }
    }, [current, allowRead])

    useUpdateEffect(() => {
        // 样例数据跟权限有关，跟ai无关,合成数据跟权限无关，跟ai有关
        // 切换radio，若数据为空则重新获取
        if (
            (sampleOption === SampleOptionValue.Sample &&
                isEmpty(sampleData)) ||
            (sampleOption === SampleOptionValue.Synthetic && isEmpty(synthData))
        ) {
            getSampleData(current?.form_view_id)
        }
    }, [sampleOption])

    const [fieldColumns, setFieldColumns] = useState<Array<any>>([])

    const onSampleOptionChange = (e) => {
        const { value } = e?.target || {}
        setSampOrSynthError('')
        setSampleOption(value)
    }

    const fieldsEmpty = (desc?: string, iconSrc?: any) => {
        if (sampOrSynthError) {
            if (sampOrSynthError === VIEWERRORCODElIST.VIEWDATAEMPTYERRCODE) {
                // 源表无任何数据信息，导致合成数据为空时
                return (
                    <Empty
                        iconSrc={dataEmpty}
                        desc={__('库表数据为空，不能生成合成数据')}
                    />
                )
            }
            // 加载失败
            return (
                <Empty
                    iconSrc={iconSrc || dataEmpty}
                    desc={
                        <Space direction="vertical" align="center" size={8}>
                            <div>{__('加载失败')}</div>
                            <div>
                                <a
                                    onClick={() =>
                                        getSampleData(current?.form_view_id)
                                    }
                                >
                                    {__('重新加载')}
                                </a>
                            </div>
                        </Space>
                    }
                />
            )
        }

        return <Empty iconSrc={iconSrc || dataEmpty} desc={desc} />
    }

    /**
     *
     * @param _fields 字段（包含名称、类型等）
     * @param _fieldsData 字段数据（样例数据/合成数据）
     * @returns
     */
    const renderSampleFields = (_fields) => {
        if (
            sampOrSynthError &&
            ![
                VIEWERRORCODElIST.VIEWDATAEMPTYERRCODE,
                VIEWERRORCODElIST.VIEWTABLEFIELD,
            ].includes(sampOrSynthError)
        ) {
            return fieldsEmpty()
        }
        return (
            <>
                {sampleOption === SampleOptionValue.Synthetic && (
                    <div className={styles.synthDataInfo}>
                        {__(
                            '合成数据由 AI 生成，不能作为真实数据使用，仅供参考。',
                        )}
                    </div>
                )}
                {_fields?.map((o, idx) => {
                    const showData =
                        sampleOption === SampleOptionValue.Sample
                            ? sampleData?.[o.technical_name]
                            : synthData?.[o.technical_name]
                    return (
                        <FieldItem
                            key={`${o?.id}-${idx}`}
                            item={o}
                            showTag={isGradeOpen}
                            isOwnedFullReadPermis={isOwnedFullReadPermis}
                            isSample={sampleOption === SampleOptionValue.Sample}
                            reqSmpOrSynthError={sampOrSynthError}
                            showData={showData}
                        />
                    )
                })}
            </>
        )
    }

    const viewItemRender = (item) => {
        return (
            <List.Item key={item.form_view_id} className={styles['list-item']}>
                <LogicItem
                    key={item.form_view_id}
                    item={item}
                    viewId={item.form_view_id}
                    isCheck={current?.form_view_id === item.form_view_id}
                    showBtn={isTrueRole}
                    onClick={() => {
                        if (fieldRef.current) {
                            fieldRef.current.scrollTop = 0
                        }
                        const { form_view_id, catalog_name, schema } = current
                        cancelRequest(
                            `/api/data-view/v1/form-view/${form_view_id}`,
                            'get',
                        )
                        cancelRequest(
                            `/api/data-view/v1/form-view/${form_view_id}/details`,
                            'get',
                        )
                        cancelRequest(
                            `/api/virtual_engine_service/v1/preview/${catalog_name}/${schema}/${viewInfo?.technical_name}`,
                            'get',
                        )
                        cancelRequest(
                            `/api/data-view/v1/logic-view/${current?.form_view_id}/synthetic-data`,
                            'get',
                        )
                        changeCurrent({ ...item, hadSearch: false })
                    }}
                />
            </List.Item>
        )
    }

    const changeCurrent = async (item) => {
        const cur = {
            ...item,
        }

        // 未加载字段
        if (cur?.fields === null) {
            try {
                const res: any = await getClassificationFields({
                    limit: 2000,
                    offset: 1,
                    id,
                    form_view_id: cur?.form_view_id,
                    open_hierarchy: isGradeOpen,
                })

                const fields = res?.entries?.[0]?.fields || []
                cur!.fields = fields

                setViewList((prev) =>
                    prev.map((o) => {
                        return o?.form_view_id === cur?.form_view_id ? cur : o
                    }),
                )
            } catch (error) {
                formatError(error)
            }
        }
        setCurrent(cur)
    }

    const onLoadViewMore = async (offset = 1) => {
        try {
            const ret: any = await getClassificationFields({
                ...condition,
                id,
                open_hierarchy: isGradeOpen,
                offset,
            })
            const views = (ret?.entries || []).map((o) => ({
                ...o,
                hadSearch: false,
            }))

            if (offset === 1) {
                setViewList(views)
            } else {
                setCondition((prev) => ({ ...prev, offset }))
                setViewList((prev) => [...prev, ...views])
            }
            setViewCount(ret?.total)
            if (offset === 1 && views?.length) {
                setViewTotal(ret?.total || 0)
                changeCurrent(views[0] || {})
            }
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div
            className={classnames({
                [styles['info-box']]: true,
                [styles.unClassify]:
                    !isGradeOpen || type === AssetNodeType.ATTRIBUTE,
                [styles.unExpandClassify]:
                    !(!isGradeOpen || type === AssetNodeType.ATTRIBUTE) &&
                    unExpand,
            })}
            id={viewInfoId}
            ref={viewInfoRef}
        >
            {loading && (
                <div
                    style={{ position: 'absolute', top: '70px', width: '100%' }}
                >
                    <Loader />
                </div>
            )}
            {!loading && !viewList?.length && (
                <div style={{ position: 'absolute', width: '100%' }}>
                    <Empty iconSrc={dataEmpty} desc="暂无数据" />
                </div>
            )}

            {!loading && viewList?.length > 0 && (
                <>
                    <div className={styles['info-box-left']}>
                        <div className={styles['title-label']}>
                            库表({viewCount || 0})
                        </div>
                        <div className={styles.list} id={ScrollViewId}>
                            <ViewScrollList
                                data={viewList}
                                scrollableTarget={ScrollViewId}
                                itemRender={viewItemRender}
                                hasMore={
                                    viewList !== undefined &&
                                    viewList?.length < viewTotal
                                }
                                onLoad={() => {
                                    onLoadViewMore(condition.offset + 1)
                                }}
                            />
                        </div>
                    </div>
                    <div className={styles['info-box-right']}>
                        <div className={styles['title-label']}>
                            字段({fieldColumns?.length || 0})
                        </div>
                        <div className={styles.list} ref={fieldRef}>
                            {current?.fields?.length ||
                            sampleDataLoading ||
                            permisLoading ||
                            viewInfoLoading ? (
                                <div className={styles.sampleDataWrapper}>
                                    {isTrueRole ? undefined : (
                                        <div
                                            className={
                                                styles.sampleDataHeaderWrapper
                                            }
                                            style={{
                                                marginBottom:
                                                    isOwnedFullReadPermis
                                                        ? '16px'
                                                        : '',
                                            }}
                                            hidden={permisLoading}
                                        >
                                            {isOwnedFullReadPermis ||
                                            isOwnedRelateFieldsReadPermis ? (
                                                <div
                                                    className={
                                                        styles.sampelDataTitle
                                                    }
                                                >
                                                    {__('字段样例数据')}
                                                </div>
                                            ) : (
                                                <Radio.Group
                                                    options={sampleOptions}
                                                    optionType="button"
                                                    onChange={
                                                        onSampleOptionChange
                                                    }
                                                    value={sampleOption}
                                                />
                                            )}
                                            <Tooltip
                                                title={
                                                    <div
                                                        className={
                                                            styles.infoTooltip
                                                        }
                                                    >
                                                        {isOwner ? (
                                                            <div
                                                                className={
                                                                    styles.sampleDataTipInfo
                                                                }
                                                            >
                                                                {__(
                                                                    '您是资源的数据Owner，可直接查看所有字段下的真实样例数据。',
                                                                )}
                                                            </div>
                                                        ) : isOwnedFullReadPermis ? (
                                                            <div
                                                                className={
                                                                    styles.sampleDataTipInfo
                                                                }
                                                            >
                                                                {__(
                                                                    '您有整个库表的权限，可直接查看所有字段下的真实样例数据。',
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div
                                                                    className={
                                                                        styles.sampleTitle
                                                                    }
                                                                >
                                                                    {__(
                                                                        '样例数据',
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.sampleIntro
                                                                    }
                                                                >
                                                                    {__(
                                                                        '用户对数据有读取或下载权限的部分，可查看真实的样例数据。',
                                                                    )}
                                                                </div>
                                                                {!isOwnedRelateFieldsReadPermis && (
                                                                    <>
                                                                        <div
                                                                            className={
                                                                                styles.sampleTitle
                                                                            }
                                                                        >
                                                                            {__(
                                                                                '合成数据',
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            className={
                                                                                styles.sampleIntro
                                                                            }
                                                                        >
                                                                            {__(
                                                                                '由 AI 生成，不能作为真实数据使用，仅供参考。数据权限不足时，可以通过查看合成数据来辅助判断是否要申请真实数据的权限。',
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                }
                                                color="#fff"
                                                overlayClassName={
                                                    styles.moreInfoTip
                                                }
                                                placement="bottomRight"
                                                // placement="bottom"
                                                getPopupContainer={(n) => n}
                                            >
                                                <InfotipOutlined
                                                    className={styles.infoIcon}
                                                />
                                            </Tooltip>
                                        </div>
                                    )}

                                    <div className={styles.fieldsWrapper}>
                                        {sampleDataLoading ||
                                        permisLoading ||
                                        viewInfoLoading ? (
                                            <div
                                                style={{
                                                    margin: '96px 0',
                                                }}
                                            >
                                                <Loader />
                                            </div>
                                        ) : (
                                            renderSampleFields(fieldColumns)
                                        )}
                                    </div>
                                </div>
                            ) : (
                                fieldsEmpty()
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default ViewInfo
