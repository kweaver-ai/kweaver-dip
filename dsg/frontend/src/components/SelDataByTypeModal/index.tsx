import { ExclamationCircleFilled } from '@ant-design/icons'
import {
    Button,
    Divider,
    Input,
    Layout,
    Modal,
    Space,
    Table,
    Tooltip,
    Tree,
    TreeProps,
} from 'antd'
import Sider from 'antd/es/layout/Sider'
import { RowSelectionType } from 'antd/es/table/interface'
import { ColumnsType } from 'antd/lib/table'
import classnames from 'classnames'
import { trim } from 'lodash'
import React, {
    forwardRef,
    Key,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { confirm } from '@/utils/modalHelper'
import { getPopupContainer } from '@/utils/microApp'
import Loader from '@/ui/Loader'
import Empty from '@/ui/Empty'
import { DisableStateColored } from '@/icons'
import {
    CatalogOption,
    CatalogType,
    CatalogTypeToName,
    formatError,
    getCRuleListByFileCatalogSearch,
    getCRuleListByFileSearch,
    getCRuleListBySearch,
    getDataElement,
    getDataElementByFileCatlg,
    getDataElementByFileId,
    getDictList,
    getDictListByFileCatlgId,
    getDictListByFileId,
    getDirDataByTypeOrId,
    getFileDirByTypeOrId,
    getFileList,
    getRuleRec,
    getStdRec,
    ICRuleItem,
    IDataElement,
    IDataItem,
    IDictItem,
    IDirItem,
    IDirQueryType,
    IFileItem,
    IMenuData,
    IRuleRecParams,
    IStdRecParams,
    SortDirection,
    StdFileCatlgType,
} from '@/core'
import emptyFolder from '@/assets/emptySmall.svg'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import styles from './styles.module.less'

import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { LightweightSearch, SearchInput } from '@/ui'
import {
    Operate,
    OperateType,
    StandardizationType,
    stardOrignizeTypeAll,
    stardOrignizeTypeList,
    StateType,
    StdDirStyle,
} from '@/utils'
import EditCodeRule from '../CodeRulesComponent/EditCodeRule'
import { searchData } from '../CodeTableManage/const'
import EditDictForm from '../CodeTableManage/EditDictForm'
import EditDataEleForm from '../DataEleManage/EditDataEleForm'
import DropDownFilter from '../DropDownFilter'
import { defaultMenu, menus as fileMenus } from '../File/const'
import { FileSorterType } from '../File/helper'
import StandardDirTree from '../StandardDirTree'
import {
    fileCatlgTreeToStdTreeData,
    StdTreeDataOpt,
} from '../StandardDirTree/const'

const { TreeNode } = Tree
const { Search } = Input

const menus = [
    { key: FileSorterType.CREATED, label: '按创建时间排序' },
    { key: FileSorterType.UPDATED, label: '按最终修改时间排序' },
]

/**
 * @param ref 传递方法getData，当详情被删除之后重新刷新列表
 */
interface ISelDataByTypeModal {
    visible: boolean
    ref?: any
    // title: string
    onClose: () => void
    // 点击确定键关闭时返回具体的选中的数据
    onOk?: (okItems: any, node?: any) => void
    // 数据类型-如：数据元、码表
    dataType: CatalogType
    // 数据标识，如文件标准维护中，选择数据元时使用id作为key，任务管理模块选择数据元使用code作为key
    dataKey?: string
    // 指定标准分类
    specifyStdType?: StandardizationType
    // 多选/单选
    rowSelectionType?: RowSelectionType
    contentKeyword?: string // 支持带入关键字参数搜索列表
    // oprType: number
    oprItems: IDataItem[]
    setOprItems: (newOprItem: IDataItem[]) => void
    handleShowDataDetail: (
        dataType: CatalogType,
        dataId?: string,
        code?: string,
    ) => void // 选择对话框中查看详情（码表/编码规则）
    // 是否展示"立即新建"提示
    showAddNewBtn?: boolean
    // 新建数据元对话框样式
    addNewModalStyle?: React.CSSProperties | undefined
    isEnableDict?: boolean
    isEnableCodeRule?: boolean
    getContainer?: any
    getDisabledDataEleInfo?: (dataType: number) => {
        disabled: boolean
        tip: string
    }
    checkItemDisabled?: (item: any) => boolean
    // 标准推荐参数
    stdRecParams?: IStdRecParams
    // 编码规则推荐参数
    ruleRecParams?: IRuleRecParams
}

interface IQueryParams {
    // 选择目录的id
    catalog_id: string
    // 页数，默认1
    offset?: number
    // 每页数量，默认5条
    limit?: number
    // 标准组织类型(std_type：数据元使用， org_type：码表使用)
    org_type?: number
    // std_type?: number
    // 搜索关键字
    keyword?: string
    // 排序字段
    sort?: FileSorterType
    // 排序方向
    direction?: SortDirection

    department_id?: string
}

/**
 * 点击下拉框等打开此对话框，选择data（如:新建数据元选择码表/编码规则）
 * @param props
 * @returns
 */
const SelDataByTypeModal: React.FC<ISelDataByTypeModal> = forwardRef(
    (props: any, ref) => {
        const {
            visible,
            onClose,
            onOk,
            dataType,
            dataKey = 'id',
            specifyStdType,
            rowSelectionType = 'radio',
            contentKeyword,
            oprItems,
            setOprItems,
            showAddNewBtn = false,
            addNewModalStyle,
            handleShowDataDetail,
            isEnableDict,
            isEnableCodeRule,
            getContainer,
            getDisabledDataEleInfo,
            checkItemDisabled,
            stdRecParams,
            ruleRecParams,
        } = props
        const { checkPermission } = useUserPermCtx()

        const treeRef: any = useRef()

        // 目录loading
        const [dirLoading, setDirLoading] = useState(true)

        // 列表loading
        const [dataLoading, setDataLoading] = useState(true)

        const [treeData, setTreeData] = useState<IDirItem[]>()

        const [dataList, setDataList] = useState<any>()
        const [recDataList, setRecDataList] = useState<any>()

        // 目录搜索关键字
        const [dirSearchKey, setDirSearchKey] = useState('')

        // 目录被选中节点
        const [selectedDir, setSelectedDir] = useState<IDirItem>()

        const [errorText, setErrorText] = useState('')

        // 右侧列表的搜索名称
        const [listSearchKey, setListSearchKey] = useState('')

        // 标准组织类型
        const [seledStdOgnizType, setSeledStdOgnizType] =
            useState<number>(stardOrignizeTypeAll)

        const [menuValue, setMenuValue] = useState<
            { key: FileSorterType; sort: SortDirection } | undefined
        >(defaultMenu)

        const [columns, setColumns] = useState<any>([])

        const [searchQuery, setSearchQuery] = useState<IQueryParams>({
            catalog_id:
                selectedDir && selectedDir.id ? selectedDir.id.toString() : '',
            keyword: contentKeyword || '', // 右边列表内容的keyword
            offset: 1,
            limit: 20,
            sort: menuValue?.key,
            direction: menuValue?.sort,
            org_type:
                typeof specifyStdType === 'number'
                    ? specifyStdType
                    : stardOrignizeTypeAll,
        })

        // table分页参数
        const [total, setTotal] = useState(0)

        // 码表/编码规则详情
        const [detailId, setDetailId] = useState('')

        // 码表详情
        const [codeTbDetailVisible, setCodeTbDetailVisible] =
            useState<boolean>(false)
        // 编码规则详情
        const [codeRuleDetailVisible, setCodeRuleDetailVisible] =
            useState<boolean>(false)

        // 新建数据元对话框
        const [createDEVisible, setCreateDEVisible] = useState(false)

        // 新建码表对话框
        const [createDictVisible, setCreateDictVisible] = useState(false)

        // 新建编码规则对话框
        const [createCRVisible, setCreateCRVisible] = useState(false)

        // const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>(
        //     oprItems.map((item: any) => item.key),
        // )

        const [selectedRowInfo, setSelectedRowInfo] = useState<any>([])

        useEffect(() => {
            if (!visible) {
                // 初始化
                setTreeData(undefined)
                setSelectedDir(undefined)
                setSearchQuery({
                    catalog_id: '',
                    keyword: contentKeyword || '', // 右边列表内容的keyword
                    offset: 1,
                    limit: 20,
                    org_type: specifyStdType,
                })
                setDataList(undefined)
                setDirSearchKey('')
                setListSearchKey(contentKeyword || '')
                setSeledStdOgnizType(stardOrignizeTypeList[0].value)
            }
        }, [visible])

        useEffect(() => {
            if (selectedDir) {
                setSearchQuery({
                    ...searchQuery,
                    catalog_id:
                        selectedDir && selectedDir.id
                            ? selectedDir.id.toString()
                            : '',
                    offset: 1,
                    department_id: selectedDir?.id || '',
                })
                setSeledStdOgnizType(stardOrignizeTypeList[0].value)
            } else {
                setSearchQuery({
                    ...searchQuery,
                    offset: 1,
                    department_id: '',
                    catalog_id: '',
                })
            }
        }, [JSON.stringify(selectedDir)])

        useEffect(() => {
            if (visible) {
                getDataList()
            }
        }, [JSON.stringify(searchQuery), visible])

        useEffect(() => {
            setSelectedRowInfo(
                oprItems?.map((item: IDataItem) => {
                    if (dataType === CatalogType.DATAELE) {
                        return {
                            id: item.key,
                            code: item.code,
                            name_cn: item.label,
                            name_en: item.otherInfo,
                        }
                    }
                    return { id: item.key, name: item.label }
                }),
            )
        }, [oprItems])

        // 处理页码变化
        const onPageChange = (page: number, pageSize: number) => {
            // 切换页面清空选中页码
            // if (page !== searchQuery.limit) {
            //     setSelectedRowKeys([])
            // }
            setSearchQuery({
                ...searchQuery,
                keyword: listSearchKey,
                offset: page,
                limit: pageSize,
            })
        }

        useImperativeHandle(ref, () => ({
            reloadData: () => getDataList(),
        }))

        // 目录分类选项-自定义/标准文件目录
        const selCatlgClass = useMemo(() => {
            // if (treeRef.current?.selCatlgClass === CatalogOption.DEPARTMENT) {
            //     setSearchQuery({
            //         department_id: selectedDir?.id || '',
            //         catalog_id: '',
            //         keyword: searchQuery.keyword, // 右边列表内容的keyword
            //         offset: 1,
            //         limit: 20,
            //         sort: menuValue?.key,
            //         direction: menuValue?.sort,
            //         org_type: searchQuery.org_type,
            //     })
            // } else {
            //     setSearchQuery({
            //         catalog_id:
            //             selectedDir && selectedDir.id
            //                 ? selectedDir.id.toString()
            //                 : '',
            //         keyword: searchQuery.keyword, // 右边列表内容的keyword
            //         offset: 1,
            //         limit: 20,
            //         sort: menuValue?.key,
            //         direction: menuValue?.sort,
            //         org_type: searchQuery.org_type,
            //     })
            // }

            return treeRef.current?.selCatlgClass
        }, [treeRef.current?.selCatlgClass])

        // 获取数据列表
        // 若标准分类为全部，则获取接口中不传标准分类字段
        const getDataList = async () => {
            try {
                setDataLoading(true)
                const {
                    catalog_id,
                    keyword,
                    offset,
                    limit,
                    sort,
                    direction,
                    department_id,
                } = searchQuery

                const org_type =
                    searchQuery.org_type !== stardOrignizeTypeAll
                        ? searchQuery.org_type
                        : undefined
                // 请求结果
                let res
                let stdRecData: any[] = []
                if (
                    (!!searchQuery.catalog_id &&
                        searchQuery.catalog_id !== '') ||
                    selCatlgClass === CatalogOption.DEPARTMENT
                ) {
                    if (dataType === CatalogType.CODETABLE) {
                        // 码表
                        if (selCatlgClass === CatalogOption.DEPARTMENT) {
                            res = await getDictList({
                                department_id,
                                keyword,
                                offset,
                                limit,
                                org_type,
                                sort,
                                direction,
                                state: isEnableDict ? 'enable' : undefined,
                            })
                        } else if (selCatlgClass === CatalogOption.AUTOCATLG) {
                            res = await getDictList({
                                catalog_id,
                                keyword,
                                offset,
                                limit,
                                org_type,
                                sort,
                                direction,
                                state: isEnableDict ? 'enable' : undefined,
                            })
                        } else if (
                            selectedDir?.stdFileCatlgType ===
                            StdFileCatlgType.FILE
                        ) {
                            res = await getDictListByFileId({
                                file_id: catalog_id,
                                keyword,
                                offset,
                                limit,
                                org_type,
                                sort,
                                direction,
                                state: isEnableDict ? 'enable' : undefined,
                            })
                        } else {
                            res = await getDictListByFileCatlgId({
                                catalog_id,
                                keyword,
                                offset,
                                limit,
                                org_type,
                                sort,
                                direction,
                                state: isEnableDict ? 'enable' : undefined,
                            })
                        }

                        setColumns(columnsDict)
                    } else if (dataType === CatalogType.CODINGRULES) {
                        // 编码规则
                        if (selCatlgClass === CatalogOption.DEPARTMENT) {
                            res = await getCRuleListBySearch({
                                department_id,
                                keyword,
                                offset,
                                limit,
                                org_type,
                                sort,
                                direction,
                                state: isEnableCodeRule ? 'enable' : undefined,
                            })
                        } else if (selCatlgClass === CatalogOption.AUTOCATLG) {
                            res = await getCRuleListBySearch({
                                catalog_id,
                                keyword,
                                offset,
                                limit,
                                org_type,
                                sort,
                                direction,
                                state: isEnableCodeRule ? 'enable' : undefined,
                            })
                        } else if (
                            selectedDir?.stdFileCatlgType ===
                            StdFileCatlgType.FILE
                        ) {
                            res = await getCRuleListByFileSearch({
                                file_id: catalog_id,
                                keyword,
                                offset,
                                limit,
                                org_type,
                                sort,
                                direction,
                                state: isEnableCodeRule ? 'enable' : undefined,
                            })
                        } else {
                            res = await getCRuleListByFileCatalogSearch({
                                catalog_id,
                                keyword,
                                offset,
                                limit,
                                org_type,
                                sort,
                                direction,
                                state: isEnableCodeRule ? 'enable' : undefined,
                            })
                        }
                        setColumns(columnsCRule)
                        if (
                            ruleRecParams &&
                            ruleRecParams.fields.length > 0 &&
                            ruleRecParams.fields[0].field_name
                        ) {
                            const stdRecRes = await getRuleRec([
                                {
                                    ...ruleRecParams,
                                    department_id: department_id || undefined,
                                },
                            ])
                            stdRecData =
                                stdRecRes.data[0]?.fields[0]?.rec?.map(
                                    (item: any) => {
                                        return {
                                            id: item.rule_id,
                                            name: item.rule_name,
                                            org_type: item.org_type,
                                            isRec: true,
                                        }
                                    },
                                ) || []
                        }
                    } else if (dataType === CatalogType.FILE) {
                        // 标准文件
                        if (selCatlgClass === CatalogOption.DEPARTMENT) {
                            res = await getFileList({
                                department_id,
                                org_type,
                                keyword,
                                offset,
                                limit,
                                sort,
                                direction,
                            })
                        } else {
                            res = await getFileList({
                                catalog_id,
                                org_type,
                                keyword,
                                offset,
                                limit,
                                sort,
                                direction,
                            })
                        }
                        setColumns(columnsStdFile)
                    } else if (dataType === CatalogType.DATAELE) {
                        if (selCatlgClass === CatalogOption.DEPARTMENT) {
                            res = await getDataElement({
                                department_id,
                                std_type: org_type,
                                keyword,
                                offset,
                                limit,
                                sort,
                                direction,
                            })
                        } else if (selCatlgClass === CatalogOption.AUTOCATLG) {
                            res = await getDataElement({
                                catalog_id,
                                std_type: org_type,
                                keyword,
                                offset,
                                limit,
                                sort,
                                direction,
                            })
                        } else if (
                            selectedDir?.stdFileCatlgType ===
                            StdFileCatlgType.FILE
                        ) {
                            res = await getDataElementByFileId({
                                file_id: catalog_id,
                                std_type: org_type,
                                keyword,
                                offset,
                                limit,
                                sort,
                                direction,
                            })
                        } else {
                            res = await getDataElementByFileCatlg({
                                file_catalog_id: catalog_id,
                                std_type: org_type,
                                keyword,
                                offset,
                                limit,
                                sort,
                                direction,
                            })
                        }
                        setColumns(columnsDataEle)
                        if (
                            stdRecParams &&
                            stdRecParams.table_fields.length > 0 &&
                            stdRecParams.table_fields[0].table_field
                        ) {
                            const stdRecRes = await getStdRec({
                                ...stdRecParams,
                                department_id: department_id || undefined,
                            })
                            stdRecData =
                                stdRecRes.data.table_fields[0]?.rec_stds?.map(
                                    (item: any) => {
                                        return {
                                            id: item.id,
                                            name_cn: item.std_ch_name,
                                            name_en: item.std_en_name,
                                            std_type:
                                                stardOrignizeTypeList.find(
                                                    (s) =>
                                                        s.label ===
                                                        item.std_type,
                                                )?.value,
                                            label: item.std_ch_name,
                                            code: item.std_code,
                                            otherInfo: item.std_en_name,
                                            isRec: true,
                                        }
                                    },
                                ) || []
                        }
                    }
                    setDataList(res.data)
                    setRecDataList(stdRecData)
                    setTotal(res.total_count || 0)
                }
            } catch (error: any) {
                formatError(error)
            } finally {
                setDataLoading(false)
                setMenuValue(undefined)
            }
        }

        const getTreeList = async (
            query?: IDirQueryType,
            optType?: StdTreeDataOpt,
            newSelectedDir?: any,
        ) => {
            try {
                let res
                let data

                if (
                    query?.type &&
                    query?.catlgOption === CatalogOption.STDFILECATLG
                ) {
                    // 标准文件目录及其文件是一次性获取
                    let treeDataTemp: any = []
                    setDirLoading(true)
                    res = await getFileDirByTypeOrId(query?.type, '')
                    treeDataTemp = fileCatlgTreeToStdTreeData([res.data])
                    data = treeDataTemp || []
                } else {
                    setDirLoading(true)
                    res = await getDirDataByTypeOrId(dataType, undefined)
                    data = res?.data ? res?.data : []
                }
                let newNode
                if (newSelectedDir) {
                    newNode = findDirByKey(newSelectedDir?.id, data)
                }
                setSelectedDir(newNode || data?.[0])
                setTreeData(data)
            } catch (error: any) {
                formatError(error)
            } finally {
                setDirLoading(false)
            }
        }

        const rotateTreeData = (
            data: any[],
            searchOprItem: any,
            params: any,
        ) => {
            data?.forEach((item) => {
                if (searchOprItem.id === item.id) {
                    Object.assign(item, params)
                    if (item.children) {
                        const { children } = item
                        children?.forEach((item2: any) => {
                            rotateTreeData(children, item2, params)
                        })
                    }
                } else {
                    if (searchOprItem.parent_id === item.id) {
                        Object.assign(item, params)
                    }
                    if (item.children) {
                        rotateTreeData(item.children, searchOprItem, params)
                    }
                }
            })
            return data
        }

        // const renderTreeNodes = (data: any[]) =>
        //     data.map((item: any) => {
        //         const node = (
        //             <div
        //                 className={styles.treeNodeCon}
        //                 style={{ display: 'flex', alignItems: 'center' }}
        //             >
        //                 <span className={styles.treeNodeConTitle}>
        //                     {item.catalog_name}
        //                 </span>
        //             </div>
        //         )
        //         if (item.children) {
        //             return (
        //                 <TreeNode
        //                     title={node}
        //                     key={item.id}
        //                     className={styles.treeNode}
        //                 >
        //                     {renderTreeNodes(item.children)}
        //                 </TreeNode>
        //             )
        //         }
        //         return (
        //             <TreeNode title={node} key={item.id} className={styles.treeNode} />
        //         )
        //     })

        const findNodeItemByKey = (data: any[], key: any) => {
            let nodeItem
            data?.forEach((item) => {
                if (item.id === key) {
                    nodeItem = item
                } else if (item.children) {
                    findNodeItemByKey(item.children, key)
                }
            })
            return nodeItem
        }

        // 通过key获取目录
        const findDirByKey = (key: any, data: any[]) => {
            let dir
            data?.forEach((item: any) => {
                if (item.id === key) {
                    dir = item
                } else if (item.children) {
                    const res = findDirByKey(key, item.children)
                    if (res) {
                        dir = res
                    }
                }
            })
            return dir
        }

        const handleOk = async () => {
            const myOprItems: IDataItem[] = []
            selectedRowInfo?.forEach((item: any) => {
                if (dataType === CatalogType.DATAELE) {
                    // key表示id，code标识数据元code
                    myOprItems.push({
                        key: item.id,
                        label: item.name_cn,
                        value: item.name_cn,
                        otherInfo: item.name_en,
                        code: item.code,
                        std_type: item.std_type,
                        dict_id: item.dict_id,
                        dict_name: item.dict_name,
                        label_id: item.label_id,
                        label_name: item.label_name,
                        label_icon: item.label_icon,
                    })
                } else if (item && item.id) {
                    myOprItems.push({
                        key: item.id,
                        value: item.name || item.ch_name,
                        label: item.name || item.ch_name,
                        std_type: item.std_type,
                    })
                }
            })
            setOprItems(myOprItems)
            onClose()
            // 如果传入了专门处理点击确定的方法则处理
            if (onOk) {
                onOk(myOprItems, selectedRowInfo)
            }
        }

        const handleCancel = () => {
            onClose()
        }

        // 列表空白显示
        const showListEmpty = () => {
            const stdType = searchQuery.org_type
            if (!treeData || !treeData.length) {
                // 目录无数据，列表空白显示，显缺省图，无内容提示
                return <Empty />
            }
            // 是否有添加/导入权限
            const hasAddAccess =
                selCatlgClass !== CatalogOption.STDFILECATLG &&
                checkPermission('manageDataStandard')

            if (
                hasAddAccess &&
                !listSearchKey &&
                typeof specifyStdType === 'number'
            ) {
                // 传入指定类型，初始无数据
                const desc = (
                    <>
                        <p>
                            {__('暂无“${stdType}”的${dataType}', {
                                stdType:
                                    stardOrignizeTypeList?.find(
                                        (item) => item.value === specifyStdType,
                                    )?.label || '--',
                                dataType: CatalogTypeToName[dataType],
                            })}
                        </p>
                        {showAddNewBtn && (
                            <p>
                                {__('可点击')}
                                <span
                                    className={styles.operate}
                                    onClick={() => handleOperateAdd(dataType)}
                                >
                                    {__('【新建】')}
                                </span>
                                {__('按钮创建该标准分类的数据元')}
                            </p>
                        )}
                    </>
                )
                return (
                    <Empty iconSrc={emptyFolder} desc={desc} iconHeight={70} />
                )
            }

            // 选择目录下无数据，引导新建
            // const desc = (
            //     <div>
            //         点击
            //         <span
            //             className={styles.operate}
            //             onClick={() => handleOperateAdd(dataType)}
            //         >
            //             【新建{dataTypeName}】
            //         </span>
            //         按钮
            //         <p className={styles.operateDesc}> 可新建{dataTypeName}</p>
            //     </div>
            // )
            // 这里alpha3版本中支持新建，alpha3版本中再Empty组件中加上desc和empty缺省图标
            return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
        }

        // 目录搜索框enter
        const handleSearchDirEnter = (e: any) => {
            const { value } = e.target
            getTreeList({ type: dataType, catalog_name: value })
        }

        // 列表搜索框enter
        const handleSearchListEnter = (e: any) => {
            const value = typeof e === 'string' ? e : trim(e.target.value)
            setListSearchKey(value)
            setSearchQuery({
                ...searchQuery,
                keyword: value,
                offset: 1,
            })
        }

        const onSelect: TreeProps['onSelect'] = (
            selectedKeysValue: string | any[],
            info: any,
        ) => {
            if (selectedKeysValue && selectedKeysValue.length) {
                const dir = findDirByKey(selectedKeysValue[0], treeData || [])
                if (dir) {
                    setSelectedDir(dir)
                }
            }
        }

        const rootId =
            treeData && treeData[0]?.id ? treeData[0].id.toString() : ''

        const [expandedKeys, setExpandedKeys] = useState<Key[]>([rootId])

        useEffect(() => {
            const myExpandkeys = expandedKeys
            if (rootId !== '' && myExpandkeys.indexOf(rootId) === -1) {
                myExpandkeys.push(rootId)
            }
            setExpandedKeys(myExpandkeys)
        }, [rootId])

        const onExpand = (expandedKeysValue: React.SetStateAction<Key[]>) => {
            // if not set autoExpandParent to false, if children expanded, parent can not collapse.
            // or, you can remove all expanded children keys.
            setExpandedKeys(expandedKeysValue)
            // setAutoExpandParent(false)
        }

        // 筛选onChange
        const handleSelectChange = (value: number) => {
            setSeledStdOgnizType(value)
            setSearchQuery({
                ...searchQuery,
                offset: 1,
                keyword: listSearchKey,
                org_type: value,
            })
        }

        const [dataTypeName, setDataTypeName] = useState('')

        useEffect(() => {
            switch (dataType) {
                case CatalogType.CODETABLE:
                    setDataTypeName('码表')
                    break
                case CatalogType.CODINGRULES:
                    setDataTypeName('编码规则')
                    break
                case CatalogType.FILE:
                    setDataTypeName('文件')
                    break
                case CatalogType.DATAELE:
                    setDataTypeName('数据元')
                    break
                default:
                    break
            }
        }, [dataType])

        const getSearchInputPlaceholder = () => {}

        const validStr = (label: string | undefined) => {
            return label || '--'
        }

        // 码表
        const columnsDict: ColumnsType<IDictItem> = [
            {
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                render: (_, record) => {
                    const { ch_name, en_name, org_type, deleted, state } =
                        record ?? {}

                    const typeItem = stardOrignizeTypeList.find(
                        (item) => item.value === org_type,
                    )
                    return (
                        <div className={styles.showTableInfo}>
                            <div className={styles.detailInfo}>
                                <div className={styles.titleInfo}>
                                    <span className={styles.org_type}>
                                        {validStr(typeItem?.label)}
                                    </span>
                                    <span
                                        className={styles.name}
                                        title={validStr(ch_name)}
                                    >
                                        {validStr(ch_name)}
                                    </span>
                                </div>
                                <div
                                    className={styles.otherInfo}
                                    title={validStr(en_name)}
                                >
                                    {validStr(en_name)}
                                </div>
                            </div>
                            <div className={styles.status}>
                                {state === StateType.DISABLE && (
                                    <DisableStateColored />
                                )}
                            </div>
                            <span
                                onClick={() => {
                                    handleShowDataDetail(
                                        CatalogType.CODETABLE,
                                        record.id,
                                    )
                                }}
                                className={styles.link}
                            >
                                详情
                            </span>
                        </div>
                    )
                },
            },
        ]

        // 编码规则
        const columnsCRule: ColumnsType<ICRuleItem> = [
            {
                // title: '中文名称',
                // fixed: 'left',
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                render: (_, record) => {
                    const { name, org_type, deleted, state, isRec } =
                        record ?? {}
                    const typeItem = stardOrignizeTypeList.find(
                        (item) => item.value === org_type,
                    )
                    // 编码规则没有标准分类字段
                    return (
                        <div className={styles.showTableInfo}>
                            <div className={styles.detailInfo}>
                                <div className={styles.titleInfo}>
                                    {isRec && (
                                        <Tooltip title={__('智能推荐')}>
                                            <div className={styles.recFlag}>
                                                荐
                                            </div>
                                        </Tooltip>
                                    )}
                                    <span className={styles.org_type}>
                                        {validStr(typeItem?.label)}
                                    </span>
                                    <span
                                        className={styles.name}
                                        title={validStr(name)}
                                    >
                                        {validStr(name)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.status}>
                                {state === StateType.DISABLE && (
                                    <DisableStateColored />
                                )}
                            </div>
                            <span
                                onClick={() => {
                                    handleShowDataDetail(
                                        CatalogType.CODINGRULES,
                                        record.id,
                                    )
                                }}
                                className={styles.link}
                            >
                                详情
                            </span>
                        </div>
                    )
                },
            },
        ]

        // 标准文件
        const columnsStdFile: ColumnsType<IFileItem> = [
            {
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                render: (name, record) => {
                    const { org_type, deleted, state, number } = record ?? {}
                    const typeItem = stardOrignizeTypeList.find(
                        (item) => item.value === org_type,
                    )
                    return (
                        <div className={styles.showTableInfo}>
                            <div className={styles.detailInfo}>
                                <div className={styles.titleInfo}>
                                    <span className={styles.org_type}>
                                        {validStr(typeItem?.label)}
                                    </span>
                                    <span
                                        className={styles.name}
                                        title={validStr(name)}
                                    >
                                        {validStr(name)}
                                    </span>
                                </div>
                                <div
                                    className={styles.otherInfo}
                                    title={validStr(number)}
                                >
                                    {validStr(number)}
                                </div>
                            </div>
                            <div className={styles.status}>
                                {state === StateType.DISABLE && (
                                    <DisableStateColored />
                                )}
                            </div>
                            <span
                                onClick={() => {
                                    handleShowDataDetail(
                                        CatalogType.FILE,
                                        record.id,
                                    )
                                }}
                                className={styles.link}
                            >
                                详情
                            </span>
                        </div>
                    )
                },
            },
        ]

        // 数据元
        const columnsDataEle: ColumnsType<IDataElement> = [
            {
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                render: (_, record) => {
                    const {
                        name_cn,
                        std_type,
                        name_en,
                        deleted,
                        state,
                        isRec,
                    } = record
                    const typeItem = stardOrignizeTypeList.find(
                        (item) => item.value === std_type,
                    )
                    const { disabled, tip } =
                        getDisabledDataEleInfo?.(record.data_type) ?? {}
                    return (
                        <Tooltip title={tip}>
                            <div className={styles.showTableInfo}>
                                <div className={styles.detailInfo}>
                                    <div className={styles.titleInfo}>
                                        {isRec && (
                                            <Tooltip title={__('智能推荐')}>
                                                <div className={styles.recFlag}>
                                                    荐
                                                </div>
                                            </Tooltip>
                                        )}
                                        <span
                                            className={classnames(
                                                styles.org_type,
                                                disabled &&
                                                    styles.disabled_org_type,
                                            )}
                                        >
                                            {validStr(typeItem?.label)}
                                        </span>
                                        <span
                                            className={classnames(
                                                styles.name,
                                                disabled &&
                                                    styles.disbaled_name,
                                            )}
                                            title={validStr(name_cn)}
                                        >
                                            {validStr(name_cn)}
                                        </span>
                                    </div>
                                    <div
                                        className={classnames(
                                            styles.otherInfo,
                                            disabled &&
                                                styles.disabledOtherInfo,
                                        )}
                                        title={validStr(name_en)}
                                    >
                                        {validStr(name_en)}
                                    </div>
                                </div>
                                <div className={styles.status}>
                                    {state === StateType.DISABLE && (
                                        <DisableStateColored />
                                    )}
                                </div>
                                <span
                                    onClick={() => {
                                        handleShowDataDetail(
                                            CatalogType.DATAELE,
                                            record.id,
                                            record.code,
                                        )
                                    }}
                                    className={styles.link}
                                >
                                    详情
                                </span>
                            </div>
                        </Tooltip>
                    )
                },
            },
        ]

        const onSelectChange = (newSelectedRowKeys: React.Key[], info: any) => {
            // 编辑时，多个不同页码的选中项，打开选择编码规则对话框，会出现newSelectedRowKeys中有key值
            // 但是info中没切换到/加载选中某key的页码时，选中key对应rowInfo在info参数中为undefined
            // setSelectedRowKeys(newSelectedRowKeys)
            // 保存没在info中的key
            let newSelectedRowKeysTemp = Object.assign([], newSelectedRowKeys)
            const selectedRowInfoTemp: any[] = []

            info?.forEach?.((infoItem: any) => {
                if (infoItem) {
                    // attr是table的rowKey属性（例如id/code）
                    if (newSelectedRowKeys.includes(infoItem[dataKey])) {
                        selectedRowInfoTemp.push(infoItem)
                        // 去除在info中的key
                        newSelectedRowKeysTemp = newSelectedRowKeysTemp.filter(
                            (itemTemp: any) => itemTemp !== infoItem[dataKey],
                        )
                    }
                }
            })

            // 添加不在info参数中原已选择的item
            selectedRowInfo?.forEach((itemRow: any) => {
                if (
                    itemRow &&
                    newSelectedRowKeysTemp.includes(itemRow[dataKey])
                ) {
                    selectedRowInfoTemp.push(itemRow)
                }
            })
            setSelectedRowInfo(selectedRowInfoTemp)
        }

        // 新建码表/编码规则
        const handleOperateAdd = (type: CatalogType) => {
            if (type === CatalogType.CODETABLE) {
                setCreateDictVisible(true)
            } else if (type === CatalogType.CODINGRULES) {
                setCreateCRVisible(true)
            } else if (type === CatalogType.DATAELE) {
                setCreateDEVisible(true)
            }
        }

        // 取消新建码表/编码规则
        const handleOperateCancel = (type: CatalogType, operate?: Operate) => {
            if (type === CatalogType.CODETABLE) {
                // 新建码表
                if (operate === Operate.OK) {
                    setCreateDictVisible(false)
                } else {
                    // 新建或编辑
                    confirm({
                        title: '确认要离开当前页面吗？',
                        icon: <ExclamationCircleFilled />,
                        content: '现在离开页面，将不会保存已填写内容。',
                        className: 'modal-center commConfirm',
                        onOk() {
                            setCreateDictVisible(false)
                        },
                    })
                }
            } else if (type === CatalogType.CODINGRULES) {
                // 新建编码规则
                setCreateCRVisible(false)
            } else if (type === CatalogType.DATAELE) {
                // 编辑数据元
                if (operate === Operate.OK) {
                    setCreateDEVisible(false)
                } else {
                    // 新建或编辑
                    confirm({
                        title: '确认要离开当前页面吗？',
                        icon: <ExclamationCircleFilled />,
                        content: '现在离开页面，将不会保存已填写内容。',
                        width: 424,
                        className: 'modal-center commConfirm',
                        style: { height: '192px' },
                        onOk() {
                            setCreateDEVisible(false)
                        },
                    })
                }
            }
        }

        // 排序方式改变
        const handleSortWayChange = (selectedMenu: IMenuData) => {
            // selectedMenu字段的key值即为查询字段名称
            const sortKey = selectedMenu.key as FileSorterType
            const sortDirection =
                selectedMenu.sort === 'asc'
                    ? SortDirection.ASC
                    : SortDirection.DESC
            setMenuValue({
                key: sortKey,
                sort: sortDirection,
            })
            const searchQueryTemp = {
                ...searchQuery,
                offset: 1,
                sort: sortKey,
                direction: sortDirection,
            }
            setSearchQuery(searchQueryTemp)
        }

        const searchChange = (data: any, key: string = '') => {
            handleSelectChange(data[key])
        }

        return (
            <>
                <div className={styles.selDataByTypeModalWrapper}>
                    <Modal
                        open={visible}
                        title={__('请选择${name}', {
                            name: dataTypeName,
                        })}
                        width={898}
                        maskClosable={false}
                        destroyOnClose
                        style={{
                            height: 600,
                            padding: 0,
                        }}
                        wrapClassName={styles.selDataModal}
                        bodyStyle={{
                            maxHeight: 584,
                            padding: 0,
                            height: 'calc(100% - 116px)',
                        }}
                        footer={
                            <div className={styles.selDataFooterWrapper}>
                                <Space
                                    size={12}
                                    className={styles.addDataWrapper}
                                    hidden={!showAddNewBtn}
                                >
                                    <span className={styles.noFind}>
                                        {__('找不到？')}
                                    </span>
                                    <Button
                                        type="link"
                                        onClick={() => {
                                            // 组件业务暂仅支持数据元，其他类型需自行调整组件适配需求
                                            handleOperateAdd(dataType)
                                        }}
                                    >
                                        {__('立即新建')}
                                    </Button>
                                </Space>
                                <div className={styles.footerBtnWrapper}>
                                    <Button
                                        onClick={handleCancel}
                                        className={styles.btn}
                                    >
                                        {__('取消')}
                                    </Button>
                                    <Button
                                        type="primary"
                                        onClick={handleOk}
                                        className={styles.btn}
                                    >
                                        {__('确定')}
                                    </Button>
                                </div>
                            </div>
                        }
                        onOk={() => handleOk()}
                        onCancel={() => handleCancel()}
                        getContainer={getContainer || getPopupContainer()}
                    >
                        <Layout className={styles.modalContent}>
                            <Sider
                                width={StdDirStyle.DEFAULTWIDTH}
                                className={styles.directoryWrapper}
                            >
                                <StandardDirTree
                                    ref={treeRef}
                                    loading={dirLoading}
                                    dirType={dataType}
                                    treeData={treeData}
                                    getTreeList={getTreeList}
                                    selectedDir={selectedDir}
                                    setSelectedDir={setSelectedDir}
                                    optMenuItems={undefined}
                                    // showCatlgClassify={
                                    //     dataType !== CatalogType.FILE
                                    // }
                                />
                            </Sider>
                            <Divider
                                type="vertical"
                                style={{ height: 'auto', margin: 0 }}
                            />
                            <div className={styles.dataContent}>
                                <div
                                    className={styles.dataSort}
                                    hidden={
                                        typeof specifyStdType === 'number' &&
                                        !listSearchKey &&
                                        !dataList?.length
                                    }
                                >
                                    <div className={styles.dataSortHeader}>
                                        <SearchInput
                                            placeholder={
                                                [
                                                    CatalogType.CODINGRULES,
                                                    CatalogType.FILE,
                                                ].includes(dataType)
                                                    ? __('搜索${name}名称', {
                                                          name: dataTypeName,
                                                      })
                                                    : __(
                                                          '搜索${name}名称或英文名称',
                                                          {
                                                              name: dataTypeName,
                                                          },
                                                      )
                                            }
                                            defaultValue={contentKeyword}
                                            value={listSearchKey}
                                            onKeyChange={(kw: string) =>
                                                handleSearchListEnter(kw)
                                            }
                                            onPressEnter={handleSearchListEnter}
                                            style={{ width: 272 }}
                                        />
                                        {typeof specifyStdType === 'number' &&
                                        specifyStdType !==
                                            StandardizationType.All ? undefined : (
                                            <div>
                                                <span
                                                    className={
                                                        styles.selectWrapper
                                                    }
                                                >
                                                    <LightweightSearch
                                                        formData={searchData}
                                                        onChange={(data, key) =>
                                                            searchChange(
                                                                data,
                                                                key,
                                                            )
                                                        }
                                                        defaultValue={{
                                                            org_type:
                                                                searchQuery.org_type,
                                                        }}
                                                    />
                                                </span>
                                            </div>
                                        )}
                                        <Space size={4}>
                                            <SortBtn
                                                contentNode={
                                                    <DropDownFilter
                                                        menus={
                                                            dataType ===
                                                            CatalogType.FILE
                                                                ? fileMenus
                                                                : menus
                                                        }
                                                        defaultMenu={
                                                            menuValue ||
                                                            defaultMenu
                                                        }
                                                        changeMenu={menuValue}
                                                        menuChangeCb={
                                                            handleSortWayChange
                                                        }
                                                    />
                                                }
                                            />
                                            <RefreshBtn
                                                onClick={() => getDataList()}
                                            />
                                        </Space>
                                    </div>
                                    <div className={styles.tipContent}>
                                        <div>
                                            <span>
                                                {__('请选择${name}', {
                                                    name: dataTypeName,
                                                })}
                                            </span>
                                            {rowSelectionType ===
                                                'checkbox' && (
                                                <>
                                                    <Divider
                                                        type="vertical"
                                                        style={{
                                                            margin: '0 6px 0 8px',
                                                        }}
                                                    />
                                                    <span>
                                                        已选 (
                                                        {selectedRowInfo?.length ||
                                                            0}
                                                        )
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {/* <div
                                            onClick={() =>
                                                handleOperateAdd(dataType)
                                            }
                                            className={styles.addNew}
                                        >
                                            <AddOutlined
                                                className={styles.addIcon}
                                            />
                                            <span
                                                className={styles.operate}
                                            >{`新建${dataTypeName}`}</span>
                                        </div> */}
                                    </div>
                                </div>
                                <div
                                    className={styles.dataListContent}
                                    hidden={dataLoading}
                                >
                                    {recDataList && recDataList.length > 0 && (
                                        <Table
                                            rowKey={dataKey}
                                            columns={columns}
                                            // scroll={{
                                            //     y: 396,
                                            // }}
                                            dataSource={recDataList}
                                            className={styles.dataTable}
                                            rowSelection={{
                                                type: rowSelectionType,
                                                preserveSelectedRowKeys: true,
                                                selectedRowKeys: selectedRowInfo
                                                    ?.filter(
                                                        (item: any) =>
                                                            item &&
                                                            item[dataKey],
                                                    )
                                                    ?.map(
                                                        (item: any) =>
                                                            item[dataKey],
                                                    ),
                                                onChange: onSelectChange,
                                                getCheckboxProps: (record) => {
                                                    return {
                                                        disabled:
                                                            getDisabledDataEleInfo?.(
                                                                record.data_type,
                                                            )?.disabled ||
                                                            checkItemDisabled?.(
                                                                record,
                                                            ),
                                                    }
                                                },
                                            }}
                                            showHeader={false}
                                            pagination={false}
                                        />
                                    )}
                                    {dataList && dataList.length > 0 && (
                                        <Table
                                            rowKey={dataKey}
                                            columns={columns}
                                            // scroll={{
                                            //     y: 396,
                                            // }}
                                            dataSource={dataList}
                                            className={styles.dataTable}
                                            rowSelection={{
                                                type: rowSelectionType,
                                                preserveSelectedRowKeys: true,
                                                selectedRowKeys: selectedRowInfo
                                                    ?.filter(
                                                        (item: any) =>
                                                            item &&
                                                            item[dataKey],
                                                    )
                                                    ?.map(
                                                        (item: any) =>
                                                            item[dataKey],
                                                    ),
                                                onChange: onSelectChange,
                                                getCheckboxProps: (record) => {
                                                    return {
                                                        disabled:
                                                            getDisabledDataEleInfo?.(
                                                                record.data_type,
                                                            )?.disabled ||
                                                            checkItemDisabled?.(
                                                                record,
                                                            ),
                                                    }
                                                },
                                            }}
                                            showHeader={false}
                                            pagination={{
                                                current: searchQuery.offset,
                                                pageSize: searchQuery.limit,
                                                total,
                                                showLessItems: true,
                                                showSizeChanger: false,
                                                showQuickJumper: true,
                                                hideOnSinglePage: true,
                                                onChange: onPageChange,
                                            }}
                                        />
                                    )}

                                    <div
                                        className={styles.showEmpty}
                                        hidden={
                                            dataLoading ||
                                            !treeData ||
                                            !dataList ||
                                            dataList?.length !== 0
                                        }
                                    >
                                        {showListEmpty()}
                                    </div>
                                </div>
                                <div
                                    className={styles.showEmpty}
                                    hidden={!dataLoading}
                                >
                                    <Loader />
                                </div>
                            </div>
                        </Layout>
                    </Modal>
                </div>
                {/* 新建数据元 */}
                {selectedDir && createDEVisible && (
                    <EditDataEleForm
                        type={OperateType.CREATE}
                        visible={createDEVisible}
                        selectedDir={
                            selCatlgClass !== CatalogOption.STDFILECATLG
                                ? selectedDir
                                : undefined
                        }
                        getTreeList={getTreeList}
                        style={
                            addNewModalStyle || {
                                position: 'fixed',
                                width: '100vw',
                                // height: 'calc(100vh - 64px)',
                                // top: '64px',
                                height: '100vh',
                                top: 0,
                            }
                        }
                        specifyStdType={specifyStdType}
                        onClose={(operate: Operate) =>
                            handleOperateCancel(CatalogType.DATAELE, operate)
                        }
                        update={(
                            newSelectedDir?: IDirItem,
                            newDataEle?: any,
                        ) => {
                            // 根据对话框中选中的目录更改左侧目录的选中目录或刷新数据
                            if (newSelectedDir) {
                                if (newSelectedDir.id !== selectedDir?.id) {
                                    // 选中目录改变会自动更新（useEffect）数据
                                    setSelectedDir(newSelectedDir)
                                } else {
                                    getDataList()
                                }
                            }

                            // 新建成功后,选中数据
                            if (newDataEle) {
                                const selectedRowInfoTemp =
                                    rowSelectionType === 'radio'
                                        ? [newDataEle]
                                        : [
                                              ...(selectedRowInfo || []),
                                              newDataEle,
                                          ]
                                setSelectedRowInfo(selectedRowInfoTemp)
                            }
                        }}
                        selCatlgClass={selCatlgClass || CatalogOption.AUTOCATLG}
                    />
                )}
                {/* 新建码表 */}
                {selectedDir && (
                    <EditDictForm
                        type={OperateType.CREATE}
                        visible={createDictVisible}
                        selectedDir={
                            selCatlgClass !== CatalogOption.STDFILECATLG
                                ? {
                                      id: selectedDir.id || '',
                                      catalog_name:
                                          selectedDir?.catalog_name || '',
                                  }
                                : undefined
                        }
                        getTreeList={getTreeList}
                        onClose={(operate: Operate) =>
                            handleOperateCancel(CatalogType.CODETABLE, operate)
                        }
                        update={(newSelectedDir?: IDirItem) => {
                            // 根据对话框中选中的目录更改左侧目录的选中目录或刷新数据
                            if (newSelectedDir) {
                                if (newSelectedDir.id !== selectedDir?.id) {
                                    // 选中目录改变会自动更新（useEffect）数据
                                    setSelectedDir(newSelectedDir)
                                } else {
                                    getDataList()
                                }
                            }
                        }}
                        selCatlgClass={selCatlgClass || CatalogOption.AUTOCATLG}
                    />
                )}
                {/* 新建编码规则 */}
                {selectedDir && (
                    <EditCodeRule
                        visible={createCRVisible}
                        operateType={OperateType.CREATE}
                        onClose={() =>
                            handleOperateCancel(CatalogType.CODINGRULES)
                        }
                        // updateCodeRuleList={getDataList}
                        // setSelectedDir={setSelectedDir}
                    />
                )}
            </>
        )
    },
)

export default SelDataByTypeModal
