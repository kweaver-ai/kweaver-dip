import React, { useEffect, useMemo, useRef, useState, useContext } from 'react'
import {
    Anchor,
    Button,
    ConfigProvider,
    Drawer,
    Pagination,
    Row,
    Select,
    Table,
    Timeline,
    Tooltip,
} from 'antd'
import { TooltipPlacement } from 'antd/es/tooltip'
import { useUpdateEffect } from 'ahooks'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import moment from 'moment'
import classnames from 'classnames'
import { ColumnsType } from 'antd/es/table'
import CodeTableDetails, { getItemStatus } from '../CodeTableManage/Details'
import CodeRuleDetails from '../CodeRulesComponent/CodeRuleDetails'
import FileDetails from '../File/Details'
import styles from './styles.module.less'
import { MicroWidgetPropsContext } from '@/context'
import __ from './locale'
import {
    additAttrConfig,
    attrConfig,
    basicConfig,
    codeRuleConfig,
    dataEleAttrEnum,
    dataEleAttrEnumType,
    dataEleDetailMods,
    DataType,
    dataTypeList,
    DEDetailBasicModType,
    dictConfig,
    stateList,
    versionConfig,
} from './const'

import {
    getDataEleDetailById,
    IDataElementDetail,
    IStdDetailConfig,
    IDirItem,
    formatError,
    IDictValueItem,
    IFileItem,
    IStandCommonRes,
    StateType,
    getDataEleAssociateFileList,
    getDictValuesBySearch,
    AttachmentType,
    isMicroWidget,
} from '@/core'
import CustomDrawer from '../CustomDrawer'
import Loader from '@/ui/Loader'
import { FileIconType } from '../File/helper'
import FileIcon from '../File/FileIcon'
import {
    getFileExtension,
    stardOrignizeTypeList,
    stateOptionList,
} from '@/utils'
import { FontIcon } from '@/icons'
import Empty from '@/ui/Empty'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'

const { Link } = Anchor

// 数据源详情传参的dataEleType类型
// 1，id匹配(不传默认为1)； 2,code匹配
export enum DataEleMatchType {
    IDMATCH = 1,
    CODEMATCH = 2,
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
 * @param dataEleId 单个详情（无select）使用此参数
 * @param mulDetailIds 传此参数表示在当前详情页，通过select组件切换id查看详情
 */
interface IDetails {
    visible: boolean
    title?: string
    dataEleMatchType?: DataEleMatchType
    dataEleId: string
    mulDetailIds?: Array<any>
    // selectedDir: IDirItem
    onClose: () => void
    handleError?: (errorKey: string) => void
    getContainer?: any
    zIndex?: number
}

/**
 * @param visible boolean 显示/隐藏
 * @param title 标题
 * @param onClose
 * @param handleError
 */
const Details: React.FC<IDetails> = ({
    visible,
    title = __('数据元详情'),
    dataEleMatchType,
    dataEleId,
    mulDetailIds,
    // selectedDir,
    onClose,
    handleError,
    getContainer = false,
    zIndex = 1000,
}) => {
    // 表单item
    const [details, setDetails] = useState<IDataElementDetail>()

    const ref = useRef<HTMLDivElement>(null)

    // 详情页面加载
    const [loading, setLoading] = useState(false)

    // 关联标准文件
    const [fileList, setFileList] =
        useState<IStandCommonRes<IFileItem>>(initAssociateData)

    // 数据元关联码表id
    const [associateDictId, setAssociateDictId] = useState<string>('')
    // 码值
    const [codeValueList, setCodeValueList] =
        useState<IStandCommonRes<IDictValueItem>>(initAssociateData)

    // 当前详情id
    const [viewDataEleId, setViewDataEleId] = useState<string>(dataEleId)

    const [viewDataEleOptions, setViewDataEleOptions] = useState<Array<any>>([])

    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    useEffect(() => {
        if (mulDetailIds?.length) {
            setViewDataEleOptions(
                mulDetailIds.map((currentData) => ({
                    label: currentData.label,
                    value: currentData.key,
                })),
            )
        }
    }, [mulDetailIds])

    const anchorItems = useMemo(() => {
        const items: any[] = []
        dataEleDetailMods.forEach((mItem) => {
            const { modKey } = mItem
            let showLink = false
            if (modKey === DEDetailBasicModType.AssociatedFile) {
                showLink = fileList?.total_count > 0
            } else if (modKey === DEDetailBasicModType.CodeTable) {
                showLink = !!details?.dict_id
            } else if (modKey === DEDetailBasicModType.CodeRule) {
                showLink = !!details?.rule_id
            }

            if (
                ![
                    DEDetailBasicModType.AssociatedFile,
                    DEDetailBasicModType.CodeTable,
                    DEDetailBasicModType.CodeRule,
                ].includes(modKey) ||
                showLink
            ) {
                items.push({
                    key: mItem.modKey,
                    href: `#${mItem.modKey}`,
                    title: mItem.title,
                })
            }
        })
        return items
    }, [details, fileList])

    // 文件详情
    const [fileDetailVisible, setFileDetailVisible] = useState<boolean>(false)

    // 码表/编码规则详情
    const [detailId, setDetailId] = useState('')

    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)
    // 编码规则详情
    const [codeRuleDetailVisible, setCodeRuleDetailVisible] =
        useState<boolean>(false)

    // 是否开启数据分级
    const [isStart] = useGradeLabelState()

    useEffect(() => {
        if (visible) {
            setViewDataEleId(dataEleId)
        } else {
            // 清空详情
            setViewDataEleId('')
            setDetails(undefined)
            setAssociateDictId('')
            setCodeValueList(initAssociateData)
            setFileList(initAssociateData)
        }
    }, [visible])

    useEffect(() => {
        if (visible) {
            getDataEleDetails(viewDataEleId)
        }
    }, [viewDataEleId])

    // 返回api接口对应的type入参值
    const getDataEleMatchTypeValue = (type: DataEleMatchType | undefined) => {
        if (type === DataEleMatchType.CODEMATCH) {
            return 2
        }
        return 1
    }

    // 获取当前数据元详情
    const getDataEleDetails = async (dId: string) => {
        try {
            setLoading(true)
            // dataEleMatchType为1时value为id值，dataEleMatchType为2时value为code值
            const res = await getDataEleDetailById({
                type: getDataEleMatchTypeValue(dataEleMatchType),
                value: viewDataEleId,
            })
            if (res.data) {
                setDetails(res.data)
                if (res.data.dict_id) {
                    // 获取码值
                    setAssociateDictId(res.data?.dict_id || '')
                    getAssociatedListData(DEDetailBasicModType.CodeTable, {
                        id: res.data?.dict_id || '',
                        ...codeValueList,
                    })
                }
                // 获取关联文件
                getAssociatedListData(DEDetailBasicModType.AssociatedFile, {
                    ...fileList,
                })
            }
        } catch (error: any) {
            if (error.status === 400) {
                const errorKey =
                    (error.data.detail &&
                        error.data.detail[0] &&
                        error.data.detail[0].Key) ||
                    ''
                // 数据元不存在(status:400, code:Standardization.ResourceError.DataNotExist)，不显示详情页
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

    // 原始/标准表格项
    const colmsDictEnums = (): ColumnsType<IDictValueItem> => {
        const cols: ColumnsType<IDictValueItem> = [
            {
                title: '码值',
                dataIndex: 'code',
                key: 'code',
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
                width: 130,
                ellipsis: true,
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

    const getAssociatedListData = async (
        type: DEDetailBasicModType,
        query: any,
    ) => {
        try {
            const { id, offset, limit, keyword } = query
            if (type === DEDetailBasicModType.AssociatedFile) {
                const res = await getDataEleAssociateFileList({
                    id: viewDataEleId,
                    offset,
                    limit,
                })
                setFileList({
                    ...query,
                    data: res.data,
                    total_count: res.total_count,
                })
            } else if (type === DEDetailBasicModType.CodeTable) {
                const res = await getDictValuesBySearch({
                    dict_id: id || associateDictId,
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

    const renderRowInfo = (rowConfig: any) => {
        const { modKey, config } = rowConfig

        // 关联列表类型（关联数据元/码表/编码规则）
        let tableList: any = []
        let dataKey = ''
        switch (modKey) {
            case DEDetailBasicModType.AssociatedFile:
                tableList = fileList
                dataKey = 'name'
                break
            case DEDetailBasicModType.CodeTable:
                tableList = codeValueList
                dataKey = 'code'
                break
            default:
                break
        }

        // 关联标准文件
        if (modKey === DEDetailBasicModType.AssociatedFile) {
            return (
                <div className={styles.tableItem}>
                    {tableList?.data?.length > 0
                        ? tableList?.data?.map((tItem: any, tIndex: number) => {
                              return (
                                  <div className={styles.tableRow} key={tIndex}>
                                      <div className={styles.firstCol}>{`${
                                          config?.[0]?.label
                                      }${tIndex + 1}`}</div>
                                      <div
                                          className={classnames(
                                              styles.secCol,
                                              styles.secColWithStatus,
                                          )}
                                      >
                                          <Tooltip
                                              title={
                                                  tItem.file_deleted &&
                                                  __('已被删除，无法查看详情')
                                              }
                                          >
                                              <Button
                                                  type="link"
                                                  className={styles.link}
                                                  disabled={tItem.file_deleted}
                                                  onClick={() => {
                                                      setDetailId(tItem.file_id)
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
                                                      {tItem[dataKey] || '--'}
                                                  </div>
                                              </Button>
                                          </Tooltip>
                                          {getItemStatus({
                                              deleted: tItem.file_deleted,
                                              state: tItem.file_state,
                                          })}
                                      </div>
                                  </div>
                              )
                          })
                        : '--'}
                </div>
            )
        }

        return (
            <div className={styles.tableItem}>
                {rowConfig.config?.map((cItem: any) => {
                    const { key, label } = cItem
                    let showContent = details?.[key]
                    if (
                        (key === 'disable_reason' &&
                            details?.state === StateType.ENABLE) ||
                        // 无值不显示
                        (['rule_name'].includes(key) && !showContent)
                    ) {
                        return undefined
                    }

                    if (key === 'data_length') {
                        if (
                            ![DataType.TDECIMAL, DataType.TCHAR].includes(
                                details?.data_type as DataType,
                            )
                        ) {
                            return undefined
                        }
                    }
                    if (key === 'std_type') {
                        showContent =
                            stardOrignizeTypeList?.find(
                                (tItem) => tItem.value === showContent,
                            )?.label || '--'
                    }
                    if (key === 'empty_flag') {
                        showContent = showContent === 0 ? __('否') : __('是')
                    }
                    if (key === 'department_name') {
                        showContent = (
                            <span title={details?.department_path_name || ''}>
                                {details?.department_name || '--'}
                            </span>
                        )
                    }
                    if (key === 'data_type') {
                        showContent =
                            // 兼容老数据
                            showContent === DataType.TNUMBER
                                ? __('数字型')
                                : dataTypeList?.find(
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
                    if (key === 'codeValueList') {
                        return (
                            <div
                                className={classnames(
                                    styles.tableRow,
                                    styles.tableListRow,
                                )}
                                key={key}
                            >
                                <ConfigProvider renderEmpty={() => <Empty />}>
                                    <Table
                                        rowKey={(rec) => rec.id}
                                        columns={colmsDictEnums()}
                                        dataSource={tableList?.data || []}
                                        pagination={false}
                                        // pagination={{
                                        //     size: 'small',
                                        //     total: tableList.total_count,
                                        //     current: tableList.offset,
                                        //     pageSize: tableList.limit,
                                        //     // showQuickJumper: true,
                                        //     hideOnSinglePage: true,
                                        // }}
                                    />
                                </ConfigProvider>
                            </div>
                        )
                    }
                    if (key === 'dict_name_cn') {
                        return (
                            <div className={styles.tableRow} key={key}>
                                <div className={styles.firstCol}>{label}</div>
                                <div
                                    className={classnames(
                                        styles.secCol,
                                        styles.secColWithStatus,
                                    )}
                                >
                                    <Tooltip
                                        title={
                                            details?.dict_deleted &&
                                            __('已被删除，无法查看详情')
                                        }
                                    >
                                        <Button
                                            type="link"
                                            className={styles.link}
                                            disabled={details?.dict_deleted}
                                            onClick={() => {
                                                setDetailId(
                                                    details?.dict_id || '',
                                                )
                                                setCodeTbDetailVisible(true)
                                            }}
                                        >
                                            <div
                                                className={
                                                    styles.asscociateTitle
                                                }
                                                title={showContent || '--'}
                                            >
                                                {showContent || '--'}
                                            </div>
                                        </Button>
                                    </Tooltip>
                                    {getItemStatus({
                                        deleted: details?.dict_deleted,
                                        state: details?.dict_state,
                                    })}
                                </div>
                            </div>
                        )
                    }
                    if (key === 'rule_name') {
                        return (
                            <div className={styles.tableRow} key={key}>
                                <div className={styles.firstCol}>{label}</div>
                                <div
                                    className={classnames(
                                        styles.secCol,
                                        styles.secColWithStatus,
                                    )}
                                >
                                    <Tooltip
                                        title={
                                            details?.rule_deleted &&
                                            __('已被删除，无法查看详情')
                                        }
                                    >
                                        <Button
                                            type="link"
                                            className={styles.link}
                                            disabled={details?.rule_deleted}
                                            onClick={() => {
                                                setDetailId(
                                                    details?.rule_id || '',
                                                )
                                                setCodeRuleDetailVisible(true)
                                            }}
                                        >
                                            <div
                                                className={
                                                    styles.asscociateTitle
                                                }
                                                title={showContent || '--'}
                                            >
                                                {showContent || '--'}
                                            </div>
                                        </Button>
                                    </Tooltip>
                                    {getItemStatus({
                                        deleted: details?.rule_deleted,
                                        state: details?.rule_state,
                                    })}
                                </div>
                            </div>
                        )
                    }
                    if (key === 'label_name') {
                        showContent = showContent ? (
                            <>
                                <FontIcon
                                    name="icon-biaoqianicon"
                                    style={{
                                        color: details?.label_icon,
                                        marginRight: 4,
                                    }}
                                />
                                {showContent}
                            </>
                        ) : (
                            '--'
                        )
                    }

                    if (key === 'data_precision') {
                        if (details?.data_type === DataType.TDECIMAL) {
                            showContent = showContent === 0 ? '0' : showContent
                        } else {
                            return undefined
                        }
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
        const data = isStart
            ? dataEleDetailMods
            : dataEleDetailMods.filter(
                  (item) => item.modKey !== DEDetailBasicModType.MoreInfo,
              )

        return data.map((mItem) => {
            let showPagination = false
            const { modKey, title: modTitle } = mItem
            let newModKey: string = modKey
            // 初始化为非对象的值
            let associateData: any = ''
            if (modKey === DEDetailBasicModType.BasicInfo) {
                if (mulDetailIds?.length) {
                    // 切换详情select存在则锚点id在切换详情上
                    newModKey = ''
                }
            } else if (modKey === DEDetailBasicModType.AssociatedFile) {
                associateData = fileList
            } else if (modKey === DEDetailBasicModType.CodeTable) {
                associateData = codeValueList
            } else if (modKey === DEDetailBasicModType.CodeRule) {
                associateData = details?.rule_id
            }
            showPagination = (associateData?.total_count || 0) > defaultPageSize

            if (
                ([
                    DEDetailBasicModType.AssociatedFile,
                    DEDetailBasicModType.CodeTable,
                ].includes(modKey) &&
                    !associateData?.keyword &&
                    !associateData?.total_count) ||
                (modKey === DEDetailBasicModType.CodeRule && !associateData)
            ) {
                // 数据为空则不显示
                return null
            }

            // 展示模块为码值
            const isCodeValue = modKey === DEDetailBasicModType.CodeTable

            return (
                <div
                    className={classnames(
                        styles.infoWrapper,
                        associateData !== '' && styles.asscociateInfoWrapper,
                    )}
                    id={newModKey}
                >
                    <div
                        className={classnames(
                            styles.infoTitle,
                            isCodeValue && styles.codeValueInfo,
                        )}
                    >
                        <div>{modTitle}</div>
                    </div>
                    {renderRowInfo(mItem)}
                    {showPagination && (
                        <div className={styles.pagination}>
                            <Pagination
                                simple
                                total={associateData.total_count}
                                pageSize={defaultPageSize}
                                onChange={(page, pageSize) =>
                                    getAssociatedListData(modKey, {
                                        ...associateData,
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
                className={`fullDrawer ${styles.detailsWrapper}`}
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
                getContainer={getContainer}
                zIndex={zIndex}
            >
                <div className={styles.bodyWrapper} ref={ref}>
                    {loading ? (
                        <Loader />
                    ) : (
                        <div className={styles.bodyContentWrapper}>
                            <div>
                                {mulDetailIds?.length && (
                                    <div
                                        className={styles.dataEleIdSelect}
                                        id={DEDetailBasicModType.BasicInfo}
                                    >
                                        <Select
                                            options={viewDataEleOptions}
                                            value={viewDataEleId}
                                            onChange={(value) => {
                                                setViewDataEleId(value)
                                            }}
                                            bordered={false}
                                            style={{ width: '100px' }}
                                        />
                                    </div>
                                )}
                                <div className={styles.detailContent}>
                                    {renderDetailContent()}
                                </div>
                            </div>
                            <Anchor
                                getContainer={() => {
                                    return (
                                        (ref?.current as HTMLElement) || window
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
                        </div>
                    )}
                </div>
            </CustomDrawer>
            {/* 查看码表详情 */}
            {codeTbDetailVisible && !!detailId && (
                <CodeTableDetails
                    visible={codeTbDetailVisible && !!detailId}
                    title={__('码表详情')}
                    dictId={detailId}
                    onClose={() => setCodeTbDetailVisible(false)}
                    getContainer={getContainer}
                    zIndex={zIndex}
                />
            )}
            {/* 查看编码规则详情 */}
            {codeRuleDetailVisible && !!detailId && (
                <CodeRuleDetails
                    // title={__('码表详情')}
                    visible={codeRuleDetailVisible && !!detailId}
                    onClose={() => setCodeRuleDetailVisible(false)}
                    id={detailId}
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
        </div>
    )
}

export default Details
