import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import { useSize, useUpdateEffect } from 'ahooks'
import {
    Button,
    Dropdown,
    Form,
    Input,
    message,
    Modal,
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
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    CatalogOption,
    CatalogType,
    changeDictState,
    delDictByIds,
    exportDict,
    formatError,
    // getDictDetailById,
    getDictList,
    getDictListByFileCatlgId,
    getDictListByFileId,
    getDictQuoteListById,
    IDictItem,
    IDirItem,
    IDirQueryType,
    IMenuData,
    SortDirection,
    StdFileCatlgType,
} from '@/core'
import { AddOutlined, ImportOutlined } from '@/icons'
import {
    LightweightSearch,
    ListPageSizerOptions,
    ListType,
    ReturnConfirmModal,
    SearchInput,
} from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import {
    ErrorInfo,
    keyboardCharactersReg,
    Operate,
    OperateType,
    stardOrignizeTypeAll,
    stardOrignizeTypeList,
    stateOptionList,
    StateType,
    streamToFile,
} from '@/utils'
import Confirm from '../Confirm'
import { MoreOperate } from '../Directory/const'
import EditDirModal from '../Directory/EditDirModal'
import DropDownFilter from '../DropDownFilter'
import { StdTreeDataOpt } from '../StandardDirTree/const'
import { defaultMenu, menus, searchData, SortType } from './const'
import Details from './Details'
import EditDictForm from './EditDictForm'
import ImportDictModal from './ImportDictModal'
import __ from './locale'

/**
 * 查询参数
 */
interface ISearchCondition {
    // 移动至目录的id
    catalog_id?: string
    // 文件id
    file_id?: string
    // 页数，默认1
    offset: number
    // 每页数量，默认20条
    limit: number
    // 标准组织类型
    stardOrignizeType: number | undefined
    // 启用状态
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
    // 部门id
    department_id?: string
}

const defaultPagiSize = 20

const initSearchCondition = {
    catalog_id: '',
    offset: 1,
    limit: defaultPagiSize,
    // status: stateList[2].key, // 2:表示现行状态
    stardOrignizeType: undefined,
    keyword: '',
    sort: SortType.CREATED,
    direction: 'desc',
    createdAtDirection: SortDirection.DESC,
    updatedAtDirection: SortDirection.DESC,
}

/**
 * @params selectedDir 左侧目录选中目录节点
 * @params selCatlgClass 左侧目录Radio选择类型
 * @returns
 */
interface IDictManage {
    selectedDir: any
    selCatlgClass?: CatalogOption
    setSelectedDir: (item: IDirItem) => void
    getTreeList: (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
        newSelectedDir?: any,
    ) => void
}

const DictManage: React.FC<IDictManage> = ({
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

    // 码表id
    const [dictId, setDictId] = useState<string>()

    const ref = useRef<HTMLDivElement>(null)

    // 列表大小
    const size = useSize(ref)

    // 导入对话框显示,【true】显示,【false】隐藏
    const [importVisible, setImportVisible] = useState(false)

    // 停用form
    const [disableForm] = Form.useForm()

    // 停用文件对话框显示,【true】显示,【false】隐藏
    const [disableFileVisible, setDisableFileVisible] = useState(false)

    // 创建/编辑界面显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)

    // 详情界面显示,【true】显示,【false】隐藏
    const [detailVisible, setDetailVisible] = useState(false)

    // 移动至界面显示,【true】显示,【false】隐藏
    const [editMoveToVisible, setEditMoveToVisible] = useState(false)

    // 删除弹框显示,【true】显示,【false】隐藏
    const [delVisible, setDelVisible] = useState(false)

    // 码表查看引用对话框
    const [quoteVisible, setQuoteVisible] = useState(false)

    // 删除项ID
    const [delId, setDelId] = useState<number | string>(0)

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
        catalog_id: selectedDir.id,
    })

    // table码表列表
    const [dictList, setDictList] = useState<Array<IDictItem>>([])

    // table分页参数
    const [total, setTotal] = useState(0)
    // 当前页码信息
    const [pageConfig, setPageConfig] = useState({
        current: 1,
        pageSize: 20,
    })

    // 码表引用记录
    const [dictQuoteRecs, setDictQuoteRecs] = useState<Array<any>>([])

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
                deleteConfirm(() => handleDelete(selectedRowKeys.join(), true))
                break
            default:
                break
        }
    }

    // 通过选中id导出码表
    const exportDEByIds = async () => {
        if (!selectedRowKeys || !selectedRowKeys.length) return
        try {
            // get请求导出方式
            // window.location.href = `/api/standardization/v1/dataelement/export/${selectedRowKeys.join()}`
            const res = await exportDict('', selectedRowKeys)
            if (typeof res === 'object' && res.byteLength) {
                streamToFile(
                    res,
                    `码表_${moment(new Date()).format('YYYYMMDDHHmmss')}.xlsx`,
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

    // 模块操作
    const modOprs = (disable: boolean) => {
        const oprs = [
            {
                key: OperateType.CREATE,
                label: __('新建码表'),
                btnNode: (
                    <Button
                        key={OperateType.CREATE}
                        type="primary"
                        className={styles.operateBtn}
                        onClick={() => handleOperate(OperateType.CREATE)}
                    >
                        <AddOutlined className={styles.operateIcon} />
                        <span className={styles.operateText}>
                            {__('新建码表')}
                        </span>
                    </Button>
                ),
                oprClassName: styles.operateBtn,
                access: `manageDataStandard`,
            },
            {
                key: OperateType.IMPORT,
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
                    <Tooltip title={hasSelected ? '' : __('请先选择码表')}>
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
                {checkPermission('manageDataStandard') && (
                    <Tooltip title={hasSelected ? '' : __('请先选择码表')}>
                        <Button
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
                )}
                {checkPermission('manageDataStandard') && (
                    <Tooltip title={hasSelected ? '' : __('请先选择码表')}>
                        <Button
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
                )}
            </>
        ) : (
            <>
                {btnOprs?.map((oItem, oIndex) => {
                    return <div key={oIndex}>{oItem.btnNode}</div>
                })}

                {moreMenus?.length > 0 && (
                    <Tooltip title={hasSelected ? '' : __('请先选择码表')}>
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

    useEffect(() => {
        // 切换目录,初始化所有查询条件
        if (selCatlgClass === CatalogOption.DEPARTMENT) {
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                department_id: selectedDir.id,
            })
        } else {
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                catalog_id: selectedDir.id,
                file_id: selectedDir.id,
            })
        }

        setPageConfig({
            current: 1,
            pageSize: 20,
        })
        setSearchKey('')
        setSeledStdOgnizType(stardOrignizeTypeAll)
        setMenuValue(defaultMenu)
        setSelectedRowKeys([])
    }, [selectedDir])

    useUpdateEffect(() => {
        filterDictList(searchCondition)
    }, [searchCondition])

    // 处理页码变化
    const onPageChange = (page: number, pageSize: number) => {
        setDictList([]) // 清空table的datasource，避免报错
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
            title: __('确认删除吗？'),
            icon: <ExclamationCircleFilled className="delIcon" />,
            content: __('「码表」删除后不能恢复，确定要删除吗？'),
            okText: __('确定'),
            cancelText: __('取消'),
            onOk() {
                okCallBack()
            },
        })
    }

    // 删除表单
    const handleDelete = async (dId: string, batchDel?: boolean) => {
        try {
            setIsLoading(true)
            const pageCurrent =
                dictList?.length === (batchDel ? selectedRowKeys?.length : 1)
                    ? pageConfig.current - 1 > 0
                        ? pageConfig.current - 1
                        : 1
                    : pageConfig.current
            await delDictByIds(dId)
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
                filterDictList(searchCondition)
            } else {
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
                const errorKey = error.data && error.data.code
                if (errorKey === 'Standardization.InvalidParameter') {
                    // 被引用对话框提示
                    error({
                        title: '不能删除',
                        content:
                            '选择的码表中包含被数据元引用中的码表，请先取消引用。',
                    })
                    return
                }
            }
            formatError(error)
        } finally {
            // setDelVisible(false)
            setIsLoading(false)
        }
    }

    const [oprId, serOprId] = useState<string>('')

    // 操作处理
    const handleOperate = async (type: OperateType, record?: any) => {
        const { id } = record ?? {}
        if (type === OperateType.DETAIL) {
            // 查看詳情
            setDetailVisible(true)
            if (id && id !== '') {
                serOprId(id)
            }
        } else if (type === OperateType.DELETE) {
            // 删除
            setDelId(record.id)
            // setDelVisible(true)
            deleteConfirm(() => handleDelete(record.id, false))
        } else if (type === OperateType.QUOTE) {
            // 获取引用详情
            getDictQuote(record.id)
            setQuoteVisible(true)
        } else if (type === OperateType.IMPORT) {
            // 导入码表
            setImportVisible(true)
        } else if (type === OperateType.MOVEDATATO) {
            // 移动码表至新目录
            setEditMoveToVisible(true)
        } else if (type === OperateType.CHANGESTATE) {
            serOprId(id || '')
            if (record.state === StateType.DISABLE) {
                handleChangeFileState(id!, StateType.ENABLE)
            } else {
                setDisableFileVisible(true)
            }
        } else {
            // 编辑或新建码表
            setEditVisible(true)
        }
        setOperateType(type)
        setDictId(id)
    }

    // 操作成功之后更新左侧树及table数据
    const handleAfterOpr = (type: OperateType, newSelectedDir?: any) => {
        // 自定义目录
        if (selCatlgClass !== CatalogOption.STDFILECATLG) {
            getTreeList(undefined, undefined, newSelectedDir)
            if (newSelectedDir?.id === selectedDir.id) {
                // 操作没有更换目录，手动刷新数据
                filterDictList({ ...searchCondition, offset: 1 })
            }
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

            await changeDictState(id, { state, reason })
            filterDictList(searchCondition)
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
            setDelVisible(false)
        } else if (type === OperateType.MOVEDATATO) {
            // 移动码表至
            setEditMoveToVisible(false)
        } else if (type === OperateType.CHANGESTATE) {
            setDisableFileVisible(false)
            disableForm.resetFields()
        } else if (type === OperateType.EDIT) {
            // 编辑码表
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
        } else if (type === OperateType.QUOTE) {
            // 查看码表引用
            setQuoteVisible(false)
            setDictQuoteRecs([])
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
            stardOrignizeType:
                value === stardOrignizeTypeAll ? undefined : value,
            offset: 1,
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

    // 操作列显示与否-是否至少有一种操作权限
    const hasOprAccess = useMemo(
        () => checkPermission('manageDataStandard'),
        [checkPermission],
    )

    // const getItems = (record: any): MenuProps['items'] =>
    //     [
    //         getAccess(`${ResourceType.data_standard}.${RequestType.delete}`)
    //             ? {
    //                   label: <div>{__('删除')}</div>,
    //                   key: OperateType.DELETE,
    //               }
    //             : null,
    //         getAccess(`${ResourceType.data_standard}.${RequestType.get}`)
    //             ? {
    //                   label: record.used_flag ? (
    //                       <div
    //                           className={styles.operate}
    //                           onClick={() => {
    //                               // 获取引用详情
    //                               getDictQuote(record.id)
    //                               setQuoteVisible(true)
    //                           }}
    //                       >
    //                           查看引用
    //                       </div>
    //                   ) : (
    //                       <Tooltip title="未被任何数据元引用">
    //                           <div
    //                               className={classnames(
    //                                   styles.operate,
    //                                   styles.operateDisabled,
    //                               )}
    //                           >
    //                               查看引用
    //                           </div>
    //                       </Tooltip>
    //                   ),
    //                   key: OperateType.QUOTE,
    //               }
    //             : null,
    //     ].filter((item) => item)

    // 原始/标准表格项
    const columnsDict = (): ColumnsType<IDictItem> => {
        const cols: any = [
            {
                title: __('码表名称'),
                dataIndex: 'ch_name',
                key: 'ch_name',
                fixed: 'left',
                // width: 172,
                ellipsis: true,
                render: (_: any, record: any) => (
                    <div
                        className={classnames(
                            styles.showTableInfo,
                            styles.dictName,
                        )}
                    >
                        <div
                            className={styles.topInfo}
                            title={record.ch_name || '--'}
                            // style={{ maxWidth: 280 }}
                            onClick={() =>
                                handleOperate(OperateType.DETAIL, record)
                            }
                        >
                            {record.ch_name || '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: __('英文名称'),
                dataIndex: 'en_name',
                key: 'en_name',
                // width: 172,
                ellipsis: true,
                render: (_: any, record: any) => (
                    <div className={styles.showTableInfo}>
                        <div
                            className={styles.topInfo}
                            title={record.en_name || '--'}
                            // style={{ maxWidth: 420 }}
                        >
                            {record.en_name || '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: '标准分类',
                dataIndex: 'org_type',
                key: 'org_type',
                width: 102,
                ellipsis: true,
                render: (org_type: any) => {
                    const res = stardOrignizeTypeList?.find(
                        (item) => item.value === org_type,
                    )
                    return (
                        <div className={styles.baseTableRow}>
                            {res ? res.label : '--'}
                        </div>
                    )
                },
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
                      title: '操作',
                      fixed: 'right',
                      key: 'action',
                      width: 230,
                      render: (_: string, record: any) => (
                          <Space size={12} className={styles.tableOperate}>
                              <Button
                                  className={styles.operate}
                                  onClick={() =>
                                      handleOperate(OperateType.EDIT, record)
                                  }
                                  type="link"
                              >
                                  编辑
                              </Button>
                              <Button
                                  className={styles.operate}
                                  onClick={() =>
                                      handleOperate(
                                          OperateType.CHANGESTATE,
                                          record,
                                      )
                                  }
                                  type="link"
                              >
                                  {record.state === StateType.DISABLE
                                      ? __('启用')
                                      : __('停用')}
                              </Button>
                              <Button
                                  className={styles.operate}
                                  onClick={() =>
                                      handleOperate(OperateType.DELETE, record)
                                  }
                                  type="link"
                              >
                                  {__('删除')}
                              </Button>
                              {
                                  <Tooltip
                                      title={
                                          record.used_flag
                                              ? ''
                                              : '未被任何数据元引用'
                                      }
                                  >
                                      <Button
                                          className={styles.operate}
                                          type="link"
                                          disabled={!record.used_flag}
                                          onClick={() => {
                                              // 获取引用详情
                                              getDictQuote(record.id)
                                              setQuoteVisible(true)
                                          }}
                                      >
                                          {__('查看引用')}
                                      </Button>
                                  </Tooltip>
                              }
                              {/* {moreAccess && (
                                  <Dropdown
                                      overlayClassName={styles.dropdownMore}
                                      menu={{
                                          items: getItems(record),
                                          onClick: ({ key }) =>
                                              handleOperate(
                                                  key as OperateType,
                                                  record,
                                              ),
                                      }}
                                  >
                                      <a onClick={() => {}}>
                                          {__('更多')}
                                          <DownOutlined />
                                      </a>
                                  </Dropdown>
                              )} */}
                          </Space>
                      ),
                  }
                : {},
        ].filter((item) => item.key)
        return cols
    }

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys)
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    }
    // 是否由选中码表
    const hasSelected = selectedRowKeys.length > 0

    const hasData = useMemo(() => {
        return dictList.length > 0
    }, [selectedDir, searchCondition.keyword, seledStdOgnizType, dictList])

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
                <p className={styles.operateDesc}> {__('可新建或导入码表')}</p>
            </div>
        ) : (
            __('暂无码表')
        )
        return (
            <Empty desc={desc} iconSrc={hasAddAccess ? emptyAdd : dataEmpty} />
        )
    }

    // 根据过滤条件获取码表
    const filterDictList = async (condition: ISearchCondition) => {
        const {
            file_id,
            catalog_id,
            offset,
            limit,
            stardOrignizeType,
            keyword,
            sort,
            direction,
            department_id,
        } = condition

        if (!catalog_id) return
        try {
            setLoading(true)
            let res
            if (selCatlgClass === CatalogOption.DEPARTMENT) {
                res = await getDictList({
                    department_id,
                    keyword,
                    offset,
                    limit,
                    org_type: stardOrignizeType,
                    sort,
                    direction,
                })
            } else if (selCatlgClass === CatalogOption.AUTOCATLG) {
                res = await getDictList({
                    catalog_id,
                    keyword,
                    offset,
                    limit,
                    org_type: stardOrignizeType,
                    sort,
                    direction,
                })
            } else if (selectedDir.stdFileCatlgType === StdFileCatlgType.FILE) {
                res = await getDictListByFileId({
                    file_id,
                    keyword,
                    offset,
                    limit,
                    org_type: stardOrignizeType,
                    sort,
                    direction,
                })
            } else {
                res = await getDictListByFileCatlgId({
                    catalog_id,
                    keyword,
                    offset,
                    limit,
                    org_type: stardOrignizeType,
                    sort,
                    direction,
                })
            }
            setDictList(res.data)
            setTotal(res.total_count)
            setSelectedRowKeys([])
        } catch (error: any) {
            formatError(error)
        } finally {
            setLoading(false)
            setMenuValue(undefined)
        }
    }

    // 获取码表引用详情
    const getDictQuote = async (_dictId: string) => {
        try {
            const res = await getDictQuoteListById(_dictId, {
                offset: 1,
                limit: 10000,
            })
            setDictQuoteRecs(res.data)
        } catch (error) {
            formatError(error)
        }
    }

    const searchChange = (data: any, key: string = '') => {
        handleSelectChange(data[key])
    }

    return (
        <div className={styles.codeTableContent}>
            <div className={styles.operateWrapper}>
                <span className={styles.btnWrapper}>{renderOprContent()}</span>
                <Space className={styles.filterCondits}>
                    <SearchInput
                        className={styles.searchInput}
                        title={__('请输入中英文名称')}
                        placeholder={__('请输入中英文名称')}
                        onKeyChange={(kw: string) => handleSearchPressEnter(kw)}
                        maxLength={64}
                    />
                    <LightweightSearch
                        formData={searchData}
                        onChange={(data, key) => searchChange(data, key)}
                        defaultValue={{ org_type: 1000 }}
                    />
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
                                filterDictList({
                                    ...searchCondition,
                                    keyword: searchKey,
                                })
                            }
                        />
                    </Space>
                </Space>
            </div>
            <div className={styles.showEmpty} hidden={!loading}>
                <Loader />
            </div>
            <div
                ref={ref}
                className={styles.dataList}
                hidden={loading || !hasData}
            >
                <Table
                    rowKey={(rec) => rec.id}
                    columns={columnsDict()}
                    rowClassName={styles.tableRow}
                    sortDirections={['ascend', 'descend', 'ascend']}
                    dataSource={dictList}
                    pagination={{
                        current: pageConfig.current,
                        pageSize: pageConfig.pageSize,
                        total,
                        pageSizeOptions:
                            ListPageSizerOptions[ListType.NarrowList],
                        showSizeChanger: true,
                        showQuickJumper: true,
                        responsive: true,
                        showLessItems: true,
                        onChange: onPageChange,
                        showTotal: (totalCount) => {
                            return `共 ${totalCount} 条记录`
                        },
                        hideOnSinglePage: total <= defaultPagiSize,
                    }}
                    scroll={{
                        y:
                            dictList.length > 0
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

            {/* 文件停用 */}
            {disableFileVisible && (
                <Confirm
                    open={disableFileVisible}
                    title={__('确认要停用吗？')}
                    content={
                        <div className={styles.disableConfirmWrapper}>
                            <div className={styles.disableConfirmContent}>
                                <div>
                                    {__('停用后，该码表将不再被相关标准关联，')}
                                </div>
                                <div>
                                    {__(
                                        '但不会对已经关联该码表的相关标准产生影响',
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

            <ImportDictModal
                visible={importVisible}
                selectedDir={
                    selCatlgClass === CatalogOption.DEPARTMENT
                        ? { id: '22', catalog_name: '全部目录' }
                        : selectedDir
                }
                update={(newSelectedDir?: IDirItem) => {
                    // 根据对话框中选中的目录更改左侧目录的选中目录
                    handleAfterOpr(operateType, newSelectedDir)
                }}
                onClose={() => handleOperateCancel(OperateType.IMPORT)}
            />
            {dictQuoteRecs && dictQuoteRecs.length > 0 && (
                <Modal
                    open={quoteVisible}
                    title={
                        <span className={styles.modalTitle}>
                            {__('查看引用')}
                        </span>
                    }
                    width={372}
                    getContainer={false}
                    maskClosable={false}
                    destroyOnClose
                    style={{
                        top: '252px',
                        margin: '0 auto',
                    }}
                    bodyStyle={{
                        padding: '32px 24px',
                        // 设计好像是502
                        // maxHeight: '502px',
                        // 考虑用户使用页面效果暂定为280
                        maxHeight: '280px',
                        overflowY: 'scroll',
                    }}
                    onCancel={() => handleOperateCancel(OperateType.QUOTE)}
                    className={styles.quoteModal}
                    footer={null}
                >
                    <div>
                        <div className={styles.quoteTip}>
                            {__('该码表被以下数据元引用')}
                        </div>
                        <div className={styles.quoteContent}>
                            {dictQuoteRecs.map((item: any, index) => {
                                return (
                                    <p
                                        className={styles.quoteContentItem}
                                        key={index}
                                    >
                                        <Tooltip title={item.name_cn}>
                                            <span
                                                className={styles.oneEllipsis}
                                            >
                                                {item.name_cn}
                                            </span>
                                        </Tooltip>
                                    </p>
                                )
                            })}
                        </div>
                    </div>
                </Modal>
            )}
            {/* 列表上方'移动至'按钮-移动数据元/码表至XX目录 */}
            {selectedRowKeys && selectedRowKeys.length > 0 && (
                <EditDirModal
                    title={__('移动至目录')}
                    visible={editMoveToVisible}
                    dirType={CatalogType.CODETABLE}
                    onClose={() => handleOperateCancel(OperateType.MOVEDATATO)}
                    // 这里传值EDIT以与目录中的移动至MOVETO区分
                    oprType={OperateType.MOVEDATATO}
                    oprItem={selectedRowKeys}
                    setOprItem={setSelectedRowKeys}
                    afterOprReload={(newSelectedDir?: any) => {
                        // 根据对话框中选中的目录更改左侧目录的选中目录
                        handleAfterOpr(operateType, newSelectedDir)
                    }}
                />
            )}
            {editVisible && (
                <EditDictForm
                    type={operateType}
                    visible={editVisible}
                    dictId={dictId}
                    selectedDir={selectedDir}
                    getTreeList={getTreeList}
                    onClose={(operate: Operate) =>
                        handleOperateCancel(OperateType.EDIT, operate)
                    }
                    update={(newSelectedDir?: IDirItem) => {
                        handleAfterOpr(operateType, newSelectedDir)
                    }}
                    selCatlgClass={selCatlgClass || CatalogOption.AUTOCATLG}
                />
            )}
            {oprId && detailVisible && (
                <Details
                    visible={detailVisible && oprId !== ''}
                    dictId={oprId}
                    onClose={() => handleOperateCancel(OperateType.DETAIL)}
                />
            )}
        </div>
    )
}

export default DictManage
