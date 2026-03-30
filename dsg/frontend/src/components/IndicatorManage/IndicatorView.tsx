import {
    CloseOutlined,
    ExclamationCircleFilled,
    RightOutlined,
} from '@ant-design/icons'
import {
    Anchor,
    Button,
    Collapse,
    Drawer,
    Form,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
} from 'antd'
import moment from 'moment'
import React, { useState, FC, useEffect, useRef } from 'react'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import {
    CreateItems,
    IndicatorInfoGroup,
    IndicatorTypes,
    TabsKey,
    atomsExpressionRegx,
    atomsFuncRegx,
    changeFormatToType,
    changeFuncValues,
    compositeExpressionRegx,
    fieldInfos,
    updateCycle,
    BusinessDomainType,
} from './const'
import {
    formatError,
    getCoreBusinessIndicatorDetail,
    getIndicatorDetail,
    getIndictorList,
} from '@/core'
import {
    getDateDisplay,
    getFieldTypeIcon,
    getOperationSignIcon,
} from './helper'
import { useCatalogColumn } from '../DimensionModel/helper'
import Detail from '../BusinessModeling/CoreBusinessIndicator/Detail'
import { GlossaryIcon } from '@/components/BusinessDomain/GlossaryIcons'
import ArchitectureIcons from '@/components/BusinessArchitecture/Icons'
import { Architecture } from '@/components/BusinessArchitecture/const'
import { AvatarOutlined, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import Editor, { getFormatSql } from './Editor'
import OwnerDisplay from '@/components/OwnerDisplay'

// 初始params
const initialQueryParams: any = {
    offset: 1,
    limit: 100,
    keyword: '',
}
interface IndicatorViewType {
    IndicatorId: string
    type: TabsKey
    onClose: () => void
    isConsanguinity?: boolean
    style?: React.CSSProperties
    mask?: boolean
}
const IndicatorView: FC<IndicatorViewType> = ({
    IndicatorId,
    type,
    onClose,
    isConsanguinity = false,
    mask = false,
    style = { position: 'absolute', top: '10px', height: 'calc(100% -10px)' },
}) => {
    const [detailData, setDetailData] = useState<any>({})
    const [loading, setLoading] = useState<boolean>(false)
    const [column, setColumn] = useState<Array<any>>([])
    const [viewData, setViewData] = useState<Array<any>>([])
    const [factFields, setFactFields] = useState<Array<any>>([])
    const [indictorList, setIndictorList] = useState<Array<any>>([])
    const bodyContainer: any = useRef(null)
    const [viewLoading, setViewLoading] = useState<boolean>(false)
    const { getColumnsById } = useCatalogColumn()

    const [viewBusinessIndicator, setViewBusinessIndicator] =
        useState<string>('')
    const [businessIndictorExist, setBusinessIndictorExist] =
        useState<boolean>(true)

    const container = useRef<any>(null)
    const anchorRef = useRef<any>(null)
    const { Link } = Anchor

    useEffect(() => {
        getIndictorDetails(IndicatorId)

        if (bodyContainer?.current?.scrollTop) {
            bodyContainer.current.scrollTop = 0
        }
        setViewBusinessIndicator('')
    }, [IndicatorId])

    const getIndictorDetails = async (id: string) => {
        try {
            setLoading(true)
            const indictorData = await getIndicatorDetail(id)
            setDetailData(indictorData)
            if (indictorData.indicator_type === TabsKey.ATOMS) {
                const { data } = await getColumnsById(
                    indictorData?.fact_table_id || '',
                )
                setFactFields(data)
            }
            if (indictorData.indicator_type === TabsKey.RECOMBINATION) {
                const { entries, count } = await getIndictorList(
                    initialQueryParams,
                )
                setIndictorList(entries)
            }
            // getPreViewData(indictorData)
            getCurrentBusinessDataDetail(indictorData.business_indicator_id)
        } catch (ex) {
            formatError(ex)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const getCurrentBusinessDataDetail = async (id) => {
        try {
            const detail = await getCoreBusinessIndicatorDetail(id)
            setBusinessIndictorExist(true)
        } catch (err) {
            if (
                err.data.code ===
                'BusinessGrooming.Indicator.RecordNotFoundError'
            ) {
                setBusinessIndictorExist(false)
            } else {
                formatError(err)
            }
        }
    }

    const tableLabels = {
        name: __('指标名称'),
        indicator_type: __('指标类型'),
        business_indicator_name: __('关联业务指标'),
        code: __('编码'),
        level: __('指标等级'),
        indicator_unit: __('指标单位'),
        domain_name: __('主题域'),
        description: __('指标定义'),
        // dimensional_model_name: __('关联维度模型'),
        refer_view_name: __('关联库表'),
        expression: __('表达式'),
        time_restrict: __('时间限定'),
        modifier_restrict: __('普通限定'),
        where_info: __('业务限定'),
        atomic_indicator_name: __('依赖原子指标'),
        creator_name: __('创建人'),
        created_at: __('创建时间'),
        updater_name: __('更新人'),
        updated_at: __('更新时间'),
        update_cycle: __('更新周期'),
        owners: __('数据Owner'),
        management_department_name: __('组织架构'),
        analysis_dimensions: __('分析维度'),
        exec_sql: __('SQL'),
        date_mark: __('日期时间标识'),
    }

    const getViewIndictTitle = (currentType) => {
        switch (currentType) {
            case TabsKey.ATOMS:
                return __('原子指标详情')
            case TabsKey.DERIVE:
                return __('衍生指标详情')
            case TabsKey.RECOMBINATION:
                return __('复合指标详情')
            default:
                return ''
        }
    }

    const getGroupElementData = ({
        title = '',
        viewKeys = [],
        currentKey,
        id,
    }: {
        title: string
        viewKeys: Array<string>
        currentKey: IndicatorInfoGroup
        id: string
    }) => {
        return (
            // <Panel
            //     header={}
            //     key={currentKey}
            //     collapsible="icon"
            // >

            // </Panel>
            <div className={styles.viewTableContainer} id={id}>
                <div className={styles.continerTitle}>{title}</div>
                {getViewTableCompont(viewKeys)}
            </div>
        )
    }

    const getViewTableCompont = (keys: Array<string> = []) => {
        let viewKeys = keys

        if (
            detailData?.indicator_type === TabsKey.DERIVE &&
            detailData?.where_info?.sub_type === 'sql'
        ) {
            viewKeys = viewKeys?.filter((cur) => cur !== 'time_restrict')
        }

        return (
            <table className={styles.viewTable}>
                {viewKeys.map((currentKey) => (
                    <tr>
                        <td
                            className={styles.tableTd}
                            style={{ background: '#f4f7fc' }}
                        >
                            <div className={styles.leftContent}>
                                {tableLabels[currentKey]}
                            </div>
                        </td>
                        <td className={styles.tableTd}>
                            <div className={styles.rightContent}>
                                {getViewContent(currentKey)}
                            </div>
                        </td>
                    </tr>
                ))}
            </table>
        )
    }

    const getBizLimit = (info: any) => {
        if (info?.sql_str) {
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
            return getRestrictView(
                detailData?.where_info?.where,
                detailData?.where_info?.where_relation,
            )
        }
        return '--'
    }

    // 获取预览内容
    const getViewContent = (viewKey) => {
        switch (viewKey) {
            case 'indicator_type':
                return IndicatorTypes[detailData[viewKey]]
            case 'business_indicator_name':
                return detailData[viewKey] ? (
                    <div className={styles.businessInfo}>
                        <div
                            onClick={() => {
                                if (businessIndictorExist) {
                                    setViewBusinessIndicator(
                                        detailData.business_indicator_id,
                                    )
                                }
                            }}
                            className={classnames(
                                styles.name,
                                businessIndictorExist ? '' : styles.nameDisable,
                            )}
                            title={detailData[viewKey]}
                        >
                            {detailData[viewKey]}
                        </div>
                        <Tooltip
                            title={
                                businessIndictorExist
                                    ? ''
                                    : __('关联业务指标已被删除。')
                            }
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                            }}
                            color="#fff"
                        >
                            <ExclamationCircleFilled
                                className={styles.errorIcon}
                                hidden={businessIndictorExist}
                            />
                        </Tooltip>
                    </div>
                ) : (
                    '--'
                )
            case 'updated_at':
                return moment(detailData.updated_at).format(
                    'YYYY-MM-DD HH:mm:ss',
                )
            case 'created_at':
                return moment(detailData.created_at).format(
                    'YYYY-MM-DD HH:mm:ss',
                )
            case 'expression':
                return detailData[viewKey] ? (
                    type === TabsKey.RECOMBINATION ? (
                        getExpressionView()
                    ) : (
                        <Editor
                            lineNumbers={false}
                            grayBackground
                            highlightActiveLine={false}
                            value={getFormatSql(detailData[viewKey])}
                            editable={false}
                        />
                    )
                ) : (
                    '--'
                )

            case 'exec_sql':
                return detailData[viewKey] ? (
                    <div
                        style={{
                            width: '100%',
                        }}
                    >
                        <Editor
                            lineNumbers={false}
                            highlightActiveLine={false}
                            style={{
                                maxHeight: 320,
                                overflow: 'auto',
                            }}
                            value={getFormatSql(detailData[viewKey])}
                            editable={false}
                            readOnly
                        />
                    </div>
                ) : (
                    '--'
                )
            case 'update_cycle':
                return (
                    updateCycle?.find(
                        (item) => item.value === detailData[viewKey],
                    )?.label || '--'
                )

            case 'description':
                return (
                    detailData[viewKey] || (
                        <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                            {__('暂无描述')}
                        </span>
                    )
                )
            case 'refer_view_name':
                return detailData[viewKey] ? (
                    <div title={detailData[viewKey]}>{detailData[viewKey]}</div>
                ) : (
                    '--'
                )
            case 'date_mark':
                return (
                    <div
                        className={styles.dateMark}
                        title={detailData[viewKey]?.business_name}
                    >
                        {detailData[viewKey]?.business_name &&
                            getFieldTypeIcon(
                                detailData[viewKey]?.original_data_type,
                            )}

                        <div>{detailData[viewKey]?.business_name || '--'}</div>
                    </div>
                )
            case 'time_restrict':
                return detailData?.where_info?.sub_type === 'view'
                    ? getRestrictView(
                          detailData?.where_info?.date_where,
                          detailData?.where_info?.date_where_relation,
                      )
                    : '--'
            case 'where_info':
                return detailData[viewKey]
                    ? getBizLimit(detailData[viewKey])
                    : '--'
            case 'domain_name':
                return (
                    <div>
                        {detailData[viewKey] ? (
                            <>
                                {detailData.domain_path_id.split('/').length ===
                                3 ? (
                                    <FontIcon
                                        name="icon-L3"
                                        type={IconType.COLOREDICON}
                                        style={{
                                            marginRight: '4px',
                                            fontSize: '20px',
                                            color: '#14CEAA',
                                            lineHeight: '20px',
                                        }}
                                    />
                                ) : (
                                    <GlossaryIcon
                                        width="20px"
                                        type={BusinessDomainType.subject_domain}
                                        fontSize="20px"
                                        styles={{ marginRight: '4px' }}
                                    />
                                )}

                                <span className={styles.textCont}>
                                    {detailData[viewKey]}
                                </span>
                            </>
                        ) : (
                            '--'
                        )}
                    </div>
                )
            case 'management_department_name':
                return (
                    <div className={classnames(styles.ownerItem)}>
                        {detailData[viewKey] ? (
                            <Space>
                                <ArchitectureIcons
                                    type={Architecture.DEPARTMENT}
                                />
                                <span>{detailData[viewKey]}</span>
                            </Space>
                        ) : (
                            '--'
                        )}
                    </div>
                )
            case 'analysis_dimensions':
                return (
                    <div
                        className={styles.viewAnalysisDimensions}
                        style={{ padding: '12px 0' }}
                    >
                        {detailData?.analysis_dimensions?.length
                            ? detailData.analysis_dimensions.map((item) => (
                                  <Tooltip
                                      title={
                                          <div>
                                              <div>
                                                  <span>
                                                      {__('业务名称：')}
                                                  </span>
                                                  <span>
                                                      {item.business_name}
                                                  </span>
                                              </div>

                                              <div>
                                                  <span>
                                                      {__('技术名称：')}
                                                  </span>
                                                  <span>
                                                      {item.technical_name}
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
                                          <span className={styles.text}>
                                              {item.business_name}
                                          </span>
                                      </Tag>
                                  </Tooltip>
                              ))
                            : '--'}
                    </div>
                )
            case 'owners':
                return <OwnerDisplay value={detailData[viewKey]} />
            default:
                return detailData[viewKey] || '--'
        }
    }

    // const getViewUpdateAndTime = (info, key) => {
    //     const times = key === 'update' ? info.updated_at : info.created_at
    //     const userName =
    //         key === 'update' ? info.updater_name : info.creator_name
    //     return (
    //         <div>
    //             <div>{userName}</div>
    //             <div>{moment(times).format('YYYY-MM-DD HH:mm:ss')}</div>
    //         </div>
    //     )
    // }
    const getExpressionView = () => {
        const operationRegx = /^[+\-*/()]{1}$/

        const expressGroups =
            detailData?.expression?.match(compositeExpressionRegx) || []

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

    const getRestrictView = (where, where_relation) => {
        const members = where || []
        return (
            <div className={styles.restrictViewContent}>
                {members.map((currentMember, index) => {
                    const { member, relation } = currentMember
                    return (
                        <div>
                            <div className={styles.member}>
                                {relation ? (
                                    <div className={styles.memberRelation}>
                                        {relation === 'and'
                                            ? __('且')
                                            : __('或')}
                                    </div>
                                ) : null}
                                <div className={styles.memberContent}>
                                    {member.map((currentField) => {
                                        return (
                                            <div className={styles.memberItem}>
                                                <div
                                                    className={
                                                        styles.fieldsData
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.fieldInfo
                                                        }
                                                    >
                                                        {getFieldTypeIcon(
                                                            currentField?.field
                                                                ?.date_type,
                                                        )}
                                                        <div
                                                            className={
                                                                styles.name
                                                            }
                                                            title={
                                                                currentField
                                                                    ?.field
                                                                    ?.business_name
                                                            }
                                                        >
                                                            {
                                                                currentField
                                                                    ?.field
                                                                    ?.business_name
                                                            }
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        (
                                                        {
                                                            fieldInfos[
                                                                changeFormatToType(
                                                                    currentField
                                                                        ?.field
                                                                        ?.date_type,
                                                                )
                                                            ]?.limitListOptions?.find(
                                                                (
                                                                    currentLimit,
                                                                ) =>
                                                                    currentLimit.value ===
                                                                    currentField.operator,
                                                            )?.label
                                                        }
                                                        )
                                                    </div>
                                                </div>
                                                <div
                                                    className={styles.itemValue}
                                                    title={currentField.value}
                                                >
                                                    {getDateDisplay(
                                                        currentField.value,
                                                        currentField.operator,
                                                        currentField?.field
                                                            ?.date_type,
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            {
                                // todo 接口联调的时候适配
                                members.length > 1 &&
                                index < members.length - 1 ? (
                                    <div className={styles.releation}>
                                        <div className={styles.line} />
                                        <div className={styles.operation}>
                                            {where_relation === 'and'
                                                ? __('且')
                                                : __('或')}
                                        </div>
                                        <div className={styles.line} />
                                    </div>
                                ) : null
                            }
                        </div>
                    )
                })}
            </div>
        )
    }

    const getTechnicalAttrKey = (currentType) => {
        switch (currentType) {
            case TabsKey.ATOMS:
                return [
                    'refer_view_name',
                    'date_mark',
                    'analysis_dimensions',
                    'expression',
                    'exec_sql',
                ]
            case TabsKey.DERIVE:
                return [
                    'update_cycle',
                    'atomic_indicator_name',
                    'analysis_dimensions',
                    'time_restrict',
                    'where_info',
                    'exec_sql',
                ]
            default:
                return [
                    'update_cycle',
                    'analysis_dimensions',
                    'expression',
                    'exec_sql',
                ]
        }
    }

    // const getPreViewData = async (detailInfo) => {
    //     try {
    //         const {
    //             indicator_type,
    //             expression,
    //             time_restrict,
    //             modifier_restrict,
    //             created_at,
    //             atomic_indicator_id,
    //             atomic_indicator_name,
    //             creator_name,
    //             creator_uid,
    //             dimensional_model_id,
    //             dimensional_model_name,
    //             domain_name,
    //             domain_path_id,
    //             fact_table_id,
    //             id,
    //             refer_count,
    //             updater_uid,
    //             updater_name,
    //             updated_at,
    //             ...restParams
    //         } = detailInfo
    //         setViewLoading(true)
    //         if (type === TabsKey.ATOMS) {
    //             const { columns, data } = await runAtomicIndicator({
    //                 ...restParams,
    //                 dimensional_model_id,
    //                 expression,
    //                 type: indicator_type,
    //             })
    //             setViewData(data)
    //             setColumn(
    //                 columns.map((currentData) => ({
    //                     title: (
    //                         <div
    //                             title={currentData.name}
    //                             className={styles.tableTrContainer}
    //                         >
    //                             <div className={styles.itemTitle}>
    //                                 {currentData.name}
    //                             </div>
    //                         </div>
    //                     ),
    //                 })),
    //             )
    //         } else if (indicator_type === TabsKey.DERIVE) {
    //             const { columns, data } = await runDerivedIndicator({
    //                 ...restParams,
    //                 time_restrict,
    //                 modifier_restrict,
    //                 atomic_indicator_id,
    //             })
    //             setViewData(data)
    //             setColumn(
    //                 columns.map((currentData) => ({
    //                     title: (
    //                         <div
    //                             title={currentData.name}
    //                             className={styles.tableTrContainer}
    //                         >
    //                             <div className={styles.itemTitle}>
    //                                 {currentData.name}
    //                             </div>
    //                         </div>
    //                     ),
    //                 })),
    //             )
    //         } else {
    //             const { columns, data } = await runCompositeIndicator({
    //                 ...restParams,
    //                 expression,
    //             })
    //             setViewData(data)
    //             setColumn(
    //                 columns.map((currentData) => ({
    //                     title: (
    //                         <div
    //                             title={currentData.name}
    //                             className={styles.tableTrContainer}
    //                         >
    //                             <div className={styles.itemTitle}>
    //                                 {currentData.name}
    //                             </div>
    //                         </div>
    //                     ),
    //                 })),
    //             )
    //         }
    //     } catch (ex) {
    //         if (!ex?.errorFields) {
    //             formatError(ex)
    //         }
    //     } finally {
    //         setViewLoading(false)
    //     }
    // }

    useEffect(() => {
        if (anchorRef.current) {
            const linkDom = anchorRef.current.querySelector(
                '.any-fabric-ant-anchor-link-title',
            )
            // 不知道什么原因，临时处理一下
            linkDom?.click()
        }
    }, [anchorRef.current])

    return (
        <div
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
        >
            <Drawer
                width={640}
                title={
                    isConsanguinity ? (
                        <div
                            className={styles.editFieldTitle}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                        >
                            <div className={styles.editTitle}>
                                <span
                                    onClick={() => {
                                        onClose()
                                    }}
                                    className={styles.icon}
                                >
                                    <RightOutlined />
                                </span>
                                <span>{__('收起指标详情')}</span>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={styles.editFieldTitle}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                        >
                            <div className={styles.editTitle}>
                                {getViewIndictTitle(type)}
                            </div>
                            <div className={styles.closeButton}>
                                <CloseOutlined
                                    onClick={() => {
                                        onClose()
                                    }}
                                />
                            </div>
                        </div>
                    )
                }
                placement="right"
                closable={false}
                onClose={() => {
                    onClose()
                }}
                mask={mask}
                open
                getContainer={false}
                style={style}
                className={styles.nodeConfigWrapper}
                footer={null}
                destroyOnClose
                bodyStyle={{
                    padding: '4px 0 24px 24px',
                }}
                push={{ distance: 0 }}
            >
                <div ref={container} className={styles.configViewWrapper}>
                    <div className={styles.formContainer}>
                        {loading ? (
                            <div className={styles.viewloading}>
                                <Spin />
                            </div>
                        ) : (
                            <div
                                className={styles.viewBody}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                }}
                                ref={bodyContainer}
                            >
                                {[
                                    {
                                        title: __('基本属性'),
                                        viewKey: [
                                            'name',
                                            'indicator_type',
                                            'business_indicator_name',
                                            'code',
                                            'level',
                                            'indicator_unit',
                                            'description',
                                        ],
                                        key: IndicatorInfoGroup.BASICINFO,
                                        id: 'view-indictor-definition',
                                    },
                                    {
                                        title: __('管理属性'),
                                        viewKey: [
                                            'domain_name',
                                            'management_department_name',
                                            'owners',
                                            'creator_name',
                                            'created_at',
                                            'updater_name',
                                            'updated_at',
                                        ],
                                        key: IndicatorInfoGroup.MANAGEATTR,
                                        id: 'view-indicator-manager',
                                    },
                                    {
                                        title: __('技术属性'),
                                        viewKey: getTechnicalAttrKey(type),
                                        key: IndicatorInfoGroup.TECHNICALATTR,
                                        id: 'view-develop-config',
                                    },
                                ].map((currentData) =>
                                    getGroupElementData({
                                        title: currentData.title,
                                        viewKeys: currentData.viewKey,
                                        currentKey: currentData.key,
                                        id: currentData.id,
                                    }),
                                )}

                                {/* <div
                                    className={styles.viewTableContainer}
                                    id="view-data-preview"
                                >
                                    <div className={styles.continerTitle}>
                                        <div className={styles.dataViewBar}>
                                            <div>
                                                <span
                                                    style={{
                                                        fontWeight: '550',
                                                    }}
                                                >
                                                    {__('数据预览')}
                                                </span>
                                            </div>
                                            <div>
                                                <RefreshBtn
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        getPreViewData(
                                                            detailData,
                                                        )
                                                    }}
                                                    tips={__('刷新数据')}
                                                />
                                            </div>
                                        </div>
                                        {viewLoading ? (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Spin />
                                            </div>
                                        ) : viewData?.length ? (
                                            <Table
                                                columns={column}
                                                dataSource={viewData}
                                                pagination={false}
                                                style={{
                                                    width: 502,
                                                }}
                                                scroll={{ x: 'max-content' }}
                                            />
                                        ) : (
                                            <div
                                                className={styles.viewDataEmpty}
                                            >
                                                {__('暂无数据')}
                                            </div>
                                        )}
                                    </div>
                                    {viewLoading ? (
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Spin />
                                        </div>
                                    ) : viewData?.length ? (
                                        <Table
                                            columns={column}
                                            dataSource={viewData}
                                            pagination={false}
                                            style={{
                                                width: 502,
                                            }}
                                            scroll={{ x: 'max-content' }}
                                        />
                                    ) : (
                                        <div className={styles.viewDataEmpty}>
                                            {__('暂无数据')}
                                        </div>
                                    )}
                                </div> */}
                                {/* <Panel
                                        header={
                                         
                                        }
                                        key={IndicatorInfoGroup.DATAVIEW}
                                        collapsible="icon"
                                    >
                                     
                                    </Panel> */}
                            </div>
                        )}
                    </div>
                    <div className={styles.menuContainer} ref={anchorRef}>
                        <Anchor
                            targetOffset={160}
                            getContainer={() =>
                                (container.current as HTMLElement) || window
                            }
                            className={styles.anchorWrapper}
                            onClick={(e: any) => {
                                e.preventDefault()
                            }}
                        >
                            <Link
                                href="#view-indictor-definition"
                                title={__('基本属性')}
                            />
                            <Link
                                href="#view-indicator-manager"
                                title={__('管理属性')}
                            />
                            <Link
                                href="#view-develop-config"
                                title={__('技术属性')}
                            />
                        </Anchor>
                    </div>

                    {viewBusinessIndicator && (
                        <Detail
                            id={viewBusinessIndicator}
                            onClose={() => {
                                setViewBusinessIndicator('')
                            }}
                            style={{ position: 'absolute', top: 0 }}
                        />
                    )}
                </div>
            </Drawer>
        </div>
    )
}

export default IndicatorView
