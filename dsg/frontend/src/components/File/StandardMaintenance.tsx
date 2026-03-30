import { useUpdateEffect } from 'ahooks'
import { Button, Select } from 'antd'
import React, { useEffect, useRef, useState } from 'react'

import { RowSelectionType } from 'antd/es/table/interface'
import lodash from 'lodash'
import {
    CatalogType,
    formatError,
    getFileAssociateInfo,
    IDataElement,
    IDataItem,
    IDictItem,
    IDirItem,
    IDirQueryType,
    IFileAssociateInfo,
    updFileAssociateInfo,
} from '@/core'
import { FileModalType } from './helper'
import __ from './locale'

import { Loader, ReturnConfirmModal } from '@/ui'
import { Operate, OperateType } from '@/utils'
import CodeRuleDetails from '../CodeRulesComponent/CodeRuleDetails'
import EditCodeRule from '../CodeRulesComponent/EditCodeRule'
import CodeTableDetails from '../CodeTableManage/Details'
import EditDictForm from '../CodeTableManage/EditDictForm'
import ImportDictModal from '../CodeTableManage/ImportDictModal'
import CustomDrawer from '../CustomDrawer'
import DataEleDetails from '../DataEleManage/Details'
import EditDataEleForm from '../DataEleManage/EditDataEleForm'
import ImportDataEleModal from '../DataEleManage/ImportDataEleModal'
import SelDataByTypeModal from '../SelDataByTypeModal'
import { StdTreeDataOpt } from '../StandardDirTree/const'
import styles from './styles.module.less'

interface IStandardMaintenance {
    // fileItem: IFileItem
    // type: OperateType
    visible: boolean
    fileId?: string
    selectedDir: IDirItem
    // setOprDirItem: (newItem: IDirItem) => void
    getTreeList: (query?: IDirQueryType, optType?: StdTreeDataOpt) => void
    onClose?: (operate: Operate) => void
    update?: (newSelectedDir?: IDirItem) => void
}

const StandardMaintenance: React.FC<IStandardMaintenance> = ({
    // fileItem,
    visible,
    // type = OperateType.CREATE,
    fileId,
    selectedDir,
    getTreeList,
    onClose = (operate: Operate) => {},
    update = (newSelectedDir?: IDirItem) => {},
}) => {
    const [loading, setLoading] = useState(true)
    // 选择数据对话框的类型（取值：码表/编码规则/标准文件）
    const [selDataType, setSelDataType] = useState<CatalogType>(
        CatalogType.DATAELE,
    )

    // 选择数据对话框数据选择类型-单选/多选
    const [rowSelectionType, setRowSelectionType] =
        useState<RowSelectionType>('checkbox')

    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])

    const ruleRef: any = useRef(null)
    // 选择数据对话框ref
    const selDataRef = useRef({
        reloadData: () => {},
    })

    // 文件关联信息
    const [associateInfo, setAssociateInfo] = useState<IFileAssociateInfo>({
        relation_de_list: [],
        relation_dict_list: [],
        relation_rule_list: [],
    })

    // 提交状态
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 查看多个数据元/码表/编码规则详情id
    const [detailIds, setDetailIds] = useState<Array<any> | undefined>([])
    // 仅查看单个数据元/码表/编码规则详情id
    const [detailId, setDetailId] = useState<string | undefined>('')

    // 编辑选择数据对话框（用于码表/编码规则/标准文件的选择对话框）
    const [selDataByTypeVisible, setSelDataByTypeVisible] = useState(false)
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)
    // 编码规则详情
    const [codeRuleDetailVisible, setCodeRuleDetailVisible] =
        useState<boolean>(false)

    // 编辑数据元
    const [editDataEleVisible, setEditDataEleVisible] = useState<boolean>(false)
    // 编辑码表
    const [editDictVisible, setEditDictVisible] = useState<boolean>(false)
    // 编辑编码规则
    const [editCodeRuleVisible, setEditCodeRuleVisible] =
        useState<boolean>(false)

    // 数据元详情
    const [importDataEleVisible, setImportDataEleVisible] =
        useState<boolean>(false)
    // 码表详情
    const [importDictVisible, setImportDictVisible] = useState<boolean>(false)

    // 保存文件请求Detail
    const [originDetail, setOriginDetail] = useState({})

    const onSelDataTypeClose = () => {
        setSelDataByTypeVisible(false)
    }

    // 对话框面包屑
    const [crumbMenu, setCrumbMenu] = useState<any>()

    useEffect(() => {
        if (fileId) {
            getFileAssociateInfoData(fileId)
        }
    }, [visible])

    useEffect(() => {
        let selData: any

        if (selDataByTypeVisible) {
            // 设置数据元/码表/编码规则选中项
            switch (selDataType) {
                case CatalogType.DATAELE:
                    selData = associateInfo.relation_de_list
                    break
                case CatalogType.CODETABLE:
                    selData = associateInfo.relation_dict_list
                    break
                case CatalogType.CODINGRULES:
                    selData = associateInfo.relation_rule_list

                    break

                default:
                    break
            }

            if (selData && selData.length) {
                setSelDataItems(selData)
            } else {
                setSelDataItems([])
            }
        }
    }, [selDataByTypeVisible])

    const getFileAssociateInfoData = async (fId: string) => {
        try {
            setLoading(true)
            const res = await getFileAssociateInfo(fId)
            const { relation_de_list, relation_dict_list, relation_rule_list } =
                res.data
            const newAssociateInfo = {
                relation_de_list:
                    relation_de_list?.map((item: any) => {
                        return {
                            label: item.name_cn,
                            value: item.name_cn,
                            key: item.id,
                        }
                    }) || [],
                relation_dict_list:
                    relation_dict_list?.map((item: any) => {
                        return {
                            label: item.ch_name,
                            value: item.ch_name,
                            key: item.id,
                        }
                    }) || [],
                relation_rule_list:
                    relation_rule_list?.map((item: any) => {
                        return {
                            label: item.name,
                            value: item.name,
                            key: item.id,
                        }
                    }) || [],
            }
            setAssociateInfo(newAssociateInfo)
            setOriginDetail(newAssociateInfo)
        } catch (error: any) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useUpdateEffect(() => {
        if (editDataEleVisible) {
            setCrumbMenu([
                { label: __('标准文件'), key: FileModalType.FileList },
                { label: __('标准维护'), key: FileModalType.FileList },
                { label: __('新建码表'), key: FileModalType.FileList },
            ])
        } else if (editDictVisible) {
            setCrumbMenu([
                { label: __('标准文件'), key: FileModalType.FileList },
                { label: __('标准维护'), key: FileModalType.FileList },
                { label: __('新建码表'), key: FileModalType.FileList },
            ])
        } else if (editCodeRuleVisible) {
            setCrumbMenu([
                { label: __('标准文件'), key: FileModalType.FileList },
                { label: __('标准维护'), key: FileModalType.FileList },
                { label: __('新建编码规则'), key: FileModalType.FileList },
            ])
        }
    }, [editDataEleVisible, editDictVisible, editCodeRuleVisible])

    /**
     * 展示详情页面（如数据元/编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id
     */
    const handleShowDataDetail = (dataType: CatalogType, dataId?: string) => {
        let myDetailIds: any[] = []
        switch (dataType) {
            case CatalogType.DATAELE:
                myDetailIds = associateInfo?.relation_de_list
                setDataEleDetailVisible(true)
                break
            case CatalogType.CODETABLE:
                // 码表详情
                myDetailIds = associateInfo?.relation_dict_list
                setCodeTbDetailVisible(true)
                break
            case CatalogType.CODINGRULES:
                // 编码规则详情
                myDetailIds = associateInfo?.relation_rule_list
                setCodeRuleDetailVisible(true)
                break
            default:
                break
        }

        if (dataId) {
            // 选择对话框中选择列表中编码规则查看详情
            setDetailId(dataId)
            setDetailIds(undefined)
        } else {
            // 查看多个详情
            setDetailId(myDetailIds?.[0]?.key)
            setDetailIds(myDetailIds)
        }
    }

    const handleOperateCancel = (
        catlgType: CatalogType,
        oprType: OperateType,
        operate?: Operate,
    ) => {
        if (catlgType === CatalogType.DATAELE) {
            if (oprType === OperateType.CREATE) {
                // 编辑数据元
                if (operate === Operate.OK) {
                    setEditDataEleVisible(false)
                } else {
                    // 新建或编辑
                    ReturnConfirmModal({
                        onCancel: () => {
                            setEditDataEleVisible(false)
                        },
                    })
                    // confirm({
                    //     title: '确认要离开当前页面吗？',
                    //     icon: <ExclamationCircleFilled />,
                    //     content: '现在离开页面，将不会保存已填写内容。',
                    //     width: 424,
                    //     className: 'modal-center commConfirm',
                    //     style: { height: '192px' },
                    //     onOk() {
                    //         setEditVisible(false)
                    //     },
                    // })
                }
            } else if (oprType === OperateType.IMPORT) {
                setImportDataEleVisible(false)
            }
        } else if (catlgType === CatalogType.CODETABLE) {
            if (oprType === OperateType.CREATE) {
                // 编辑码表
                if (operate === Operate.OK) {
                    setEditDictVisible(false)
                } else {
                    // 新建或编辑
                    ReturnConfirmModal({
                        onCancel: () => {
                            setEditDictVisible(false)
                        },
                    })
                    // confirm({
                    //     title: '确认要离开当前页面吗？',
                    //     icon: <ExclamationCircleFilled />,
                    //     content: '现在离开页面，将不会保存已填写内容。',
                    //     className: 'modal-center commConfirm',
                    //     onOk() {
                    //         setEditVisible(false)
                    //     },
                    // })
                }
            } else if (oprType === OperateType.IMPORT) {
                setImportDictVisible(false)
            }
        } else if (catlgType === CatalogType.CODINGRULES) {
            if (oprType === OperateType.CREATE) {
                setEditCodeRuleVisible(false)
            }
        } else if (catlgType === CatalogType.FILE) {
            if (oprType === OperateType.FILEMAINTENANCE) {
                onClose(Operate.CANCEL)
            }
        }

        // if (oprType === OperateType.FILEMAINTENANCE) {
        //     setEditDataEleVisible(false)
        //     setEditDictVisible(false)
        //     setEditCodeRuleVisible(false)
        // }
    }

    const handleOK = async () => {
        try {
            setIsSubmitting(true)
            const res = await updFileAssociateInfo(fileId!, {
                relation_de_list: associateInfo.relation_de_list?.map(
                    (item) => item.key,
                ),
                relation_dict_list: associateInfo.relation_dict_list?.map(
                    (item) => item.key,
                ),
                relation_rule_list: associateInfo.relation_rule_list?.map(
                    (item) => item.key,
                ),
            })
            onClose(Operate.OK)
        } catch (error) {
            formatError(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        switch (selDataType) {
            case CatalogType.DATAELE:
                setAssociateInfo({
                    ...associateInfo,
                    relation_de_list: selDataItems || [],
                })
                break
            case CatalogType.CODETABLE:
                setAssociateInfo({
                    ...associateInfo,
                    relation_dict_list: selDataItems || [],
                })
                break
            case CatalogType.CODINGRULES:
                setAssociateInfo({
                    ...associateInfo,
                    relation_rule_list: selDataItems || [],
                })
                break
            default:
                break
        }
    }, [selDataItems])

    return (
        <div className={styles.stdMaintenanceWrapper}>
            <CustomDrawer
                open={visible}
                onClose={() => {
                    // 内容不变
                    if (lodash.isEqual(originDetail, associateInfo)) {
                        onClose(Operate.OK)
                    } else {
                        onClose(Operate.CANCEL)
                    }
                }}
                handleOk={handleOK}
                // headerWidth={`calc(100% - ${(size?.width || 1700) - 700}px)`}
                loading={isSubmitting}
                headerWidth="100%"
                rootClassName={styles.stdMaintenanceModal}
                title={__('标准维护')}
                isShowFooter
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
                customBodyStyle={{
                    height: 'auto',
                    flex: 1,
                }}
                customHeaderStyle={{
                    padding: '0 24px',
                }}
                customTitleStyle={{
                    height: 20,
                    width: 'auto',
                    maxWidth: 1146,
                    margin: '16px auto 24px',
                }}
            >
                {loading ? (
                    <Loader />
                ) : (
                    <div className={styles.associateWrapper}>
                        <div className={styles.associateItem}>
                            <div className={styles.associateItemTop}>
                                <div className={styles.associateTitle}>
                                    {__('关联数据元')}
                                </div>
                                <div className={styles.asscociateOprWrapper}>
                                    <Button
                                        type="link"
                                        size="small"
                                        className={styles.oprBtn}
                                        onClick={() =>
                                            setEditDataEleVisible(true)
                                        }
                                    >
                                        {__('新建')}
                                    </Button>
                                    <Button
                                        type="link"
                                        size="small"
                                        className={styles.oprBtn}
                                        onClick={() =>
                                            setImportDataEleVisible(true)
                                        }
                                    >
                                        {__('导入')}
                                    </Button>
                                    {associateInfo.relation_de_list?.length >
                                        0 && (
                                        <Button
                                            type="link"
                                            size="small"
                                            className={styles.oprBtn}
                                            onClick={() =>
                                                handleShowDataDetail(
                                                    CatalogType.DATAELE,
                                                )
                                            }
                                        >
                                            {__('详情')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <Select
                                ref={ruleRef}
                                labelInValue
                                mode="tags"
                                className={styles.associateInfoSelect}
                                placeholder={__('请选择关联数据元')}
                                value={associateInfo.relation_de_list}
                                onChange={(value: any) =>
                                    setAssociateInfo({
                                        ...associateInfo,
                                        relation_de_list: value,
                                    })
                                }
                                style={{ width: '100%' }}
                                // options={options}
                                open={false}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelDataType(CatalogType.DATAELE)
                                    if (!codeRuleDetailVisible) {
                                        setSelDataByTypeVisible(true)
                                    }
                                    ruleRef?.current?.blur()
                                }}
                            />
                        </div>
                        <div className={styles.associateItem}>
                            <div className={styles.associateItemTop}>
                                <div className={styles.associateTitle}>
                                    {__('关联码表')}
                                </div>
                                <div className={styles.asscociateOprWrapper}>
                                    <Button
                                        type="link"
                                        size="small"
                                        className={styles.oprBtn}
                                        onClick={() => setEditDictVisible(true)}
                                    >
                                        {__('新建')}
                                    </Button>
                                    <Button
                                        type="link"
                                        size="small"
                                        className={styles.oprBtn}
                                        onClick={() =>
                                            setImportDictVisible(true)
                                        }
                                    >
                                        {__('导入')}
                                    </Button>
                                    {associateInfo.relation_dict_list?.length >
                                        0 && (
                                        <Button
                                            type="link"
                                            size="small"
                                            className={styles.oprBtn}
                                            onClick={() =>
                                                handleShowDataDetail(
                                                    CatalogType.CODETABLE,
                                                )
                                            }
                                        >
                                            {__('详情')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <Select
                                ref={ruleRef}
                                labelInValue
                                mode="tags"
                                // size="small"
                                className={styles.associateInfoSelect}
                                listHeight={80}
                                placeholder={__('请选择关联码表')}
                                // defaultValue={['a10', 'c12']}
                                value={associateInfo.relation_dict_list}
                                onChange={(value: any) =>
                                    setAssociateInfo({
                                        ...associateInfo,
                                        relation_dict_list: value,
                                    })
                                }
                                style={{ width: '100%' }}
                                open={false}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelDataType(CatalogType.CODETABLE)
                                    if (!codeRuleDetailVisible) {
                                        setSelDataByTypeVisible(true)
                                    }
                                    ruleRef?.current?.blur()
                                }}
                            />
                        </div>
                        <div className={styles.associateItem}>
                            <div className={styles.associateItemTop}>
                                <div className={styles.associateTitle}>
                                    {__('关联编码规则')}
                                </div>
                                <div className={styles.asscociateOprWrapper}>
                                    <Button
                                        type="link"
                                        size="small"
                                        className={styles.oprBtn}
                                        onClick={() =>
                                            setEditCodeRuleVisible(true)
                                        }
                                    >
                                        {__('新建')}
                                    </Button>
                                    {associateInfo.relation_rule_list?.length >
                                        0 && (
                                        <Button
                                            type="link"
                                            size="small"
                                            className={styles.oprBtn}
                                            onClick={() =>
                                                handleShowDataDetail(
                                                    CatalogType.CODINGRULES,
                                                )
                                            }
                                        >
                                            {__('详情')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <Select
                                ref={ruleRef}
                                labelInValue
                                mode="tags"
                                // size="small"
                                className={styles.associateInfoSelect}
                                listHeight={80}
                                placeholder={__('请选择关联编码规则')}
                                // defaultValue={['a10', 'c12']}
                                value={associateInfo.relation_rule_list}
                                onChange={(value: any) =>
                                    setAssociateInfo({
                                        ...associateInfo,
                                        relation_rule_list: value,
                                    })
                                }
                                style={{ width: '100%' }}
                                // options={options}
                                open={false}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelDataType(CatalogType.CODINGRULES)
                                    if (!codeRuleDetailVisible) {
                                        setSelDataByTypeVisible(true)
                                    }
                                    ruleRef?.current?.blur()
                                }}
                            />
                        </div>
                    </div>
                )}
            </CustomDrawer>

            {/* 选择码表/编码规则 */}
            {selDataByTypeVisible && (
                <SelDataByTypeModal
                    visible={selDataByTypeVisible}
                    ref={selDataRef}
                    onClose={onSelDataTypeClose}
                    onOk={(oprItems: any) => {
                        switch (selDataType) {
                            case CatalogType.DATAELE:
                                setAssociateInfo({
                                    ...associateInfo,
                                    relation_de_list: oprItems,
                                })
                                break
                            case CatalogType.CODETABLE:
                                setAssociateInfo({
                                    ...associateInfo,
                                    relation_dict_list: oprItems,
                                })
                                break
                            case CatalogType.CODINGRULES:
                                setAssociateInfo({
                                    ...associateInfo,
                                    relation_rule_list: oprItems,
                                })
                                break
                            default:
                                break
                        }
                    }}
                    dataType={selDataType}
                    rowSelectionType={rowSelectionType}
                    oprItems={selDataItems}
                    setOprItems={setSelDataItems}
                    handleShowDataDetail={handleShowDataDetail}
                />
            )}

            {/* 新建数据元 */}
            {editDataEleVisible && (
                <EditDataEleForm
                    type={OperateType.CREATE}
                    visible={editDataEleVisible}
                    dataEleId={undefined}
                    selectedDir={undefined}
                    getTreeList={getTreeList}
                    showContinueBtn
                    onClose={(operate: Operate) =>
                        handleOperateCancel(
                            CatalogType.DATAELE,
                            OperateType.CREATE,
                            operate,
                        )
                    }
                    update={(
                        newSelectedDir?: IDirItem,
                        newDataEle?: IDataElement,
                    ) => {
                        const { relation_de_list = [] } = associateInfo

                        const newData = {
                            label: newDataEle?.name_cn || '',
                            value: newDataEle?.name_cn || '',
                            key: newDataEle?.id || '',
                        }

                        setAssociateInfo({
                            ...associateInfo,
                            relation_de_list: [...relation_de_list, newData],
                        })
                    }}
                />
            )}

            {/* 新建码表 */}
            {editDictVisible && (
                <EditDictForm
                    type={OperateType.CREATE}
                    visible={editDictVisible}
                    dictId={undefined}
                    selectedDir={undefined}
                    getTreeList={getTreeList}
                    onClose={(operate: Operate) =>
                        handleOperateCancel(
                            CatalogType.CODETABLE,
                            OperateType.CREATE,
                            operate,
                        )
                    }
                    update={(
                        newSelectedDir?: IDirItem,
                        newDict?: IDictItem,
                    ) => {
                        const { relation_dict_list = [] } = associateInfo

                        const newData = {
                            label: newDict?.ch_name || '',
                            value: newDict?.ch_name || '',
                            key: newDict?.id || '',
                        }

                        setAssociateInfo({
                            ...associateInfo,
                            relation_dict_list: [
                                ...relation_dict_list,
                                newData,
                            ],
                        })
                    }}
                />
            )}

            {/* 新建编码规则 */}
            {editCodeRuleVisible && (
                <EditCodeRule
                    visible={editCodeRuleVisible}
                    operateType={OperateType.CREATE}
                    onClose={() =>
                        handleOperateCancel(
                            CatalogType.CODINGRULES,
                            OperateType.CREATE,
                        )
                    }
                    updateCodeRuleList={(newCodeRule: any) => {
                        const { relation_rule_list = [] } = associateInfo

                        const newData = {
                            label: newCodeRule?.name || '',
                            value: newCodeRule?.name || '',
                            key: newCodeRule?.id || '',
                        }

                        setAssociateInfo({
                            ...associateInfo,
                            relation_rule_list: [
                                ...relation_rule_list,
                                newData,
                            ],
                        })
                    }}
                />
            )}

            {/* 导入数据元 */}
            {importDataEleVisible && (
                <ImportDataEleModal
                    visible={importDataEleVisible}
                    selectedDir={undefined}
                    update={(
                        newSelectedDir?: IDirItem,
                        newDEList?: Array<IDataElement>,
                    ) => {
                        const { relation_de_list = [] } = associateInfo

                        const newData =
                            newDEList?.map((item: any) => {
                                return {
                                    label: item.name,
                                    value: item.name,
                                    key: item.id,
                                }
                            }) || []

                        setAssociateInfo({
                            ...associateInfo,
                            relation_de_list: [...relation_de_list, ...newData],
                        })
                    }}
                    onClose={() =>
                        handleOperateCancel(
                            CatalogType.DATAELE,
                            OperateType.IMPORT,
                        )
                    }
                />
            )}

            {/* 导入码表 */}
            {importDictVisible && (
                <ImportDictModal
                    visible={importDictVisible}
                    selectedDir={undefined}
                    update={(
                        newSelectedDir?: IDirItem,
                        newDictList?: Array<IDictItem>,
                    ) => {
                        const { relation_dict_list = [] } = associateInfo

                        const newData =
                            newDictList?.map((item: any) => {
                                return {
                                    label: item.ch_name,
                                    value: item.ch_name,
                                    key: item.id,
                                }
                            }) || []

                        setAssociateInfo({
                            ...associateInfo,
                            relation_dict_list: [
                                ...relation_dict_list,
                                ...newData,
                            ],
                        })
                    }}
                    onClose={() =>
                        handleOperateCancel(
                            CatalogType.CODETABLE,
                            OperateType.IMPORT,
                        )
                    }
                />
            )}
            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!detailId && (
                <DataEleDetails
                    visible={dataEleDetailVisible}
                    dataEleId={detailId}
                    mulDetailIds={detailIds}
                    onClose={() => setDataEleDetailVisible(false)}
                />
            )}
            {/* 查看码表详情 */}
            {codeTbDetailVisible && !!detailId && (
                <CodeTableDetails
                    visible={codeTbDetailVisible && !!detailId}
                    title={__('码表详情')}
                    dictId={detailId}
                    mulDetailIds={detailIds}
                    onClose={() => setCodeTbDetailVisible(false)}
                />
            )}
            {/* 查看编码规则详情，支持多选框查看详情 */}
            {codeRuleDetailVisible && !!detailId && (
                <CodeRuleDetails
                    visible={codeRuleDetailVisible && !!detailId}
                    id={detailId}
                    mulDetailIds={detailIds}
                    onClose={() => {
                        setCodeRuleDetailVisible(false)
                    }}
                />
            )}
        </div>
    )
}

export default StandardMaintenance
