import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, List, Space, message } from 'antd'
import { useSize, useUpdateEffect } from 'ahooks'
import { OperateType, streamToFile } from '@/utils'
import DropDownFilter from '../DropDownFilter'
import { defaultMenu, menus, ViewMode, UNGROUPED } from './const'
import {
    BizModelType,
    BusinessDomainLevelTypes,
    exportTable,
    formatError,
    getBusinessModelByDepartment,
    getCoreBusinesses,
    IBusinessDomainItem,
    ICoreBusinessesParams,
    ICoreBusinessItem,
    TaskType,
    cancelModalAudit,
    submitModalAudit,
    BusinessAuditType,
} from '@/core'
import CreateCoreBusiness from './CreateCoreBusiness'
import CoreBusinessCard from './CoreBusinessCard'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import Loader from '@/ui/Loader'
import { AddOutlined } from '@/icons'
import __ from './locale'
import CreateTask from '../TaskComponents/CreateTask'
import ProcessModel from './ProcessModel'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    SearchInput,
    ListDefaultPageSize,
    ListPagination,
    ListType,
} from '@/ui'
import { useBusinessModelContext } from './BusinessModelProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface ICoreBusiness {
    selectedNode: IBusinessDomainItem | any
    setSelectedNode: (node: any) => void
    viewMode: ViewMode
    architectureTreeRef?: any
    businessDomainTreeRef?: any
}

const CoreBusiness: React.FC<ICoreBusiness> = ({
    selectedNode,
    viewMode,
    setSelectedNode,
    architectureTreeRef,
    businessDomainTreeRef,
}) => {
    const [visible, setVisible] = useState(false)
    const [operateType, setOperateType] = useState<OperateType | TaskType>(
        OperateType.CREATE,
    )
    const [searchValue, setSearchValue] = useState('')
    const [coreBusinessList, setCoreBusinessList] = useState<
        ICoreBusinessItem[]
    >([])
    const [total, setTotal] = useState(0)

    const { businessModelType } = useBusinessModelContext()
    const [searchCondition, setSearchCondition] =
        useState<ICoreBusinessesParams>({
            limit: ListDefaultPageSize[ListType.CardList],
            offset: 1,
            sort: defaultMenu.key,
            direction: defaultMenu.sort,
            getall: true,
            node_id: '',
            model_type: businessModelType,
        })
    const [loading, setLoading] = useState(false)
    const [editItem, setEditItem] = useState<ICoreBusinessItem>()
    const ref = useRef<HTMLDivElement>(null)
    const [createTaskVisible, setCreateTaskVisible] = useState(false)
    const [createTaskType, setCreateTaskType] = useState<string>()
    const { checkPermission } = useUserPermCtx()

    const hasOprAccess = useMemo(
        () => checkPermission('manageBusinessModelAndBusinessDiagnosis'),
        [checkPermission],
    )

    // 新建任务默认值
    const createTaskData = useMemo(() => {
        const res: any[] = [
            {
                name: 'task_type',
                value: createTaskType,
                disabled: true,
            },
        ]

        return [
            ...res,
            {
                name: 'main_biz',
                value: {
                    id: editItem?.business_model_id,
                    name: editItem?.name,
                },
                disabled: true,
            },
        ]
    }, [createTaskType])

    // 列表大小
    const size = useSize(ref)
    const col = size
        ? (size?.width || 0) >= 1356
            ? 4
            : (size?.width || 0) >= 1012
            ? 3
            : (size?.width || 0) >= 668
            ? 2
            : 1
        : 3
    useUpdateEffect(() => {
        if (searchValue === searchCondition.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: searchValue,
            offset: 1,
        })
    }, [searchValue])

    useUpdateEffect(() => {
        setSearchCondition({
            ...searchCondition,
            offset: 1,
            node_id:
                selectedNode.id === UNGROUPED ||
                viewMode === ViewMode.InfoSystem
                    ? ''
                    : selectedNode.id,
            department_id:
                selectedNode.id === UNGROUPED ||
                viewMode === ViewMode.InfoSystem
                    ? ''
                    : selectedNode.id,
            info_system_id:
                selectedNode.id === UNGROUPED ||
                viewMode !== ViewMode.InfoSystem
                    ? ''
                    : selectedNode.id,
            getall: !selectedNode.id,
        })
    }, [selectedNode])

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
        })
    }

    // 获取业务模型列表
    const getCoreBusinessList = async () => {
        if (selectedNode?.type === BusinessDomainLevelTypes.Process) return
        try {
            setLoading(true)
            const res = await getCoreBusinesses(searchCondition)
            setCoreBusinessList(res.entries || [])
            setTotal(res.total_count)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 获取业务模型列表
    const getBusinessModel = async () => {
        try {
            setLoading(true)
            const res = await getBusinessModelByDepartment(searchCondition)
            setCoreBusinessList(res.entries || [])
            setTotal(res.total_count)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (viewMode === ViewMode.Department) {
            getBusinessModel()
        } else if (viewMode === ViewMode.InfoSystem) {
            getBusinessModel()
        } else {
            getCoreBusinessList()
        }
    }, [searchCondition])

    const exportBusinessTable = async (item: ICoreBusinessItem) => {
        try {
            const res = await exportTable({
                business_model_id: item.id,
                is_draft: item?.has_draft,
            })
            const businessTableMap = {
                business: __('业务表清单'),
                data: __('数据表清单'),
            }
            streamToFile(
                res,
                `${item.name}_${
                    businessTableMap[businessModelType]
                }_${new Date().getTime()}.xlsx`,
            )
        } catch (error) {
            const text = new TextDecoder('utf-8').decode(error.data)
            message.error(JSON.parse(text).description || '导出失败')
        }
    }

    const handleOperate = (
        type: OperateType | TaskType,
        item?: ICoreBusinessItem,
    ) => {
        setEditItem(item)
        const auditType =
            businessModelType === BizModelType.BUSINESS
                ? BusinessAuditType.BusinessModelPublish
                : BusinessAuditType.DataModelPublish
        // TODO:导出
        if (type === OperateType.EXPORT && item) {
            exportBusinessTable(item)
            return
        }
        // 撤销
        if (type === OperateType.REVOCATION && item) {
            onRevokeAudit(item, auditType)
            return
        }
        // 提交
        if (type === OperateType.SUBMIT && item) {
            onSubmitAudit(item, auditType)
            return
        }
        if (Object.values(TaskType).includes(type as TaskType)) {
            setCreateTaskType(type)
            setCreateTaskVisible(true)
        } else {
            setOperateType(type)
            setVisible(true)
        }
    }

    // 撤销审核
    const onRevokeAudit = async (
        item: ICoreBusinessItem,
        auditType: BusinessAuditType,
    ) => {
        try {
            setLoading(true)
            await cancelModalAudit(item.id, auditType)
            setSearchCondition({ ...searchCondition })
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 提交审核
    const onSubmitAudit = async (
        item: ICoreBusinessItem,
        auditType: BusinessAuditType,
    ) => {
        try {
            setLoading(true)
            await submitModalAudit(item.id, auditType)
            setSearchCondition({ ...searchCondition })
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const onCreateSuccess = async (relatedDept?: {
        id: string
        name: string
        domain_id?: string
    }) => {
        setVisible(false)
        // 更新架构树 数量
        if (relatedDept?.domain_id && viewMode === ViewMode.BArchitecture) {
            await businessDomainTreeRef.current?.execNode(
                OperateType.PLUS,
                relatedDept.domain_id,
            )
        }

        if (selectedNode.type === BusinessDomainLevelTypes.Process) {
            setSelectedNode({ ...selectedNode })
        } else {
            if (
                selectedNode.id === UNGROUPED &&
                viewMode === ViewMode.Department
            ) {
                // 部门未分组下创建模型，跳转到对应的部门下
                architectureTreeRef?.current.setCurrentNode(relatedDept)
                return
            }

            if (
                selectedNode.id === UNGROUPED &&
                viewMode === ViewMode.BArchitecture
            ) {
                // 选择业务流程则跳转对应的流程 未选业务流程 则刷新未分组列表
                if (relatedDept?.domain_id) {
                    businessDomainTreeRef?.current.setCurrentNode({
                        ...relatedDept,
                        type: BusinessDomainLevelTypes.Process,
                    })
                } else {
                    businessDomainTreeRef?.current.setCurrentNode({
                        ...selectedNode,
                    })
                }
                return
            }
            if (
                selectedNode.id === UNGROUPED &&
                viewMode === ViewMode.InfoSystem
            ) {
                businessDomainTreeRef?.current.setCurrentNode({
                    ...selectedNode,
                })
            }
            setSearchCondition({ ...searchCondition })
        }
    }

    const onDeleteSuccess = async (delItem: ICoreBusinessItem) => {
        setSearchCondition({
            ...searchCondition,
            offset:
                coreBusinessList.length === 1
                    ? (searchCondition.offset || 1) - 1 || 1
                    : searchCondition.offset,
        })
        // 更新架构树 数量
        await businessDomainTreeRef.current?.execNode(
            OperateType.MINUS,
            delItem.domain_id,
        )
    }

    const handlePageChange = (offset: number, limit: number) => {
        setSearchCondition({ ...searchCondition, offset, limit })
    }

    const renderEmpty = useCallback(() => {
        // 未搜索 没数据
        if (total === 0 && !searchCondition.keyword) {
            return (
                <Empty
                    desc={
                        businessModelType === BizModelType.BUSINESS
                            ? hasOprAccess
                                ? __('暂无业务模型，点击上方按钮可新建')
                                : __('暂无业务模型')
                            : hasOprAccess
                            ? __('暂无数据模型，点击上方按钮可新建')
                            : __('暂无数据模型')
                    }
                    iconSrc={dataEmpty}
                />
            )
        }
        if (total === 0 && searchCondition.keyword) {
            return <Empty />
        }

        return null
    }, [viewMode, searchCondition, total])

    // const searchChange = (data, key) => {
    //     setSearchCondition({
    //         ...searchCondition,
    //         is_all: data[key],
    //     })
    // }

    return (
        <div className={styles.coreBusinessWrapper}>
            <div className={styles.title}>
                {businessModelType === BizModelType.BUSINESS
                    ? __('业务模型')
                    : __('数据模型')}
            </div>
            {selectedNode?.type === BusinessDomainLevelTypes.Process ? (
                <ProcessModel
                    handleOperate={handleOperate}
                    processNode={selectedNode}
                    businessDomainTreeRef={businessDomainTreeRef}
                />
            ) : (
                <>
                    <div className={styles.top}>
                        <div className={styles.topLeft}>
                            <Button
                                type="primary"
                                icon={<AddOutlined />}
                                onClick={() =>
                                    handleOperate(OperateType.CREATE)
                                }
                                hidden={!hasOprAccess}
                                style={{ marginRight: 12 }}
                            >
                                {businessModelType === BizModelType.BUSINESS
                                    ? __('新建业务模型')
                                    : __('新建数据模型')}
                            </Button>
                            {/* <CreateTaskSelect
                                taskItems={[TaskType.NEWMAINBUSINESS]}
                                onSelected={(type) => {
                                    setCreateTaskType(type)
                                    setCreateTaskVisible(true)
                                }}
                                hidden={
                                    !getAccess(
                                        `${ResourceType.task}.${RequestType.post}`,
                                    )
                                }
                            /> */}
                        </div>
                        <Space style={{ marginTop: '16px' }}>
                            <SearchInput
                                className={styles.nameInput}
                                placeholder={
                                    businessModelType === BizModelType.BUSINESS
                                        ? __('搜索业务模型')
                                        : __('搜索数据模型')
                                }
                                value={searchValue}
                                onKeyChange={(value: string) =>
                                    setSearchValue(value)
                                }
                                style={{ width: 272 }}
                            />
                            {/* {viewMode === ViewMode.Department && (
                                <LightweightSearch
                                    formData={searchData}
                                    onChange={(data, key) =>
                                        searchChange(data, key)
                                    }
                                    defaultValue={{ is_all: true }}
                                />
                            )} */}
                            <Space size={0}>
                                <SortBtn
                                    contentNode={
                                        <DropDownFilter
                                            menus={menus}
                                            defaultMenu={defaultMenu}
                                            menuChangeCb={handleMenuChange}
                                        />
                                    }
                                />
                                <RefreshBtn
                                    onClick={() =>
                                        setSearchCondition({
                                            ...searchCondition,
                                            offset: 1,
                                        })
                                    }
                                />
                            </Space>
                        </Space>
                    </div>
                    {loading ? (
                        <Loader />
                    ) : total > 0 ? (
                        <div className={styles.bottom} ref={ref}>
                            <div className={styles.listWrapper}>
                                <List
                                    grid={{
                                        gutter: 20,
                                        column: col,
                                    }}
                                    dataSource={coreBusinessList}
                                    renderItem={(item) => (
                                        <List.Item
                                            style={{
                                                maxWidth:
                                                    (size?.width ||
                                                        0 - (col - 1) * 20) /
                                                    col,
                                            }}
                                        >
                                            <CoreBusinessCard
                                                item={item}
                                                handleOperate={(type) =>
                                                    handleOperate(type, item)
                                                }
                                                onDeleteSuccess={
                                                    onDeleteSuccess
                                                }
                                                viewMode={viewMode}
                                            />
                                        </List.Item>
                                    )}
                                    className={styles.list}
                                    locale={{
                                        emptyText: (
                                            <Empty
                                                desc={__('暂无数据')}
                                                iconSrc={dataEmpty}
                                            />
                                        ),
                                    }}
                                />
                            </div>
                            <ListPagination
                                listType={ListType.CardList}
                                queryParams={searchCondition}
                                totalCount={total}
                                onChange={handlePageChange}
                            />
                        </div>
                    ) : (
                        <div className={styles.emptyWrapper}>
                            {renderEmpty()}
                        </div>
                    )}
                </>
            )}

            <CreateCoreBusiness
                visible={visible}
                operateType={operateType as OperateType}
                setOperateType={setOperateType}
                onClose={() => setVisible(false)}
                onSuccess={onCreateSuccess}
                selectedNode={selectedNode}
                viewMode={viewMode}
                editId={editItem?.main_business_id || editItem?.id}
            />
            <CreateTask
                show={createTaskVisible}
                operate={OperateType.CREATE}
                title={__('新建任务')}
                defaultData={createTaskData}
                isSupportFreeTask
                onClose={() => {
                    setCreateTaskVisible(false)
                    setCreateTaskType(undefined)
                }}
            />
        </div>
    )
}

export default CoreBusiness
