import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import { useSize, useUpdateEffect } from 'ahooks'
import {
    Button,
    Dropdown,
    Form,
    Input,
    message,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { DefaultOptionType } from 'antd/lib/select'
import { ColumnsType } from 'antd/lib/table'
import classnames from 'classnames'
import { isNumber, trim } from 'lodash'
import moment from 'moment'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { confirm } from '@/utils/modalHelper'
import styles from './styles.module.less'

import dataEmpty from '@/assets/dataEmpty.svg'
import emptyAdd from '@/assets/emptyAdd.svg'
import __ from './locale'

import {
    CatalogOption,
    CatalogType,
    changeDataEleState,
    delDataEleByIds,
    exportDataEleByIds,
    formatError,
    getDataElement,
    getDataElementByFileCatlg,
    getDataElementByFileId,
    IDataElement,
    IDirItem,
    IDirQueryType,
    IMenuData,
    SortDirection,
    StateType,
    StdFileCatlgType,
} from '@/core'
import { AddOutlined, ImportOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import {
    ErrorInfo,
    keyboardCharactersReg,
    Operate,
    OperateType,
    stardOrignizeTypeAll,
    stardOrignizeTypeList,
    stateOptionList,
    streamToFile,
} from '@/utils'
import DropDownFilter from '../DropDownFilter'
import { defaultMenu, menus, searchData, SortType } from './const'

import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    LightweightSearch,
    ListPageSizerOptions,
    ListType,
    ReturnConfirmModal,
    SearchInput,
} from '@/ui'
import Loader from '@/ui/Loader'
import CodeRuleDetails from '../CodeRulesComponent/CodeRuleDetails'
import CodeTableDetails from '../CodeTableManage/Details'
import Confirm from '../Confirm'
import { MoreOperate } from '../Directory/const'
import EditDirModal from '../Directory/EditDirModal'
import { StdTreeDataOpt } from '../StandardDirTree/const'
import Details from './Details'
import EditDataEleForm from './EditDataEleForm'
import ImportDataEleModal from './ImportDataEleModal'

/**
 * 查询参数
 */
interface ISearchCondition {
    // 选择目录的id
    catalog_id: number | string
    // 页数，默认1
    offset: number
    // 每页数量，默认5条
    limit: number
    // 标准组织类型
    stardOrignizeType: number | undefined
    // 标准状态
    state?: StateType
    // 搜索关键字
    keyword: string
    // 排序字段
    sort: SortType
    // 排序方向
    direction: string
    // 创建时间排序方向
    createdAtDirection: SortDirection
    // 修改时间排序方向
    updatedAtDirection: SortDirection
}

const defaultPagiSize = 20

const initSearchCondition = {
    catalog_id: 11,
    offset: 1,
    limit: 20,
    // state: stateList[2].key, // 2:表示现行状态
    stardOrignizeType: undefined,
    keyword: '',
    sort: defaultMenu.key,
    direction: defaultMenu.sort,
    createdAtDirection: SortDirection.DESC,
    updatedAtDirection: SortDirection.DESC,
}

interface IDataEleManage {
    selectedDir: IDirItem
    selCatlgClass?: CatalogOption
    setSelectedDir: (item: IDirItem) => void
    getTreeList: (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
        newSelectedDir?: any,
    ) => void
}
/**
 * 表单
 * @param modelId 业务模型id
 * @returns
 */
const DataEleManage: React.FC<IDataEleManage> = ({
    selectedDir,
    selCatlgClass,
    setSelectedDir,
    getTreeList,
}) => {
    const { checkPermission } = useUserPermCtx()

    // 操作类型
    const [operateType, setOperateType] = useState<OperateType>(
        OperateType.CREATE,
    )

    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')
    // 表格选中项
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    // 数据元id
    const [dataEleId, setDataEleId] = useState<string>()

    const ref = useRef<HTMLDivElement>(null)

    // 列表大小
    const size = useSize(ref)

    // 导入对话框显示,【true】显示,【false】隐藏
    const [importVisible, setImportVisible] = useState(false)

    const [disableForm] = Form.useForm()

    // 停用数据元对话框显示,【true】显示,【false】隐藏
    const [disableFileVisible, setDisableFileVisible] = useState(false)

    // 创建/编辑界面显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)

    // 详情界面显示,【true】显示,【false】隐藏
    const [detailVisible, setDetailVisible] = useState(false)

    // 关联码表/编码规则id
    const [associateItemId, setAssociateItemId] = useState('')

    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)

    // 编码规则详情
    const [codeRuleDetailVisible, setCodeRuleDetailVisible] =
        useState<boolean>(false)

    // 移动至界面显示,【true】显示,【false】隐藏
    const [editMoveToVisible, setEditMoveToVisible] = useState(false)

    // 删除弹框显示,【true】显示,【false】隐藏
    const [delVisible, setDelVisible] = useState(false)

    // 删除项ID
    const [delId, setDelId] = useState<number | string>('')

    // 请求加载
    const [isLoading, setIsLoading] = useState(false)

    // 整体的load显示,【true】显示,【false】隐藏
    const [loading, setLoading] = useState(true)

    // 标准组织类型
    const [seledStdOgnizType, setSeledStdOgnizType] =
        useState<number>(stardOrignizeTypeAll)

    // 筛选options
    const getSelectOptions = (): DefaultOptionType[] => {
        return stardOrignizeTypeList
    }

    const [menuValue, setMenuValue] = useState<
        { key: SortType; sort: SortDirection } | undefined
    >(defaultMenu)

    // 搜索参数
    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        ...initSearchCondition,
        catalog_id: selectedDir?.id,
    })

    // table数据元列表
    const [dataEleList, setDataEleList] = useState<Array<IDataElement>>([])

    // table分页参数
    const [total, setTotal] = useState(0)
    // 当前页码信息
    const [pageConfig, setPageConfig] = useState({
        current: 1,
        pageSize: 20,
    })

    const handleTableChange = (pagination: any, filters: any, sorter: any) => {
        let newSearchCondition = {
            ...searchCondition,
        }
        if (sorter?.order) {
            // 默认
            setMenuValue({
                key: sorter?.columnKey,
                sort:
                    sorter?.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            })
            newSearchCondition = {
                ...searchCondition,
                sort: sorter?.columnKey,
                direction:
                    sorter?.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
            setSearchCondition({
                ...newSearchCondition,
            })
        }

        setPageConfig({
            ...pageConfig,
            current: pagination.current,
            pageSize: pagination.pageSize,
        })
    }

    const handleClickMenu = async (e: any) => {
        switch (e.key) {
            case MoreOperate.RENAME:
                break
            case MoreOperate.MOVETO:
                break
            case MoreOperate.EXPORT:
                exportDEByIds()
                break
            case MoreOperate.DELETE:
                setDelId(selectedRowKeys.join())
                // setDelVisible(true)
                deleteConfirm(() => handleDelete(selectedRowKeys.join(), true))
                break
            default:
                break
        }
    }

    // 通过选中id导出数据元
    const exportDEByIds = async () => {
        if (!selectedRowKeys || !selectedRowKeys.length) return
        try {
            // get请求导出方式
            // window.location.href = `/api/standardization/v1/dataelement/export/${selectedRowKeys.join()}`
            const res = await exportDataEleByIds(selectedRowKeys.join())
            if (typeof res === 'object' && res.byteLength) {
                streamToFile(
                    res,
                    `数据元_${moment(new Date()).format(
                        'YYYYMMDDHHmmss',
                    )}.xlsx`,
                )
                message.success('导出成功')
            } else {
                message.error('导出失败')
            }
        } catch (error: any) {
            formatError(error)
        }
    }

    // const moreOprMenu = (disable: boolean) =>
    //     [
    //         getAccess(`${ResourceType.data_standard}.${RequestType.get}`)
    //             ? {
    //                   label: '导出',
    //                   key: MoreOperate.EXPORT,
    //                   disabled: disable,
    //               }
    //             : null,
    //         getAccess(`${ResourceType.data_standard}.${RequestType.delete}`)
    //             ? {
    //                   label: '删除',
    //                   key: MoreOperate.DELETE,
    //                   disabled: disable,
    //               }
    //             : null,
    //     ].filter((item) => item)

    useEffect(() => {
        // 切换目录,初始化所有查询条件
        setSearchCondition({
            ...searchCondition,
            offset: 1,
            catalog_id: selectedDir?.id,
        })
        setPageConfig({
            current: 1,
            pageSize: 20,
        })
        setSearchKey('')
        setSeledStdOgnizType(stardOrignizeTypeAll)
        setMenuValue(defaultMenu)
        setSelectedRowKeys([])
    }, [selectedDir?.id])

    useUpdateEffect(() => {
        filterDataEle(searchCondition)
    }, [searchCondition])

    // 处理页码变化
    const onPageChange = (page: number, pageSize: number) => {
        setDataEleList([]) // 清空table的datasource，避免报错
        // 切换页面清空选中页码
        if (page !== pageConfig.current) {
            setSelectedRowKeys([])
        }
        setPageConfig({
            current: page,
            pageSize,
        })
        setSearchCondition({
            ...searchCondition,
            keyword: searchKey,
            offset: page,
            limit: pageSize,
        })
    }

    // 删除确认提示
    const deleteConfirm = (okCallBack: () => void) => {
        confirm({
            title: __('确认要删除吗？'),
            icon: <ExclamationCircleFilled className="delIcon" />,
            content: (
                <div className={styles.delConfirmContent}>
                    <div>{__('删除后，该数据元将无法恢复，')}</div>
                    <div>
                        {__('但不会对之前已经使用该数据元的系统产生影响')}
                    </div>
                </div>
            ),
            okText: __('确定'),
            cancelText: __('取消'),
            onOk() {
                okCallBack()
            },
        })
    }

    // 表格操作单个 或 批量 删除
    const handleDelete = async (dId: string, batchDel?: boolean) => {
        try {
            setIsLoading(true)

            const pageCurrent =
                dataEleList?.length === (batchDel ? selectedRowKeys?.length : 1)
                    ? pageConfig.current - 1 > 0
                        ? pageConfig.current - 1
                        : 1
                    : pageConfig.current
            await delDataEleByIds(dId)
            setIsLoading(false)
            if (selCatlgClass === CatalogOption.STDFILECATLG) {
                getTreeList(
                    {
                        type: CatalogType.DATAELE,
                        catlgOption: selCatlgClass,
                    },
                    undefined,
                    selectedDir,
                )
            } else {
                getTreeList(undefined, undefined, selectedDir)
            }
            message.success('删除成功')
            if (pageCurrent === pageConfig.current) {
                filterDataEle(searchCondition)
            } else {
                // pageConfig变化后,会在useEffect中调用filterDataEle(searchCondition)
                setPageConfig({
                    ...pageConfig,
                    current: pageCurrent,
                })
                setSearchCondition({
                    ...searchCondition,
                    offset: pageCurrent,
                })
            }

            if (batchDel) {
                setSelectedRowKeys([])
            } else if (selectedRowKeys.length > 0) {
                // 在选中时 删除选中行，更新选中项
                const tempKeys = selectedRowKeys.filter((key) => key !== delId)
                setSelectedRowKeys(tempKeys)
            }
        } catch (error: any) {
            if (error.status === 400) {
                const errorKey =
                    (error.data.detail &&
                        error.data.detail[0] &&
                        error.data.detail[0].Key) ||
                    error.data.code ||
                    ''
                let msg = ''
                if (errorKey === 'Standardization.InvalidParameter') {
                    msg = error.data.detail
                        ? error.data.detail[0].Message
                        : error.data.description
                } else if (errorKey === 'Standardization.Incorrect') {
                    // 消息队列服务异常
                    msg = error.data.description
                }
                if (msg) {
                    message.error(msg)
                }
                filterDataEle(searchCondition)
            } else {
                formatError(error)
            }
        } finally {
            setIsLoading(false)
            // setDelVisible(false)
        }
    }

    // 批量删除
    const handleBatchDelete = async () => {
        try {
            await delDataEleByIds(delId.toString())
            message.success(__('删除成功'))
            getTreeList(undefined, undefined, selectedDir)
            setSearchCondition({
                ...searchCondition,
                offset:
                    dataEleList?.length === selectedRowKeys?.length
                        ? pageConfig.current - 1
                        : pageConfig.current,
            })
            setSelectedRowKeys([])
        } catch (error) {
            if (error.status === 400) {
                const errorKey =
                    (error.data.detail &&
                        error.data.detail[0] &&
                        error.data.detail[0].Key) ||
                    error.data.code ||
                    ''
                let msg = ''
                if (errorKey === 'Standardization.InvalidParameter') {
                    msg = error.data.detail
                        ? error.data.detail[0].Message
                        : error.data.description
                } else if (errorKey === 'Standardization.Incorrect') {
                    // 消息队列服务异常
                    msg = error.data.description
                }
                if (msg) {
                    message.error(msg)
                }
                filterDataEle(searchCondition)
            } else {
                formatError(error)
            }
        }
    }

    const [oprId, serOprId] = useState<string>('')

    // 操作处理
    const handleOperate = async (
        type: OperateType,
        id?: string,
        record?: any,
    ) => {
        if (type === OperateType.DETAIL) {
            // 查看詳情
            setDetailVisible(true)
            if (id && id !== '') {
                serOprId(id)
            }
        } else if (type === OperateType.IMPORT) {
            // 导入数据元
            setImportVisible(true)
        } else if (type === OperateType.MOVEDATATO) {
            // 移动数据元至新目录
            setEditMoveToVisible(true)
        } else if (type === OperateType.CHANGESTATE) {
            serOprId(id || '')
            if (record.state === StateType.DISABLE) {
                handleChangeFileState(id!, StateType.ENABLE)
            } else {
                setDisableFileVisible(true)
            }
        } else {
            // 编辑或新建数据元
            setEditVisible(true)
        }
        setOperateType(type)
        setDataEleId(id)
    }

    // 操作成功之后更新左侧树及table数据
    const handleAfterOpr = (type: OperateType, newSelectedDir?: any) => {
        // 自定义目录
        if (selCatlgClass !== CatalogOption.STDFILECATLG) {
            getTreeList(undefined, undefined, newSelectedDir)
            if (newSelectedDir?.id === selectedDir.id) {
                // 操作没有更换目录，手动刷新数据
                filterDataEle({ ...searchCondition, offset: 1 })
            }

            // if ([OperateType.IMPORT, OperateType.MOVEDATATO].includes(type)) {
            //     // 导入或移动数据需要更新左侧自定义目录计数
            //     // 修改选中目录会自动重新获取列表数据（初始化searchCondition，搜索第一页数据）
            //     getTreeList(undefined, undefined, newSelectedDir)
            // } else if ([OperateType.CREATE, OperateType.EDIT].includes(type)) {
            //     // 新建或编辑数据需要更新左侧自定义目录计数
            //     getTreeList()
            //     setSearchCondition(
            //         filterParams
            //             ? { ...filterParams }
            //             : {
            //                   ...searchCondition,
            //   catalog_id:
            //       newSelectedDir.id ||
            //       searchCondition?.catalog_id,
            //               },
            //     )
            // }
        }
    }

    // 查看关联码表/编码规则详情
    const handleViewAssociateDetail = (item: any) => {
        const { dict_id, rule_id, rule_name } = item
        setAssociateItemId(dict_id || rule_id || '')
        if (dict_id) {
            setCodeTbDetailVisible(true)
        } else if (rule_id) {
            setCodeRuleDetailVisible(true)
        }
    }

    const handleChangeFileState = async (
        id: string,
        state: StateType,
        reason?: any,
    ) => {
        try {
            setIsLoading(true)
            await disableForm.validateFields()

            await changeDataEleState(id, { state, reason })
            filterDataEle(searchCondition)
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

    // 操作取消处理
    const handleOperateCancel = (type: OperateType, operate?: Operate) => {
        if (type === OperateType.DETAIL) {
            // 详情
            setDetailVisible(false)
        } else if (type === OperateType.IMPORT) {
            // 导入
            setImportVisible(false)
        } else if (type === OperateType.DELETE) {
            // 删除
            // setDelVisible(false)
        } else if (type === OperateType.MOVEDATATO) {
            // 移动数据元至
            setEditMoveToVisible(false)
        } else if (type === OperateType.CHANGESTATE) {
            setDisableFileVisible(false)
            disableForm.resetFields()
        } else if (type === OperateType.EDIT) {
            // 编辑数据元
            if (operate === Operate.OK) {
                setEditVisible(false)
            } else {
                // 新建或编辑
                ReturnConfirmModal({
                    onCancel: () => {
                        setEditVisible(false)
                    },
                })
            }
        }
    }

    // 筛选onChange
    const handleSelectChange = (value: number) => {
        setSeledStdOgnizType(value)
        setPageConfig({
            ...pageConfig,
            current: 1,
        })
        setSearchCondition({
            ...searchCondition,
            keyword: searchKey,
            offset: 1,
            stardOrignizeType:
                value === stardOrignizeTypeAll ? undefined : value,
        })
    }

    // 搜索框enter
    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        if (keyword === searchCondition?.keyword) return
        setSearchKey(keyword)
        setPageConfig({
            ...pageConfig,
            current: 1,
        })
        setSearchCondition({
            ...searchCondition,
            offset: 1,
            keyword,
        })
    }

    // 排序方式改变
    const handleSortWayChange = (selectedMenu: IMenuData) => {
        if (hasData) {
            const current = 1
            setPageConfig({
                ...pageConfig,
                current,
            })
            setMenuValue({
                key: selectedMenu.key as SortType,
                sort:
                    selectedMenu.sort === 'asc'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            })
            setSearchCondition({
                ...searchCondition,
                offset: current,
                keyword: searchKey,
                sort: selectedMenu.key as SortType,
                direction:
                    selectedMenu.sort === 'asc'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            })
        }
    }

    // 是否至少有一种操作权限
    const hasOprAccess = useMemo(
        () => checkPermission('manageDataStandard'),
        [checkPermission],
    )

    // 原始/标准表格项
    const columnsDataEle = (): ColumnsType<IDataElement> => {
        const cols: any = [
            {
                title: __('数据元名称'),
                dataIndex: 'name_cn',
                key: 'name_cn',
                width: '50%',
                ellipsis: true,
                render: (_: any, record: any) => (
                    <div
                        className={classnames(
                            styles.showTableInfo,
                            styles.rowName,
                        )}
                    >
                        <div
                            className={styles.topInfo}
                            title={record.name_cn || '--'}
                            onClick={() =>
                                handleOperate(OperateType.DETAIL, record.id)
                            }
                        >
                            {record.name_cn || '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: __('英文名称'),
                dataIndex: 'name_en',
                key: 'name_en',
                width: '50%',
                ellipsis: true,
                render: (_: any, record: any) => (
                    <div className={styles.showTableInfo}>
                        <div
                            className={styles.topInfo}
                            title={record.name_en || '--'}
                        >
                            {record.name_en || '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: __('所属组织结构'),
                dataIndex: 'department_name',
                key: 'department_name',
                width: '50%',
                ellipsis: true,
                render: (value, record) => (
                    <span title={record.department_path_names || ''}>
                        {record.department_name || '--'}
                    </span>
                ),
            },
            {
                title: __('标准分类'),
                dataIndex: 'std_type',
                key: 'std_type',
                width: 116,
                ellipsis: true,
                render: (std_type: any) => {
                    const res = stardOrignizeTypeList?.find(
                        (item) => item.value === std_type,
                    )
                    return (
                        <div className={styles.baseTableRow}>
                            {res ? res.label : '--'}
                        </div>
                    )
                },
            },
            // {
            //     title: __('码表/编码规则'),
            //     dataIndex: 'assciateItem',
            //     key: 'assciateItem',
            //     width: 144,
            //     ellipsis: true,
            //     render: (_: any, record: any) => {
            //         const { dict_id, dict_name, rule_id, rule_name } = record
            //         const associateItemName = dict_name || rule_name || '--'
            //         const newAssociateItemId = dict_id || rule_id || ''
            //         return (
            //             <div className={styles.baseTableRow}>
            //                 <div
            //                     className={classnames(
            //                         styles.topInfo,
            //                         newAssociateItemId
            //                             ? styles.link
            //                             : undefined,
            //                     )}
            //                     title={associateItemName}
            //                     onClick={() =>
            //                         handleViewAssociateDetail(record)
            //                     }
            //                 >
            //                     {associateItemName}
            //                 </div>
            //             </div>
            //         )
            //     },
            // },
            {
                title: <div>{__('状态')}</div>,
                dataIndex: 'state',
                key: 'state',
                width: 88,
                ellipsis: true,
                sorter: true,
                sortOrder:
                    searchCondition.sort === 'state'
                        ? searchCondition.direction === SortDirection.ASC
                            ? 'ascend'
                            : 'descend'
                        : null,
                showSorterTooltip: false,

                render: (state: any) => {
                    const res = stateOptionList?.find(
                        (item) => item.key === state,
                    )
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
                      key: 'action',
                      width: 148,
                      render: (_: string, record: any) => (
                          <Space size={16} className={styles.tableOperate}>
                              <div
                                  className={styles.operate}
                                  onClick={() =>
                                      handleOperate(OperateType.EDIT, record.id)
                                  }
                              >
                                  {__('编辑')}
                              </div>
                              <div
                                  className={styles.operate}
                                  onClick={() =>
                                      handleOperate(
                                          OperateType.CHANGESTATE,
                                          record.id,
                                          record,
                                      )
                                  }
                              >
                                  {record.state === StateType.DISABLE
                                      ? __('启用')
                                      : __('停用')}
                              </div>

                              {
                                  <div
                                      className={styles.operate}
                                      onClick={() => {
                                          setDelId(record.id)
                                          //   setDelVisible(true)
                                          deleteConfirm(() =>
                                              handleDelete(record.id, false),
                                          )
                                      }}
                                  >
                                      {__('删除')}
                                  </div>
                              }
                          </Space>
                      ),
                  }
                : {},
        ].filter((item: any) => item.key)
        return cols
    }
    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys)
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    }
    // 是否由选中数据元
    const hasSelected = selectedRowKeys.length > 0

    const hasData = useMemo(() => {
        return dataEleList?.length > 0
    }, [selectedDir, searchCondition.keyword, seledStdOgnizType, dataEleList])

    const showEmpty = () => {
        const searchValue = searchCondition.keyword
        const stdType = searchCondition.stardOrignizeType
        // 搜索条件不为初始值
        if (searchValue || (typeof stdType === 'number' && stdType >= 0)) {
            // 搜索无数据，空白显示，显缺省图+文字提示
            return <Empty />
        }

        // 是否有添加/导入权限
        const hasAddAccess =
            selCatlgClass !== CatalogOption.STDFILECATLG && hasOprAccess

        // 目录无数据，显示缺省图+引导新建导入文字提示
        const desc = hasAddAccess ? (
            <div>
                {__('点击')}
                <span
                    className={styles.operate}
                    onClick={() => {
                        handleOperate(OperateType.CREATE)
                    }}
                >
                    【{__('新建')}】
                </span>
                {__('或')}
                {__('点击')}
                <span
                    className={styles.operate}
                    onClick={() => {
                        handleOperate(OperateType.IMPORT)
                    }}
                >
                    【{__('导入')}】
                </span>
                {__('按钮')}
                <p className={styles.operateDesc}>
                    {' '}
                    {__('可新建或导入数据元')}
                </p>
            </div>
        ) : (
            __('暂无数据元')
        )
        return (
            <Empty desc={desc} iconSrc={hasAddAccess ? emptyAdd : dataEmpty} />
        )
    }

    // 根据过滤条件获取数据元
    const filterDataEle = async (condition: ISearchCondition) => {
        const {
            catalog_id,
            offset,
            limit,
            stardOrignizeType,
            keyword,
            sort,
            direction,
        } = condition
        if (!catalog_id) return
        try {
            setLoading(true)
            let res
            if (selCatlgClass === CatalogOption.DEPARTMENT) {
                res = await getDataElement({
                    department_id: catalog_id,
                    keyword,
                    offset,
                    limit,
                    std_type: stardOrignizeType,
                    sort,
                    direction,
                })
            } else if (selCatlgClass === CatalogOption.AUTOCATLG) {
                res = await getDataElement({
                    catalog_id,
                    keyword,
                    offset,
                    limit,
                    std_type: stardOrignizeType,
                    sort,
                    direction,
                })
            } else if (selectedDir.stdFileCatlgType === StdFileCatlgType.FILE) {
                res = await getDataElementByFileId({
                    file_id: catalog_id,
                    keyword,
                    offset,
                    limit,
                    std_type: stardOrignizeType,
                    sort,
                    direction,
                })
            } else {
                res = await getDataElementByFileCatlg({
                    file_catalog_id: catalog_id,
                    keyword,
                    offset,
                    limit,
                    std_type: stardOrignizeType,
                    sort,
                    direction,
                })
            }
            // 设置数据 + 设置 pageSize
            setDataEleList(res?.data)
            setTotal(res?.total_count)
            setSelectedRowKeys([])
        } catch (error: any) {
            formatError(error)
        } finally {
            setLoading(false)
            setMenuValue(undefined)
        }
    }

    const searchChange = (data: any, key: string = '') => {
        handleSelectChange(data[key])
    }

    // 模块操作
    const modOprs = (disable: boolean) => {
        const oprs = [
            {
                key: OperateType.CREATE,
                label: __('新建数据元'),
                btnNode: (
                    <Button
                        key={OperateType.CREATE}
                        type="primary"
                        className={styles.operateBtn}
                        onClick={() => handleOperate(OperateType.CREATE)}
                    >
                        <AddOutlined className={styles.operateIcon} />
                        <span className={styles.operateText}>
                            {__('新建数据元')}
                        </span>
                    </Button>
                ),
                oprClassName: styles.operateBtn,
                access: 'manageDataStandard',
            },
            {
                key: OperateType.IMPORT,
                label: __('导入'),
                btnNode: (
                    <Button
                        key={OperateType.IMPORT}
                        className={classnames(
                            styles.operateBtn,
                            styles.opearteWhite,
                        )}
                        onClick={() => handleOperate(OperateType.IMPORT)}
                    >
                        <ImportOutlined className={styles.operateIcon} />
                        <span className={styles.operateText}>{__('导入')}</span>
                    </Button>
                ),
                oprClassName: classnames(
                    styles.operateBtn,
                    styles.opearteWhite,
                ),

                access: 'manageDataStandard',
            },
            {
                key: OperateType.MOVEDATATO,
                label: __('移动至'),
                disabled: disable,
                btnNode: (
                    <Tooltip title={hasSelected ? '' : __('请先选择数据元')}>
                        <Button
                            key={OperateType.MOVEDATATO}
                            className={classnames(
                                styles.operateBtn,
                                styles.opearteWhite,
                            )}
                            onClick={() =>
                                handleOperate(OperateType.MOVEDATATO)
                            }
                            disabled={!hasSelected}
                        >
                            <span className={styles.operateText}>
                                {__('移动至')}
                            </span>
                        </Button>
                    </Tooltip>
                ),
                oprClassName: classnames(
                    styles.operateBtn,
                    styles.opearteWhite,
                ),
                access: 'manageDataStandard',
            },
            {
                key: OperateType.EXPORT,
                label: __('导出'),
                disabled: disable,
                btnNode: (
                    <Tooltip title={hasSelected ? '' : __('请先选择数据元')}>
                        <Button
                            key={OperateType.EXPORT}
                            className={classnames(
                                styles.operateBtn,
                                styles.opearteWhite,
                            )}
                            onClick={() =>
                                handleClickMenu({ key: MoreOperate.EXPORT })
                            }
                            disabled={!hasSelected}
                        >
                            <span className={styles.operateText}>
                                {__('导出')}
                            </span>
                        </Button>
                    </Tooltip>
                ),
                oprClassName: classnames(
                    styles.operateBtn,
                    styles.opearteWhite,
                ),
                access: 'manageDataStandard',
            },
            {
                key: OperateType.DELETE,
                label: __('删除'),
                disabled: disable,
                btnNode: (
                    <Tooltip title={hasSelected ? '' : __('请先选择数据元')}>
                        <Button
                            key={OperateType.DELETE}
                            className={classnames(
                                styles.operateBtn,
                                styles.opearteWhite,
                            )}
                            onClick={() =>
                                handleClickMenu({ key: MoreOperate.DELETE })
                            }
                            disabled={!hasSelected}
                        >
                            <span className={styles.operateText}>
                                {__('删除')}
                            </span>
                        </Button>
                    </Tooltip>
                ),
                oprClassName: classnames(
                    styles.operateBtn,
                    styles.opearteWhite,
                ),
                access: 'manageDataStandard',
            },
        ]

        return oprs.filter((oItem) => checkPermission(oItem.access))
    }

    const renderOprContent = () => {
        // 按钮超过3个之外的放到dropdown中
        const oprs = modOprs(!hasSelected)
        const maxBtnCount = 4
        const showMore = oprs?.length > maxBtnCount
        //   按钮展示
        const btnOprs = showMore ? oprs.slice(0, maxBtnCount - 1) : oprs
        // 下拉展示，超过maxBtnCount，把第（maxBtnCount -1）个及其之后的放到dropdown中
        const moreMenus = showMore ? oprs.slice(maxBtnCount - 1) : []

        return selCatlgClass === CatalogOption.STDFILECATLG ? (
            <>
                {hasOprAccess && (
                    <Tooltip title={hasSelected ? '' : __('请先选择数据元')}>
                        <Button
                            key={OperateType.EXPORT}
                            className={classnames(
                                styles.operateBtn,
                                styles.opearteWhite,
                            )}
                            onClick={() =>
                                handleClickMenu({ key: MoreOperate.EXPORT })
                            }
                            disabled={!hasSelected}
                        >
                            <span className={styles.operateText}>导出</span>
                        </Button>
                    </Tooltip>
                )}
                {hasOprAccess && (
                    <Tooltip title={hasSelected ? '' : __('请先选择数据元')}>
                        <Button
                            key={OperateType.DELETE}
                            className={classnames(
                                styles.operateBtn,
                                styles.opearteWhite,
                            )}
                            onClick={() =>
                                handleClickMenu({ key: MoreOperate.DELETE })
                            }
                            disabled={!hasSelected}
                        >
                            <span className={styles.operateText}>删除</span>
                        </Button>
                    </Tooltip>
                )}
            </>
        ) : (
            <>
                {btnOprs?.map((oItem, oIndex) => {
                    return <div key={oIndex}>{oItem.btnNode}</div>
                })}

                {moreMenus?.length > 0 && (
                    <Tooltip title={hasSelected ? '' : __('请先选择数据元')}>
                        <Dropdown
                            menu={{
                                items: moreMenus,
                                onClick: (e) => handleClickMenu(e),
                            }}
                            trigger={['hover']}
                            className={classnames(
                                styles.operateBtn,
                                !hasSelected && styles.moreOprMenuDisabled,
                            )}
                        >
                            <Button disabled={!hasSelected}>
                                <EllipsisOutlined className={styles.moreIcon} />
                            </Button>
                        </Dropdown>
                    </Tooltip>
                )}
            </>
        )
    }

    return (
        <div className={styles.dataEleContent}>
            <div className={styles.operateWrapper}>
                <span className={styles.btnWrapper}>{renderOprContent()}</span>
                <Space className={styles.filterCondits}>
                    <SearchInput
                        className={styles.searchInput}
                        title={__('请输入中英文名称、同义词')}
                        placeholder={__('请输入中英文名称、同义词')}
                        onKeyChange={(kw: string) => handleSearchPressEnter(kw)}
                        maxLength={64}
                    />
                    <div className={styles.selectWrapper}>
                        <LightweightSearch
                            formData={searchData}
                            onChange={(data, key) => searchChange(data, key)}
                            defaultValue={{ state: 1000 }}
                        />
                    </div>
                    <Space size={4}>
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={menuValue || defaultMenu}
                                    changeMenu={menuValue}
                                    menuChangeCb={handleSortWayChange}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() =>
                                filterDataEle({
                                    ...searchCondition,
                                    keyword: searchKey,
                                })
                            }
                        />
                    </Space>
                </Space>
            </div>
            <div
                className={classnames(styles.showEmpty, styles.baseEmpty)}
                hidden={!loading}
            >
                <Loader />
            </div>
            <div
                ref={ref}
                className={classnames(styles.dataList, styles.dataEleList)}
                hidden={loading || !hasData}
            >
                <Table
                    rowKey={(rec) => rec.id}
                    columns={columnsDataEle()}
                    rowClassName={styles.tableRow}
                    sortDirections={['ascend', 'descend', 'ascend']}
                    dataSource={dataEleList}
                    pagination={{
                        current: pageConfig.current,
                        pageSize: pageConfig.pageSize,
                        total,
                        pageSizeOptions:
                            ListPageSizerOptions[ListType.NarrowList],
                        showQuickJumper: true,
                        showLessItems: true,
                        responsive: true,
                        onChange: onPageChange,
                        showTotal: (totalCount) => {
                            return `共 ${totalCount} 条记录`
                        },
                        hideOnSinglePage: total <= defaultPagiSize,
                    }}
                    scroll={{
                        y:
                            dataEleList?.length > 0
                                ? isNumber(size?.height)
                                    ? Number(size?.height) - 109
                                    : undefined
                                : undefined,
                    }}
                    rowSelection={rowSelection}
                    locale={{
                        emptyText: <Empty />,
                    }}
                    onChange={handleTableChange}
                />
            </div>
            <div className={styles.showEmpty} hidden={loading || hasData}>
                {showEmpty()}
            </div>

            {/* 数据元停用 */}
            {disableFileVisible && (
                <Confirm
                    open={disableFileVisible}
                    title={__('确认要停用吗？')}
                    content={
                        <div className={styles.disableConfirmWrapper}>
                            <div className={styles.disableConfirmContent}>
                                <div>
                                    {__(
                                        '停用后，该数据元将不再被相关标准关联，',
                                    )}
                                </div>
                                <div>
                                    {__(
                                        '但不会对已经关联该数据元的相关标准产生影响',
                                    )}
                                </div>
                            </div>
                            <Form
                                layout="vertical"
                                form={disableForm}
                                autoComplete="off"
                                className={styles.disableFormWrapper}
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
                                        }}
                                    />
                                </Form.Item>
                            </Form>
                        </div>
                    }
                    onOk={() =>
                        handleChangeFileState(
                            oprId,
                            StateType.DISABLE,
                            disableForm.getFieldValue('reason'),
                        )
                    }
                    onCancel={async () =>
                        handleOperateCancel(OperateType.CHANGESTATE)
                    }
                    icon={
                        <ExclamationCircleFilled
                            className={styles.confirmIcon}
                        />
                    }
                    okButtonProps={{ loading: isLoading }}
                    width={416}
                    bodyStyle={{
                        height: 340,
                    }}
                    className={styles.disableConfirm}
                />
            )}

            {/* 导入 */}
            {importVisible && (
                <ImportDataEleModal
                    visible={importVisible}
                    selectedDir={
                        selCatlgClass === CatalogOption.DEPARTMENT
                            ? { id: '11', catalog_name: '全部目录' }
                            : selectedDir
                    }
                    update={(newDir?: any) =>
                        handleAfterOpr(operateType, newDir)
                    }
                    onClose={() => handleOperateCancel(OperateType.IMPORT)}
                />
            )}
            {/* 列表上方'移动至'按钮-移动数据元/码表至XX目录 */}
            {selectedRowKeys && selectedRowKeys.length > 0 && (
                <EditDirModal
                    title={__('移动至目录')}
                    visible={editMoveToVisible}
                    dirType={CatalogType.DATAELE}
                    onClose={() => handleOperateCancel(OperateType.MOVEDATATO)}
                    oprType={OperateType.MOVEDATATO}
                    oprItem={selectedRowKeys}
                    setOprItem={setSelectedRowKeys}
                    afterOprReload={(newDir?: any) =>
                        handleAfterOpr(operateType, newDir)
                    }
                />
            )}
            {/* 编辑数据元抽屉 */}
            {editVisible && (
                <EditDataEleForm
                    type={operateType}
                    visible={editVisible}
                    dataEleId={dataEleId}
                    selectedDir={selectedDir}
                    showContinueBtn={operateType === OperateType.CREATE}
                    getTreeList={getTreeList}
                    onClose={(operate: Operate) =>
                        handleOperateCancel(OperateType.EDIT, operate)
                    }
                    update={(newDir?: any) =>
                        handleAfterOpr(operateType, newDir)
                    }
                    selCatlgClass={selCatlgClass || CatalogOption.AUTOCATLG}
                />
            )}
            {/* 数据元详情 */}
            {detailVisible && !!oprId && (
                <Details
                    visible={detailVisible && !!oprId}
                    title={__('数据元详情')}
                    dataEleId={oprId}
                    onClose={() => handleOperateCancel(OperateType.DETAIL)}
                    handleError={(errorKey: string) => {
                        // 数据元不存在(status:400, code:Standardization.Empty)，刷新列表
                        if (errorKey === 'Standardization.Empty') {
                            filterDataEle(searchCondition)
                        }
                    }}
                />
            )}
            {/* 查看码表详情 */}
            {associateItemId && codeTbDetailVisible && (
                <CodeTableDetails
                    visible={codeTbDetailVisible}
                    title={__('码表详情')}
                    dictId={associateItemId}
                    onClose={() => setCodeTbDetailVisible(false)}
                />
            )}
            {/* 查看编码规则详情 */}
            {associateItemId && codeRuleDetailVisible && (
                <CodeRuleDetails
                    visible={codeRuleDetailVisible}
                    id={associateItemId}
                    onClose={() => {
                        setCodeRuleDetailVisible(false)
                    }}
                />
            )}
        </div>
    )
}

export default DataEleManage
