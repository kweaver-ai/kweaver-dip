/* eslint-disable no-param-reassign */
import { Button, message, Modal, Space } from 'antd'
import React, { useEffect, useRef, useState } from 'react'

import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { confirm } from '@/utils/modalHelper'
import { useQuery } from '@/utils'
// import ResourcesDirTree from './ResourcesDirTree'
// 资源分类数据还没确定数据来源，暂时使用资源目录分类树
import dataEmpty from '@/assets/dataEmpty.svg'
import CommonIcon from '@/components/CommonIcon'
import { disabledDate } from '@/components/MyAssets/helper'
import { SearchType } from '@/components/SearchLayout/const'
import {
    cancelPublishDataCatalogFile,
    deleteDataCatalogFile,
    formatError,
    getDataCatalogFileList,
    getSortOptionsList,
    publishDataCatalogFile,
    PublishStatus,
    SortDirection,
} from '@/core'
import { IQueryList, IRescItem } from '@/core/apis/dataFiles/index.d'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { AddOutlined } from '@/icons'
import { ReactComponent as script } from '@/icons/svg/outlined/script.svg'
import { ReactComponent as wizard } from '@/icons/svg/outlined/wizard.svg'
import { LightweightSearch, OptionBarTool, SearchInput } from '@/ui'
import { BusinessDomainType } from '../BusinessDomain/const'
import CommonTable from '../CommonTable'
import { FixedType } from '../CommonTable/const'
import DragBox from '../DragBox'
import DropDownFilter from '../DropDownFilter'
import ResourcesDirTree from '../ResourcesDir/ResourcesDirTree'
import { RescCatlgType } from '../ResourcesDir/const'
import { rescCatlgItems } from '../ResourcesDir/helper'
import { RefreshBtn, SortBtn } from '../ToolbarComponents'
import CreateFileBase from './CreateFileBase'
import UploadFileManage from './UploadFileManage'
import {
    // stateList,
    allNodeInfo,
    Architecture,
    CatlgTreeNode,
    createModelType,
    defaultMenu,
    lightweightSearchData,
    menus,
    OperationType,
    PublishStatusBgColors,
    PublishStatusColors,
    PublishStatusText,
    ResourceTag,
    typeAll,
} from './const'
import { ButtonGroupLists, ButtonLists, StatusTextBox } from './helper'
import __ from './locale'
import styles from './styles.module.less'

const initSearchCondition: IQueryList = {
    category_id: '',
    offset: 1,
    limit: 10,
    refreshNum: new Date().getTime(),
}

const DataFiles = () => {
    const navigate = useNavigate()
    const ref: any = useRef()
    const query = useQuery()
    // 接口编号
    const serviceCode = query.get('serviceCode') || ''
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const commonTableRef: any = useRef()
    const searchRef: any = useRef()
    const tableRef: any = useRef()

    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    // 左侧目录tabKey
    const [activeTabKey, setActiveTabKey] = useState<string>()

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        updatedAt: 'descend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    // 删除弹框显示,【true】显示,【false】隐藏
    const [delVisible, setDelVisible] = useState<boolean>(false)
    // 删除目录loading
    const [delBtnLoading, setDelBtnLoading] = useState<boolean>(false)
    // 模式弹窗
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [initEmptyFlag, setInitEmptyFlag] = useState<boolean>(false)
    const [hasSearchCondition, setHasSearchCondition] = useState<boolean>(false)
    const [{ using }] = useGeneralConfig()
    // 附件弹窗
    const [attachmentModalOpen, setAttachmentModalOpen] =
        useState<boolean>(false)
    const [fileDataId, setFileDataId] = useState<string>('')
    // 新建资源弹窗
    const [showCreate, setShowCreate] = useState<boolean>(false)
    const [selectedNode, setSelectedNode] = useState<CatlgTreeNode>({
        name: '全部',
        id: '',
        path: '',
        type: Architecture.ALL,
    })

    const [searchCondition, setSearchCondition] = useState<IQueryList>({
        ...initSearchCondition,
    })

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [departmentList, setDepartmentList] = useState<any[]>([])
    // 创建模型
    const [createModel, setCreateModel] = useState<createModelType>(
        createModelType.Wizard,
    )

    const [treeName, setTreeName] = useState<string>('')
    const showEditBtn = ['draft', 'offline', '']
    const showDelBtn = ['draft']
    const showPublishBtn = ['draft', 'offline']
    const showOnlineBtn = ['publish']
    const showOfflineBtn = ['online']

    useEffect(() => {
        const {
            sort,
            direction,
            offset,
            limit,
            subject_domain_id,
            department_id,
            category_id,
            keyword,
            publish_status,
            ...searchObj
        } = searchCondition
        setHasSearchCondition(Object.values(searchObj).some((item) => item))
    }, [searchCondition])

    // 查询form参数
    const [searchFormData, setSearchFormData] = useState<any[]>([
        {
            label: __('文件资源名称、编码'),
            key: 'keyword',
            type: SearchType.Input,
            itemProps: {
                value: serviceCode,
            },
            isAlone: true,
        },
        {
            label: __('资源状态'),
            key: 'publish_status',
            type: SearchType.Select,
            // defaultValue: '',
            itemProps: {
                options: [],
            },
            clearKey: 'auditState',
        },
        {
            label: __('更新时间'),
            key: 'times',
            type: SearchType.RangePicker,
            defaultValue: typeAll,
            itemProps: {
                format: 'YYYY-MM-DD',
                disabledDate: (current: any) => disabledDate(current, {}),
            },
        },
    ])

    useEffect(() => {
        getSortListOptions()
    }, [])

    // 点击目录项
    const [curCatlg, setCurCatlg] = useState<IRescItem>()

    const handleOperate = async (key: OperationType, record) => {
        setCurCatlg(record)
        let url
        try {
            switch (key) {
                case OperationType.DETAIL:
                    // 查看详情
                    url = `/data-files/detail?id=${record.id}`
                    navigate(url)
                    break
                case OperationType.DELETE:
                    // 删除
                    confirm({
                        title: __('确定要删除吗？'),
                        content: __('文件资源删除后，将无法找回，请谨慎操作！'),
                        onOk: async () => {
                            handleDelete(record.id)
                        },
                    })
                    break
                case OperationType.CHANGE:
                case OperationType.EDIT:
                    // 变更和编辑
                    setShowCreate(true)
                    setFileDataId(record.id)
                    break
                case OperationType.ATTACHMENT:
                    // 附件
                    setAttachmentModalOpen(true)
                    setFileDataId(record.id)
                    break
                case OperationType.PUBLISH:
                    // 发布
                    await publishDataCatalogFile(record.id)
                    setSearchCondition({
                        ...searchCondition,
                        offset: 1,
                    })
                    message.success(__('发布成功'))
                    break
                case OperationType.PUBLISH_AUDIT_RETRACT:
                    // 发布审核撤回
                    await cancelPublishDataCatalogFile(record.id)
                    setSearchCondition({
                        ...searchCondition,
                        offset: 1,
                    })
                    message.success(__('发布审核撤回成功'))
                    break
                default:
                    break
            }
        } catch (err) {
            formatError(err)
        }
    }

    const getSortListOptions = async () => {
        try {
            const data = await getSortOptionsList()

            setSearchFormData(
                searchFormData.map((item) => {
                    if (item.key === 'publish_status') {
                        return {
                            ...item,
                            itemProps: {
                                options: data.publish_status.map((it) => {
                                    return {
                                        value: it.key,
                                        label: __(it.text),
                                    }
                                }),
                            },
                        }
                    }
                    if (item.key === 'status') {
                        return {
                            ...item,
                            itemProps: {
                                options: data.updown_status.map((it) => {
                                    return {
                                        value: it.key,
                                        label: __(it.text),
                                    }
                                }),
                            },
                        }
                    }
                    return item
                }),
            )
        } catch (err) {
            formatError(err)
        }
    }

    // 查询
    const search = () => {
        commonTableRef?.current?.getData()
    }

    // 新增
    const toAdd = () => {
        setModalOpen(true)
    }

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('文件资源名称')}</span>
                    <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        ({__('编码')})
                    </span>
                </div>
            ),
            dataIndex: 'name',
            key: 'name', //
            sorter: true,
            sortOrder: tableSort.name,
            fixed: 'left',
            showSorterTooltip: {
                title: __('按文件资源名称排序'),
                placement: 'bottom',
                overlayInnerStyle: {
                    color: '#fff',
                },
            },
            render: (text, record) => {
                const resourceStatus = record.publish_status
                return (
                    <div className={styles.catlgBox}>
                        <div className={classnames(styles.catlgName)}>
                            <div className={styles.nameText}>
                                <span
                                    title={text}
                                    onClick={() =>
                                        handleOperate(
                                            OperationType.DETAIL,
                                            record,
                                        )
                                    }
                                    className={styles.name}
                                >
                                    {text || '--'}
                                </span>
                                {![
                                    PublishStatus.PUBLISHED,
                                    PublishStatus.UNPUBLISHED,
                                ].includes(resourceStatus) ? (
                                    <ResourceTag
                                        data={{
                                            text: PublishStatusText[
                                                resourceStatus
                                            ],
                                            color: PublishStatusColors[
                                                resourceStatus
                                            ],
                                            background:
                                                PublishStatusBgColors[
                                                    resourceStatus
                                                ],
                                            advice: record.audit_advice,
                                        }}
                                    />
                                ) : null}
                            </div>
                        </div>
                        <div
                            className={classnames(
                                styles.ellipsis,
                                styles.catlgCode,
                            )}
                            title={record.code}
                            style={{
                                color: 'rgba(0, 0, 0, 0.45)',
                                fontSize: '12px',
                            }}
                        >
                            {record.code}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('资源状态'),
            dataIndex: 'publish_status',
            ellipsis: true,
            key: 'publish_status',
            render: (text, record) => {
                const resourceStatus =
                    record.publish_status === PublishStatus.PUBLISHED
                        ? PublishStatus.PUBLISHED
                        : PublishStatus.UNPUBLISHED
                return (
                    <StatusTextBox
                        color={PublishStatusColors[resourceStatus]}
                        text={PublishStatusText[resourceStatus]}
                    />
                )
            },
            width: 180,
        },
        {
            title: __('所属组织架构'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (text, record) => {
                return (
                    <span title={record?.department_path}>
                        {text ? text || '--' : '--'}
                    </span>
                )
            },
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            sorter: true,
            sortOrder: tableSort.updatedAt,
            showSorterTooltip: {
                title: __('按更新时间排序'),
                placement: 'bottom',
                overlayInnerStyle: {
                    color: '#fff',
                },
            },
            ellipsis: true,
            width: 220,
            render: (text, record) => {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 260,
            fixed: FixedType.RIGHT,
            render: (text: string, record) => {
                // 上线相关操作
                const onlineOperationTypes = [
                    OperationType.ONLINE,
                    OperationType.OFFLINE,
                    OperationType.ONLINE_AUDIT_RETRACT,
                    OperationType.OFFLINE_AUDIT_RETRACT,
                ]
                const btnList = ButtonGroupLists.filter((item) =>
                    item.StatusGroup.includes(record?.publish_status),
                )
                const optionTypes = btnList.length
                    ? btnList[0].menus
                    : ButtonGroupLists[0].menus
                const buttonMenus = optionTypes.map(
                    (current) =>
                        ButtonLists.find((item) => item.key === current) ||
                        ButtonLists[0],
                )
                const newBtnList = buttonMenus.map((it) => {
                    if (
                        it.key === OperationType.PUBLISH &&
                        !record.attachment_count
                    ) {
                        return {
                            ...it,
                            disabled: true,
                            title: __('请先上传附件'),
                        }
                    }
                    return it
                })

                return (
                    <OptionBarTool
                        menus={newBtnList}
                        onClick={(key, e) => {
                            handleOperate(key as OperationType, record)
                        }}
                        getPopupContainer={(node) => tableRef.current || node}
                    />
                )
            },
        },
    ]

    // 获取选中的节点
    const getSelectedNode = (sn?: CatlgTreeNode, type?: RescCatlgType) => {
        // if: 在树结构中操作后获取选中项 else: 在列表中操作后 选中项不变，但要更新列表及详情
        let node
        if (sn) {
            node = { ...sn }
        } else {
            node = allNodeInfo
        }
        setTreeName(node.name)

        setSelectedNode(sn || allNodeInfo)

        if (type === RescCatlgType.ORGSTRUC) {
            setSearchCondition({
                ...searchCondition,
                department_id: node.id,
                offset: 1,
                category_id: undefined,
                subject_domain_id: undefined,
            })
        } else if (type === RescCatlgType.RESC_CLASSIFY) {
            setSearchCondition({
                ...searchCondition,
                category_id: node.id,
                offset: 1,
                department_id: undefined,
                subject_domain_id: undefined,
            })
        } else if (type === RescCatlgType.DOAMIN) {
            setSearchCondition({
                ...searchCondition,
                category_id: undefined,
                department_id: undefined,
                subject_domain_id: node.id,
                offset: 1,
            })
        }
    }

    const getCurTabKey = (tabKey: string) => {
        setActiveTabKey(tabKey)
    }

    const emptyDesc = () => {
        return (
            <div style={{ textAlign: 'center' }}>
                <div>{__('暂无数据')}</div>
            </div>
        )
    }

    const handleDelete = async (id: string) => {
        try {
            setDelBtnLoading(true)
            await deleteDataCatalogFile(id)
            setDelBtnLoading(false)
            message.success(__('删除成功'))
        } catch (e) {
            formatError(e)
        } finally {
            setDelBtnLoading(false)
            setDelVisible(false)
            search()
        }
    }

    const rowSelection = {
        onChange: (keys: React.Key[]) => {
            setSelectedRowKeys(keys)
        },
    }

    // 新增
    const modalHandleOk = () => {
        const departmentParam =
            activeTabKey === 'organization'
                ? `&departmentId=${selectedNode?.id || ''}`
                : ''
        const categoryParam =
            activeTabKey === 'resource'
                ? `&categoryId=${selectedNode?.id || ''}`
                : ''

        const subjectDomain =
            activeTabKey === RescCatlgType.DOAMIN &&
            [
                BusinessDomainType.subject_domain,
                BusinessDomainType.business_activity,
                BusinessDomainType.business_object,
            ].includes(selectedNode?.type as BusinessDomainType)
                ? `&domainId=${selectedNode?.id || ''}`
                : ''
        const url = `/dataService/interfaceService/create?createModel=${createModel}${
            departmentParam || categoryParam || subjectDomain
        }`

        navigate(url)
        setModalOpen(false)
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        })
        setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'updated_at':
                setTableSort({
                    updatedAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    name: null,
                })
                break
            case 'name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    updatedAt: null,
                })
                break
            default:
                setTableSort({
                    name: null,
                    updatedAt: null,
                })
                break
        }
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'updated_at') {
                setTableSort({
                    updatedAt: sorter.order || 'ascend',
                    name: null,
                })
            } else {
                setTableSort({
                    updatedAt: null,
                    name: sorter.order || 'ascend',
                })
            }
            return {
                key:
                    sorter.columnKey === 'service_name'
                        ? 'name'
                        : sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'updated_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    updatedAt: 'descend',
                    name: null,
                })
            } else {
                setTableSort({
                    updatedAt: 'ascend',
                    name: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                updatedAt: null,
                name: 'descend',
            })
        } else {
            setTableSort({
                updatedAt: null,
                name: 'ascend',
            })
        }
        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    const handleCreate = () => {
        setShowCreate(true)
    }

    const getListTemplate = () => {
        return (
            <div
                className={classnames(
                    styles.right,
                    !searchIsExpansion && styles.isExpansion,
                )}
                ref={tableRef}
            >
                <div className={styles.rigthTitle}>{__('文件')}</div>

                <div className={styles['operate-container']}>
                    <Button
                        icon={<AddOutlined />}
                        type="primary"
                        onClick={() => handleCreate()}
                    >
                        {__('新建')}
                    </Button>
                    <Space size={16}>
                        <Space size={8}>
                            <SearchInput
                                className={styles.nameInput}
                                style={{ width: 272 }}
                                placeholder={__('搜索文件资源名称、编码')}
                                onKeyChange={(kw: string) =>
                                    setSearchCondition({
                                        ...searchCondition,
                                        keyword: kw,
                                        offset: 1,
                                    })
                                }
                            />
                            <LightweightSearch
                                formData={lightweightSearchData}
                                onChange={(data, key) => {
                                    const { status, update_at } = data
                                    setSearchCondition({
                                        ...searchCondition,
                                        publish_status: status || null,
                                        offset: 1,
                                        updated_at_start:
                                            update_at?.[0] &&
                                            update_at[0]
                                                .startOf('day')
                                                ?.valueOf(),
                                        updated_at_end:
                                            update_at?.[1] &&
                                            update_at[1].endOf('day').valueOf(),
                                    })
                                }}
                                defaultValue={{
                                    status: '',
                                    update_at: null,
                                }}
                            />
                        </Space>
                        <span>
                            <SortBtn
                                contentNode={
                                    <DropDownFilter
                                        menus={menus}
                                        defaultMenu={defaultMenu}
                                        menuChangeCb={handleMenuChange}
                                        changeMenu={selectedSort}
                                    />
                                }
                            />
                            <RefreshBtn
                                onClick={() =>
                                    setSearchCondition({ ...searchCondition })
                                }
                            />
                        </span>
                    </Space>
                </div>

                <CommonTable
                    queryAction={getDataCatalogFileList}
                    params={searchCondition}
                    baseProps={{
                        columns: columns.filter(
                            (item) =>
                                !(['status'].includes(item.key) && using === 1),
                        ),
                        scroll: {
                            x: 1300,
                            y: `calc(100vh - ${
                                !searchIsExpansion
                                    ? hasSearchCondition
                                        ? 280 + 41
                                        : 280
                                    : hasSearchCondition
                                    ? 385 + 41
                                    : 385
                            }px)`,
                        },
                        rowKey: 'code',
                        rowClassName: styles.tableRow,
                    }}
                    ref={commonTableRef}
                    emptyDesc={
                        // getAccess(
                        //     `${ResourceType.service_management}.${RequestType.post}`,
                        // ) ? (
                        //     emptyDesc()
                        // ) : (
                        //     <div>{__('暂无数据')}</div>
                        // )
                        emptyDesc()
                    }
                    emptyIcon={dataEmpty}
                    emptyExcludeField={['direction', 'sort', 'department_id']}
                    getEmptyFlag={(flag) => {
                        setIsEmpty(flag)
                    }}
                    onTableListUpdated={() => {
                        setSelectedSort(undefined)
                    }}
                    onChange={(currentPagination, filters, sorter) => {
                        if (
                            currentPagination.current === searchCondition.offset
                        ) {
                            const selectedMenu = handleTableChange(sorter)
                            setSelectedSort(selectedMenu)
                            setSearchCondition({
                                ...searchCondition,
                                sort: selectedMenu.key,
                                direction: selectedMenu.sort,
                                offset: 1,
                                limit: currentPagination?.pageSize,
                            })
                        } else {
                            setSearchCondition({
                                ...searchCondition,
                                offset: currentPagination.current,
                            })
                        }
                    }}
                />
            </div>
        )
    }

    return (
        <div className={styles.serviceOverviewWrapper}>
            <DragBox
                defaultSize={defaultSize}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    <ResourcesDirTree
                        getCurTabKey={getCurTabKey}
                        getSelectedNode={getSelectedNode}
                        ref={ref}
                        initNodeType={[
                            Architecture.ORGANIZATION,
                            Architecture.DEPARTMENT,
                        ].join()}
                        selectOptions={rescCatlgItems.filter((currentTab) =>
                            [
                                // RescCatlgType.DOAMIN,
                                RescCatlgType.ORGSTRUC,
                            ].includes(currentTab.value),
                        )}
                        filterDomainType={[
                            BusinessDomainType.subject_domain_group,
                            BusinessDomainType.subject_domain,
                            BusinessDomainType.business_object,
                            BusinessDomainType.business_activity,
                        ]}
                        limitDomainTypes={[
                            BusinessDomainType.business_object,
                            BusinessDomainType.business_activity,
                        ]}
                        domainPlaceholder={__(
                            '搜索主题域分组、主题域、业务对象/活动',
                        )}
                        defaultActiveKey={RescCatlgType.ORGSTRUC}
                        unCategorizedKey="uncategory"
                    />
                </div>
                {getListTemplate()}
            </DragBox>

            {showCreate && (
                <CreateFileBase
                    onConfirm={(dataId?: string) => {
                        setSearchCondition((old) => {
                            const obj = {
                                ...old,
                                offset: dataId ? old.offset : 1,
                                refreshNum: Date.now(),
                            }
                            return obj
                        })

                        setShowCreate(false)
                        setFileDataId('')
                    }}
                    onCancel={() => {
                        setShowCreate(false)
                        setFileDataId('')
                    }}
                    show={showCreate}
                    dataId={fileDataId}
                />
            )}
            {attachmentModalOpen && (
                <UploadFileManage
                    id={fileDataId}
                    onClose={() => {
                        setAttachmentModalOpen(false)
                        setFileDataId('')
                        setSearchCondition({
                            ...searchCondition,
                            offset: 1,
                        })
                    }}
                    open={attachmentModalOpen}
                />
            )}

            {/* 选择模式 */}
            <Modal
                title={__('选择模式')}
                open={modalOpen}
                onOk={modalHandleOk}
                width={800}
                onCancel={() => setModalOpen(false)}
            >
                <div className={styles.selectMode}>
                    <div className={styles.modeBox}>
                        <div className={styles.leftMode}>
                            <div
                                onClick={() =>
                                    setCreateModel(createModelType.Wizard)
                                }
                                className={classnames(
                                    styles.modeBoxItem,
                                    createModelType.Wizard === createModel &&
                                        styles.active,
                                )}
                            >
                                <CommonIcon
                                    icon={wizard}
                                    className={styles.modeIcon}
                                />
                                <div>{__('您无需编写任何代码')}</div>
                                <div>{__('在界面勾选配置即可快速生成API')}</div>
                            </div>
                            <div className={styles.modeLabel}>
                                {__('向导模式')}
                            </div>
                        </div>
                        <div className={styles.leftMode}>
                            <div
                                onClick={() =>
                                    setCreateModel(createModelType.Script)
                                }
                                className={classnames(
                                    styles.modeBoxItem,
                                    createModelType.Script === createModel &&
                                        styles.active,
                                )}
                            >
                                <CommonIcon
                                    icon={script}
                                    className={styles.modeIcon}
                                />
                                <div>{__('自行编写脚本')}</div>
                                <div>
                                    {__('支持多表关联、复杂查询和聚合函数')}
                                </div>
                            </div>
                            <div className={styles.modeLabel}>
                                {__('脚本模式')}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default DataFiles
