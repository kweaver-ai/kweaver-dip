import {
    CheckCircleTwoTone,
    DownOutlined,
    EllipsisOutlined,
    ExclamationCircleFilled,
} from '@ant-design/icons'
import { useSize, useUpdateEffect } from 'ahooks'
import {
    Button,
    Dropdown,
    Form,
    Input,
    Space,
    Table,
    Tooltip,
    message,
} from 'antd'
import { DefaultOptionType } from 'antd/es/select'
import Cookies from 'js-cookie'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import classnames from 'classnames'
import { isNumber, trim } from 'lodash'
import moment from 'moment'
import { confirm } from '@/utils/modalHelper'

import dataEmpty from '@/assets/dataEmpty.svg'
import emptyAdd from '@/assets/emptyAdd.svg'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    AttachmentType,
    CatalogOption,
    CatalogType,
    IDirItem,
    IDirQueryType,
    IFileItem,
    IMenuData,
    SortDirection,
    StateType,
    changeFileState,
    delFileByIds,
    exportFileById,
    exportFileByIds,
    formatError,
    getFileList,
} from '@/core'
import { AddOutlined } from '@/icons'
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
    Operate,
    OperateType,
    getFileExtension,
    keyboardCharactersReg,
    stardOrignizeTypeAll,
    stardOrignizeTypeList,
    stateOptionList,
    streamToFile,
    useQuery,
} from '@/utils'
import Confirm from '../Confirm'
import EditDirModal from '../Directory/EditDirModal'
import DropDownFilter from '../DropDownFilter'
import { MoreOperate, StdTreeDataOpt } from '../StandardDirTree/const'
import { defaultMenu, menus, searchData } from './const'
import Details from './Details'
import EditFileForm from './EditFileForm'
import FileIcon from './FileIcon'
import {
    FileIconType,
    FileSorterType,
    ISearchCondition,
    fileTypeOptions,
} from './helper'
import ImportFileModal from './ImportFileModal'
import __ from './locale'
import StandardMaintenance from './StandardMaintenance'
import styles from './styles.module.less'

interface IFile {
    selectedDir: IDirItem
    setSelectedDir: (item: IDirItem) => void
    getTreeList: (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
        newSelectedDir?: any,
    ) => void
    selCatlgClass: CatalogOption
}

const defaultPagiSize = 20

const initSearchCondition = {
    catalog_id: 44,
    offset: 1,
    limit: defaultPagiSize,
    org_type: undefined,
    keyword: '',
    sort: FileSorterType.CREATED,
    direction: SortDirection.DESC,
}

const File: React.FC<IFile> = ({
    selectedDir,
    setSelectedDir,
    getTreeList,
    selCatlgClass,
}) => {
    const { checkPermission } = useUserPermCtx()
    const query = useQuery()

    // 操作类型
    const [operateType, setOperateType] = useState<OperateType>(
        OperateType.CREATE,
    )

    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')

    // 文件id
    const [fileId, setFileId] = useState<string>()

    const ref = useRef<HTMLDivElement>(null)

    // 列表大小
    const size = useSize(ref)

    // 导入对话框显示,【true】显示,【false】隐藏
    const [importVisible, setImportVisible] = useState(false)

    const [disableForm] = Form.useForm()

    // 停用文件对话框显示,【true】显示,【false】隐藏
    const [disableFileVisible, setDisableFileVisible] = useState(false)

    // 创建/编辑界面显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)

    // 详情界面显示,【true】显示,【false】隐藏
    const [detailVisible, setDetailVisible] = useState(false)

    // 标准维护界面
    const [maintenanceVisible, setMaintenanceVisible] = useState(false)

    // 移动至界面显示,【true】显示,【false】隐藏
    const [editMoveToVisible, setEditMoveToVisible] = useState(false)

    // 表格选中项
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    // 删除弹框显示,【true】显示,【false】隐藏
    const [delVisible, setDelVisible] = useState(false)

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
        { key: FileSorterType | string; sort: SortDirection } | undefined
    >(defaultMenu)

    // 搜索参数
    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        ...initSearchCondition,
        keyword: query.get('name') || '',
        catalog_id: selectedDir.id,
    })

    // table文件列表
    const [fileList, setFileList] = useState<Array<IFileItem>>([])

    // table分页参数
    const [total, setTotal] = useState(0)
    // 当前页码信息
    const [pageConfig, setPageConfig] = useState({
        current: 1,
        pageSize: defaultPagiSize,
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
                downloadZipConfirm(exportFielByIds)
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

    // 打包下载提示框
    const downloadZipConfirm = (okCallBack: () => void) => {
        const appendixCount =
            fileList?.filter(
                (fItem) =>
                    selectedRowKeys.includes(fItem.id) &&
                    fItem.attachment_type === AttachmentType.FILE,
            )?.length || 0
        confirm({
            title: __(
                '共选中 ${totalCount} 个文件，其中包含 ${fileCount} 个附件，已为您全部下载。',
                {
                    totalCount: selectedRowKeys?.length || 0,
                    fileCount: appendixCount,
                },
            ),
            icon: <CheckCircleTwoTone twoToneColor="#52c31b" />,
            content: __('链接格式的文件不包含附件，故无法下载'),
            width: 520,
            okText: __('确定'),
            cancelText: __('取消'),
            onOk() {
                okCallBack()
            },
        })
    }

    // 通过选中id下载文件
    const exportFielByIds = async () => {
        if (!selectedRowKeys || !selectedRowKeys.length) return
        try {
            // get请求下载方式
            // window.location.href = `/api/standardization/v1/dataelement/export/${selectedRowKeys.join()}`
            const res = await exportFileByIds(selectedRowKeys)
            if (
                typeof res === 'object' &&
                isNumber(res.byteLength) &&
                res.byteLength >= 0
            ) {
                streamToFile(
                    res,
                    `标准文件_${moment(new Date()).format(
                        'YYYYMMDDHHmmss',
                    )}.zip`,
                )
                message.success('下载成功')
            } else {
                message.error('下载失败')
            }
        } catch (e: any) {
            let { response: error } = e
            if (typeof error?.data === 'object') {
                const decoder = new TextDecoder()
                const jsonString = decoder.decode(error?.data)
                // 将字符串转换为 JSON 对象
                const jsonObject = JSON.parse(jsonString)
                error = Object.assign(error, { data: jsonObject })
            }
            if (
                error?.data?.code ===
                'Standardization.InternalError.FileDownloadFailed'
            ) {
                message.error(__('系统内部错误，请联系管理员'))
                return
            }
            formatError(error || e)
        }
    }

    // const moreOprMenu = (disable: boolean) =>
    //     [
    //         // 批量下载
    //         getAccess(`${ResourceType.data_standard}.${RequestType.get}`)
    //             ? {
    //                   label: '下载',
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
            catalog_id: selectedDir.id,
        })
        setPageConfig({
            current: 1,
            pageSize: 20,
        })
        // setSearchKey('')
        setSeledStdOgnizType(stardOrignizeTypeAll)
        setMenuValue(defaultMenu)
        setSelectedRowKeys([])
    }, [selectedDir.id])

    useUpdateEffect(() => {
        filterFileList(searchCondition)
    }, [searchCondition])

    // 处理页码变化
    const onPageChange = (page: number, pageSize: number) => {
        setFileList([]) // 清空table的datasource，避免报错
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
            content: __(
                '删除后，该标准文件将无法恢复，但不会对已经关联该标准文件的相关数据标准产生影响',
            ),
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
                fileList?.length === (batchDel ? selectedRowKeys?.length : 1)
                    ? pageConfig.current - 1 > 0
                        ? pageConfig.current - 1
                        : 1
                    : pageConfig.current

            await delFileByIds(dId)
            setIsLoading(false)
            getTreeList(undefined, undefined, selectedDir)
            message.success('删除成功')
            if (pageCurrent === pageConfig.current) {
                filterFileList(searchCondition)
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
                filterFileList(searchCondition)
            } else {
                formatError(error)
            }
        } finally {
            setIsLoading(false)
            // setDelVisible(false)
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
            // 导入文件
            setImportVisible(true)
        } else if (type === OperateType.MOVEDATATO) {
            // 移动文件至新目录
            setEditMoveToVisible(true)
        } else if (type === OperateType.CHANGESTATE) {
            serOprId(id || '')
            if (record.state === StateType.DISABLE) {
                handleChangeFileState(id!, StateType.ENABLE)
            } else {
                setDisableFileVisible(true)
            }
        } else if (type === OperateType.FILEMAINTENANCE) {
            setMaintenanceVisible(true)
            setFileId(record.id)
        } else if (type === OperateType.VIEWFILE) {
            handleDownloadOrLink(record)
        } else if (type === OperateType.DELETE) {
            setDelId(record.id)
            deleteConfirm(() => handleDelete(record.id, false))
        } else {
            // 编辑或添加文件
            setEditVisible(true)
        }
        setOperateType(type)
        setFileId(id)
    }

    // 操作成功之后更新左侧树及table数据
    const handleAfterOpr = (newSelectedDir?: any) => {
        // getTreeList(undefined, undefined, newSelectedDir)
        if (newSelectedDir?.id === selectedDir.id) {
            // 操作没有更换目录，手动刷新数据
            filterFileList({ ...searchCondition, offset: 1 })
        }
    }

    const handleDownloadOrLink = async (fileItem: IFileItem) => {
        const { id, attachment_type, attachment_url, file_name } = fileItem
        const fileType = getFileExtension(file_name)
        if (attachment_type === AttachmentType.URL) {
            window.open(attachment_url, '_blank')
        } else {
            const url = exportFileById(id)
            axios
                .get(url, {
                    headers: {
                        Authorization: `Bearer ${Cookies.get(
                            'af.oauth2_token',
                        )}`,
                    },
                    responseType: 'arraybuffer',
                })
                .then((res: any) => {
                    const data = res?.data
                    const header =
                        res.headers?.['content-disposition']?.split('filename=')

                    const fileName =
                        header?.length > 0
                            ? decodeURIComponent(header[1])
                            : `标准文件_${moment(new Date()).format(
                                  'YYYYMMDDHHmmss',
                              )}.${fileType}`
                    if (typeof data === 'object' && data.byteLength) {
                        streamToFile(data, fileName)
                        message.success('下载成功')
                    } else {
                        message.error('下载失败')
                    }
                })
                .catch((e) => {
                    let { response: error } = e
                    if (typeof error?.data === 'object') {
                        const decoder = new TextDecoder()
                        const jsonString = decoder.decode(error?.data)
                        // 将字符串转换为 JSON 对象
                        const jsonObject = JSON.parse(jsonString)
                        error = Object.assign(error, { data: jsonObject })
                    }
                    if (
                        error?.data?.code ===
                        'Standardization.InternalError.FileDownloadFailed'
                    ) {
                        message.error(__('系统内部错误，请联系管理员'))
                        return
                    }
                    formatError(error || e)
                })
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

            await changeFileState(id, { state, reason })
            filterFileList(searchCondition)
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
            // 移动文件至
            setEditMoveToVisible(false)
        } else if (type === OperateType.FILEMAINTENANCE) {
            setMaintenanceVisible(false)
        } else if (type === OperateType.CHANGESTATE) {
            setDisableFileVisible(false)
            disableForm.resetFields()
        } else if ([OperateType.CREATE, OperateType.EDIT].includes(type)) {
            // 新建/编辑文件
            if (operate === Operate.OK) {
                setEditVisible(false)
                filterFileList(searchCondition)
            } else if (operate === Operate.OK_AND_CONTINUEOPR) {
                filterFileList(searchCondition)
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
            org_type: value === stardOrignizeTypeAll ? undefined : value,
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
                key: selectedMenu.key as FileSorterType,
                sort:
                    selectedMenu.sort === 'asc'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            })
            setSearchCondition({
                ...searchCondition,
                offset: current,
                keyword: searchKey,
                sort: selectedMenu.key as FileSorterType,
                direction:
                    selectedMenu.sort === 'asc'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            })
        }
    }

    // 表格项操作
    const columnOprs = (record: any) => {
        return checkPermission('manageDataStandard')
            ? [
                  {
                      key: OperateType.EDIT,
                      label: __('编辑'),
                  },
                  {
                      key: OperateType.CHANGESTATE,
                      label:
                          record.state === StateType.DISABLE
                              ? __('启用')
                              : __('停用'),
                  },
                  {
                      key: OperateType.FILEMAINTENANCE,
                      label: __('标准维护'),
                  },
                  {
                      key: OperateType.VIEWFILE,
                      label: (
                          <div>
                              {record.attachment_type === AttachmentType.FILE
                                  ? __('下载')
                                  : __('访问')}
                          </div>
                      ),
                  },
                  {
                      key: OperateType.DELETE,
                      label: __('删除'),
                  },
              ]
            : []
    }

    // 是否至少有一种操作权限
    const hasOprAccess = useMemo(() => {
        return checkPermission('manageDataStandard')
    }, [checkPermission])

    // const getItems = (record: any): MenuProps['items'] =>
    //     [
    //         getAccess(`${ResourceType.data_standard}.${RequestType.get}`)
    //             ? {
    //                   label: (
    //                       <div>
    //                           {record.attachment_type === AttachmentType.FILE
    //                               ? __('下载')
    //                               : __('访问')}
    //                       </div>
    //                   ),
    //                   key: OperateType.VIEWFILE,
    //               }
    //             : null,
    //         getAccess(`${ResourceType.data_standard}.${RequestType.delete}`)
    //             ? {
    //                   label: <div>{__('删除')}</div>,
    //                   key: OperateType.DELETE,
    //               }
    //             : null,
    //     ].filter((item) => item)

    const handleClickMore = (key: string, record: any) => {
        // 文件维护
        if (key === OperateType.FILEMAINTENANCE) {
            setMaintenanceVisible(true)
            setFileId(record.id)
        } else if (key === OperateType.DELETE) {
            setDelId(record.id)
            setDelVisible(true)
        }
    }

    // 原始/标准表格项
    const columnsFile = (): ColumnsType<IFileItem> => {
        const cols: any = [
            {
                title: __('标准文件名称'),
                dataIndex: 'name',
                key: 'name',
                width: 172,
                ellipsis: true,
                render: (name: any, record: any) => (
                    <div
                        className={classnames(
                            styles.showTableInfo,
                            styles.fileNameWrapper,
                        )}
                    >
                        <FileIcon
                            type={
                                record.attachment_type === AttachmentType.URL
                                    ? FileIconType.LINK
                                    : getFileExtension(record.file_name)
                            }
                        />

                        <div
                            className={styles.topInfo}
                            title={name || '--'}
                            onClick={() =>
                                handleOperate(OperateType.DETAIL, record.id)
                            }
                        >
                            {name || '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: __('标准编号'),
                dataIndex: 'number',
                key: 'number',
                width: 172,
                ellipsis: true,
                render: (number: any, record: any) => (
                    <div className={styles.showTableInfo}>
                        <div className={styles.topInfo} title={number || '--'}>
                            {number || '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: __('标准分类'),
                dataIndex: 'org_type',
                key: 'org_type',
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
            {
                title: __('文件类型'),
                dataIndex: 'attachment_type',
                key: 'attachment_type',
                width: 116,
                ellipsis: true,
                render: (attachment_type: any) => {
                    const res = fileTypeOptions?.find(
                        (item) => item.value === attachment_type,
                    )
                    return (
                        <div className={styles.baseTableRow}>
                            {res ? res.typeLabel : '--'}
                        </div>
                    )
                },
            },
            {
                title: __('所属组织结构'),
                dataIndex: 'department_name',
                key: 'department_name',
                width: 172,
                ellipsis: true,
                render: (value, record) => (
                    <span title={record.department_path_names || ''}>
                        {record.department_name || '--'}
                    </span>
                ),
            },
            {
                title: __('实施日期'),
                dataIndex: 'act_date',
                key: 'act_date',
                width: 144,
                ellipsis: true,
                sorter: true,
                sortOrder:
                    searchCondition.sort === 'act_date'
                        ? searchCondition.direction === SortDirection.ASC
                            ? 'ascend'
                            : 'descend'
                        : null,
                showSorterTooltip: {
                    title: __('按实施日期排序'),
                    placement: 'bottom',
                },
                render: (date: any) => (
                    <div className={styles.baseTableRow}>
                        {date ? moment(date || '').format('YYYY-MM-DD') : '--'}
                    </div>
                ),
            },
            {
                title: __('停用日期'),
                dataIndex: 'disable_date',
                key: 'disable_date',
                width: 144,
                ellipsis: true,
                sorter: true,
                sortOrder:
                    searchCondition.sort === 'disable_date'
                        ? searchCondition.direction === SortDirection.ASC
                            ? 'ascend'
                            : 'descend'
                        : null,
                showSorterTooltip: {
                    title: __('按停用日期排序'),
                    placement: 'bottom',
                },
                render: (date: any) => (
                    <div className={styles.baseTableRow}>
                        {date ? moment(date || '').format('YYYY-MM-DD') : '--'}
                    </div>
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
                      title: __('操作'),
                      fixed: 'right',
                      key: 'action',
                      width: 230,
                      render: (_: string, record: any) => {
                          // 按钮超过三个之外的放到dropdown中
                          const oprs = columnOprs(record) || []
                          const maxBtnCount = 4
                          const showMore = oprs?.length > maxBtnCount
                          //   按钮展示
                          const btnOprs = showMore
                              ? oprs.slice(0, maxBtnCount - 1)
                              : oprs
                          // 下拉展示，超过四个，把第四个及其之后的放到dropdown中
                          const moreMenus = showMore
                              ? oprs.slice(maxBtnCount - 1)
                              : []
                          return (
                              <Space size={16} className={styles.tableOperate}>
                                  {btnOprs?.map((oItem, oIndex) => {
                                      return (
                                          <div
                                              key={oIndex}
                                              className={styles.operate}
                                              onClick={() =>
                                                  handleOperate(
                                                      oItem.key,
                                                      record.id,
                                                      record,
                                                  )
                                              }
                                          >
                                              {oItem?.label}
                                          </div>
                                      )
                                  })}
                                  {moreMenus?.length > 0 && (
                                      <Dropdown
                                          overlayClassName={styles.dropdownMore}
                                          menu={{
                                              items: moreMenus,
                                              onClick: ({ key }) =>
                                                  handleOperate(
                                                      key as OperateType,
                                                      record?.id,
                                                      record,
                                                  ),
                                          }}
                                      >
                                          <a onClick={() => {}}>
                                              {__('更多')}
                                              <DownOutlined />
                                          </a>
                                      </Dropdown>
                                  )}
                              </Space>
                          )
                      },
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

    // 是否由选中文件
    const hasSelected = selectedRowKeys.length > 0

    const hasData = useMemo(() => {
        return fileList.length > 0
    }, [selectedDir, searchCondition.keyword, seledStdOgnizType, fileList])

    const showEmpty = () => {
        const searchValue = searchCondition.keyword
        const stdType = searchCondition.org_type
        // 搜索条件不为初始值
        if (searchValue || (typeof stdType === 'number' && stdType >= 0)) {
            // 搜索无数据，空白显示，显缺省图+文字提示
            return <Empty />
        }

        // 是否有添加/导入权限
        const hasAddAccess = checkPermission('manageDataStandard')

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
                    【{__('添加文件')}】
                </span>
                {__('可新建文件')}
            </div>
        ) : (
            __('暂无数据')
        )
        return (
            <Empty desc={desc} iconSrc={hasAddAccess ? emptyAdd : dataEmpty} />
        )
    }

    // 根据过滤条件获取文件
    const filterFileList = async (condition: ISearchCondition) => {
        const {
            catalog_id,
            offset,
            limit,
            // status,
            org_type,
            keyword,
            sort,
            direction,
        } = condition
        if (!catalog_id) return
        try {
            setLoading(true)
            let res
            if (selCatlgClass === CatalogOption.DEPARTMENT) {
                res = await getFileList({
                    department_id: isNumber(catalog_id) ? '' : catalog_id,
                    keyword,
                    offset,
                    limit,
                    org_type,
                    sort,
                    direction,
                })
            } else {
                res = await getFileList({
                    catalog_id,
                    keyword,
                    // offset: pageConfig.current,
                    // limit: pageConfig.pageSize,
                    offset,
                    limit,
                    // status,
                    org_type,
                    sort,
                    direction,
                })
            }
            // 设置数据 + 设置 pageSize
            setFileList(res.data)
            setTotal(res.total_count)

            // 测试数据-del
            // setFileList(fileListTest)
            // setTotal(fileListTest?.length)

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
        return checkPermission('manageDataStandard')
            ? [
                  {
                      key: OperateType.CREATE,
                      label: __('添加文件'),
                      btnNode: (
                          <Button
                              type="primary"
                              className={styles.operateBtn}
                              onClick={() => handleOperate(OperateType.CREATE)}
                          >
                              <AddOutlined className={styles.operateIcon} />
                              <span className={styles.operateText}>
                                  {__('添加文件')}
                              </span>
                          </Button>
                      ),
                      oprClassName: styles.operateBtn,
                  },
                  // {
                  //     key: OperateType.IMPORT,
                  //     label: __('导入'),
                  //     btnNode: (
                  //         <Button
                  //                 className={classnames(
                  //                     styles.operateBtn,
                  //                     styles.opearteWhite,
                  //                 )}
                  //                 onClick={() => handleOperate(OperateType.IMPORT)}
                  //             >
                  //                 <ImportOutlined className={styles.operateIcon} />
                  //                 <span className={styles.operateText}>
                  //                     {__('批量添加')}
                  //                 </span>
                  //             </Button>
                  //     ),
                  //     oprClassName: classnames(
                  //         styles.operateBtn,
                  //         styles.opearteWhite,
                  //     ),
                  //     access: `${ResourceType.data_standard}.${RequestType.post}`,
                  // },
                  {
                      key: OperateType.MOVEDATATO,
                      label: __('移动至'),
                      disabled: disable,
                      btnNode: (
                          <Tooltip
                              title={hasSelected ? '' : __('请先选择文件')}
                          >
                              <Button
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
                  },
                  // {
                  //     key: OperateType.EXPORT,
                  //     label: __('下载'),
                  //     disabled: disable,
                  //     btnNode: (
                  //         <Tooltip title={hasSelected ? '' : __('请先选择数据元')}>
                  //             <Button
                  //                 className={classnames(
                  //                     styles.operateBtn,
                  //                     styles.opearteWhite,
                  //                 )}
                  //                 onClick={() =>
                  //                     handleClickMenu({ key: MoreOperate.EXPORT })
                  //                 }
                  //                 disabled={!hasSelected}
                  //             >
                  //                 <span className={styles.operateText}>
                  //                     {__('下载')}
                  //                 </span>
                  //             </Button>
                  //         </Tooltip>
                  //     ),
                  //     oprClassName: classnames(
                  //         styles.operateBtn,
                  //         styles.opearteWhite,
                  //     ),
                  //     access: `${ResourceType.data_standard}.${RequestType.get}`,
                  // },
                  {
                      key: OperateType.DELETE,
                      label: __('删除'),
                      disabled: disable,
                      btnNode: (
                          <Tooltip
                              title={hasSelected ? '' : __('请先选择文件')}
                          >
                              <Button
                                  className={classnames(
                                      styles.operateBtn,
                                      styles.opearteWhite,
                                  )}
                                  onClick={() =>
                                      handleClickMenu({
                                          key: MoreOperate.DELETE,
                                      })
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
                  },
              ]
            : []
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

        return (
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
        <div className={styles.fileContentWrapper}>
            <div className={styles.operateWrapper}>
                <span className={styles.btnWrapper}>{renderOprContent()}</span>
                <Space className={styles.filterCondits}>
                    <SearchInput
                        className={styles.searchInput}
                        title={__('请输入文件名称、编号')}
                        placeholder={__('请输入文件名称、编号')}
                        value={searchCondition.keyword}
                        onKeyChange={(kw: string) => {
                            handleSearchPressEnter(kw)
                        }}
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
                                filterFileList({
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
                className={styles.fileList}
                hidden={loading || !hasData}
            >
                <Table
                    rowKey={(rec) => rec.id}
                    columns={columnsFile()}
                    rowClassName={styles.tableRow}
                    sortDirections={['ascend', 'descend', 'ascend']}
                    dataSource={fileList}
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
                        x: 500,
                        y:
                            fileList?.length === 0
                                ? undefined
                                : total > pageConfig.pageSize
                                ? (size?.height || 588) - 119
                                : (size?.height || 588) - 119,
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
                                    {__(
                                        '停用后，该标准文件将不再被相关标准关联，',
                                    )}
                                </div>
                                <div>
                                    {__(
                                        '但不会对已经关联该标准文件的相关标准产生影响',
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
                    // className={(styles.commConfirm, styles.disableConfirm)}
                    className={styles.disableConfirm}
                />
            )}

            {/* 导入 */}
            {importVisible && (
                <ImportFileModal
                    visible={importVisible}
                    selectedDir={selectedDir}
                    setSelectedDir={setSelectedDir}
                    update={(newSelectedDir?: IDirItem) =>
                        handleAfterOpr(newSelectedDir)
                    }
                    onClose={() => handleOperateCancel(OperateType.IMPORT)}
                />
            )}
            {/* 列表上方'移动至'按钮-移动文件/码表至XX目录 */}
            {selectedRowKeys && selectedRowKeys.length > 0 && (
                <EditDirModal
                    title={__('移动至目录')}
                    visible={editMoveToVisible}
                    dirType={CatalogType.FILE}
                    onClose={() => handleOperateCancel(OperateType.MOVEDATATO)}
                    oprType={OperateType.MOVEDATATO}
                    oprItem={selectedRowKeys}
                    setOprItem={setSelectedRowKeys}
                    afterOprReload={(newSelectedDir?: IDirItem) =>
                        handleAfterOpr(newSelectedDir)
                    }
                />
            )}
            {/* 编辑文件抽屉 */}
            {editVisible && (
                <EditFileForm
                    type={operateType}
                    visible={editVisible}
                    fileId={fileId}
                    selectedDir={selectedDir}
                    getTreeList={getTreeList}
                    onClose={(operate: Operate) =>
                        handleOperateCancel(operateType, operate)
                    }
                    update={(newSelectedDir?: IDirItem) =>
                        handleAfterOpr(newSelectedDir)
                    }
                    selCatlgClass={selCatlgClass}
                />
            )}
            {/* 文件详情 */}
            {detailVisible && oprId !== '' && (
                <Details
                    visible={detailVisible && oprId !== ''}
                    fileId={oprId}
                    onClose={() => handleOperateCancel(OperateType.DETAIL)}
                    handleError={(errorKey: string) => {
                        // 文件不存在(status:400, code:Standardization.Empty)，刷新列表
                        if (errorKey === 'Standardization.Empty') {
                            filterFileList(searchCondition)
                        }
                    }}
                />
            )}

            {maintenanceVisible && fileId && (
                <StandardMaintenance
                    // type={operateType}
                    visible={maintenanceVisible}
                    fileId={fileId}
                    selectedDir={selectedDir}
                    getTreeList={getTreeList}
                    onClose={(operate: Operate) =>
                        handleOperateCancel(
                            OperateType.FILEMAINTENANCE,
                            operate,
                        )
                    }
                    update={(newSelectedDir?: IDirItem) => {
                        // 由于抽屉不改变原有父页内容，故此不应切换选中节点
                        // 根据对话框中选中的目录更改左侧目录的选中目录
                        // if (
                        //     newSelectedDir &&
                        //     newSelectedDir.id &&
                        //     newSelectedDir.id !== selectedDir.id
                        // ) {
                        //     setSelectedDir(newSelectedDir)
                        // } else {
                        filterFileList(searchCondition)
                        // }
                    }}
                />
            )}
        </div>
    )
}

export default File
