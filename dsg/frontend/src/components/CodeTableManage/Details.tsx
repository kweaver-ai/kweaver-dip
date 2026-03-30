import React, { useEffect, useState, useRef, useMemo, useContext } from 'react'
import {
    Anchor,
    Button,
    Col,
    ConfigProvider,
    Drawer,
    Pagination,
    Row,
    Select,
    Table,
    Tooltip,
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import { trim } from 'lodash'
import { TooltipPlacement } from 'antd/es/tooltip'
import classnames from 'classnames'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import DataElementDetails from '../DataEleManage/Details'
import FileDetails from '../File/Details'
import { MicroWidgetPropsContext } from '@/context'
import {
    basicConfig,
    quoteConfig,
    dictValuesConfig,
    versionConfig,
    codeTableDetailMods,
    CTDetailBasicModType,
} from './const'
import {
    getFileExtension,
    stardOrignizeTypeList,
    stateOptionList,
    StateType,
} from '@/utils'
import {
    getDictDetailById,
    IChangeInfoItem,
    IDataElement,
    IStdDetailConfig,
    IDictItem,
    IDictValueItem,
    IStandCommonRes,
    formatError,
    IFileItem,
    getDictQuoteListById,
    getDictAssociatedFile,
    getDictValuesBySearch,
    AttachmentType,
    isMicroWidget,
} from '@/core'
import Loader from '@/ui/Loader'
import { SearchInput } from '@/ui'
import { FileIconType } from '../File/helper'
import FileIcon from '../File/FileIcon'
import __ from './locale'
import CustomDrawer from '../CustomDrawer'

const { Link } = Anchor

// 获取item的状态-已删除/已停用
export const getItemStatus = (item: any) => {
    const { state, deleted } = item
    if (deleted) {
        return <div className="quoteDeletedStatus">{__('已删除')} </div>
    }
    if (state === StateType.DISABLE) {
        return <div className="quoteDisableStatus">{__('已停用')} </div>
    }
    return undefined
}

interface ISearchCondition {
    // 页数，默认1
    offset: number
    // 每页数量，默认20条
    limit: number
    // 搜索关键字
    keyword: string
}

/**
 * @param handleError 处理异常情况
 */
interface IDetails {
    visible?: boolean
    title?: string
    dictId: string
    mulDetailIds?: Array<any>
    handleError?: (errorKey: string) => void
    onClose: () => void
    getContainer?: any
    zIndex?: number
}

// 关联数据默认页码
const defaultPageSize = 5

const initAssociateData: IStandCommonRes<any> = {
    data: [],
    total_count: 0,
    offset: 1,
    limit: defaultPageSize,
    keyword: '',
}

/**
 * @param visible boolean 显示/隐藏
 * @param title 标题
 * @param onClose
 * @param handleError 处理异常情况
 *
 */
const Details: React.FC<IDetails> = ({
    visible,
    title = __('码表详情'),
    dictId,
    mulDetailIds,
    onClose,
    handleError,
    getContainer,
    zIndex = 1000,
}) => {
    // 表单item
    const [details, setDetails] = useState<IDictItem>()
    // 关联数据元
    const [dataEleList, setDataEleList] =
        useState<IStandCommonRes<IDataElement>>(initAssociateData)
    // 关联标准文件
    const [fileList, setFileList] =
        useState<IStandCommonRes<IFileItem>>(initAssociateData)

    // 码值
    const [codeValueList, setCodeValueList] =
        useState<IStandCommonRes<IDictValueItem>>(initAssociateData)

    const ref = useRef<HTMLDivElement>(null)

    // 详情页面加载
    const [loading, setLoading] = useState(false)

    // 历史版本折叠功能
    const [isHistoryShow, setIsHistoryShow] = useState(false)

    // 详情页，若详情存在则显示，否则不显示
    const [detailVisible, setDetailVisible] = useState(false)

    // 关联信息详情id
    const [detailId, setDetailId] = useState('')

    const [viewDictId, setViewDictId] = useState<string>(dictId)

    const [viewDictOptions, setViewDictOptions] = useState<Array<any>>([])

    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    useEffect(() => {
        if (mulDetailIds?.length) {
            setViewDictOptions(
                mulDetailIds.map((currentData) => ({
                    label: currentData.label,
                    value: currentData.key,
                })),
            )
        }
    }, [mulDetailIds])

    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 文件详情
    const [fileDetailVisible, setFileDetailVisible] = useState<boolean>(false)

    const anchorItems = useMemo(() => {
        const items: any[] = []
        codeTableDetailMods.forEach((mItem) => {
            const { modKey } = mItem
            let associateList
            if (modKey === CTDetailBasicModType.AssociatedDataEle) {
                associateList = dataEleList
            } else if (modKey === CTDetailBasicModType.AssociatedFile) {
                associateList = fileList
            } else if (modKey === CTDetailBasicModType.CodeValue) {
                associateList = codeValueList
            }

            if (
                ![
                    CTDetailBasicModType.AssociatedDataEle,
                    CTDetailBasicModType.AssociatedFile,
                    CTDetailBasicModType.CodeValue,
                ].includes(modKey) ||
                associateList?.keyword ||
                associateList?.total_count
            ) {
                items.push({
                    key: mItem.modKey,
                    href: `#${mItem.modKey}`,
                    title: mItem.title,
                })
            }
        })
        return items
    }, [dataEleList, fileList, codeValueList])

    // 搜索码值关键字
    const [searchEnumsKey, setSearchEnumsKey] = useState('')

    useEffect(() => {
        if (visible) {
            setViewDictId(viewDictId)
        } else {
            // 清空详情
            setDetails(undefined)
            setSearchEnumsKey('')
        }
    }, [visible])

    useEffect(() => {
        if (visible) {
            getDictDetails(viewDictId)
        }
    }, [viewDictId])

    // 原始/标准表格项
    const colmsDictEnums = (): ColumnsType<IDictValueItem> => {
        const cols: ColumnsType<IDictValueItem> = [
            {
                title: '码值',
                dataIndex: 'code',
                key: 'code',
                // editing: true,
                width: 130,
                ellipsis: true,
                render: (_, record) => (
                    <div className={styles.showTableInfo}>
                        <div
                            className={styles.topInfo}
                            title={record.code || '--'}
                        >
                            {record.code || '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: '码值描述',
                dataIndex: 'value',
                key: 'value',
                ellipsis: true,
                width: 130,
                render: (_, record) => (
                    <div className={styles.showTableInfo}>
                        <div
                            className={styles.topInfo}
                            title={record.value || '--'}
                        >
                            {record.value || '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: '说明',
                dataIndex: 'description',
                key: 'description',
                // width: 120,
                ellipsis: true,
                render: (_, record) => {
                    return (
                        <div className={styles.showTableInfo}>
                            <div
                                className={styles.topInfo}
                                title={record.description || '--'}
                            >
                                {record.description || '--'}
                            </div>
                        </div>
                    )
                },
            },
        ]
        return cols
    }

    // 当前页码信息
    const [pageConfig, setPageConfig] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    })

    const handleTableChange = (pagination: any) => {
        setPageConfig({
            ...pageConfig,
            current: pagination.current,
            pageSize: pagination.pageSize,
        })
    }

    // 获取当前数据元详情
    const getDictDetails = async (dId: string) => {
        if (!dId) return
        try {
            setLoading(true)
            // const res = await getDictDetailById(dictId)
            const [detail, deList, fList, cvList] = await Promise.all([
                // 获取码表详情
                getDictDetailById(dId),
                // 获取码表关联数据源
                getDictQuoteListById(dId, {
                    offset: dataEleList.offset,
                    limit: dataEleList.limit,
                }),
                // 获取码表关联
                getDictAssociatedFile(dId, {
                    offset: fileList.offset,
                    limit: fileList.limit,
                }),
                // 获取码值
                getDictValuesBySearch({
                    dict_id: dId,
                    keyword: '',
                    offset: codeValueList.offset,
                    limit: codeValueList.limit,
                }),
            ])
            setDetails(detail.data)
            setDataEleList({
                ...dataEleList,
                data: deList?.data || [],
                total_count: deList?.total_count || 0,
            })
            setFileList({
                ...fileList,
                data: fList?.data || [],
                total_count: fList?.total_count || 0,
            })
            setCodeValueList({
                ...codeValueList,
                data: cvList?.data || [],
                total_count: cvList?.total_count || 0,
            })
            // let detailData
            // if (res.data) {
            //     detailData = res.data
            //     setPageConfig({
            //         ...pageConfig,
            //         total: res.data.enums.length || 0,
            //     })
            // }
            // if (quoteRes.data) {
            //     detailData.quote_dataEle_list = quoteRes.data || []
            // }
            // setDetails(detailData)
            // setEnums(detailData.enums || [])
        } catch (error: any) {
            if (error.status === 400) {
                const errorKey = error.data && error.data.code
                // 码表不存在(status:400, code:Standardization.ResourceError.DataNotExist)，不显示详情页
                if (handleError) {
                    handleError(errorKey)
                }
            }
            onClose()
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 历史版本中超出显示
    const toolTip = (
        tipTitle: string,
        value: any,
        className: string,
        placement?: TooltipPlacement,
    ) => {
        return (
            <Tooltip placement={placement || 'top'} title={tipTitle}>
                <span className={className}>{value}</span>
            </Tooltip>
        )
    }

    // 码值展示
    const enumDisplay = (
        enumList: any,
        infoType: string,
        enumListTitle?: any,
    ) => {
        if (!enumList || enumList.length === 0) return ''
        return (
            <>
                {enumListTitle || ''}
                <div className={styles.enumValues}>
                    {enumList.map(
                        (enumItem: IChangeInfoItem, enumIndex: number) => {
                            const firstEnum = enumIndex === 0
                            const old_value = enumItem.old_value || '--'
                            const new_value = enumItem.new_value || '--'
                            const code = enumItem.code || '--'

                            const oldNode = toolTip(
                                old_value,
                                old_value,
                                'oneEllipsis',
                            )

                            const newNode = toolTip(
                                new_value,
                                new_value,
                                'oneEllipsis',
                            )

                            const arrow = <>&nbsp;{' -> '}&nbsp;</>
                            return (
                                // 码值信息
                                <div className={styles.dictValue}>
                                    {toolTip(
                                        code,
                                        firstEnum ? `码值：${code}` : code,
                                        'dictCode oneEllipsis',
                                    )}
                                    <div className={styles.dictUpdValue}>
                                        <span className={styles.oneEllipsis}>
                                            {firstEnum ? '码值描述：' : ''}
                                        </span>
                                        {infoType === 'update' ? (
                                            <>
                                                {oldNode}
                                                {arrow}
                                                {newNode}
                                            </>
                                        ) : infoType === 'add' ? (
                                            newNode
                                        ) : (
                                            oldNode
                                        )}
                                    </div>
                                </div>
                            )
                        },
                    )}
                </div>
            </>
        )
    }

    // 加载显示内容
    const loadInfoValue = (config: IStdDetailConfig): any => {
        const value: any = details?.[config.name]
        if (['create_user', 'update_user'].includes(config.name)) {
            const isValue = (
                <>
                    <Tooltip title={value || '--'}>
                        <span>{value || '--'}</span>
                    </Tooltip>
                    <span>
                        &nbsp;
                        {(config.name === 'create_user'
                            ? details?.create_time?.substring(0, 10)
                            : details?.update_time?.substring(0, 10)) || ''}
                    </span>
                </>
            )
            return isValue
        }
        // 标准分类
        if (config.name === 'org_type') {
            const res = stardOrignizeTypeList.find(
                (item) => item.value === details?.org_type,
            )
            return res ? res.label : '--'
        }
        // 所属组织结构
        if (config.name === 'department_name') {
            return (
                <span title={details?.department_path_name || ''}>
                    {details?.department_name || '--'}
                </span>
            )
        }
        // 数据元引用信息
        // if (config?.name === 'dataEleList') {
        //     const dataList = details?.dataEleList
        //     return !!dataList && dataList.length > 0 ? (
        //         <div>
        //             <p style={{ textAlign: 'justify' }}>
        //                 {dataList.map((dataItem: IDataElement) => {
        //                     return <span>{dataItem.name_cn}；</span>
        //                 })}
        //             </p>
        //         </div>
        //     ) : (
        //         '--'
        //     )
        // }
        return value
    }

    // 前端搜索码值
    const filterEnums = (condition: ISearchCondition) => {
        const { offset, limit, keyword } = condition

        let newEnums: any[] = []

        if (keyword) {
            const allEnums = (details && details.enums) || []
            const enumsTemp = allEnums.filter(
                (itemRow) =>
                    itemRow.code
                        ?.toLowerCase()
                        .includes((keyword as string).toLowerCase()) ||
                    itemRow.value
                        ?.toLowerCase()
                        .includes((keyword as string).toLowerCase()),
            )
            newEnums = enumsTemp
        } else if (details && details.enums) {
            // 搜索值为空
            newEnums = details.enums
        }

        setPageConfig({
            current: offset,
            pageSize: limit,
            total: newEnums.length,
        })
    }

    const getAssociatedListData = async (
        type: CTDetailBasicModType,
        query: any,
    ) => {
        try {
            const { offset, limit, keyword } = query
            if (type === CTDetailBasicModType.AssociatedDataEle) {
                const res = await getDictQuoteListById(dictId, {
                    offset,
                    limit,
                })
                setDataEleList({
                    ...query,
                    data: res.data,
                    total_count: res.total_count,
                })
            } else if (type === CTDetailBasicModType.AssociatedFile) {
                const res = await getDictAssociatedFile(dictId, {
                    offset,
                    limit,
                })
                setFileList({
                    ...query,
                    data: res.data,
                    total_count: res.total_count,
                })
            } else if (type === CTDetailBasicModType.CodeValue) {
                const res = await getDictValuesBySearch({
                    dict_id: dictId,
                    offset,
                    limit,
                    keyword,
                })
                setCodeValueList({
                    ...query,
                    data: res.data,
                    total_count: res.total_count,
                })
            }
        } catch (error: any) {
            formatError(error)
        }
    }

    // 搜索框enter
    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        setSearchEnumsKey(keyword)
        const current = 1
        // filterEnums({
        //     keyword,
        //     offset: current,
        //     limit: pageConfig.pageSize,
        // })
        const codeValueListTemp = {
            ...codeValueList,
            keyword,
            offset: 1,
        }
        getAssociatedListData(CTDetailBasicModType.CodeValue, codeValueListTemp)
    }

    // 处理页码变化
    const onPageChange = (page: number, pageSize: number) => {
        let current = page
        if (pageSize !== pageConfig.pageSize) {
            current = 1
        }
        filterEnums({
            keyword: searchEnumsKey,
            offset: current,
            limit: pageSize,
        })
    }

    const showTableEmpty = () => {
        // 搜索为空显示
        return <Empty />
    }

    const renderRowInfo = (rowConfig: any) => {
        const { modKey, config } = rowConfig

        // 关联列表类型（关联数据元/码表/编码规则）
        let tableList: any = []
        let dataKey = ''
        switch (modKey) {
            case CTDetailBasicModType.AssociatedDataEle:
                tableList = dataEleList
                dataKey = 'name_cn'
                break
            case CTDetailBasicModType.AssociatedFile:
                tableList = fileList
                dataKey = 'name'
                break
            case CTDetailBasicModType.CodeValue:
                tableList = codeValueList
                dataKey = 'code'
                break
            default:
                break
        }

        if (modKey === CTDetailBasicModType.AssociatedDataEle) {
            return (
                <div className={styles.tableItem}>
                    {tableList?.data?.length > 0
                        ? tableList?.data?.map((tItem: any, tIndex: number) => {
                              const tCount =
                                  (tableList.offset - 1) * tableList.limit +
                                  (tIndex + 1)
                              return (
                                  <div className={styles.tableRow} key={tIndex}>
                                      <div
                                          className={styles.firstCol}
                                      >{`${config?.[0]?.label}${tCount}`}</div>
                                      <div
                                          className={classnames(
                                              styles.secCol,
                                              styles.secColWithStatus,
                                          )}
                                      >
                                          <Tooltip
                                              title={
                                                  tItem?.deleted &&
                                                  __('已被删除，无法查看详情')
                                              }
                                          >
                                              <Button
                                                  type="link"
                                                  className={styles.link}
                                                  disabled={tItem?.deleted}
                                                  onClick={() => {
                                                      setDetailId(tItem.id)
                                                      setDataEleDetailVisible(
                                                          true,
                                                      )
                                                  }}
                                              >
                                                  <div
                                                      className={
                                                          styles.asscociateTitle
                                                      }
                                                      title={
                                                          tItem[dataKey] || '--'
                                                      }
                                                  >
                                                      {tItem[dataKey]}
                                                  </div>
                                              </Button>
                                          </Tooltip>
                                          {getItemStatus(tItem)}
                                      </div>
                                  </div>
                              )
                          })
                        : '--'}
                </div>
            )
        }

        // 关联标准文件
        if (modKey === CTDetailBasicModType.AssociatedFile) {
            return (
                <div className={styles.tableItem}>
                    {tableList?.data?.length > 0
                        ? tableList?.data?.map((tItem: any, tIndex: number) => {
                              const tCount =
                                  (tableList.offset - 1) * tableList.limit +
                                  (tIndex + 1)

                              return (
                                  <div className={styles.tableRow} key={tIndex}>
                                      <div
                                          className={styles.firstCol}
                                      >{`${config?.[0]?.label}${tCount}`}</div>
                                      <div
                                          className={classnames(
                                              styles.secCol,
                                              styles.secColWithStatus,
                                          )}
                                      >
                                          <Tooltip
                                              title={
                                                  tItem?.deleted &&
                                                  __('已被删除，无法查看详情')
                                              }
                                          >
                                              <Button
                                                  type="link"
                                                  className={styles.link}
                                                  disabled={tItem?.deleted}
                                                  onClick={() => {
                                                      setDetailId(tItem.id)
                                                      setFileDetailVisible(true)
                                                  }}
                                              >
                                                  <div
                                                      className={
                                                          styles.fileInfoIcon
                                                      }
                                                  >
                                                      <FileIcon
                                                          type={
                                                              tItem?.attachment_type ===
                                                              AttachmentType.FILE
                                                                  ? getFileExtension(
                                                                        tItem?.file_name,
                                                                    ) || ''
                                                                  : FileIconType.LINK
                                                          }
                                                      />
                                                  </div>
                                                  <div
                                                      className={
                                                          styles.asscociateTitle
                                                      }
                                                      title={
                                                          tItem[dataKey] || '--'
                                                      }
                                                  >
                                                      {tItem[dataKey]}
                                                  </div>
                                              </Button>
                                          </Tooltip>
                                          {getItemStatus(tItem)}
                                      </div>
                                  </div>
                              )
                          })
                        : '--'}
                </div>
            )
        }
        // 码值
        if (modKey === CTDetailBasicModType.CodeValue) {
            return (
                <div className={styles.tableItem}>
                    <ConfigProvider renderEmpty={() => showTableEmpty()}>
                        <Table
                            rowKey={(rec) => rec.id}
                            columns={colmsDictEnums()}
                            dataSource={codeValueList?.data || []}
                            pagination={false}
                        />
                    </ConfigProvider>
                </div>
            )
        }
        return (
            <div className={styles.tableItem}>
                {rowConfig.config?.map((cItem: any) => {
                    const { key, label } = cItem
                    let showContent = details?.[key]
                    if (
                        key === 'disable_reason' &&
                        details?.state === StateType.ENABLE
                    ) {
                        return undefined
                    }
                    if (key === 'org_type') {
                        showContent =
                            stardOrignizeTypeList?.find(
                                (tItem) => tItem.value === showContent,
                            )?.label || '--'
                    }
                    if (key === 'state') {
                        const stateLabel =
                            stateOptionList?.find(
                                (tItem) => tItem.key === showContent,
                            )?.label || '--'
                        showContent = (
                            <div
                                className={classnames(
                                    styles.status,
                                    showContent === StateType.DISABLE &&
                                        styles.disableStatus,
                                )}
                            >
                                {stateLabel || '--'}
                            </div>
                        )
                    }
                    if (key === 'version') {
                        showContent = showContent ? `v${showContent}` : ''
                    }
                    return (
                        <div className={styles.tableRow} key={key}>
                            <div className={styles.firstCol}>{label}</div>
                            <div className={styles.secCol}>
                                {showContent || '--'}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderDetailContent = () => {
        return codeTableDetailMods.map((mItem) => {
            let showPagination = false
            const { modKey, title: modTitle } = mItem
            // 初始化为非对象的值
            let associateList: any = ''
            if (modKey === CTDetailBasicModType.AssociatedDataEle) {
                associateList = dataEleList
            } else if (modKey === CTDetailBasicModType.AssociatedFile) {
                associateList = fileList
            } else if (modKey === CTDetailBasicModType.CodeValue) {
                associateList = codeValueList
            }
            showPagination = (associateList?.total_count || 0) > defaultPageSize

            if (
                [
                    CTDetailBasicModType.AssociatedDataEle,
                    CTDetailBasicModType.AssociatedFile,
                    CTDetailBasicModType.CodeValue,
                ].includes(modKey) &&
                !associateList?.keyword &&
                !associateList?.total_count
            ) {
                // 数据为空则不显示
                return null
            }

            // 展示模块为码值
            const isCodeValue = modKey === CTDetailBasicModType.CodeValue

            return (
                <div
                    className={classnames(
                        styles.infoWrapper,
                        // 关联信息相关超过缺省
                        associateList !== '' && styles.asscociateInfoWrapper,
                    )}
                    id={modKey}
                >
                    <div
                        className={classnames(
                            styles.infoTitle,
                            isCodeValue && styles.codeValueInfo,
                        )}
                    >
                        <div>
                            {associateList?.total_count
                                ? `${mItem.title}（${associateList?.total_count}）`
                                : mItem.title}
                        </div>
                        {isCodeValue && (
                            <div
                                className={styles.codeValueSearch}
                                hidden={
                                    !codeValueList?.keyword &&
                                    !codeValueList?.data?.length
                                }
                            >
                                <SearchInput
                                    placeholder="搜索码值、码值描述"
                                    onKeyChange={(kw: string) =>
                                        handleSearchPressEnter(kw)
                                    }
                                    value={codeValueList.keyword}
                                    onPressEnter={handleSearchPressEnter}
                                    maxLength={64}
                                />
                            </div>
                        )}
                    </div>
                    {renderRowInfo(mItem)}
                    {showPagination && (
                        <div className={styles.pagination}>
                            <Pagination
                                simple
                                current={associateList?.offset}
                                total={associateList.total_count}
                                pageSize={defaultPageSize}
                                onChange={(page, pageSize) =>
                                    getAssociatedListData(modKey, {
                                        ...associateList,
                                        offset: page,
                                        limit: pageSize,
                                    })
                                }
                            />
                        </div>
                    )}
                </div>
            )
        })
    }

    return (
        <div>
            <CustomDrawer
                title={title}
                placement="right"
                push={{ distance: 0 }}
                className={`fullDrawer ${styles.codeTableDetails}`}
                onClose={onClose}
                open={visible && !!details}
                width={640}
                isShowHeader={false}
                isShowFooter={false}
                contentWrapperStyle={{
                    boxShadow: 'none',
                    // 集成到AS时候，弹窗不覆盖AS头，解决偶现弹窗不出现header
                    top: isMicroWidget({ microWidgetProps }) ? '52px' : 0,
                }}
                headerStyle={{ display: 'block' }}
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
                customBodyStyle={{
                    height: '100%',
                }}
                maskClosable
                maskStyle={{
                    top: isMicroWidget({ microWidgetProps }) ? '52px' : 0,
                }}
                getContainer={getContainer || false}
                zIndex={zIndex}
            >
                <div className={styles.bodyWrapper} ref={ref}>
                    {loading ? (
                        <Loader />
                    ) : (
                        <Row justify="space-between" gutter={20}>
                            <Col span={17}>
                                {mulDetailIds?.length && (
                                    <div
                                        className={styles.dictIdSelect}
                                        id={CTDetailBasicModType.BasicInfo}
                                    >
                                        <Select
                                            options={viewDictOptions}
                                            value={viewDictId}
                                            onChange={(value) => {
                                                setViewDictId(value)
                                            }}
                                            bordered={false}
                                            style={{ width: '100px' }}
                                        />
                                    </div>
                                )}
                                <div className={styles.detailContent}>
                                    {renderDetailContent()}
                                </div>
                            </Col>
                            <Col span={7}>
                                <Anchor
                                    getContainer={() => {
                                        return (
                                            (ref?.current as HTMLElement) ||
                                            window
                                        )
                                    }}
                                    onClick={(e: any) => e.preventDefault()}
                                    className={styles.anchorWrapper}
                                >
                                    {anchorItems?.map((link) => {
                                        return (
                                            <Link
                                                href={`${link.href}`}
                                                title={link.title}
                                                key={link.key}
                                            />
                                        )
                                    })}
                                </Anchor>
                            </Col>
                        </Row>
                    )}
                </div>
            </CustomDrawer>
            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!detailId && (
                <DataElementDetails
                    visible={dataEleDetailVisible && !!detailId}
                    dataEleId={detailId}
                    onClose={() => setDataEleDetailVisible(false)}
                    getContainer={getContainer}
                    zIndex={zIndex}
                />
            )}

            {/* 文件详情 */}
            {fileDetailVisible && !!detailId && (
                <FileDetails
                    visible={fileDetailVisible && !!detailId}
                    fileId={detailId}
                    onClose={() => setFileDetailVisible(false)}
                    getContainer={getContainer}
                />
            )}
        </div>
    )
}

export default Details
