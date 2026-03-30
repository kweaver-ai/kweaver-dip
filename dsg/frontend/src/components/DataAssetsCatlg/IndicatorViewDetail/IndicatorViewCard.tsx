import { FC, useEffect, useState, useContext, useMemo } from 'react'
import { Col, Row, Space, Tabs, Tag, Tooltip } from 'antd'
import classnames from 'classnames'
import { noop } from 'lodash'
import {
    CaretDownOutlined,
    CloseOutlined,
    DownOutlined,
    UpOutlined,
} from '@ant-design/icons'
import { FontIcon, FullScreenOutlined } from '@/icons'
import CustomDrawer from '@/components/CustomDrawer'
import {
    AssetTypeEnum,
    HasAccess,
    IndictorDetail,
    formatError,
    getIndicatorDetail,
    getIndictorList,
    isMicroWidget,
    PolicyActionEnum,
    ResType,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import {
    IndicatorContentTabs,
    IndicatorContentType,
    IndicatorTypesList,
    IndicatorTypesText,
    viewCardBasicInfoList,
} from './helper'
import { Expand, Loader } from '@/ui'
import {
    getDateDisplay,
    getFieldTypeIcon,
    getOperationSignIcon,
} from '@/components/IndicatorManage/helper'
import IndicatorManagementOutlined from '@/icons/IndicatorManagementOutlined'
import {
    AllLimitListOptions,
    atomsExpressionRegx,
    atomsFuncRegx,
    changeFuncValues,
    compositeExpressionRegx,
    noContentLimit,
    TabsKey,
} from '@/components/IndicatorManage/const'
import { useCatalogColumn } from '@/components/DimensionModel/helper'
import { AssetType, CogAParamsType, MicroWidgetPropsContext } from '@/context'
import Editor, { getFormatSql } from '@/components/IndicatorManage/Editor'
import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getInnerUrl } from '@/utils'
import ApplyPolicy from '@/components/AccessPolicy/ApplyPolicy'
import { BizType, PolicyType } from '@/components/AuditPolicy/const'
import AccessIndicator from '@/components/AccessPolicy/components/AccessDetail/AccessIndicator'
import AccessModal from '@/components/AccessPolicy/AccessModal'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import OwnerDisplay from '@/components/OwnerDisplay'
import PermisApplyBtn from '../DataResc/PermisApplyBtn'
import { DataRescType } from '../ApplicationService/helper'
import { usePolicyCheck } from '@/hooks/usePolicyCheck'
import FavoriteOperation, {
    UpdateFavoriteParams,
} from '@/components/Favorite/FavoriteOperation'
import FeedbackOperation from '@/components/FeedbackResMode/operate/FeedbackOperation'

interface IRestrictView {
    relation: string
    member: any
}

// 初始params
const initialQueryParams: any = {
    offset: 1,
    limit: 2000,
    keyword: '',
}
const RestrictView: FC<IRestrictView> = ({ relation, member }) => {
    const [expand, setExpand] = useState<boolean>(true)
    return (
        <div className={styles.memberContainer}>
            <div className={styles.memberRelation}>
                <span
                    onClick={() => {
                        setExpand(!expand)
                    }}
                    className={classnames(
                        styles.expandBtn,
                        expand ? styles.expanded : styles.unExpand,
                    )}
                >
                    <CaretDownOutlined />
                </span>
                {relation && member?.length > 1
                    ? __('限定条件满足“${relation}”关系：', {
                          relation: relation === 'and' ? __('且') : __('或'),
                      })
                    : __('限定条件')}
            </div>

            {expand ? (
                <div className={styles.memberContent}>
                    <div className={styles.memberLineContainer}>
                        {member?.length > 1 ? (
                            <div className={styles.memberLine}>
                                <div className={styles.dot} />
                                <div className={styles.line} />
                                <div className={styles.dot} />
                            </div>
                        ) : (
                            ''
                        )}
                    </div>
                    <div className={styles.memberWrapper}>
                        {member?.map((currentField) => {
                            const fieldType =
                                currentField?.field?.date_type ||
                                currentField?.data_type
                            const name =
                                currentField?.field?.business_name ||
                                currentField?.name
                            return (
                                <div className={styles.memberItem}>
                                    <div className={styles.fieldsData}>
                                        <div className={styles.fieldInfo}>
                                            {/* 没有类型，不显示图标 */}
                                            {fieldType
                                                ? getFieldTypeIcon(fieldType)
                                                : null}
                                            <div
                                                className={styles.name}
                                                title={name}
                                            >
                                                {name}
                                            </div>
                                        </div>
                                        <div className={styles.operation}>
                                            {
                                                AllLimitListOptions.find(
                                                    (currentLimit) =>
                                                        currentLimit.value ===
                                                        currentField.operator,
                                                )?.label
                                            }
                                        </div>
                                    </div>
                                    <div
                                        className={styles.itemValue}
                                        hidden={noContentLimit.includes(
                                            currentField.operator,
                                        )}
                                    >
                                        <span
                                            className={styles.text}
                                            title={currentField.value}
                                        >
                                            {getDateDisplay(
                                                currentField.value,
                                                currentField?.operator,
                                                fieldType,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
interface IRestrictViewList {
    where: { relation: string; member: any[] }[]
}

export const RestrictViewList: FC<IRestrictViewList> = ({ where }) => {
    return (
        <div className={styles.restrictViewListContent}>
            {where?.map((currentMember, index) => {
                const { member, relation } = currentMember as any
                return (
                    <div>
                        <RestrictView
                            key={index}
                            relation={relation}
                            member={member}
                        />
                    </div>
                )
            })}
        </div>
    )
}

interface IIndicatorViewCard {
    open?: boolean

    indicatorId: string
    // operate: OperateType
    cardProps?: Record<string, any>
    onFullScreen: () => void
    onClose: (flag?: boolean) => void
    onSure: () => void
    allowRead?: boolean
    inAssetPanorama?: boolean // 在资产全景中
    // 添加收藏
    onAddFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    // 取消收藏
    onCancelFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    selectedResc?: any
}

const IndicatorViewCard: FC<IIndicatorViewCard> = ({
    open,
    // operate,
    indicatorId,
    cardProps,
    onFullScreen,
    onClose,
    onSure,
    allowRead,
    inAssetPanorama = false,
    onAddFavorite = noop,
    onCancelFavorite = noop,
    selectedResc,
}) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [indicatorInfo, setIndicatorInfo] = useState<IndictorDetail>()
    const { getColumnsById } = useCatalogColumn()
    const [factFields, setFactFields] = useState<Array<any>>([])
    const [indictorList, setIndictorList] = useState<Array<any>>([])
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [userInfo] = useCurrentUser()
    // 授权申请
    const [permissionRequestOpen, setPermissionRequestOpen] =
        useState<boolean>(false)
    // 授权
    const [accessOpen, setAccessOpen] = useState<boolean>(false)

    // const [hasAuditProcess] = useAuditProcess({
    //     audit_type: PolicyType.AssetPermission,
    //     service_type: BizType.AuthService,
    // })
    const isShowRequestPath = ['/data-assets', '/congnitive-search'].includes(
        getInnerUrl(window.location.pathname),
    )

    const { allowedActions, refreshPolicy } = usePolicyCheck(
        indicatorId,
        AssetTypeEnum.Indicator,
        {
            toast: microWidgetProps?.components?.toast,
        },
    )

    // 具备授权权限
    const canAuth = useMemo(() => {
        return (
            [PolicyActionEnum.Allocate, PolicyActionEnum.Auth].some((o) =>
                (allowedActions || []).includes(o),
            ) || indicatorInfo?.can_auth
        )
    }, [allowedActions, indicatorInfo?.can_auth])

    const isOwner = useMemo(() => {
        return (
            userInfo?.ID &&
            indicatorInfo?.owners?.some(
                (owner) => owner.owner_id === userInfo?.ID,
            )
        )
    }, [indicatorInfo, userInfo])

    const [activeKey, setActiveKey] = useState<IndicatorContentType>(
        IndicatorContentType.TECHNICAL,
    )
    const { checkPermissions } = useUserPermCtx()

    const hasBusinessRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )
    // useCogAsstContext 已移除，相关功能已下线

    useEffect(() => {
        if (indicatorId) {
            getIndictorDetails(indicatorId)
        }
    }, [indicatorId])

    const getIndictorDetails = async (id: string) => {
        try {
            setLoading(true)
            const indictorData = await getIndicatorDetail(id)
            if (indictorData.indicator_type === 'atomic') {
                const { data } = await getColumnsById(
                    indictorData?.fact_table_id || '',
                )
                setFactFields(data)
            }
            if (indictorData.indicator_type === 'composite') {
                const { entries, count } = await getIndictorList(
                    initialQueryParams,
                )
                setIndictorList(entries)
            }
            setIndicatorInfo(indictorData)
        } catch (ex) {
            formatError(ex, microWidgetProps?.components?.toast)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    /**
     * 基础详情显示
     * @param info
     * @returns
     */
    const renderParamsInfo = (info: any) => {
        const { key } = info
        const text = indicatorInfo?.[key]
        if (key === 'description') {
            return (
                <Expand
                    content={text || '--'}
                    expandTips={
                        <span className={styles.expBtn}>
                            {__('展开')}
                            <DownOutlined className={styles.expIcon} />
                        </span>
                    }
                    collapseTips={
                        <span className={styles.expBtn}>
                            {__('收起')}
                            <UpOutlined className={styles.expIcon} />
                        </span>
                    }
                />
            )
        }
        if (key === 'indicator_type') {
            return IndicatorTypesText[text] || '--'
        }

        return text || '--'
    }

    const getExpressionView = (indicatorData: IndictorDetail) => {
        const operationRegx = /^[+\-*/()]{1}$/
        if (indicatorData?.indicator_type === 'atomic') {
            const expressGroups =
                indicatorData?.expression?.match(atomsExpressionRegx) || []
            return (
                <div className={styles.expressionView}>
                    {expressGroups.map((currentData) => {
                        if (atomsFuncRegx.test(currentData)) {
                            const funcData = changeFuncValues(currentData)

                            const displayfield = factFields?.find(
                                (currentField) =>
                                    currentField.id ===
                                    funcData[1].replace(/[{}]/g, ''),
                            )
                            return (
                                <div className={styles.expressionFunc}>
                                    <span
                                        className={styles.funcName}
                                        title={funcData[0]}
                                    >
                                        {funcData[0]}
                                    </span>
                                    <span>(</span>
                                    {funcData[2] ? (
                                        <span>{funcData[2]}</span>
                                    ) : null}
                                    <div
                                        className={styles.selectNames}
                                        title={
                                            displayfield?.business_name || ''
                                        }
                                    >
                                        {displayfield?.business_name || ''}
                                    </div>
                                    <span>)</span>
                                </div>
                            )
                        }
                        return operationRegx.test(currentData) ? (
                            <div className={styles.textName}>
                                {getOperationSignIcon(currentData)}
                            </div>
                        ) : (
                            <div
                                className={styles.textName}
                                title={currentData}
                            >
                                {currentData}
                            </div>
                        )
                    })}
                </div>
            )
        }
        const expressGroups =
            indicatorData?.expression?.match(compositeExpressionRegx) || []

        return (
            <div className={styles.expressionView}>
                {expressGroups.map((currentData) => {
                    const findIndictor = indictorList.find(
                        (currentIndictor) =>
                            currentIndictor.id ===
                            currentData.replace(/[{}]/g, ''),
                    )
                    return findIndictor ? (
                        <div
                            className={styles.selectNames}
                            title={findIndictor.name}
                        >
                            {findIndictor.name}
                        </div>
                    ) : operationRegx.test(currentData) ? (
                        <div className={styles.textName}>
                            {getOperationSignIcon(currentData)}
                        </div>
                    ) : (
                        <div className={styles.textName} title={currentData}>
                            {currentData}
                        </div>
                    )
                })}
            </div>
        )
    }

    const getBizLimit = (info: any) => {
        if (info?.sub_type === 'sql') {
            return (
                <Editor
                    lineNumbers={false}
                    grayBackground
                    highlightActiveLine={false}
                    value={info?.sql_str}
                    editable={false}
                />
            )
        }

        if (info?.where?.[0]?.member) {
            return <RestrictViewList where={info?.where} />
        }
        return '--'
    }

    const getAttrTemplate = (itemData) => {
        switch (itemData.key) {
            case 'expression':
                return indicatorInfo?.expression ? (
                    indicatorInfo?.indicator_type === TabsKey.RECOMBINATION ? (
                        getExpressionView(indicatorInfo)
                    ) : (
                        <Editor
                            lineNumbers={false}
                            grayBackground
                            highlightActiveLine={false}
                            value={getFormatSql(indicatorInfo?.expression)}
                            editable={false}
                        />
                    )
                ) : (
                    '--'
                )
            case 'atomic_indicator_name':
                return (
                    <div className={styles.atomicIndictorName}>
                        <IndicatorManagementOutlined
                            style={{
                                fontSize: 24,
                            }}
                        />
                        <span className={styles.textName}>
                            {indicatorInfo?.atomic_indicator_name || '--'}
                        </span>
                    </div>
                )
            case 'time_restrict':
                return indicatorInfo?.where_info?.sub_type === 'view' ? (
                    <RestrictViewList
                        where={indicatorInfo?.where_info?.date_where}
                    />
                ) : (
                    '--'
                )
            case 'where_info':
                return indicatorInfo?.where_info
                    ? getBizLimit(indicatorInfo?.where_info)
                    : '--'

            case 'analysis_dimensions':
                return (
                    <div className={styles.viewAnalysisDimensions}>
                        <Expand
                            rows={5}
                            content={
                                indicatorInfo?.analysis_dimensions?.length
                                    ? indicatorInfo?.analysis_dimensions.map(
                                          (item) => (
                                              <Tooltip
                                                  title={
                                                      <div>
                                                          <div>
                                                              <span>
                                                                  {__(
                                                                      '业务名称：',
                                                                  )}
                                                              </span>
                                                              <span>
                                                                  {
                                                                      item.business_name
                                                                  }
                                                              </span>
                                                          </div>

                                                          <div>
                                                              <span>
                                                                  {__(
                                                                      '技术名称：',
                                                                  )}
                                                              </span>
                                                              <span>
                                                                  {
                                                                      item.technical_name
                                                                  }
                                                              </span>
                                                          </div>
                                                      </div>
                                                  }
                                                  color="#fff"
                                                  overlayInnerStyle={{
                                                      color: 'rgba(0,0,0,0.85)',
                                                  }}
                                              >
                                                  <Tag
                                                      icon={getFieldTypeIcon(
                                                          item.original_data_type,
                                                      )}
                                                      className={styles.tag}
                                                  >
                                                      <span
                                                          className={
                                                              styles.text
                                                          }
                                                      >
                                                          {item.business_name}
                                                      </span>
                                                  </Tag>
                                              </Tooltip>
                                          ),
                                      )
                                    : '--'
                            }
                            expandTips={
                                <span className={styles.expBtn}>
                                    {__('展开')}
                                    <DownOutlined className={styles.expIcon} />
                                </span>
                            }
                            collapseTips={
                                <span className={styles.expBtn}>
                                    {__('收起')}
                                    <UpOutlined className={styles.expIcon} />
                                </span>
                            }
                        />
                    </div>
                )
            case 'exec_sql':
                return indicatorInfo?.exec_sql ? (
                    <div
                        style={{
                            width: '100%',
                        }}
                    >
                        <Editor
                            grayBackground
                            lineNumbers={false}
                            highlightActiveLine={false}
                            style={{
                                maxHeight: 320,
                                overflow: 'auto',
                            }}
                            value={getFormatSql(indicatorInfo?.exec_sql)}
                            editable={false}
                            readOnly
                        />
                    </div>
                ) : (
                    '--'
                )
            default:
                return ''
        }
    }

    /**
     *
     */
    const getTechnicalAttrTemplate = () => {
        const isBizSqlStr = indicatorInfo?.where_info?.sub_type === 'sql'
        const technicalAttrs = indicatorInfo
            ? IndicatorTypesList?.[indicatorInfo?.indicator_type]
            : []
        if (indicatorInfo?.indicator_type === TabsKey.DERIVE && isBizSqlStr) {
            technicalAttrs.filter((current) => current.key !== 'time_restrict')
        }

        return technicalAttrs.map((current) => (
            <div>
                <div className={styles.labelText}>
                    {current.label}
                    <span
                        style={{
                            fontWeight: 'normal',
                        }}
                    >
                        {current.key === 'time_restrict'
                            ? `${
                                  indicatorInfo?.where_info?.date_where
                                      ?.length &&
                                  indicatorInfo?.where_info?.date_where
                                      ?.length > 1
                                      ? __('（每组间满足“${relation}”条件）', {
                                            relation:
                                                indicatorInfo?.where_info
                                                    ?.date_where_relation ===
                                                'or'
                                                    ? __('或')
                                                    : __('且'),
                                        })
                                      : ''
                              }`
                            : current.key === 'where_info' && !isBizSqlStr
                            ? `${
                                  indicatorInfo?.where_info?.where?.length &&
                                  indicatorInfo?.where_info?.where?.length > 1
                                      ? __('（每组间满足“${relation}”条件）', {
                                            relation:
                                                indicatorInfo?.where_info
                                                    ?.where_relation === 'or'
                                                    ? __('或')
                                                    : __('且'),
                                        })
                                      : ''
                              }`
                            : ''}
                    </span>
                </div>
                <div className={styles.contentContainer}>
                    {getAttrTemplate(current)}
                </div>
            </div>
        ))
    }

    const getContentTemplate = (type) => {
        switch (type) {
            case IndicatorContentType.TECHNICAL:
                return getTechnicalAttrTemplate()
            case IndicatorContentType.AUTH_POLICY:
                return (
                    <AccessIndicator
                        id={indicatorId}
                        type={AssetTypeEnum.Indicator}
                    />
                )
            default:
                return ''
        }
    }

    useEffect(() => {
        if (
            selectedResc?.service_info?.is_favored !==
                indicatorInfo?.is_favored ||
            selectedResc?.service_info?.favor_id !== indicatorInfo?.favor_id
        ) {
            setIndicatorInfo(
                indicatorInfo
                    ? {
                          ...indicatorInfo,
                          is_favored: selectedResc?.is_favored,
                          favor_id: selectedResc?.favor_id,
                      }
                    : undefined,
            )
        }
    }, [selectedResc])

    /** 收藏 */
    const handleFavoriteAdd = ({
        is_favored,
        favor_id,
    }: UpdateFavoriteParams) => {
        setIndicatorInfo(
            indicatorInfo
                ? {
                      ...indicatorInfo,
                      is_favored,
                      favor_id,
                  }
                : undefined,
        )
        onAddFavorite({ is_favored, favor_id })
    }

    //  取消收藏
    const handleFavoriteCancel = ({
        is_favored,
        favor_id,
    }: UpdateFavoriteParams) => {
        setIndicatorInfo(
            indicatorInfo
                ? {
                      ...indicatorInfo,
                      is_favored,
                      favor_id,
                  }
                : undefined,
        )
        onCancelFavorite({ is_favored, favor_id })
    }
    return (
        <div className={styles.indicatorViewCardWrapper}>
            <CustomDrawer
                open={open}
                destroyOnClose
                loading={loading}
                onCancel={onClose}
                onClose={() => onClose()}
                handleOk={onSure}
                // headerWidth="calc(100% - 40px)"
                isShowHeader={false}
                isShowFooter={false}
                customBodyStyle={{
                    flexDirection: 'column',
                    height: '100%',
                }}
                // className={bodyClassName}
                bodyStyle={{
                    // width: 417,
                    padding: 0,
                    // flexDirection: 'column',
                }}
                style={{
                    position: 'relative',
                    // width: 417,
                    right: '0',
                    height: '100%',
                }}
                {...cardProps}
                // customBodyStyle={{ height: 'calc(100% - 125px)' }}
                // title={viewInfo?.service_name || '--'}
            >
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <div className={styles.viewHeaderWrapper}>
                            <div
                                className={styles.viewTitle}
                                title={indicatorInfo?.name || '--'}
                            >
                                {indicatorInfo?.name || '--'}
                            </div>
                            <Space size={4} className={styles.headerBtnWrapper}>
                                {(isOwner || canAuth) &&
                                    (isShowRequestPath ||
                                        isMicroWidget({
                                            microWidgetProps,
                                        })) && (
                                        <Tooltip
                                            title={__('资源授权')}
                                            placement="bottom"
                                        >
                                            <FontIcon
                                                name="icon-shouquan"
                                                className={classnames(
                                                    styles.permissionIcon,
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setAccessOpen(true)
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                {/* {hasAuditProcess &&
                                    !isOwner &&
                                    (isShowRequestPath ||
                                        isMicroWidget({
                                            microWidgetProps,
                                        })) && (
                                        <Tooltip
                                            title={
                                                !hasBusinessRoles
                                                    ? __('为集成应用申请权限')
                                                    : __('权限申请')
                                            }
                                            placement="bottom"
                                        >
                                            <FontIcon
                                                name="icon-quanxianshenqing1"
                                                className={
                                                    styles.permissionIcon
                                                }
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setPermissionRequestOpen(
                                                        true,
                                                    )
                                                }}
                                            />
                                        </Tooltip>
                                    )} */}
                                <PermisApplyBtn
                                    id={indicatorId}
                                    type={DataRescType.INDICATOR}
                                    isOwner={isOwner}
                                    onApplyPermisClick={(flag?: boolean) =>
                                        setPermissionRequestOpen(true)
                                    }
                                />

                                {/* 引用资源提问按钮 */}
                                {/* {!inAssetPanorama && hasBusinessRoles && (
                                    <Tooltip
                                        placement="bottom"
                                        title={chatTip('normal', allowRead)}
                                        // getPopupContainer={(n) => n}
                                    >
                                        <FontIcon
                                            name="icon-yinyong1"
                                            className={classnames(
                                                styles.chatIcon,
                                              !allowRead  &&
                                                    styles.disableChat,
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (!allowRead || !llm) return
                                                updateParams(
                                                    CogAParamsType.Resource,
                                                    {
                                                        data: [
                                                            {
                                                                id: indicatorId,
                                                                name: indicatorInfo?.name,
                                                                type: AssetType.INDICATOR,
                                                                indicator_type:
                                                                    indicatorInfo?.indicator_type,
                                                            },
                                                        ],
                                                        op: 'add',
                                                        event: e,
                                                    },
                                                )
                                                onOpenAssistant()
                                            }}
                                        />
                                    </Tooltip>
                                )} */}
                                <FavoriteOperation
                                    item={indicatorInfo}
                                    className={styles.favoriteIcon}
                                    resType={ResType.Indicator}
                                    onAddFavorite={handleFavoriteAdd}
                                    onCancelFavorite={handleFavoriteCancel}
                                />
                                <FeedbackOperation
                                    item={indicatorInfo}
                                    resType={ResType.Indicator}
                                    className={styles.favoriteIcon}
                                />

                                <Tooltip
                                    title={__('进入全屏')}
                                    placement="bottom"
                                    getPopupContainer={(n) => n}
                                >
                                    <FullScreenOutlined
                                        className={styles.fullScreenIcon}
                                        onClick={onFullScreen}
                                    />
                                </Tooltip>
                                <Tooltip title={__('关闭')} placement="bottom">
                                    <CloseOutlined
                                        className={styles.closeIcon}
                                        onClick={() => {
                                            onClose()
                                        }}
                                    />
                                </Tooltip>
                            </Space>
                        </div>
                        <div className={styles.viewContentWrapper}>
                            <div className={styles.viewBasicInfoWrapper}>
                                <Space
                                    direction="vertical"
                                    wrap={false}
                                    style={{ width: '100%' }}
                                >
                                    <Row gutter={16}>
                                        {viewCardBasicInfoList?.map((info) => {
                                            const { key } = info
                                            const text = renderParamsInfo(info)
                                            const isDesc = key === 'description'

                                            return (
                                                <Col
                                                    span={info.span || 12}
                                                    key={info.key}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems:
                                                            'flex-start',
                                                        marginTop: 10,
                                                    }}
                                                >
                                                    <span
                                                        className={styles.label}
                                                    >
                                                        {info?.label}
                                                    </span>
                                                    {key === 'owners' ? (
                                                        <span
                                                            className={
                                                                styles.name
                                                            }
                                                        >
                                                            <OwnerDisplay
                                                                value={
                                                                    indicatorInfo?.owners
                                                                }
                                                            />
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={
                                                                isDesc
                                                                    ? styles.desc
                                                                    : styles.name
                                                            }
                                                            title={
                                                                isDesc
                                                                    ? indicatorInfo?.[
                                                                          key
                                                                      ]
                                                                    : text
                                                            }
                                                        >
                                                            {text}
                                                        </span>
                                                    )}
                                                </Col>
                                            )
                                        })}
                                    </Row>
                                </Space>
                            </div>
                            {/* <div className={styles.contentTitle}>
                                <div className={styles.titleIconWrapper}>
                                    <div className={styles.left} />
                                    <div className={styles.right} />
                                </div>
                                <div className={styles.textName}>
                                    {__('技术属性')}
                                </div>
                            </div> */}
                            {/* <div className={styles.splitLine} /> */}
                            <Tabs
                                activeKey={activeKey}
                                items={IndicatorContentTabs}
                                onChange={(e) =>
                                    setActiveKey(e as IndicatorContentType)
                                }
                                getPopupContainer={(node) => node}
                                tabBarGutter={32}
                                className={styles.viewContentTab}
                            />
                            <div className={styles.viewContentAttrWrapper}>
                                {getContentTemplate(activeKey)}
                            </div>
                        </div>
                    </>
                )}
            </CustomDrawer>

            {/* 权限申请 */}
            {accessOpen && (
                <AccessModal
                    id={indicatorId}
                    type={AssetTypeEnum.Indicator}
                    onClose={(needRefresh) => {
                        setAccessOpen(false)
                        if (needRefresh) {
                            refreshPolicy()
                            getIndictorDetails(indicatorId)
                        }
                    }}
                    indicatorType={indicatorInfo?.indicator_type}
                />
            )}
            {/* 权限申请 */}
            {permissionRequestOpen && (
                <ApplyPolicy
                    id={indicatorId}
                    onClose={() => {
                        setPermissionRequestOpen(false)
                    }}
                    type={AssetTypeEnum.Indicator}
                    indicatorType={indicatorInfo?.indicator_type}
                />
            )}
        </div>
    )
}

export default IndicatorViewCard
