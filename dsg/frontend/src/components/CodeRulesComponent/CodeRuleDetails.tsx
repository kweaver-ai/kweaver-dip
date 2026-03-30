import React, { useEffect, useState, useRef, useMemo } from 'react'
import {
    Drawer,
    Select,
    Anchor,
    Col,
    ConfigProvider,
    Pagination,
    Row,
    Table,
    Tooltip,
    Button,
} from 'antd'
import moment from 'moment'
import { ColumnsType } from 'antd/es/table'
import { noop, trim } from 'lodash'
import { TooltipPlacement } from 'antd/es/tooltip'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import {
    formatError,
    getCodeRuleDataElement,
    getCodeRuleDetails,
    ICodeRuleDataElement,
    ICRuleItem,
    getDictDetailById,
    IChangeInfoItem,
    IDataElement,
    IStdDetailConfig,
    IDictItem,
    IDictValueItem,
    IStandCommonRes,
    IFileItem,
    getFileAssociatedCodeTable,
    getDictQuoteListById,
    getDictAssociatedFile,
    getDictValuesBySearch,
    getCodeRuleReletionFilesInfo,
    IDataItem,
    getCodeTableByIds,
    getCodeRulesByIds,
    AttachmentType,
} from '@/core'
import Empty from '@/ui/Empty'
import DataElementDetails from '../DataEleManage/Details'
import FileDetails from '../File/Details'

import {
    // basicConfig,
    // quoteConfig,
    // dictValuesConfig,
    // versionConfig,
    codeTableDetailMods,
    CTDetailBasicModType,
    RuleCustomType,
    RuleMethod,
    RuleTypeOptions,
} from './const'
import {
    getFileExtension,
    stardOrignizeTypeList,
    stateOptionList,
    StateType,
} from '@/utils'
import Loader from '@/ui/Loader'
import { FileIconType } from '../File/helper'
import FileIcon from '../File/FileIcon'
import CustomDrawer from '../CustomDrawer'
import Details from '../CodeTableManage/Details'

const { Link } = Anchor

// 获取item的状态-已删除/已停用
export const getItemStatus = (item: any) => {
    const { state, deleted } = item
    if (deleted) {
        return <div className={styles.quoteDeletedStatus}>{__('已删除')} </div>
    }
    if (state === StateType.DISABLE) {
        return <div className={styles.quoteDisableStatus}>{__('已停用')} </div>
    }

    return undefined
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
    editing: boolean
    dataIndex: string
    title: any
    inputType: 'number' | 'text'
    record: IDictItem
    index: number
    children: React.ReactNode
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
 * @param mulDetailIds 传此参数表示在当前详情页，通过select组件切换id查看详情
 */
interface ICodeRuleDetails {
    visible?: boolean
    title?: string
    id: string
    handleError?: (errorKey: string, ruleId: string) => void
    onClose: () => void
    mulDetailIds?: Array<any>
    getContainer?: any
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
 * @param mulDetailIds 传此参数表示在当前详情页，通过select组件切换id查看详情
 *
 */
const CodeRuleDetails: React.FC<ICodeRuleDetails> = ({
    visible,
    title = __('编码规则详情'),
    id,
    onClose,
    handleError = noop,
    mulDetailIds,
    getContainer,
}) => {
    // 表单item
    const [details, setDetails] = useState<ICRuleItem>()
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
    const [detailId, setDetailId] = useState(id)

    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)

    // 文件详情
    const [fileDetailVisible, setFileDetailVisible] = useState<boolean>(false)

    const [customCodeTable, setCustomCodeTable] = useState<Array<any>>([])

    const [viewCodeTableId, setViewCodeTableId] = useState<string>('')

    const [viewRuleId, setViewRuleId] = useState<string>(id)

    const [viewRuleOptions, setViewRuleOptions] = useState<Array<any>>([])

    useEffect(() => {
        if (mulDetailIds) {
            setViewRuleOptions(
                mulDetailIds.map((currentData) => ({
                    label: currentData.label,
                    value: currentData.key,
                })),
            )
        }
    }, [mulDetailIds])

    const anchorItems = useMemo(() => {
        const items: any[] = []
        codeTableDetailMods.forEach((mItem) => {
            const { modKey } = mItem
            let associateList
            if (modKey === CTDetailBasicModType.AssociatedDataEle) {
                associateList = dataEleList
            } else if (modKey === CTDetailBasicModType.AssociatedFile) {
                associateList = fileList
            }

            if (
                ![
                    CTDetailBasicModType.AssociatedDataEle,
                    CTDetailBasicModType.AssociatedFile,
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
            setViewRuleId(id)
        } else {
            // 清空详情
            setDetails(undefined)
            setIsHistoryShow(false)
            setSearchEnumsKey('')
        }
    }, [visible, id])

    useEffect(() => {
        getDictDetails(viewRuleId)
    }, [viewRuleId])

    // 原始/标准表格项
    const colmsDictEnums = (): ColumnsType<IDictValueItem> => {
        const cols: ColumnsType<IDictValueItem> = [
            {
                title: '码值',
                dataIndex: 'code',
                key: 'code',
                // editing: true,
                width: 154,
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
                width: 280,
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
    const getDictDetails = async (dataId) => {
        if (!dataId) return
        try {
            setLoading(true)
            // const res = await getDictDetailById(id)
            const [detail, deList, fList] = await Promise.all([
                // 获取码表详情
                getCodeRuleDetails(dataId),
                // 获取码表关联数据源
                getCodeRuleDataElement(dataId, {
                    offset: dataEleList.offset,
                    limit: dataEleList.limit,
                }),
                // 获取码表关联
                getCodeRuleReletionFilesInfo(dataId, {
                    offset: fileList.offset,
                    limit: fileList.limit,
                }),
            ])
            setDetails(detail.data)
            const { custom, std_files, rule_type, ...rest } = detail.data
            if (rule_type === RuleMethod.Customer) {
                const codeTableIds: Array<string> =
                    custom?.reduce((preData: Array<string>, currentData) => {
                        if (currentData.type === RuleCustomType.CodeTable) {
                            return [...preData, currentData.value]
                        }
                        return preData
                    }, []) || []
                if (codeTableIds.length) {
                    const codeTableData = await getCodeTableByIds(codeTableIds)
                    setCustomCodeTable(codeTableData?.data || [])
                }
            }
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
        } catch (error: any) {
            if (error.status === 400) {
                const errorKey = error.data && error.data.code

                if (handleError) {
                    handleError(errorKey, dataId)
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

    const getAssociatedListData = async (
        type: CTDetailBasicModType,
        query: any,
        dataId: string,
    ) => {
        try {
            const { offset, limit, keyword } = query
            if (type === CTDetailBasicModType.AssociatedDataEle) {
                const res = await getCodeRuleDataElement(dataId, {
                    offset,
                    limit,
                })
                setDataEleList({
                    ...query,
                    data: res.data,
                    total_count: res.total_count,
                })
            } else if (type === CTDetailBasicModType.AssociatedFile) {
                const res = await getCodeRuleReletionFilesInfo(dataId, {
                    offset,
                    limit,
                })
                setFileList({
                    ...query,
                    data: res.data,
                    total_count: res.total_count,
                })
            }
        } catch (error: any) {
            formatError(error)
        }
    }

    const renderRowInfo = (rowConfig: any) => {
        const { modKey, config } = rowConfig

        // 关联列表类型（关联数据元/码表/编码规则）
        let tableData: any = []
        let dataKey = ''
        switch (modKey) {
            case CTDetailBasicModType.AssociatedDataEle:
                tableData = dataEleList.data
                dataKey = 'name_cn'
                break
            case CTDetailBasicModType.AssociatedFile:
                tableData = fileList.data
                dataKey = 'name'
                break
            default:
                break
        }

        if (modKey === CTDetailBasicModType.AssociatedDataEle) {
            return (
                <div className={styles.tableItem}>
                    {tableData?.length > 0
                        ? tableData?.map((tItem: any, tIndex: number) => {
                              return (
                                  <div className={styles.tableRow} key={tIndex}>
                                      <div className={styles.firstCol}>{`${
                                          config?.[0]?.label
                                      }${
                                          tIndex +
                                          1 +
                                          (dataEleList.offset - 1) *
                                              dataEleList.limit
                                      }`}</div>
                                      <div className={styles.secCol}>
                                          <Tooltip
                                              title={
                                                  tItem?.deleted &&
                                                  __('已被删除，无法查看详情')
                                              }
                                          >
                                              <Button
                                                  type="link"
                                                  disabled={tItem?.deleted}
                                                  className={classnames(
                                                      styles.link,
                                                      styles.fileName,
                                                  )}
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
                    {tableData?.length > 0
                        ? tableData?.map((tItem: any, tIndex: number) => {
                              return (
                                  <div className={styles.tableRow} key={tIndex}>
                                      <div className={styles.firstCol}>{`${
                                          config?.[0]?.label
                                      }${
                                          tIndex +
                                          1 +
                                          fileList.limit * (fileList.offset - 1)
                                      }`}</div>
                                      <div
                                          className={classnames(
                                              styles.secCol,
                                              styles.fileCol,
                                          )}
                                      >
                                          <div className={styles.fileName}>
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
                                              <Tooltip
                                                  title={
                                                      tItem?.deleted &&
                                                      __(
                                                          '已被删除，无法查看详情',
                                                      )
                                                  }
                                              >
                                                  <Button
                                                      type="link"
                                                      className={styles.link}
                                                      disabled={tItem?.deleted}
                                                      onClick={() => {
                                                          setDetailId(tItem.id)
                                                          setFileDetailVisible(
                                                              true,
                                                          )
                                                      }}
                                                  >
                                                      <div
                                                          className={
                                                              styles.asscociateTitle
                                                          }
                                                          title={
                                                              tItem[dataKey] ||
                                                              '--'
                                                          }
                                                      >
                                                          {tItem[dataKey]}
                                                      </div>
                                                  </Button>
                                              </Tooltip>
                                          </div>
                                          {getItemStatus(tItem)}
                                      </div>
                                  </div>
                              )
                          })
                        : '--'}
                </div>
            )
        }
        if (
            modKey === CTDetailBasicModType.RuleCodeInfo &&
            details?.rule_type === RuleMethod.Customer
        ) {
            const customData =
                details?.custom?.map((currentData) => {
                    if (currentData.type === RuleCustomType.CodeTable) {
                        const currentTableInfo = customCodeTable?.find(
                            (codeTableinfo) =>
                                codeTableinfo.id === currentData.value,
                        )
                        return {
                            ...currentData,
                            value: currentTableInfo?.ch_name ? (
                                <span
                                    onClick={() => {
                                        setViewCodeTableId(currentTableInfo.id)
                                    }}
                                    className={styles.link}
                                >
                                    {currentTableInfo.ch_name}
                                </span>
                            ) : (
                                '--'
                            ),
                        }
                    }
                    return currentData
                }) || []
            return (
                <div className={styles.tableItem}>
                    <div className={styles.tableRow}>
                        <div
                            className={styles.firstCol}
                        >{`${config?.[0]?.label}`}</div>
                        <div
                            className={classnames(
                                styles.secCol,
                                styles.fileCol,
                            )}
                            style={{
                                marginBottom: '12px',
                                flexDirection: 'column',
                            }}
                        >
                            {customData.length > 0
                                ? customData.map(
                                      (tItem: any, tIndex: number) => {
                                          return (
                                              <div
                                                  key={tIndex}
                                                  className={styles.ruleCard}
                                              >
                                                  <div
                                                      className={
                                                          styles.ruleItem
                                                      }
                                                  >
                                                      <div
                                                          className={
                                                              styles.ruleLabel
                                                          }
                                                      >
                                                          {__('分段长度：')}
                                                      </div>
                                                      <div
                                                          className={
                                                              styles.ruleValue
                                                          }
                                                      >
                                                          {tItem.segment_length}
                                                      </div>
                                                  </div>
                                                  <div
                                                      className={
                                                          styles.ruleItem
                                                      }
                                                  >
                                                      <div
                                                          className={
                                                              styles.ruleLabel
                                                          }
                                                      >
                                                          {__('规则名称：')}
                                                      </div>
                                                      <div
                                                          className={
                                                              styles.ruleValue
                                                          }
                                                      >
                                                          {tItem.name || '--'}
                                                      </div>
                                                  </div>
                                                  <div
                                                      className={
                                                          styles.ruleItem
                                                      }
                                                  >
                                                      <div
                                                          className={
                                                              styles.ruleLabel
                                                          }
                                                      >
                                                          {__('规则类型：')}
                                                      </div>
                                                      <div
                                                          className={
                                                              styles.ruleValue
                                                          }
                                                      >
                                                          {RuleTypeOptions.find(
                                                              (currentOption) =>
                                                                  currentOption.value ===
                                                                  tItem.type,
                                                          )?.label || '--'}
                                                      </div>
                                                  </div>
                                                  <div
                                                      className={
                                                          styles.ruleItem
                                                      }
                                                  >
                                                      <div
                                                          className={
                                                              styles.ruleLabel
                                                          }
                                                      >
                                                          {__('规则格式/值：')}
                                                      </div>
                                                      <div
                                                          className={
                                                              styles.ruleValue
                                                          }
                                                      >
                                                          {tItem.value || '--'}
                                                      </div>
                                                  </div>
                                              </div>
                                          )
                                      },
                                  )
                                : '--'}
                        </div>
                    </div>
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
                    if (key === 'department_name') {
                        showContent = (
                            <span title={details?.department_path_name || ''}>
                                {details?.department_name || '--'}
                            </span>
                        )
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
                    if (key === 'ruglarInfos') {
                        showContent = details?.regex || '--'
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
            let associateList
            if (modKey === CTDetailBasicModType.AssociatedDataEle) {
                associateList = dataEleList
            } else if (modKey === CTDetailBasicModType.AssociatedFile) {
                associateList = fileList
            }
            showPagination = (associateList?.total_count || 0) > defaultPageSize

            if (
                [
                    CTDetailBasicModType.AssociatedDataEle,
                    CTDetailBasicModType.AssociatedFile,
                ].includes(modKey) &&
                !associateList?.keyword &&
                !associateList?.total_count
            ) {
                // 数据为空则不显示
                return null
            }

            return (
                <div className={styles.infoWrapper} id={modKey}>
                    <div className={classnames(styles.infoTitle)}>
                        <div>
                            {associateList?.total_count
                                ? `${mItem.title}（${associateList?.total_count}）`
                                : mItem.title}
                        </div>
                    </div>
                    {renderRowInfo(mItem)}
                    {showPagination && (
                        <div className={styles.pagination}>
                            <Pagination
                                size="small"
                                total={associateList.total_count}
                                pageSize={defaultPageSize}
                                onChange={(page, pageSize) =>
                                    getAssociatedListData(
                                        modKey,
                                        {
                                            ...associateList,
                                            offset: page,
                                            limit: pageSize,
                                        },
                                        viewRuleId,
                                    )
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
                }}
                headerStyle={{ display: 'block' }}
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
                customBodyStyle={{
                    height: 'auto',
                }}
                maskClosable
                maskStyle={undefined}
                getContainer={getContainer || false}
            >
                <div className={styles.bodyWrapper} ref={ref}>
                    {mulDetailIds ? (
                        <div className={styles.ruleCodeSelect}>
                            <Select
                                options={viewRuleOptions}
                                value={viewRuleId}
                                onChange={(value) => {
                                    setViewRuleId(value)
                                }}
                                bordered={false}
                                style={{ width: '100px' }}
                            />
                        </div>
                    ) : null}
                    {loading ? (
                        <div className="showEmpty baseEmpty">
                            <Loader />
                        </div>
                    ) : (
                        <Row justify="space-between" gutter={20}>
                            <Col span={18}>
                                <div className={styles.detailContent}>
                                    {renderDetailContent()}
                                </div>
                            </Col>
                            <Col span={6}>
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

            {viewCodeTableId && (
                <Details
                    visible={!!viewCodeTableId}
                    dictId={viewCodeTableId}
                    onClose={() => {
                        setViewCodeTableId('')
                    }}
                    getContainer={getContainer}
                />
            )}
        </div>
    )
}

export default CodeRuleDetails
