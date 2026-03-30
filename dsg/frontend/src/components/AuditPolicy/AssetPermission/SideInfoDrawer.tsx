import {
    CloseOutlined,
    DownOutlined,
    InfoCircleFilled,
    PlusOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { useSize } from 'ahooks'
import {
    Button,
    Checkbox,
    List,
    Popconfirm,
    Tabs,
    Tooltip,
    message,
} from 'antd'
import classnames from 'classnames'
import { noop, trim, uniqBy } from 'lodash'
import moment from 'moment'
import VirtualList from 'rc-virtual-list'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import noObjEmpty from '@/assets/noObjEmpty.svg'
import CustomDrawer from '@/components/CustomDrawer'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import { renderOtherInfo } from '@/components/DataAssetsCatlg/DataResc/DataRescItem'
import { getDataRescTypeIcon } from '@/components/DataAssetsCatlg/DataResc/helper'
import IndicatorViewDetail from '@/components/DataAssetsCatlg/IndicatorViewDetail'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import { getState } from '@/components/DatasheetView/helper'
import WorkflowViewPlugin, {
    IWorkflowInfo,
    VisitType,
} from '@/components/WorkflowViewPlugin'
import {
    OnlineStatus,
    PolicyDataRescType,
    RescPolicyStatus,
    RescPolicyType,
    formatError,
    getProcessDefinitionByKey,
    reqRescPolicyDetail,
    updateRescPolicy,
} from '@/core'
import { FontIcon, UnbindOutlined } from '@/icons'
import {
    DetailsLabel,
    Empty,
    Expand,
    LightweightSearch,
    Loader,
    SearchInput,
} from '@/ui'
import { confirm } from '@/utils/modalHelper'
import { BizType, PolicyType } from '../const'
import {
    SideInfoDrawerTabKey,
    allRescTypeList,
    builtInRescPolicyTypeList,
    filterItems,
    handleRescPolicyError,
    moreInfoList,
    policyRescTypeToDataRescType,
    policyStatusList,
    rescPolicyTypeLabelList,
    sideInfoDrawerTabs,
} from './helper'
import __ from './locale'
import SelDataRescModal from './SelDataRescModal'
import styles from './styles.module.less'
import { getPopupContainer } from '@/utils'

const detailLabelStyle = {
    padding: '8px 0',
    color: 'rgba(0,0,0,0.45)',
}

interface ISearchCondition {
    keyword?: string
    offset: number
    limit: number
    rescType: string
}

interface IOperaionModelType {
    open?: boolean
    id: string
    // 外界设置流程更新流程id
    proc_def_key?: string
    // 审核策略类型，内置、自定义
    type: RescPolicyType
    cardProps?: Record<string, any>
    // 编辑资源或设置、解绑流程调用，改变外侧组件对应数据
    updateDetail?: (newPolicyInfo) => void
    reloadData?: (e) => void
    // 绑定流程
    onSave?: (workflowInfo: IWorkflowInfo) => void
    // 解绑流程
    onUnBind?: () => void
}

const SideInfoDrawer = ({
    open,
    id,
    proc_def_key,
    type,
    cardProps,
    updateDetail = noop,
    reloadData = noop,
    onSave = noop,
    onUnBind = noop,
}: IOperaionModelType) => {
    const [loading, setLoading] = useState<boolean>(false)
    const processType = PolicyType.AssetPermission
    const serviceType = BizType.AuthService

    // const [searchCondition, setSearchCondition] = useState<any>({
    //     rescType: PolicyDataRescType.NOLIMIT,
    // })
    // 操作项
    const [curOprResc, setCurOprResc] = useState<any>()
    // 视图详情
    const [viewDetailOpen, setViewDetailOpen] = useState<boolean>(false)
    // 接口详情
    const [interfaceDetailOpen, setInterfaceDetailOpen] =
        useState<boolean>(false)
    // 指标详情
    const [indicatorDetailOpen, setIndicatorDetailOpen] =
        useState<boolean>(false)

    const [detail, setDetail] = useState<any>({})
    const [moreInfoData, setMoreInfoData] = useState<any[]>(moreInfoList)
    const [workflow, setWorkflow] = useState<any>()
    const [processLoading, setProcessLoading] = useState<boolean>(true)
    const [isSetWorkflowOpen, setIsSetWorkflowOpen] = useState<boolean>(false)
    const [workflowKey, setWorkflowKey] = useState<number>(0) // 添加key来强制重新加载
    const originalWorkflow = useRef<any>(null)

    const [tabActiveKey, setTabActiveKey] = useState<string>(
        SideInfoDrawerTabKey.AuditResource,
    )

    // tabContetnt
    const tabContentContainer = useRef<HTMLDivElement>(null)
    const tabContentSize = useSize(tabContentContainer) || {
        width: 340,
        height: 300,
    }
    // tabContent高度、宽度
    const [tabContentHeight, tabContentWidth] = useMemo(() => {
        return [tabContentSize?.height || 300, tabContentSize?.width || 340]
    }, [tabContentSize])

    // 审核资源所有参数
    const rescListContainer = useRef<HTMLDivElement>(null)
    const rescListSize = useSize(rescListContainer) || {
        width: 340,
        height: 300,
    }
    // 审核资源列表高度
    const rescListHeight = useMemo(() => {
        return Math.floor(rescListSize?.height || 0) || 300
    }, [rescListSize])
    // 审核资源列表（后端返回策略所有审核的资源, 所有资源保存在detail.resources中）
    const [auditAllRescList, setAuditAllRescList] = useState<any[]>([])
    const [auditRescList, setAuditRescList] = useState<any[]>([])

    // 添加资源modal
    const [selRescModalOpen, setSelRescModalOpen] = useState<boolean>(false)
    const [checkedIdList, setCheckedIdList] = useState<string[]>([])
    const checkAll = useMemo(
        () => auditRescList?.length === checkedIdList.length,
        [auditRescList, checkedIdList],
    )
    // 审核资源-是否显示input搜索框
    const [isShowInput, setIsShowInput] = useState<boolean>(false)
    // 审核资源-是否展示全选
    const [isShowCheckAll, setIsShowCheckAll] = useState<boolean>(false)
    const initRescSearchCondition: ISearchCondition = {
        keyword: '',
        offset: 1,
        limit: 10,
        rescType: PolicyDataRescType.NOLIMIT,
    }
    // 审核资源查询参数
    const [rescSearchCondition, setRescSearchCondition] =
        useState<ISearchCondition>(initRescSearchCondition)
    const [rescKeyword, setRescKeyword] = useState<string>('')
    const indeterminate = useMemo(
        () =>
            checkedIdList.length > 0 &&
            checkedIdList.length < auditRescList?.length,
        [detail, checkedIdList],
    )

    const hasRescSearchCondition = useMemo(() => {
        return (
            rescSearchCondition.keyword ||
            rescSearchCondition.rescType !== PolicyDataRescType.NOLIMIT
        )
    }, [rescSearchCondition])

    useEffect(() => {
        if (open && id) {
            setDetail(undefined)
            setWorkflow(null)
            getPolicyDetail()
        } else {
            setDetail(undefined)
        }
    }, [open, id])

    // 类型计数
    const [rescTotalCount, maxOffset] = useMemo(() => {
        let viewCount = 0
        let apiCount = 0
        let indicatorCount = 0
        const { rescType, limit = 10 } = rescSearchCondition
        let maxOffsetNum =
            Math.ceil((auditAllRescList?.length || 0) / limit) || 1
        auditAllRescList?.forEach((item) => {
            const { type: itemType } = item
            if (itemType === PolicyDataRescType.LOGICALVIEW) {
                viewCount += 1
            } else if (itemType === PolicyDataRescType.INTERFACE) {
                apiCount += 1
            } else if (itemType === PolicyDataRescType.INDICATOR) {
                indicatorCount += 1
            }
        })
        if (rescType === PolicyDataRescType.LOGICALVIEW) {
            maxOffsetNum = Math.ceil((viewCount || 0) / limit) || 1
        } else if (rescType === PolicyDataRescType.INTERFACE) {
            maxOffsetNum = Math.ceil((apiCount || 0) / limit) || 1
        } else if (rescType === PolicyDataRescType.INDICATOR) {
            maxOffsetNum = Math.ceil((indicatorCount || 0) / limit) || 1
        }
        return [
            {
                [PolicyDataRescType.NOLIMIT]: auditAllRescList?.length || 0,
                [PolicyDataRescType.LOGICALVIEW]: viewCount || 0,
                [PolicyDataRescType.INTERFACE]: apiCount || 0,
                [PolicyDataRescType.INDICATOR]: indicatorCount || 0,
            },
            maxOffsetNum || 1,
        ]
    }, [rescSearchCondition, auditAllRescList])

    const filterTopNode = useMemo(() => {
        return isShowInput ? (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <FontIcon name="icon-shaixuan" className={styles.filterIcon} />
            </div>
        ) : (
            <div className={styles.filterTopNode}>
                <div className={styles.filterItemTitle}>
                    {
                        allRescTypeList?.find(
                            (tItem) =>
                                tItem.value === rescSearchCondition.rescType,
                        )?.label
                    }
                    {__(' (${text})', {
                        text:
                            rescTotalCount?.[rescSearchCondition.rescType] ||
                            '0',
                    })}
                </div>
                <DownOutlined className={styles.dropdownIcon} />
            </div>
        )
    }, [isShowInput, rescSearchCondition, auditRescList, detail])

    useEffect(() => {
        if (
            tabActiveKey === SideInfoDrawerTabKey.AuditProcess &&
            detail?.proc_def_key
        ) {
            getProccess(detail?.proc_def_key)
        } else {
            setProcessLoading(false)
            setWorkflow(undefined)
            originalWorkflow.current = undefined
        }
    }, [detail, tabActiveKey])

    useEffect(() => {
        if (proc_def_key) {
            setDetail({
                ...(detail || {}),
                proc_def_key,
            })
        }
    }, [proc_def_key])

    useEffect(() => {
        if (!auditAllRescList?.length) return
        getAuditRescList(rescSearchCondition)
    }, [rescSearchCondition, auditAllRescList])

    /**
     * 将文本中的关键词替换为带有灰色高亮样式的HTML
     * @param {string} text - 原始文本
     * @param {string} keyword - 要高亮的关键词
     * @returns {string} - 替换后的HTML字符串
     */
    function highlightKeyword(text, keyword) {
        if (!text || !keyword) return text

        try {
            // 转义正则表达式特殊字符
            const escapedKeyword = keyword.replace(
                /[.[*?+^$|()/]|\]|\\/g,
                '\\$&',
            )

            // 使用转义后的关键词创建正则表达式
            const regex = new RegExp(escapedKeyword, 'gi')

            const hasMatch = regex.test(text) // 判断是否有匹配

            if (!hasMatch) return '' // 无匹配时返回空

            // 有匹配时进行替换
            return text.replace(regex, (match) => {
                return `<span style="color:#FF6304;">${match}</span>`
            })
        } catch (error) {
            // 如果正则表达式创建失败，返回原文本
            return text
        }
    }

    // 审核资源
    const getAuditRescList = (params) => {
        if (!auditAllRescList?.length) return
        const { keyword, offset = 1, limit = 10 } = params
        if (offset > maxOffset) return
        const kw = trim(keyword)
        const start = (offset - 1) * limit
        const end = offset * limit

        const filterParamsList =
            (kw
                ? auditAllRescList?.map((item: any) => {
                      if (!kw) {
                          const {
                              html_name,
                              html_tech_name,
                              html_code,
                              ...rest
                          } = item
                          return rest
                      }
                      const { name, technical_name, uniform_catalog_code } =
                          item
                      // 关键词搜索高亮显示
                      const html_name = highlightKeyword(name, kw)
                      const html_tech_name = highlightKeyword(
                          technical_name,
                          kw,
                      )
                      const html_code = highlightKeyword(
                          uniform_catalog_code,
                          kw,
                      )
                      return {
                          ...item,
                          html_name,
                          html_tech_name,
                          html_code,
                      }
                  })
                : auditAllRescList
            )?.filter?.(
                (item) =>
                    // 类型筛选+高亮筛选
                    (params.rescType === PolicyDataRescType.NOLIMIT ||
                        params.rescType === item.type) &&
                    (!kw ||
                        item.html_name ||
                        item.html_tech_name ||
                        item.html_code),
            ) || []

        const list = filterParamsList?.slice(0, end)
        setAuditRescList(list)
    }

    const onRescListScroll = (e: any) => {
        // 滑动到最大页数，不再获取数据
        if ((rescSearchCondition?.offset || 1) > maxOffset) return
        if (
            Math.abs(
                e.currentTarget.scrollHeight -
                    e.currentTarget.scrollTop -
                    rescListHeight,
            ) <= 1
        ) {
            setRescSearchCondition({
                ...rescSearchCondition,
                offset: (rescSearchCondition?.offset || 0) + 1,
            })
        }
    }

    const getPolicyDetail = async () => {
        try {
            if (!id) return
            const res = await reqRescPolicyDetail(id)
            setDetail({
                ...detail,
                ...(res || {}),
                resources: res?.resources || [],
            })
            setAuditAllRescList(res?.resources || [])
            setMoreInfoData(
                moreInfoList.map((item) => {
                    return {
                        ...item,
                        infoList: item?.infoList?.map((dItem) => {
                            const { key } = dItem
                            let val = res[key] || ''
                            let render
                            if (key === 'description') {
                                render = () => {
                                    return res?.description ? (
                                        <Expand
                                            expandTips={__('展开')}
                                            content={res?.description}
                                        />
                                    ) : (
                                        '--'
                                    )
                                }
                            } else if (key === 'type') {
                                val = builtInRescPolicyTypeList.includes(type)
                                    ? __('内置')
                                    : __('自定义')
                            } else if (key === 'status') {
                                val = getState(val, policyStatusList, {
                                    width: '8px',
                                    height: '8px',
                                })
                            } else if (key === 'proc_def_key') {
                                val = res?.proc_def_key ? __('已设置') : '--'
                            } else if (key === 'resources') {
                                val = builtInRescPolicyTypeList.includes(type)
                                    ? rescPolicyTypeLabelList[type]
                                    : __('${text} 个', {
                                          text: res[key]?.length || '0',
                                      })
                            } else if (
                                ['updated_at', 'created_at'].includes(key)
                            ) {
                                val = moment(val).format('YYYY-MM-DD HH:mm:ss')
                            }
                            return {
                                ...dItem,
                                value: val || '--',
                                labelStyles: detailLabelStyle,
                                render,
                            }
                        }),
                    }
                }),
            )
        } catch (e) {
            handleRescPolicyError(e, reloadData)
        }
    }

    const getProccess = async (key: string) => {
        try {
            setProcessLoading(true)
            setWorkflow(undefined)
            const process = await getProcessDefinitionByKey(key)
            setWorkflow(process)
            // 只有当流程真正发生变化时才更新 key
            if (
                !originalWorkflow.current ||
                originalWorkflow.current.key !== process?.key ||
                originalWorkflow.current.id !== process?.id
            ) {
                setWorkflowKey((prev) => prev + 1)
                originalWorkflow.current = process
            }
        } catch (error) {
            setWorkflow(undefined)
            formatError(error)
        } finally {
            setProcessLoading(false)
        }
    }

    /**
     * 保存流程
     */
    const saveWorkflow = async (workflowInfo: IWorkflowInfo) => {
        try {
            const config = {
                id: workflowInfo.process_def_id,
                key: workflowInfo.process_def_key,
                name: workflowInfo.process_def_name,
                type: processType,
            }

            await updateRescPolicy({
                ...detail,
                proc_def_key: workflowInfo.process_def_key,
            })

            // 只有当流程真正发生变化时才更新 key
            if (
                !originalWorkflow.current ||
                originalWorkflow.current.key !== config.key ||
                originalWorkflow.current.id !== config.id
            ) {
                setWorkflowKey((prev) => prev + 1)
            }

            originalWorkflow.current = config
            setIsSetWorkflowOpen(false)

            // if (onSave) {
            //     onSave(workflowInfo)
            // }
            updateDetail({
                ...detail,
                proc_def_key: workflowInfo.process_def_key,
            })
            getPolicyDetail()
            // message.success(__('保存成功'))
        } catch (e) {
            handleRescPolicyError(e, reloadData)
        }
    }

    /**
     * 解绑审核流程
     */
    const unBindWorkflow = async () => {
        confirm({
            title: __('确认解绑'),
            content: __('确认要解绑该流程吗？'),
            okText: __('确定'),
            cancelText: __('取消'),
            onOk: async () => {
                try {
                    await updateRescPolicy({
                        ...detail,
                        proc_def_key: '',
                    })
                    updateDetail({
                        ...detail,
                        proc_def_key: '',
                    })
                    setWorkflow(undefined)
                    // 解绑流程时总是需要更新 key
                    setWorkflowKey((prev) => prev + 1)
                    originalWorkflow.current = undefined
                    getPolicyDetail()
                    message.success(__('解绑成功'))
                } catch (e) {
                    handleRescPolicyError(e, reloadData)
                }
            },
        })
    }
    /**
     * 取消
     */
    const closeWorkflow = () => {
        setIsSetWorkflowOpen(false)
    }

    const removeResc = async (rescListIds: Array<string>) => {
        try {
            const leftResources = auditAllRescList?.filter(
                (item) => !rescListIds.includes(item.id),
            )
            const res = await updateRescPolicy({
                ...detail,
                resources: leftResources,
            })
            getPolicyDetail()
            setRescSearchCondition({
                ...rescSearchCondition,
                offset: 1,
            })
            updateDetail({
                ...detail,
                resources: leftResources,
                resources_count:
                    (auditAllRescList?.length || 0) -
                        (rescListIds?.length || 0) || 0,
            })
            message.success(__('移除成功'))
            setCheckedIdList([])
        } catch (e) {
            handleRescPolicyError(e, reloadData)
        }
    }

    const handleAddResource = async (items: Array<any>) => {
        try {
            setSelRescModalOpen(false)

            const newRescList = uniqBy(
                [...(auditRescList || []), ...items],
                'id',
            )
            const auditAllRescListIds = auditAllRescList?.map((item) => item.id)
            // 新添加数据
            const newAddCount = items?.filter(
                (item) => !auditAllRescListIds.includes(item.id),
            )?.length
            setAuditAllRescList(items)
            await updateRescPolicy({
                ...detail,
                resources: items?.map((rItem) => {
                    return {
                        id: rItem.id,
                        type: rItem.type,
                    }
                }),
            })
            // 更新侧边栏详情
            getPolicyDetail()
            // 更新表格数据
            updateDetail({
                ...detail,
                resources: newRescList,
                resources_count: newRescList?.length || 0,
            })
            message.success(
                __('已添加${text}个数据资源', {
                    text: newAddCount || '0',
                }),
            )
        } catch (e) {
            handleRescPolicyError(e, reloadData)
        }
    }

    const renderEmpty = () => {
        if (!id) {
            return (
                <div className={styles.noItemIdEmpty}>
                    <Empty
                        iconSrc={noObjEmpty}
                        desc={__('请选择策略以查看详细信息')}
                    />
                </div>
            )
        }
        // 审核资源tab-内置策略显示内容
        if (
            tabActiveKey === SideInfoDrawerTabKey.AuditResource &&
            builtInRescPolicyTypeList.includes(type)
        )
            return (
                <div className={styles.buildInPolicyTips}>
                    <div className={styles.tipTitle}>
                        {rescPolicyTypeLabelList[type]}
                    </div>
                    <div className={styles.tipCont}>
                        {__('内置策略的审核资源默认为选择了${text}', {
                            text: rescPolicyTypeLabelList[type],
                        })}
                    </div>
                </div>
            )

        const desc =
            tabActiveKey === SideInfoDrawerTabKey.AuditProcess
                ? __('无绑定的审核流程')
                : tabActiveKey === SideInfoDrawerTabKey.AuditResource
                ? __('无可审核的数据资源')
                : ''
        return <Empty iconSrc={dataEmpty} desc={desc} />
    }

    const searchChange = (d, dataKey) => {
        if (!dataKey) {
            // 清空筛选
            setRescSearchCondition({
                ...rescSearchCondition,
                ...d,
                offset: 1,
            })
        } else {
            const dk = dataKey

            setRescSearchCondition({
                ...rescSearchCondition,
                [dk]: d[dk],
                offset: 1,
            })
        }
    }

    const handleCheck = (e: any, item) => {
        e.stopPropagation()
        if (e.target.checked) {
            setCheckedIdList([...checkedIdList, item.id])
        } else {
            setCheckedIdList(
                checkedIdList.filter((checkId) => checkId !== item.id),
            )
        }
    }

    const renderListItem = (item: any) => {
        const {
            department,
            id: rescId,
            name,
            type: rescType,
            uniform_catalog_code,
            subject_path,
            technical_name,
            status,
            html_name,
            html_tech_name,
            html_code,
        } = item
        return (
            <div className={styles.listItem}>
                {isShowCheckAll && (
                    <Checkbox
                        checked={!!checkedIdList.find((cId) => cId === rescId)}
                        onChange={(e) => handleCheck(e, item)}
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
                <div className={styles.listItemContentWrapper}>
                    <span style={{ marginTop: '2px' }}>
                        {getDataRescTypeIcon(
                            {
                                type: policyRescTypeToDataRescType[rescType],
                                indicator_type: item.sub_type,
                            },
                            20,
                        )}
                    </span>
                    <div className={styles.listItemContent}>
                        <div className={styles.nameWrapper}>
                            <div
                                className={name ? styles.name : ''}
                                title={name}
                                dangerouslySetInnerHTML={{
                                    __html: html_name || name,
                                }}
                                onClick={() => {
                                    setCurOprResc(item)
                                    if (
                                        item.type ===
                                        PolicyDataRescType.LOGICALVIEW
                                    ) {
                                        setViewDetailOpen(true)
                                    } else if (
                                        item.type ===
                                        PolicyDataRescType.INTERFACE
                                    ) {
                                        setInterfaceDetailOpen(true)
                                    } else if (
                                        item.type ===
                                        PolicyDataRescType.INDICATOR
                                    ) {
                                        setIndicatorDetailOpen(true)
                                    }
                                }}
                            />
                            {[
                                OnlineStatus.OFFLINE,
                                OnlineStatus.DELETED,
                            ].includes(status) && (
                                <Tooltip
                                    color="#fff"
                                    title={__('${type}资源不能进行权限申请', {
                                        type:
                                            status === OnlineStatus.OFFLINE
                                                ? __('已下线')
                                                : __('已删除'),
                                    })}
                                    overlayInnerStyle={{
                                        color: 'rgba(0, 0, 0, 0.85)',
                                    }}
                                >
                                    <div className={styles.onlineStatus}>
                                        {status === OnlineStatus.OFFLINE
                                            ? __('已下线')
                                            : __('已删除')}
                                    </div>
                                </Tooltip>
                            )}
                        </div>
                        <div
                            className={styles.code}
                            title={uniform_catalog_code}
                            dangerouslySetInnerHTML={{
                                __html:
                                    __('编码') +
                                    __('：') +
                                    (html_code || uniform_catalog_code),
                            }}
                        />
                        {rescType === PolicyDataRescType.LOGICALVIEW && (
                            <div
                                className={styles.techName}
                                title={technical_name}
                                dangerouslySetInnerHTML={{
                                    __html:
                                        __('技术名称') +
                                        __('：') +
                                        (html_tech_name || technical_name),
                                }}
                            />
                        )}

                        <div className={styles.otherInfo}>
                            {renderOtherInfo(
                                {
                                    ...item,
                                    subject_domain_name: item.subject,
                                    department_name: department,
                                },
                                policyRescTypeToDataRescType[rescType],
                            )}
                        </div>
                    </div>
                </div>

                {!isShowCheckAll && (
                    <div className={styles.btnIconWrapper}>
                        <Popconfirm
                            title={__('确定要移除审核资源吗？')}
                            okText={__('确定')}
                            cancelText={__('取消')}
                            placement="bottomLeft"
                            onConfirm={(e) => {
                                removeResc([item.id])
                            }}
                            icon={
                                <InfoCircleFilled
                                    style={{
                                        color: '#FAAD14',
                                    }}
                                />
                            }
                        >
                            <Tooltip title={__('移除')} placement="topRight">
                                <CloseOutlined className={styles.btnIcon} />
                            </Tooltip>
                        </Popconfirm>
                    </div>
                )}
            </div>
        )
    }

    const FilterItemsWithCount: any = useMemo(() => {
        return isShowInput
            ? filterItems
            : filterItems.map((item) => {
                  if (item.key === 'rescType') {
                      return {
                          ...item,
                          options: item?.options?.map((o: any) => {
                              return {
                                  ...o,
                                  label: `${o?.label} (${
                                      rescTotalCount?.[o?.key] || 0
                                  })`,
                              }
                          }),
                      }
                  }
                  return item
              })
    }, [rescTotalCount, isShowInput])

    return (
        <div className={styles.sideInfoDrawerWrapper}>
            {!id ? (
                renderEmpty()
            ) : (
                <CustomDrawer
                    open={open}
                    destroyOnClose
                    loading={loading}
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
                        zIndex: 200,
                    }}
                    {...cardProps}
                >
                    <div hidden={!loading}>
                        <Loader />
                    </div>
                    {loading ? (
                        <Loader />
                    ) : (
                        <div className={styles.contentWrapper}>
                            <Tabs
                                activeKey={tabActiveKey}
                                onChange={(e) => setTabActiveKey(e)}
                                getPopupContainer={(node) => node}
                                tabBarGutter={32}
                                items={sideInfoDrawerTabs}
                                destroyInactiveTabPane
                                className={styles.contentTab}
                            />
                            <div
                                className={styles.tabContentWrapper}
                                ref={tabContentContainer}
                            >
                                {/* 审核资源 */}
                                {tabActiveKey ===
                                    SideInfoDrawerTabKey.AuditResource &&
                                    (builtInRescPolicyTypeList.includes(
                                        type,
                                    ) ? (
                                        renderEmpty()
                                    ) : (
                                        <div
                                            className={styles.auditRescWrapper}
                                        >
                                            <div
                                                className={
                                                    styles.rescTopWrapper
                                                }
                                            >
                                                <LightweightSearch
                                                    formData={filterItems}
                                                    isButton={!isShowInput}
                                                    filterTopNode={
                                                        filterTopNode
                                                    }
                                                    compClassName={classnames(
                                                        styles.filterBtn,
                                                        isShowInput &&
                                                            styles.filterIconBtn,
                                                    )}
                                                    onChange={(d, key) =>
                                                        searchChange(d, key)
                                                    }
                                                    defaultValue={{
                                                        rescType:
                                                            PolicyDataRescType.NOLIMIT,
                                                    }}
                                                />

                                                {isShowInput && (
                                                    <SearchInput
                                                        value={
                                                            rescSearchCondition?.keyword
                                                        }
                                                        style={{
                                                            // width: 190,
                                                            flex: '1',
                                                        }}
                                                        placeholder={__(
                                                            '搜索资源名称、编码',
                                                        )}
                                                        onKeyChange={(
                                                            _kw: string,
                                                        ) => {
                                                            const kw = trim(_kw)
                                                            setRescKeyword(
                                                                trim(kw),
                                                            )
                                                            setRescSearchCondition(
                                                                {
                                                                    ...rescSearchCondition,
                                                                    keyword: kw,
                                                                },
                                                            )
                                                            setIsShowInput(!!kw)
                                                        }}
                                                        onPressEnter={(
                                                            e: any,
                                                        ) => {
                                                            setRescKeyword(
                                                                trim(
                                                                    e
                                                                        ?.currentTarget
                                                                        ?.value,
                                                                ),
                                                            )
                                                        }}
                                                        onBlur={() => {
                                                            if (
                                                                !rescSearchCondition?.keyword
                                                            ) {
                                                                setIsShowInput(
                                                                    false,
                                                                )
                                                            }
                                                        }}
                                                    />
                                                )}
                                                <div
                                                    className={
                                                        styles.rightOprBtnWrapper
                                                    }
                                                >
                                                    <Tooltip
                                                        title={__(
                                                            '搜索审核资源',
                                                        )}
                                                        placement="bottom"
                                                    >
                                                        <SearchOutlined
                                                            onClick={() => {
                                                                setIsShowInput(
                                                                    true,
                                                                )
                                                            }}
                                                            style={{
                                                                marginRight:
                                                                    '8px',
                                                                display:
                                                                    isShowInput
                                                                        ? 'none'
                                                                        : 'block',
                                                            }}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip
                                                        title={
                                                            !auditAllRescList?.length
                                                                ? __(
                                                                      '无可批量操作的审核资源',
                                                                  )
                                                                : __('批量操作')
                                                        }
                                                        placement={
                                                            !auditAllRescList?.length
                                                                ? 'bottomRight'
                                                                : 'bottom'
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                isShowCheckAll
                                                                    ? classnames(
                                                                          styles.checkAll,
                                                                          styles.checkAllIsShowing,
                                                                      )
                                                                    : classnames(
                                                                          styles.checkAll,
                                                                          !auditAllRescList?.length &&
                                                                              styles.checkAllDisabled,
                                                                      )
                                                            }
                                                            onClick={() => {
                                                                if (
                                                                    !auditAllRescList?.length
                                                                ) {
                                                                    return
                                                                }
                                                                setIsShowCheckAll(
                                                                    (prev) =>
                                                                        !prev,
                                                                )
                                                            }}
                                                        >
                                                            <FontIcon name="icon-piliangxuanze" />
                                                        </span>
                                                    </Tooltip>
                                                    <Tooltip
                                                        title={__(
                                                            '添加审核资源',
                                                        )}
                                                        placement="bottomRight"
                                                    >
                                                        <PlusOutlined
                                                            style={{
                                                                marginLeft:
                                                                    '8px',
                                                            }}
                                                            onClick={() =>
                                                                setSelRescModalOpen(
                                                                    true,
                                                                )
                                                            }
                                                        />
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            {auditAllRescList?.length ? (
                                                <>
                                                    {isShowCheckAll && (
                                                        <div
                                                            className={
                                                                styles.selectAllWrapper
                                                            }
                                                        >
                                                            <Checkbox
                                                                indeterminate={
                                                                    indeterminate
                                                                }
                                                                onChange={() => {
                                                                    if (
                                                                        checkedIdList?.length ===
                                                                        auditRescList?.length
                                                                    ) {
                                                                        setCheckedIdList(
                                                                            [],
                                                                        )
                                                                    } else {
                                                                        setCheckedIdList(
                                                                            auditRescList?.map(
                                                                                (
                                                                                    item,
                                                                                ) =>
                                                                                    item.id,
                                                                            ),
                                                                        )
                                                                    }
                                                                }}
                                                                checked={
                                                                    checkAll
                                                                }
                                                            >
                                                                <span
                                                                    style={{
                                                                        marginLeft:
                                                                            '8px',
                                                                    }}
                                                                >
                                                                    {checkedIdList?.length
                                                                        ? __(
                                                                              '已选${text}项',
                                                                              {
                                                                                  text: checkedIdList?.length,
                                                                              },
                                                                          )
                                                                        : __(
                                                                              '全选',
                                                                          )}
                                                                </span>
                                                            </Checkbox>
                                                            {checkedIdList?.length >
                                                                0 && (
                                                                <Popconfirm
                                                                    title={__(
                                                                        '确定要移除已选的${text}项审核资源吗？',
                                                                        {
                                                                            text:
                                                                                checkedIdList?.length ||
                                                                                '0',
                                                                        },
                                                                    )}
                                                                    okText={__(
                                                                        '确定',
                                                                    )}
                                                                    cancelText={__(
                                                                        '取消',
                                                                    )}
                                                                    placement="bottomLeft"
                                                                    onConfirm={(
                                                                        e,
                                                                    ) => {
                                                                        removeResc(
                                                                            checkedIdList,
                                                                        )
                                                                    }}
                                                                    icon={
                                                                        <InfoCircleFilled
                                                                            style={{
                                                                                color: '#FAAD14',
                                                                            }}
                                                                        />
                                                                    }
                                                                >
                                                                    <Tooltip
                                                                        title={
                                                                            !checkedIdList?.length
                                                                                ? __(
                                                                                      '请先选择审核资源',
                                                                                  )
                                                                                : undefined
                                                                        }
                                                                        placement="topRight"
                                                                    >
                                                                        <Button
                                                                            type="link"
                                                                            disabled={
                                                                                !checkedIdList?.length
                                                                            }
                                                                            ghost
                                                                            style={{
                                                                                padding:
                                                                                    '0',
                                                                            }}
                                                                        >
                                                                            {__(
                                                                                '移除',
                                                                            )}
                                                                        </Button>
                                                                    </Tooltip>
                                                                </Popconfirm>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div
                                                        className={
                                                            styles.rescListWrapper
                                                        }
                                                        ref={rescListContainer}
                                                    >
                                                        {/* {auditRescList?.map(
                                                            (item) =>
                                                                renderListItem(
                                                                    item,
                                                                ),
                                                        )} */}
                                                        {auditRescList?.length ? (
                                                            <List>
                                                                <VirtualList
                                                                    data={
                                                                        auditRescList
                                                                    }
                                                                    height={
                                                                        rescListHeight
                                                                    }
                                                                    // itemHeight={47}
                                                                    itemKey="id"
                                                                    onScroll={
                                                                        onRescListScroll
                                                                    }
                                                                >
                                                                    {(item) =>
                                                                        renderListItem(
                                                                            item,
                                                                        )
                                                                    }
                                                                </VirtualList>
                                                            </List>
                                                        ) : hasRescSearchCondition ? (
                                                            <Empty />
                                                        ) : (
                                                            <Empty
                                                                iconSrc={
                                                                    dataEmpty
                                                                }
                                                                desc={__(
                                                                    '暂无数据',
                                                                )}
                                                            />
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                renderEmpty()
                                            )}
                                        </div>
                                    ))}
                                {tabActiveKey ===
                                    SideInfoDrawerTabKey.AuditProcess && (
                                    <div className={styles.auditProcessWrapper}>
                                        {/* 审核流程 */}
                                        <div
                                            className={
                                                styles.auditProcessOprsWrapper
                                            }
                                        >
                                            <Tooltip
                                                title={__('设置审核流程')}
                                                placement="bottom"
                                                getPopupContainer={(n) => n}
                                            >
                                                <div>
                                                    <FontIcon
                                                        name="icon-shezhi"
                                                        style={{
                                                            fontSize: '16px',
                                                            color: '#000',
                                                            cursor: 'pointer',
                                                        }}
                                                        onClick={() => {
                                                            setIsSetWorkflowOpen(
                                                                true,
                                                            )
                                                        }}
                                                    />
                                                </div>
                                            </Tooltip>
                                            <Tooltip
                                                title={
                                                    detail?.proc_def_key
                                                        ? detail?.status ===
                                                          RescPolicyStatus.Enabled
                                                            ? __(
                                                                  '策略正在使用中，不能直接解绑，请先停用策略',
                                                              )
                                                            : __('解绑审核流程')
                                                        : __(
                                                              '尚未设置审核流程，无需解绑',
                                                          )
                                                }
                                                // placement="topRight"
                                                placement="bottomRight"
                                                getPopupContainer={(n) => n}
                                            >
                                                <div>
                                                    <UnbindOutlined
                                                        style={{
                                                            fontSize: '16px',
                                                            color:
                                                                detail?.proc_def_key &&
                                                                detail?.status !==
                                                                    RescPolicyStatus.Enabled
                                                                    ? '#000'
                                                                    : 'rgba(0,0,0,0.3)',
                                                            cursor:
                                                                detail?.proc_def_key &&
                                                                detail?.status !==
                                                                    RescPolicyStatus.Enabled
                                                                    ? 'pointer'
                                                                    : 'not-allowed',
                                                        }}
                                                        onClick={() =>
                                                            !!detail?.proc_def_key &&
                                                            detail?.status !==
                                                                RescPolicyStatus.Enabled &&
                                                            unBindWorkflow()
                                                        }
                                                    />
                                                </div>
                                            </Tooltip>
                                        </div>
                                        {/* 流程展示 */}
                                        <div
                                            className={
                                                styles.workflowViewWrapper
                                            }
                                        >
                                            {processLoading ? (
                                                <Loader />
                                            ) : workflow ? (
                                                <WorkflowViewPlugin
                                                    key={workflowKey}
                                                    isFixed={false}
                                                    className={
                                                        styles.workflowViewContWrapper
                                                    }
                                                    flowProps={
                                                        {
                                                            process_type:
                                                                processType,
                                                            visit: VisitType.Preview,
                                                            process_def_key:
                                                                workflow.key,
                                                            process_def_id:
                                                                workflow.id,
                                                            previewBox: {
                                                                background:
                                                                    '#fff',
                                                                height: tabContentHeight,
                                                                width: tabContentWidth,
                                                            },
                                                        } as any
                                                    }
                                                />
                                            ) : (
                                                renderEmpty()
                                            )}
                                        </div>
                                        {isSetWorkflowOpen && (
                                            <WorkflowViewPlugin
                                                key={`edit-${workflowKey}`}
                                                flowProps={{
                                                    allowEditName: false,
                                                    process_type: processType,
                                                    visit: workflow
                                                        ? VisitType.Update
                                                        : VisitType.New,
                                                    ...(workflow
                                                        ? {
                                                              process_def_id:
                                                                  workflow.id,
                                                              process_def_key:
                                                                  workflow.key,
                                                          }
                                                        : {}),
                                                    onCloseAuditFlow:
                                                        closeWorkflow,
                                                    onSaveAuditFlow:
                                                        saveWorkflow,
                                                }}
                                                className={
                                                    styles.setWorkflowWrapper
                                                }
                                            />
                                        )}
                                    </div>
                                )}
                                {tabActiveKey ===
                                    SideInfoDrawerTabKey.MoreInfo && (
                                    <div className={styles.moreInfoWrapper}>
                                        {moreInfoData.map((item) => {
                                            const {
                                                title = '--',
                                                infoList = [],
                                            } = item
                                            return (
                                                <>
                                                    <div
                                                        className={
                                                            styles.infoTitle
                                                        }
                                                    >
                                                        {title}
                                                    </div>
                                                    <DetailsLabel
                                                        detailsList={infoList}
                                                    />
                                                </>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CustomDrawer>
            )}
            {/* 选择审核资源 */}
            {selRescModalOpen && (
                <SelDataRescModal
                    open={selRescModalOpen}
                    originCheckedList={auditAllRescList || []}
                    onClose={() => setSelRescModalOpen(false)}
                    onSure={(items) => {
                        handleAddResource(items)
                    }}
                />
            )}

            {viewDetailOpen && (
                <LogicViewDetail
                    open={viewDetailOpen}
                    onClose={() => {
                        setViewDetailOpen(false)
                    }}
                    id={curOprResc?.id}
                    getContainer={getPopupContainer()}
                    fullHeight
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: 0,
                    }}
                />
            )}
            {indicatorDetailOpen && (
                <IndicatorViewDetail
                    open={indicatorDetailOpen}
                    id={curOprResc?.id}
                    onClose={() => {
                        setIndicatorDetailOpen(false)
                    }}
                    indicatorType={curOprResc?.sub_type || ''}
                    getContainer={getPopupContainer()}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: 0,
                    }}
                />
            )}
            {interfaceDetailOpen && (
                <div hidden={!interfaceDetailOpen}>
                    <ApplicationServiceDetail
                        open={interfaceDetailOpen}
                        onClose={() => {
                            setInterfaceDetailOpen(false)
                        }}
                        serviceCode={curOprResc?.id}
                        getContainer={getPopupContainer()}
                        style={{
                            position: 'fixed',
                            width: '100vw',
                            height: '100vh',
                            top: 0,
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export default memo(SideInfoDrawer)
