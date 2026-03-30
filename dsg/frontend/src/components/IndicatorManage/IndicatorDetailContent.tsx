/* eslint-disable no-param-reassign */
import { useEffect, useState, useRef, FC, useContext } from 'react'
import { Tooltip, Anchor, Tag } from 'antd'
import classnames from 'classnames'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { useGetState } from 'ahooks'
import { find, noop } from 'lodash'
import moment from 'moment'
import dataEmpty from '@/assets/dataEmpty.svg'
import { FontIcon } from '@/icons'
import { getActualUrl, OperateType } from '@/utils'
import {
    formatError,
    getIndicatorDetail,
    getIndictorList,
    LoginPlatform,
} from '@/core'

import styles from './styles.module.less'
import DetailsLabel from '../../ui/DetailsLabel'
import { GlossaryIcon } from '@/components/BusinessDomain/GlossaryIcons'
import __ from './locale'
import {
    businessDetailInfo,
    manageDetailInfo,
    technologyDetailInfo,
    TabsKey,
    BusinessDomainType,
    IndicatorTypes,
    changeFormatToType,
    compositeExpressionRegx,
    fieldInfos,
    updateCycle,
    ROW_HEIGHT,
    ROW_MARGIN,
    IndicatorDetailTabKey,
    IndicatorType,
} from './const'
import {
    countCharacters,
    getDateDisplay,
    getFieldTypeIcon,
    getOperationSignIcon,
} from './helper'

import ArchitectureIcons from '@/components/BusinessArchitecture/Icons'
import { Architecture } from '@/components/BusinessArchitecture/const'

import { useCatalogColumn } from '../DimensionModel/helper'
import Detail from '@/components/BusinessModeling/CoreBusinessIndicator/Detail'
import IndicatorView from './IndicatorView'
import { IconType } from '@/icons/const'
import { Empty, Loader } from '@/ui'
import { TaskInfoContext } from '@/context'
import Editor, { getFormatSql } from './Editor'
import OwnerDisplay from '../OwnerDisplay'
// 初始params
const initialQueryParams: any = {
    offset: 1,
    limit: 2000,
    keyword: '',
}

interface IIndicatorDetailContent {
    indicatorId: string
    indicatorType: TabsKey | string
    isMarket?: boolean
    onEdit?: () => void
    allowJump?: boolean
    navigateJumpToPage?: (url) => void
}

// 页面路径中获取参数
const IndicatorDetailContent: FC<IIndicatorDetailContent> = ({
    indicatorId,
    indicatorType,
    isMarket = false,
    allowJump = true,
    navigateJumpToPage = noop,
    onEdit = noop,
}) => {
    const container = useRef<any>(null)
    const { Link } = Anchor

    const [active, setActive] = useState<IndicatorDetailTabKey>(
        IndicatorDetailTabKey.Detail,
    )

    const [detailData, setDetailData, getCurrentDetailData] = useGetState<any>(
        {},
    )
    const [loading, setLoading] = useState<boolean>(false)
    const [
        businessDetailContent,
        setBusinessDetailContent,
        getBusinessDetailContent,
    ] = useGetState(businessDetailInfo)
    const [
        manageDetailContent,
        setManageDetailContent,
        getManageDetailContent,
    ] = useGetState(manageDetailInfo)
    const [technologyDetailContent, setTechnologyDetailContent] = useState(
        technologyDetailInfo[indicatorType] || [],
    )
    const [indictorList, setIndictorList, getCurrentIndictorList] = useGetState<
        Array<any>
    >([])
    const [dimensionModel, setDimensionModel, getDimensionModel] = useGetState<
        Array<any>
    >([])
    const [businessIndictorExist, setBusinessIndictorExist] =
        useState<boolean>(true)
    const [viewBusinessIndicator, setViewBusinessIndicator] =
        useState<string>('')

    const { getColumnsById } = useCatalogColumn()
    const [factFields, setFactFields, getFactFields] = useGetState<Array<any>>(
        [],
    )
    const { taskInfo } = useContext(TaskInfoContext)
    useEffect(() => {
        if (indicatorId) {
            getIndictorDetails(indicatorId)
        }
    }, [indicatorId, indicatorType])

    const getIndictorDetails = async (id: string) => {
        try {
            setLoading(true)
            const indictorData: any = await getIndicatorDetail(id)
            setDetailData(indictorData)
            if (indictorData.indicator_type === TabsKey.ATOMS) {
                const { data } = await getColumnsById(
                    indictorData?.fact_table_id || '',
                )
                setFactFields(data)
            }
            if (indictorData.indicator_type === TabsKey.RECOMBINATION) {
                const { entries } = await getIndictorList(initialQueryParams)
                setIndictorList(entries)
            }
            getResponseInfo(indictorData)
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }

    // 业务和管理属性数据
    const getResponseInfo = (res: any) => {
        businessDetailInfo.forEach((it) => {
            it.value = res[it.key] ? res[it.key] : '--'
        })
        manageDetailInfo.forEach((it) => {
            // 对 owners 字段特殊处理，避免直接渲染对象数组
            if (it.key === 'owners') {
                // 对于 owners 字段，不设置 value，完全通过 render 函数处理
                it.value = '--' // 设置默认值，但实际渲染会被 render 函数覆盖
            } else {
                it.value = res[it.key] ? res[it.key] : '--'
            }
        })

        handleBusinessDetailInfo(res, businessDetailInfo)
        handleManageDetailInfo(res, manageDetailInfo)
        handletechnologyDetailInfo(
            res,
            technologyDetailInfo[res.indicator_type],
        )
    }
    const handleBusinessDetailInfo = (res, businessDetailInfoData: any) => {
        let detailInfoNew = [...businessDetailInfoData]
        detailInfoNew = detailInfoNew?.map((item: any) => {
            switch (item.key) {
                case 'indicator_type':
                    return {
                        ...item,
                        render: () => IndicatorTypes[res[item.key]],
                    }
                case 'business_indicator_name':
                    return {
                        ...item,
                        render: () => {
                            return (
                                <div className={styles.businessInfo}>
                                    {res[item.key] ? (
                                        <div
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                if (businessIndictorExist) {
                                                    setViewBusinessIndicator(
                                                        res.business_indicator_id,
                                                    )
                                                    setViewDetailId('')
                                                }
                                            }}
                                            className={classnames(
                                                styles.name,
                                                businessIndictorExist
                                                    ? ''
                                                    : styles.nameDisable,
                                            )}
                                            title={res[item.key]}
                                        >
                                            {res[item.key]}
                                        </div>
                                    ) : (
                                        <div> -- </div>
                                    )}

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
                            )
                        },
                    }
                default:
                    return item
            }
        })
        setBusinessDetailContent(detailInfoNew)
    }

    const handleManageDetailInfo = (res, manageDetailInfoData: any) => {
        let detailInfoNew = [...manageDetailInfoData]
        const domain_path_id_count = countCharacters(res?.domain_path_id || '')
        const map = [
            BusinessDomainType.subject_domain_group,
            BusinessDomainType.subject_domain,
            BusinessDomainType.business_object,
        ]
        detailInfoNew = detailInfoNew?.map((item: any) => {
            switch (item.key) {
                case 'domain_name':
                    return {
                        ...item,
                        render: () => {
                            return (
                                <span
                                    className={styles.textContainer}
                                    title={item.value}
                                >
                                    {item.value !== '--' &&
                                        (map[domain_path_id_count] ===
                                        BusinessDomainType.business_object ? (
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
                                                type={map[domain_path_id_count]}
                                                fontSize="20px"
                                                styles={{ marginRight: '4px' }}
                                            />
                                        ))}
                                    <span className={styles.textCont}>
                                        {item.value}
                                    </span>
                                </span>
                            )
                        },
                    }
                case 'owners':
                    return {
                        ...item,
                        render: () => {
                            return <OwnerDisplay value={res.owners} />
                        },
                    }
                case 'management_department_name':
                    return {
                        ...item,
                        render: () => {
                            return (
                                <div className={classnames(styles.ownerItem)}>
                                    {item.value !== '--' && (
                                        <div>
                                            <ArchitectureIcons
                                                type={Architecture.DEPARTMENT}
                                            />
                                        </div>
                                    )}
                                    <div
                                        className={styles.ownerName}
                                        title={item.value}
                                    >
                                        {item.value}
                                    </div>
                                </div>
                            )
                        },
                    }
                case 'updated_at':
                    return {
                        ...item,
                        render: () => {
                            return moment(res.updated_at).format(
                                'YYYY-MM-DD HH:mm:ss',
                            )
                        },
                    }

                case 'created_at':
                    return {
                        ...item,
                        render: () => {
                            return moment(res.created_at).format(
                                'YYYY-MM-DD HH:mm:ss',
                            )
                        },
                    }
                default:
                    return item
            }
        })
        setManageDetailContent(detailInfoNew)
    }
    const getExpressionView = (resData) => {
        const operationRegx = /^[+\-*/()]{1}$/

        const expressGroups =
            resData?.expression?.match(compositeExpressionRegx) || []

        return (
            <div className={styles.expressionView}>
                {expressGroups.map((currentData) => {
                    const findIndictor = getCurrentIndictorList().find(
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

    const getGroupRelateHeight = (rules) => {
        // 全部行数
        const rulesLen = rules.reduce((prev, curr, index) => {
            return prev + (curr.member.length ? curr.member.length : 0)
        }, 0)
        // 组数
        const groupLen = rules.length
        // 第一组的行数
        const firstGroupLen = rules[0].member.length
        // 最后一组的行数
        const lastGroupLen = rules[groupLen - 1].member.length

        // 组连接线高度 = 总高度 - 第一组高度的一半 - 最后一组高度的一半
        const gHeight =
            rulesLen * ROW_HEIGHT +
            (rulesLen - 1) * ROW_MARGIN -
            (firstGroupLen * ROW_HEIGHT + (firstGroupLen - 1) * ROW_MARGIN) /
                2 -
            (lastGroupLen * ROW_HEIGHT + (lastGroupLen - 1) * ROW_MARGIN) / 2

        return gHeight
    }

    const getRestrictView2 = (where, where_relation) => {
        const members = where || []
        return (
            <div className={styles['view-rule-wrapper']}>
                <div className={styles['rule-container']}>
                    {
                        // Todo 联调时根据后端结果适配
                        members.length > 1 && (
                            <div
                                className={styles['group-relate']}
                                style={{
                                    height: getGroupRelateHeight(members),
                                    marginTop:
                                        (members[0].member.length * ROW_HEIGHT +
                                            (members[0].member.length - 1) *
                                                ROW_MARGIN) /
                                        2,
                                }}
                            >
                                <div className={styles['relate-text']}>
                                    {where_relation === 'and'
                                        ? __('且')
                                        : __('或')}
                                </div>
                                <div style={{ width: '48px' }}>&nbsp;</div>
                            </div>
                        )
                    }
                    <div className={styles['rule-groups']}>
                        {members.map((currentMember, index) => {
                            const { member, relation } = currentMember
                            return (
                                <div className={styles['rule-group']}>
                                    {member.length <= 1 &&
                                    members.length <= 1 ? (
                                        ''
                                    ) : (
                                        <div
                                            className={styles['row-relate']}
                                            style={{
                                                height:
                                                    member.length * ROW_HEIGHT +
                                                    (member.length - 1) *
                                                        ROW_MARGIN -
                                                    ROW_HEIGHT,
                                            }}
                                        >
                                            <div
                                                className={
                                                    styles['relate-text']
                                                }
                                            >
                                                {relation === 'or'
                                                    ? '或'
                                                    : '且'}
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles['rule-rows']}>
                                        {member.map((item) => (
                                            <div className={styles['rule-row']}>
                                                <div
                                                    className={
                                                        styles['field-name']
                                                    }
                                                >
                                                    {getFieldTypeIcon(
                                                        item?.field?.date_type,
                                                    )}
                                                    {item?.field?.business_name}
                                                </div>
                                                <div
                                                    className={
                                                        styles[
                                                            'field-condition'
                                                        ]
                                                    }
                                                >
                                                    {
                                                        fieldInfos[
                                                            changeFormatToType(
                                                                item?.field
                                                                    ?.date_type,
                                                            )
                                                        ]?.limitListOptions?.find(
                                                            (currentLimit) =>
                                                                currentLimit.value ===
                                                                item.operator,
                                                        )?.label
                                                    }
                                                </div>
                                                <div
                                                    className={
                                                        styles['field-value']
                                                    }
                                                    style={{
                                                        width:
                                                            members.length > 1
                                                                ? '312px'
                                                                : '360px',
                                                    }}
                                                >
                                                    {getDateDisplay(
                                                        item.value,
                                                        item.operator,
                                                        item?.field?.date_type,
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    const handleUpdateCycle = (resData: any) => {
        const currentItem: any = find(updateCycle, {
            value: resData.update_cycle,
        })
        return <span>{currentItem?.label || '--'}</span>
    }

    const handleAnalysisDimensions = (resData: any) => {
        return resData?.analysis_dimensions?.length ? (
            <div className={styles.viewAnalysisDimensions}>
                {resData.analysis_dimensions.map((item) => (
                    <Tooltip
                        title={
                            <div>
                                <div>
                                    <span>{__('业务名称：')}</span>
                                    <span>{item.business_name}</span>
                                </div>

                                <div>
                                    <span>{__('技术名称：')}</span>
                                    <span>{item.technical_name}</span>
                                </div>
                            </div>
                        }
                        color="#fff"
                        overlayInnerStyle={{
                            color: 'rgba(0,0,0,0.85)',
                        }}
                    >
                        <Tag
                            icon={getFieldTypeIcon(item.original_data_type)}
                            className={styles.tag}
                        >
                            <span className={styles.text}>
                                {item.business_name}
                            </span>
                        </Tag>
                    </Tooltip>
                ))}
            </div>
        ) : (
            '--'
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
            return getRestrictView2(info?.where, info?.where_relation)
        }
        return '--'
    }

    const handletechnologyDetailInfo = (
        resData,
        currentTechnologyDetailInfo,
    ) => {
        let detailInfoNew = currentTechnologyDetailInfo

        if (
            resData?.indicator_type === TabsKey.DERIVE &&
            resData?.where_info?.sql_str
        ) {
            detailInfoNew = detailInfoNew?.filter(
                (cur) => cur.key !== 'time_restrict',
            )
        }

        detailInfoNew = detailInfoNew?.map((item: any) => {
            switch (item.key) {
                case 'refer_view_name':
                    return {
                        ...item,
                        render: () => {
                            return isMarket || !allowJump ? (
                                resData[item.key] || '--'
                            ) : resData[item.key] ? (
                                <div
                                    className={styles.textLink}
                                    onClick={() => handleTurnPage(item.key)}
                                    title={resData[item.key]}
                                >
                                    {resData[item.key]}
                                </div>
                            ) : (
                                '--'
                            )
                        },
                    }
                case 'date_mark':
                    return {
                        ...item,
                        render: () => {
                            const dateItem = resData[item.key] || {}
                            return (
                                <div
                                    className={styles.dateMark}
                                    title={dateItem.business_name}
                                >
                                    {dateItem.business_name &&
                                        getFieldTypeIcon(
                                            dateItem.original_data_type,
                                        )}

                                    <div>{dateItem.business_name || '--'}</div>
                                </div>
                            )
                        },
                    }
                case 'atomic_indicator_name':
                    return {
                        ...item,
                        render: () => {
                            return isMarket || !allowJump ? (
                                resData[item.key] || '--'
                            ) : resData[item.key] ? (
                                <div
                                    className={styles.textLink}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleTurnPage(item.key)
                                    }}
                                    title={resData[item.key]}
                                >
                                    {resData[item.key]}
                                </div>
                            ) : (
                                '--'
                            )
                        },
                    }
                case 'exec_sql':
                    return {
                        ...item,
                        render: () => {
                            return resData[item.key] ? (
                                <div
                                    style={{
                                        width: '100%',
                                        position: 'absolute',
                                    }}
                                >
                                    <Editor
                                        grayBackground
                                        highlightActiveLine={false}
                                        style={{
                                            maxHeight: 320,
                                            overflow: 'auto',
                                        }}
                                        value={getFormatSql(resData[item.key])}
                                        editable={false}
                                        readOnly
                                    />
                                </div>
                            ) : (
                                '--'
                            )
                        },
                    }
                case 'expression':
                    return {
                        ...item,
                        render: () => {
                            return resData[item.key] && indicatorType ? (
                                indicatorType === TabsKey.RECOMBINATION ? (
                                    getExpressionView(resData)
                                ) : (
                                    <Editor
                                        lineNumbers={false}
                                        grayBackground
                                        highlightActiveLine={false}
                                        value={getFormatSql(resData[item.key])}
                                        editable={false}
                                    />
                                )
                            ) : (
                                '--'
                            )
                        },
                    }
                case 'time_restrict':
                    return {
                        ...item,
                        render: () =>
                            resData?.where_info?.date_where?.length
                                ? getRestrictView2(
                                      resData?.where_info?.date_where,
                                      resData?.where_info?.date_where_relation,
                                  )
                                : '--',
                    }
                case 'where_info':
                    return {
                        ...item,
                        render: () =>
                            resData[item.key]
                                ? getBizLimit(resData[item.key])
                                : '--',
                    }
                case 'update_cycle':
                    return {
                        ...item,
                        render: () => {
                            return handleUpdateCycle(resData)
                        },
                    }

                case 'analysis_dimensions':
                    return {
                        ...item,
                        render: () => {
                            return handleAnalysisDimensions(resData)
                        },
                    }

                default:
                    return {
                        ...item,
                        value: resData[item.key],
                    }
            }
        })
        setTechnologyDetailContent(detailInfoNew)
    }

    const handleTabsChange = (key: string) => {
        setActive(key as IndicatorDetailTabKey)
    }

    // 之前的弹框
    // 查看指标详情
    const [viewDetailId, setViewDetailId] = useState<string>('')
    const handleTurnPage = (key: string) => {
        const currentDetailData = getCurrentDetailData()
        let url = ''
        if (key === 'refer_view_name') {
            const fromLink = encodeURIComponent(
                window.location.pathname + window.location.search,
            )
            url = `/datasheet-view/detail?id=${currentDetailData?.refer_view_id}&model=view&backPrev=true`
            if (allowJump) {
                window.open(
                    getActualUrl(url, true, LoginPlatform.drmb),
                    '_self',
                )
            }
        } else if (key === 'atomic_indicator_name') {
            setViewBusinessIndicator('')
            setViewDetailId(currentDetailData.atomic_indicator_id)
        } else if (key === 'edit') {
            const id = currentDetailData.id ? currentDetailData.id : indicatorId
            const type = currentDetailData.indicator_type
                ? currentDetailData.indicator_type
                : indicatorType

            if (type === TabsKey.RECOMBINATION) {
                url = `/business/indicatorManage?indicatorId=${id}&indicatorType=${type}&operation=${OperateType.EDIT}`
                // window.open(getActualUrl(url), '_blank')
            } else {
                url = `/business/indicatorManage/indicatorGraph?type=${
                    type === TabsKey.ATOMS
                        ? IndicatorType.ATOM
                        : IndicatorType.DERIVED
                }&operate=${OperateType.EDIT}&indicatorId=${id}&sceneId=${
                    currentDetailData?.scene_analysis_id
                }&backPrev=true`
            }
            if (allowJump) {
                navigateJumpToPage(getActualUrl(url))
            }
            // onEdit()
        }
    }

    return (
        <div
            className={classnames(styles.detailsContainer, styles.formContent)}
            onClick={() => {
                setViewBusinessIndicator('')
                setViewDetailId('')
            }}
        >
            {loading ? (
                <div className={styles.viewloading}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.detailsContent} ref={container}>
                    <div className={styles.detailsBox}>
                        <div
                            id="component-indictor-definition"
                            className={styles.formModuleContainer}
                        >
                            <div className={styles.moduleTitle}>
                                <h4>{__('基本属性')}</h4>
                            </div>
                            <DetailsLabel
                                wordBreak
                                detailsList={getBusinessDetailContent()}
                                labelWidth="110px"
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                        <div
                            id="component-data-manage"
                            className={styles.formModuleContainer}
                        >
                            <div className={styles.moduleTitle}>
                                <h4>{__('管理属性')}</h4>
                            </div>
                            <DetailsLabel
                                wordBreak
                                detailsList={getManageDetailContent()}
                                labelWidth="100px"
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                        <div
                            id="component-develop-config"
                            className={styles.formModuleContainer}
                        >
                            <div className={styles.moduleTitle}>
                                <h4>{__('技术属性')}</h4>
                            </div>
                            {allowJump &&
                            !detailData?.scene_analysis_id &&
                            indicatorType !== TabsKey.RECOMBINATION ? (
                                <div>
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={
                                            <div>
                                                {__('指标暂未开发')}
                                                {isMarket ? null : (
                                                    <>
                                                        ，{__('可点击')}
                                                        <span
                                                            style={{
                                                                color: '#126ee3',
                                                                cursor: 'pointer',
                                                            }}
                                                            onClick={() =>
                                                                handleTurnPage(
                                                                    'edit',
                                                                )
                                                            }
                                                        >
                                                            【{__('编辑')}】
                                                        </span>
                                                        {__('按钮进行指标开发')}
                                                    </>
                                                )}
                                            </div>
                                        }
                                    />
                                </div>
                            ) : (
                                <DetailsLabel
                                    wordBreak
                                    detailsList={technologyDetailContent}
                                    labelWidth="110px"
                                    style={{ paddingLeft: 40 }}
                                />
                            )}
                        </div>
                    </div>
                    {isMarket ? null : (
                        <div className={styles.menuContainer}>
                            <Anchor
                                targetOffset={160}
                                getContainer={() =>
                                    (container.current as HTMLElement) || window
                                }
                                onClick={(e: any) => e.preventDefault()}
                                className={styles.anchorWrapper}
                            >
                                <Link
                                    href="#component-indictor-definition"
                                    title={__('基本属性')}
                                />
                                <Link
                                    href="#component-data-manage"
                                    title={__('管理属性')}
                                />
                                <Link
                                    href="#component-develop-config"
                                    title={__('技术属性')}
                                />
                            </Anchor>
                        </div>
                    )}
                </div>
            )}
            {viewBusinessIndicator && (
                <div
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    <Detail
                        id={viewBusinessIndicator}
                        onClose={() => {
                            setViewBusinessIndicator('')
                        }}
                        style={{ position: 'absolute', top: 0 }}
                    />
                </div>
            )}
            {viewDetailId && (
                <div
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    <IndicatorView
                        onClose={() => {
                            setViewDetailId('')
                        }}
                        style={{ position: 'absolute', top: 0 }}
                        IndicatorId={viewDetailId}
                        type={TabsKey.ATOMS}
                    />
                </div>
            )}
        </div>
    )
}

export default IndicatorDetailContent
