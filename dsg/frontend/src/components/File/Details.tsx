import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import {
    Anchor,
    Breadcrumb,
    Col,
    Drawer,
    Input,
    InputNumber,
    Pagination,
    Row,
} from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import {
    formatError,
    IStandCommonRes,
    ICRuleItem,
    IDataElement,
    IDictItem,
    IDirItem,
    IFileInfo,
    IFileItem,
    getFileAssociatedDataElement,
    getFileAssociatedCodeTable,
    getFileAssociatedCodeRule,
    getFileDetailById,
    AttachmentType,
    StateType,
} from '@/core'
import {
    getFileExtension,
    stardOrignizeTypeAll,
    stardOrignizeTypeList,
    stateOptionList,
} from '@/utils'
import DataElementDetails from '../DataEleManage/Details'
import CodeTableDetails from '../CodeTableManage/Details'
import CodeRuleDetails from '../CodeRulesComponent/CodeRuleDetails'
import styles from './styles.module.less'
import __ from './locale'
import { FileIconType, fileTypeOptions } from './helper'
import { FileDetailBasicModType, fileDetailMods } from './const'
import CustomDrawer from '../CustomDrawer'
import FileIcon from './FileIcon'

const { Link } = Anchor

interface IDetails {
    visible: boolean
    title?: string
    // dataEleMatchType?: DataEleMatchType
    fileId: string
    onClose: () => void
    handleError?: (errorKey: string) => void
    getContainer?: any
}

// 关联数据默认页码
const defaultPageSize = 5

const initAssociateData: IStandCommonRes<any> = {
    data: [],
    total_count: 0,
    offset: 1,
    limit: defaultPageSize,
}

const Details: React.FC<IDetails> = ({
    visible,
    title = __('标准文件详情'),
    fileId,
    onClose,
    handleError,
    getContainer,
}) => {
    const [loading, setLoading] = useState(true)
    // 表单item
    const [fileAllInfo, setFileAllInfo] = useState<IFileInfo>()

    // const anchorItems = fileDetailMods.map((mItem) => {
    //     return {
    //         key: mItem.modKey,
    //         href: `#${mItem.modKey}`,
    //         title: mItem.title,
    //     }
    // })

    // 文件详情
    const [details, setDetails] = useState<IFileItem>()
    // 关联数据元
    const [dataEleList, setDataEleList] =
        useState<IStandCommonRes<IDataElement>>(initAssociateData)
    // 关联码表
    const [codeTableList, setCodeTableList] =
        useState<IStandCommonRes<IDictItem>>(initAssociateData)
    // 关联编码规则
    const [codeRuleList, setCodeRuleList] =
        useState<IStandCommonRes<ICRuleItem>>(initAssociateData)

    const ref = useRef<HTMLDivElement>(null)

    // 数据元/码表/编码规则详情
    const [detailId, setDetailId] = useState('')

    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)
    // 编码规则详情
    const [codeRuleDetailVisible, setCodeRuleDetailVisible] =
        useState<boolean>(false)

    const anchorItems = useMemo(() => {
        const items: any[] = []
        fileDetailMods.forEach((mItem) => {
            const { modKey } = mItem
            let associateList: any = []
            if (modKey === FileDetailBasicModType.AssociatedDataEle) {
                associateList = dataEleList
            } else if (modKey === FileDetailBasicModType.AssociatedCodeTable) {
                associateList = codeTableList
            } else if (modKey === FileDetailBasicModType.AssociatedCodeRule) {
                associateList = codeRuleList
            }
            if (
                ![
                    FileDetailBasicModType.AssociatedDataEle,
                    FileDetailBasicModType.AssociatedCodeTable,
                    FileDetailBasicModType.AssociatedCodeRule,
                ].includes(modKey) ||
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
    }, [dataEleList, codeTableList, codeRuleList])

    useEffect(() => {
        if (visible && fileId) {
            getFileAllInfo()
        }
    }, [visible])

    const getFileAllInfo = async () => {
        try {
            setLoading(true)
            const [detail, deList, ctList, crList] = await Promise.all([
                // 获取文件详情
                getFileDetailById(fileId),
                // 获取文件关联数据元
                getFileAssociatedDataElement({
                    id: fileId,
                    offset: dataEleList.offset,
                    limit: dataEleList.limit,
                }),
                // 获取文件关联码表
                getFileAssociatedCodeTable({
                    id: fileId,
                    offset: codeTableList.offset,
                    limit: codeTableList.limit,
                }),
                // 获取文件关联编码规则
                getFileAssociatedCodeRule({
                    id: fileId,
                    offset: codeRuleList.offset,
                    limit: codeRuleList.limit,
                }),
            ])
            setDetails(detail.data)
            setDataEleList({
                ...dataEleList,
                data: deList.data,
                total_count: deList.total_count,
            })
            setCodeTableList({
                ...codeTableList,
                data: ctList.data,
                total_count: ctList.total_count,
            })
            setCodeRuleList({
                ...codeRuleList,
                data: crList.data,
                total_count: crList.total_count,
            })
        } catch (error: any) {
            formatError(error)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const getAssociatedListData = async (
        type: FileDetailBasicModType,
        offset: number,
        limit: number,
    ) => {
        try {
            if (type === FileDetailBasicModType.AssociatedDataEle) {
                const res = await getFileAssociatedDataElement({
                    id: fileId,
                    offset,
                    limit,
                })
                setDataEleList({ ...dataEleList, offset, data: res.data })
            } else if (type === FileDetailBasicModType.AssociatedCodeTable) {
                const res = await getFileAssociatedCodeTable({
                    id: fileId,
                    offset,
                    limit,
                })
                setCodeTableList({ ...codeTableList, offset, data: res.data })
            } else if (type === FileDetailBasicModType.AssociatedCodeRule) {
                const res = await getFileAssociatedCodeRule({
                    id: fileId,
                    offset,
                    limit,
                })
                setCodeRuleList({ ...codeRuleList, offset, data: res.data })
            }
        } catch (error: any) {
            formatError(error)
            onClose()
        }
    }

    const handleAnchorClick = (
        e: React.MouseEvent<HTMLElement>,
        link: {
            title: React.ReactNode
            href: string
        },
    ) => {
        e.preventDefault()
    }

    const renderRowInfo = (rowConfig: any) => {
        const { modKey, config } = rowConfig

        // 关联列表类型（关联数据元/码表/编码规则）
        let tableList: any = []
        let dataKey = ''
        switch (modKey) {
            case FileDetailBasicModType.AssociatedDataEle:
                tableList = dataEleList
                dataKey = 'name_cn'
                break
            case FileDetailBasicModType.AssociatedCodeTable:
                tableList = codeTableList
                dataKey = 'ch_name'
                break
            case FileDetailBasicModType.AssociatedCodeRule:
                tableList = codeRuleList
                dataKey = 'name'
                break
            default:
                break
        }

        if (
            [
                FileDetailBasicModType.AssociatedDataEle,
                FileDetailBasicModType.AssociatedCodeTable,
                FileDetailBasicModType.AssociatedCodeRule,
            ].includes(modKey)
        ) {
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
                                      <div className={styles.secCol}>
                                          <span
                                              className={styles.link}
                                              onClick={() => {
                                                  setDetailId(tItem.id)
                                                  if (
                                                      modKey ===
                                                      FileDetailBasicModType.AssociatedDataEle
                                                  ) {
                                                      setDataEleDetailVisible(
                                                          true,
                                                      )
                                                  } else if (
                                                      modKey ===
                                                      FileDetailBasicModType.AssociatedCodeTable
                                                  ) {
                                                      setCodeTbDetailVisible(
                                                          true,
                                                      )
                                                  } else if (
                                                      modKey ===
                                                      FileDetailBasicModType.AssociatedCodeRule
                                                  ) {
                                                      setCodeRuleDetailVisible(
                                                          true,
                                                      )
                                                  }
                                              }}
                                          >
                                              {tItem[dataKey]}
                                          </span>
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
                        (key === 'file_name' &&
                            details?.attachment_type === AttachmentType.URL) ||
                        (key === 'attachment_url' &&
                            details?.attachment_type === AttachmentType.FILE) ||
                        (key === 'disable_reason' &&
                            details?.state === StateType.ENABLE)
                    ) {
                        return undefined
                    }

                    if (['file_name', 'attachment_url'].includes(key)) {
                        showContent = (
                            <div className={styles.fileInfo}>
                                <div className={styles.fileInfoIcon}>
                                    <FileIcon
                                        type={
                                            details?.attachment_type ===
                                            AttachmentType.FILE
                                                ? getFileExtension(
                                                      details?.file_name,
                                                  ) || ''
                                                : FileIconType.LINK
                                        }
                                    />
                                </div>
                                <div
                                    className={styles.fileName}
                                    title={showContent || '--'}
                                >
                                    {showContent || '--'}
                                </div>
                            </div>
                        )
                    }
                    if (key === 'attachment_type') {
                        showContent =
                            fileTypeOptions?.find(
                                (tItem) => tItem.value === showContent,
                            )?.typeLabel || '--'
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
        return fileDetailMods.map((mItem) => {
            let showPagination = false
            const { modKey } = mItem
            // 初始化为非对象的值
            let associateList: any = ''
            if (modKey === FileDetailBasicModType.AssociatedDataEle) {
                showPagination =
                    (dataEleList?.total_count || 0) > defaultPageSize
                associateList = dataEleList
            } else if (modKey === FileDetailBasicModType.AssociatedCodeTable) {
                showPagination =
                    (codeTableList?.total_count || 0) > defaultPageSize
                associateList = codeTableList
            } else if (modKey === FileDetailBasicModType.AssociatedCodeRule) {
                showPagination =
                    (codeRuleList?.total_count || 0) > defaultPageSize
                associateList = codeRuleList
            }

            if (
                [
                    FileDetailBasicModType.AssociatedDataEle,
                    FileDetailBasicModType.AssociatedCodeTable,
                    FileDetailBasicModType.AssociatedCodeRule,
                ].includes(modKey) &&
                !associateList?.total_count
            ) {
                // 数据为空则不显示
                return null
            }

            return (
                <div
                    className={classnames(
                        styles.infoWrapper,
                        // 关联信息相关超过缺省
                        associateList !== '' && styles.asscociateInfoWrapper,
                    )}
                    id={mItem.modKey}
                >
                    <div className={styles.infoTitle}>
                        {associateList?.total_count
                            ? `${mItem.title}（${associateList?.total_count}）`
                            : mItem.title}
                    </div>
                    {renderRowInfo(mItem)}
                    {showPagination && (
                        <div className={styles.pagination}>
                            <Pagination
                                simple
                                total={associateList.total_count}
                                pageSize={defaultPageSize}
                                showQuickJumper={false}
                                showSizeChanger={false}
                                onChange={(page, pageSize) =>
                                    getAssociatedListData(
                                        modKey,
                                        page,
                                        pageSize,
                                    )
                                }
                            />
                        </div>
                    )}
                </div>
            )
        })
    }

    const hanldeModalClose = (type: FileDetailBasicModType) => {
        setDetailId('')
        if (type === FileDetailBasicModType.AssociatedDataEle) {
            setDataEleDetailVisible(false)
        } else if (type === FileDetailBasicModType.AssociatedCodeTable) {
            setCodeTbDetailVisible(false)
        } else if (type === FileDetailBasicModType.AssociatedCodeRule) {
            setCodeRuleDetailVisible(false)
        }
    }

    return visible ? (
        <div>
            <CustomDrawer
                title={title}
                placement="right"
                push={{ distance: 0 }}
                className={`fullDrawer ${styles.fileDetailsWrapper}`}
                onClose={onClose}
                open={visible}
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
                    height: '100%',
                }}
                maskClosable
                maskStyle={undefined}
                getContainer={getContainer}
            >
                <div className={styles.bodyWrapper} ref={ref}>
                    {!loading && (
                        <Row justify="space-between" gutter={20}>
                            <Col span={16}>
                                <div className={styles.detailContent}>
                                    {renderDetailContent()}
                                </div>
                            </Col>
                            <Col span={8}>
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
                    onClose={() =>
                        hanldeModalClose(
                            FileDetailBasicModType.AssociatedDataEle,
                        )
                    }
                    getContainer={getContainer}
                />
            )}
            {/* 查看码表详情 */}
            {codeTbDetailVisible && !!detailId && (
                <CodeTableDetails
                    visible={codeTbDetailVisible && !!detailId}
                    dictId={detailId}
                    onClose={() =>
                        hanldeModalClose(
                            FileDetailBasicModType.AssociatedCodeTable,
                        )
                    }
                    getContainer={getContainer}
                />
            )}
            {/* 查看编码规则详情 */}
            {codeRuleDetailVisible && !!detailId && (
                <CodeRuleDetails
                    visible={codeRuleDetailVisible && !!detailId}
                    onClose={() =>
                        hanldeModalClose(
                            FileDetailBasicModType.AssociatedCodeRule,
                        )
                    }
                    id={detailId}
                    getContainer={getContainer}
                />
            )}
        </div>
    ) : (
        <div />
    )
}

export default Details
