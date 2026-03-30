import { ExclamationCircleFilled } from '@ant-design/icons'
import { useSize } from 'ahooks'
import { Button, Form, Input, message, Space, Table, Tooltip } from 'antd'
import classnames from 'classnames'
import { trim } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    batchDelCodeRules,
    CatalogOption,
    CatalogType,
    delCodeRule,
    formatError,
    getCRuleListByFileCatalogSearch,
    getCRuleListByFileSearch,
    getCRuleListBySearch,
    ICRuleItem,
    ICRuleQuery,
    IDirItem,
    IDirQueryType,
    SortDirection,
    updateCodeRuleStatus,
} from '@/core'
import { AddOutlined } from '@/icons'
import {
    LightweightSearch,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import {
    ErrorInfo,
    keyboardCharactersReg,
    OperateType,
    Source,
    StandardizationType,
    stardOrignizeTypeAll,
    stateOptionList,
    StateType,
} from '@/utils'
import { confirm } from '@/utils/modalHelper'
import Confirm from '../Confirm'
import EditDirModal from '../Directory/EditDirModal'
import DropDownFilter from '../DropDownFilter'
import { StdTreeDataOpt } from '../StandardDirTree/const'
import CodeRuleDetails from './CodeRuleDetails'
import {
    defaultMenu,
    menus,
    OptionType,
    searchData,
    SortType,
    StandardSort,
} from './const'
import EditCodeRule from './EditCodeRule'
import __ from './locale'
import styles from './styles.module.less'
import ViewDataElement from './ViewDataElement'

const initSearchCondition = {
    source: Source.ALL,
    sort: 'update_time',
    direction: SortDirection.DESC,
    offset: 1,
    limit: 20,
}
interface ISelectedItem {
    page: number
    selectedKeys: React.Key[]
}
interface IRuleDetails {
    selectedDir: IDirItem | undefined
    getTreeList: (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
        newSelectedDir?: any,
    ) => void
    setSelectedDir: (selectedDir: IDirItem | undefined) => void
    selCatlgClass: CatalogOption
}
const RuleDetails: React.FC<IRuleDetails> = ({
    selectedDir,
    getTreeList,
    setSelectedDir,
    selCatlgClass = CatalogOption.AUTOCATLG,
}: IRuleDetails) => {
    const { checkPermission } = useUserPermCtx()

    const [searchValue, setSearchValue] = useState('')
    const [searchCondition, setSearchCondition] = useState<ICRuleQuery>({
        keyword: searchValue,
        ...initSearchCondition,
    })
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    const [createVisible, setCreateVisible] = useState(false)
    const [detailVisible, setDetailVisible] = useState(false)
    const [viewDataEleVisible, setViewDataEleVisible] = useState(false)
    const [editMoveToVisible, setEditMoveToVisible] = useState(false)

    const [operateType, setOperateType] = useState(OperateType.CREATE)
    const [operateData, setOperateData] = useState<ICRuleItem>()
    const [loading, setLoading] = useState(true)
    const ref = useRef<HTMLDivElement>(null)
    const [menuValue, setMenuValue] = useState<
        { key: SortType; sort: SortDirection } | undefined
    >(defaultMenu)

    const [totalCount, setTotalCount] = useState(0)

    // 停用文件对话框显示,【true】显示,【false】隐藏
    const [disableFileVisible, setDisableFileVisible] = useState(false)

    const [disabledId, setDisabledId] = useState<string>('')

    // 请求加载
    const [isLoading, setIsLoading] = useState(false)

    const [dataSource, setDataSource] = useState<ICRuleItem[]>([])

    // 停用form
    const [disableForm] = Form.useForm()

    // 列表大小
    const size = useSize(ref)

    const isCanMoveOrDelete = useMemo(
        () => selectedRowKeys.length > 0,
        [selectedRowKeys],
    )

    const isSearch = useMemo(() => {
        const { org_type, keyword } = searchCondition
        const res = org_type !== undefined || trim(keyword)
        return res
    }, [searchCondition])

    // 输入框改变回调
    const handleSearchChange = (e: any) => {
        const { value } = e.target
        // 点击× 清空 重新请求数据
        if (!value || e.type === 'click') {
            setSearchCondition({
                ...searchCondition,
                keyword: value,
            })
        }
        setSearchValue(value)
    }

    // 回车搜索
    const handlePressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        if (keyword === searchCondition?.keyword) return
        setSearchValue(keyword)
        const params = JSON.parse(JSON.stringify(searchCondition))
        params.keyword = keyword
        params.offset = 1
        setSearchCondition(params)
    }

    // 获取编码规则列表
    const getCodeRules = async (params: any) => {
        if (!selectedDir?.id) return
        const { offset, limit } = params
        try {
            setLoading(true)
            let res: any = { total_count: 0, data: [] }
            if (selCatlgClass === CatalogOption.DEPARTMENT) {
                res = await getCRuleListBySearch({
                    ...searchCondition,
                    keyword: searchValue,
                    offset,
                    limit,
                    department_id: selectedDir?.id,
                })
            } else if (selCatlgClass === CatalogOption.STDFILECATLG) {
                if (selectedDir.stdFileCatlgType === 'file') {
                    const { catalog_id, ...rest } = searchCondition
                    res = await getCRuleListByFileSearch({
                        ...rest,
                        keyword: searchValue,
                        offset,
                        limit,
                        file_id: selectedDir?.id,
                    })
                } else {
                    const { file_id, ...rest } = searchCondition
                    res = await getCRuleListByFileCatalogSearch({
                        ...rest,
                        keyword: searchValue,
                        offset,
                        limit,
                        catalog_id: selectedDir?.id,
                    })
                }
            } else {
                const { file_id, ...rest } = searchCondition
                res = await getCRuleListBySearch({
                    ...rest,
                    keyword: searchValue,
                    offset,
                    limit,
                    catalog_id: selectedDir?.id,
                })
            }
            setLoading(false)
            setTotalCount(res.total_count)
            setDataSource(res.data)
        } catch (error) {
            setLoading(false)
            formatError({ error })
        } finally {
            setMenuValue(undefined)
        }
    }

    useEffect(() => {
        setSearchCondition({
            ...searchCondition,
            keyword: '',
            offset: 1,
        })
        setSearchValue('')
    }, [selectedDir?.id])

    useEffect(() => {
        getCodeRules(searchCondition)
    }, [searchCondition])

    useEffect(() => {
        setSelectedRowKeys([])
    }, [searchCondition])

    // 状态变化
    const handleStatusChange = (e: StateType) => {
        setSearchCondition({
            ...searchCondition,
            state: e,
            keyword: searchValue,
        })
    }

    // 状态变化
    const handleOrgTypeChange = (e) => {
        setSearchCondition({
            ...searchCondition,
            org_type: e === StandardizationType.All ? undefined : e,
            keyword: searchValue,
            offset: 1,
        })
    }

    // 来源变化
    const handleSourceChange = (e: Source) => {
        setSearchCondition({
            ...searchCondition,
            source: e,
            keyword: searchValue,
        })
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu: any) => {
        const { key, sort } = selectedMenu
        if (key === searchCondition.sort && sort === searchCondition.direction)
            return
        setMenuValue(selectedMenu)
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            offset: 1,
        })
    }

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys)
    }

    // const used_flag = (record: any): MenuProps['items'] =>
    //     [
    //         checkPermission('manageDataStandard')
    //             ? {
    //                   label: (
    //                       <Tooltip
    //                           title={
    //                               record.used_flag
    //                                   ? ''
    //                                   : __('未被任何数据元引用')
    //                           }
    //                       >
    //                           {__('查看引用')}
    //                       </Tooltip>
    //                   ),
    //                   key: OperateType.DETAIL,
    //                   disabled: !record.used_flag,
    //               }
    //             : null,
    //         checkPermission('manageDataStandard')
    //             ? {
    //                   label: (
    //                       <div
    //                           className={
    //                               record.source === Source.SYSTEM ||
    //                               record.used_flag
    //                                   ? 'forbid-delete'
    //                                   : 'can-delete'
    //                           }
    //                       >
    //                           <Tooltip
    //                               title={
    //                                   record.source === Source.SYSTEM
    //                                       ? __('系统预置，不能删除')
    //                                       : record.used_flag
    //                                       ? __('已被引用，不能删除')
    //                                       : ''
    //                               }
    //                           >
    //                               {__('删除')}
    //                           </Tooltip>
    //                       </div>
    //                   ),
    //                   key: OperateType.DELETE,
    //               }
    //             : null,
    //     ].filter((item) => item)

    // 单个删除编码规则
    const deleteCodeRule = async (id: string) => {
        try {
            await delCodeRule(id)
            message.success(__('删除成功'))
            if (selCatlgClass !== CatalogOption.STDFILECATLG) {
                getTreeList(undefined, undefined, selectedDir)
            }
            setSearchCondition({
                ...searchCondition,
                offset: 1,
            })
            // 在选中时 删除选中行，更新选中项
            if (selectedRowKeys.length > 0) {
                const tempKeys = selectedRowKeys.filter((key) => key !== id)
                setSelectedRowKeys(tempKeys)
            }
        } catch (error) {
            formatError({ error })
        }
    }

    // 删除确认提示
    const deleteConfirm = (okCallBack: () => void) => {
        confirm({
            title: __('确认删除吗？'),
            icon: <ExclamationCircleFilled className="delIcon" />,
            content: __('「编码规则」删除后不能恢复，确定要删除吗？'),
            okText: __('确定'),
            cancelText: __('取消'),
            onOk() {
                okCallBack()
            },
        })
    }
    const handleClickMore = (key: string, record: ICRuleItem) => {
        if (key === OperateType.DELETE) {
            if (!(record.source === Source.SYSTEM || record.used_flag)) {
                deleteConfirm(() => deleteCodeRule(record.id))
            }
        }
        if (key === OperateType.DETAIL) {
            if (record.used_flag) {
                setOperateData(record)
                setViewDataEleVisible(true)
            }
        }
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: '32px',
    }

    // 设置操作数据及弹窗打开
    const handleOperate = (ot: OperateType, data?: ICRuleItem) => {
        setOperateType(ot)
        if ([OperateType.CREATE, OperateType.EDIT].includes(ot)) {
            setCreateVisible(true)
        }
        if (ot === OperateType.DETAIL) {
            setDetailVisible(true)
        }
        if (data) {
            setOperateData(data)
        } else {
            setOperateData(undefined)
        }
    }

    // 操作成功之后更新左侧树及table数据
    const hanleAfterOpr = (
        type: OperateType,
        newSelectedDir?: any,
        filterParams?: any,
    ) => {
        if (selCatlgClass === CatalogOption.AUTOCATLG) {
            getTreeList(undefined, undefined, newSelectedDir)
        } else {
            getTreeList(
                {
                    type: CatalogType.CODINGRULES,
                    catlgOption: CatalogOption.STDFILECATLG,
                },
                StdTreeDataOpt.Load,
            )
        }
        setSearchCondition(
            filterParams
                ? {
                      ...searchCondition,
                      catalog_id:
                          newSelectedDir.id || searchCondition?.catalog_id,
                      offset: 1,
                  }
                : { ...filterParams, offset: 1 },
        )
    }

    // 批量删除
    const batchDel = async () => {
        try {
            await batchDelCodeRules(selectedRowKeys as string[])
            message.success(__('删除成功'))
            if (selCatlgClass === CatalogOption.AUTOCATLG) {
                getTreeList(undefined, undefined, selectedDir)
            }
            setSearchCondition({
                ...searchCondition,
                offset: 1,
            })
            setSelectedRowKeys([])
        } catch (error: any) {
            switch (error.data.code) {
                case 'Standardization.RequestError.FormatIncorrect':
                    error({
                        title: __('不能删除'),
                        content: __(
                            '选择的编码规则中包含被数据元引用或系统预置编码规则，请先处理后再尝试删除。',
                        ),
                        icon: <ExclamationCircleFilled />,
                    })

                    break
                default:
                    formatError({ error })
            }
        }
    }

    // 批量删除确认
    const handleBatchDelete = async () => {
        deleteConfirm(batchDel)
    }

    // 是否至少有一种操作权限
    const hasOprAccess = useMemo(
        () => checkPermission('manageDataStandard'),
        [checkPermission],
    )

    const getMenusItems = (record) => {
        const allMenus = [
            {
                key: OptionType.STATE,
                label:
                    record.state === StateType.ENABLE ? __('停用') : __('启用'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OptionType.EDIT,
                label: __('编辑'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OptionType.USED,
                label: __('查看引用'),
                title: record.used_flag ? '' : __('未被任何数据元引用'),
                menuType: OptionMenuType.Menu,
                disabled: !record.used_flag,
            },
            {
                key: OptionType.DELETE,
                label: __('删除'),
                menuType: OptionMenuType.Menu,
            },
        ]

        return allMenus.filter((currentData) => {
            switch (currentData.key) {
                case OptionType.STATE:
                case OptionType.EDIT:
                    return hasOprAccess
                case OptionType.USED:
                    return hasOprAccess
                case OptionType.DELETE:
                    return hasOprAccess
                default:
                    return true
            }
        })
    }

    const columns: any = [
        {
            title: __('编码规则名称'),
            dataIndex: 'name',
            // width: 150,
            ellipsis: true,
            fixed: 'left',
            render: (_, record) =>
                record?.name ? (
                    <span
                        onClick={() => {
                            handleOperate(OperateType.DETAIL, record)
                        }}
                        className={styles.textName}
                    >
                        {record?.name}
                    </span>
                ) : (
                    '--'
                ),
        },
        {
            title: __('标准分类'),
            dataIndex: 'org_type',
            width: 150,
            ellipsis: true,
            render: (value, record) =>
                StandardSort.find((currentData) => currentData.value === value)
                    ?.label || '--',
        },
        {
            title: __('所属组织结构'),
            dataIndex: 'department_name',
            key: 'department_name',
            width: 180,
            ellipsis: true,
            render: (value, record) => (
                <span title={record.department_path_names || ''}>
                    {record.department_name || '--'}
                </span>
            ),
        },
        // {
        //     title: __('所属目录'),
        //     dataIndex: 'catalog_name',
        //     width: 172,
        //     ellipsis: true,
        //     render: (value, record) => (
        //         <Tooltip
        //             overlayStyle={{ maxWidth: '500px' }}
        //             placement="top"
        //             title={
        //                 <div
        //                     style={{
        //                         padding: '8px',
        //                     }}
        //                 >
        //                     <div
        //                         style={{
        //                             wordBreak: 'break-all',
        //                         }}
        //                     >
        //                         {record.full_catalog_name}
        //                     </div>
        //                 </div>
        //             }
        //             color="#fff"
        //             overlayInnerStyle={{
        //                 color: 'rgba(0,0,0,0.85)',
        //             }}
        //             getPopupContainer={(node) => document.body}
        //         >
        //             {value}
        //         </Tooltip>
        //     ),
        // },
        {
            title: __('状态'),
            dataIndex: 'state',
            width: 120,
            sorter: true,
            sortOrder:
                searchCondition.sort === 'state'
                    ? searchCondition.direction === SortDirection.ASC
                        ? 'ascend'
                        : 'descend'
                    : null,
            showSorterTooltip: false,
            render: (state: StateType) => {
                const res = stateOptionList?.find((item) => item.key === state)
                return (
                    <div
                        className={classnames(
                            styles.baseTableRow,
                            styles.statusRow,
                        )}
                    >
                        <div
                            className={classnames(
                                styles.status,
                                state === StateType.DISABLE &&
                                    styles.disableStatus,
                            )}
                        >
                            {res?.label || '--'}
                        </div>
                    </div>
                )
            },
        },

        hasOprAccess
            ? {
                  title: __('操作'),
                  fixed: 'right',
                  width: 220,
                  key: 'action',
                  render: (_: string, record: ICRuleItem) => (
                      <OptionBarTool
                          menus={getMenusItems(record)}
                          onClick={(key, e) => {
                              switch (key) {
                                  case OptionType.STATE:
                                      if (record.state === StateType.ENABLE) {
                                          setDisableFileVisible(true)
                                          setDisabledId(record.id)
                                      } else {
                                          handleChangeFileState(
                                              record.id,
                                              StateType.ENABLE,
                                          )
                                      }
                                      break
                                  case OptionType.EDIT:
                                      handleOperate(OperateType.EDIT, record)
                                      break
                                  case OptionType.USED:
                                      setOperateData(record)
                                      setViewDataEleVisible(true)
                                      break
                                  case OptionType.DELETE:
                                      deleteConfirm(() =>
                                          deleteCodeRule(record.id),
                                      )
                                      break
                                  default:
                                      break
                              }
                          }}
                      />
                  ),
              }
            : {},
    ].filter((item) => item.key || item.dataIndex)

    const showEmpty = () => {
        if (dataSource.length > 0 || isLoading) return null

        if (isSearch) {
            return <Empty />
        }

        const desc = __('暂无数据')
        return <Empty desc={desc} iconSrc={dataEmpty} />
    }

    const searchChange = (data: any, dataKey: any) => {
        if (!dataKey) {
            setSearchCondition({
                ...searchCondition,
                keyword: searchValue,
                ...data,
                offset: 1,
            })
        } else if (dataKey === 'org_type') {
            handleOrgTypeChange(data[dataKey])
        }
    }

    const handleChangeFileState = async (
        id: string,
        state: StateType,
        values?: {
            reason: string
        },
    ) => {
        try {
            setIsLoading(true)
            await updateCodeRuleStatus(id, { state, ...(values || {}) })
            setSearchCondition({ ...searchCondition, offset: 1 })
            if (state === StateType.ENABLE) {
                message.success('启用成功')
            } else {
                message.success('停用成功')
            }
            setDisableFileVisible(false)
            disableForm.resetFields()
        } catch (error: any) {
            if (error.errorFields) {
                return
            }
            formatError(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSortChange = (pagination: any, filters: any, sorter: any) => {
        if (sorter?.order) {
            setSearchCondition({
                ...searchCondition,
                sort: sorter.field,
                direction:
                    sorter.order === 'descend'
                        ? SortDirection.DESC
                        : SortDirection.ASC,
                offset: pagination.current,
                limit: pagination.pageSize,
            })
            setMenuValue({
                key: sorter.field,
                sort:
                    sorter.order === 'descend'
                        ? SortDirection.DESC
                        : SortDirection.ASC,
            })
        } else {
            setSearchCondition({
                ...searchCondition,
                offset: pagination.current,
                limit: pagination.pageSize,
            })
        }
    }

    return (
        <div className={styles.ruledDetailsWrapper}>
            <div className={styles.operateWrapper} ref={ref}>
                <Space size={8} className={styles.operateItem}>
                    {hasOprAccess &&
                        (selCatlgClass === CatalogOption.AUTOCATLG ||
                            selCatlgClass === CatalogOption.DEPARTMENT) && (
                            <Button
                                type="primary"
                                icon={<AddOutlined />}
                                onClick={() =>
                                    handleOperate(OperateType.CREATE)
                                }
                            >
                                {__('新建编码规则')}
                            </Button>
                        )}
                    {hasOprAccess &&
                        (selCatlgClass === CatalogOption.AUTOCATLG ||
                            selCatlgClass === CatalogOption.DEPARTMENT) && (
                            <Tooltip
                                title={
                                    isCanMoveOrDelete
                                        ? ''
                                        : __('请先选择编码规则')
                                }
                            >
                                <Button
                                    disabled={!isCanMoveOrDelete}
                                    onClick={() => setEditMoveToVisible(true)}
                                >
                                    {__('移动至')}
                                </Button>
                            </Tooltip>
                        )}
                    {hasOprAccess && (
                        <Tooltip
                            title={
                                isCanMoveOrDelete ? '' : __('请先选择编码规则')
                            }
                        >
                            <Button
                                disabled={!isCanMoveOrDelete}
                                onClick={handleBatchDelete}
                            >
                                {__('删除')}
                            </Button>
                        </Tooltip>
                    )}
                </Space>
                <Space className={styles.operateItem}>
                    <SearchInput
                        placeholder={__('搜索编码规则名称')}
                        onKeyChange={(kw: string) => handlePressEnter(kw)}
                        style={{ width: 272 }}
                    />
                    <LightweightSearch
                        formData={searchData}
                        onChange={(data, key) => searchChange(data, key)}
                        defaultValue={{ org_type: stardOrignizeTypeAll }}
                    />
                    <Space size={4}>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={menuValue || defaultMenu}
                                    changeMenu={menuValue}
                                    menuChangeCb={handleMenuChange}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() =>
                                setSearchCondition({
                                    ...searchCondition,
                                })
                            }
                        />
                    </Space>
                </Space>
            </div>

            {dataSource.length > 0 && !loading && (
                <Table
                    rowKey="id"
                    dataSource={dataSource}
                    rowSelection={rowSelection}
                    columns={columns}
                    rowClassName={styles.tableRow}
                    scroll={{
                        x: 1000,
                        y:
                            (size?.height || 0) > 56
                                ? 'calc(100vh - 330px)'
                                : 'calc(100vh - 260px)',
                    }}
                    onChange={handleSortChange}
                    pagination={{
                        total: totalCount,
                        current: searchCondition.offset,
                        pageSize: searchCondition.limit,
                        pageSizeOptions: [10, 20, 50, 100],
                        showQuickJumper: true,
                        responsive: true,
                        showLessItems: true,
                        showSizeChanger: true,
                        hideOnSinglePage: totalCount <= 10,
                        showTotal: (total) => {
                            return `共 ${total} 条记录`
                        },
                    }}
                />
            )}
            {loading && (
                <div className={styles.codeRuleLoading}>
                    <Loader />
                </div>
            )}

            <div className={styles.emptyWrapper}>{showEmpty()}</div>
            {createVisible && (
                <EditCodeRule
                    visible={createVisible}
                    editData={operateData}
                    onClose={() => {
                        setCreateVisible(false)
                        setOperateData(undefined)
                    }}
                    operateType={operateType}
                    updateCodeRuleList={(
                        newData: any,
                        newSelectedDir?: any,
                    ) => {
                        hanleAfterOpr(operateType, newSelectedDir)
                    }}
                    selectTreeNode={{
                        ...selectedDir,
                        treeType: selCatlgClass,
                    }}
                />
            )}
            {detailVisible && (
                <CodeRuleDetails
                    visible={detailVisible}
                    onClose={() => setDetailVisible(false)}
                    id={operateData?.id || ''}
                />
            )}
            <ViewDataElement
                visible={viewDataEleVisible}
                onClose={() => {
                    setOperateData(undefined)
                    setViewDataEleVisible(false)
                }}
                id={operateData?.id}
            />
            {selectedRowKeys && selectedRowKeys.length > 0 && (
                <EditDirModal
                    title={__('选择目录')}
                    visible={editMoveToVisible}
                    dirType={CatalogType.CODINGRULES}
                    onClose={() => setEditMoveToVisible(false)}
                    oprType={OperateType.MOVEDATATO}
                    oprItem={selectedRowKeys}
                    setOprItem={setSelectedRowKeys}
                    // afterOprReload={() => run({})}
                    afterOprReload={(newSelectedDir?: IDirItem) => {
                        hanleAfterOpr(operateType, newSelectedDir)
                    }}
                />
            )}

            {/* 文件停用 */}
            {disableFileVisible && (
                <Confirm
                    open={disableFileVisible}
                    title={__('确认要停用吗？')}
                    content={
                        <div className={styles.disableConfirmWrapper}>
                            <div className={styles.disableConfirmContent}>
                                <div>
                                    {__(
                                        '停用后，该编码规则将不再被相关标准关联，',
                                    )}
                                </div>
                                <div>
                                    {__(
                                        '但不会对已经关联该编码规则的相关标准产生影响',
                                    )}
                                </div>
                            </div>
                            <Form
                                layout="vertical"
                                form={disableForm}
                                autoComplete="off"
                                className={styles.disableFormWrapper}
                                onFinish={(values) => {
                                    handleChangeFileState(
                                        disabledId,
                                        StateType.DISABLE,
                                        values,
                                    )
                                }}
                            >
                                <Form.Item
                                    label={__('停用原因')}
                                    name="reason"
                                    className={styles.reason}
                                    validateTrigger={['onChange', 'onBlur']}
                                    validateFirst
                                    rules={[
                                        {
                                            required: true,
                                            message: ErrorInfo.NOTNULL,
                                            transform: (value: any) =>
                                                trim(value),
                                        },
                                        {
                                            pattern: keyboardCharactersReg,
                                            message: ErrorInfo.EXCEPTEMOJI,
                                        },
                                    ]}
                                >
                                    <Input.TextArea
                                        placeholder={__('请输入停用原因')}
                                        className={styles.showCount}
                                        showCount
                                        maxLength={800}
                                        style={{
                                            resize: `none`,
                                            height: '80px',
                                            wordWrap: 'break-word',
                                        }}
                                    />
                                </Form.Item>
                            </Form>
                        </div>
                    }
                    onOk={() => {
                        disableForm.submit()
                    }}
                    onCancel={async () => {
                        setDisableFileVisible(false)
                        disableForm.resetFields()
                    }}
                    icon={
                        <ExclamationCircleFilled
                            className={styles.confirmIcon}
                        />
                    }
                    okButtonProps={{ loading: isLoading }}
                    width={416}
                    bodyStyle={{
                        height: 344,
                    }}
                    // className={(styles.commConfirm, styles.disableConfirm)}
                    className={styles.disableConfirm}
                />
            )}
        </div>
    )
}

export default RuleDetails
