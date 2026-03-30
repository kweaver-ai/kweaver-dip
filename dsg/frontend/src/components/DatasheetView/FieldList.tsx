import { Badge, Table, Tooltip } from 'antd'
import React, { useEffect, useMemo, useState, CSSProperties } from 'react'
import classnames from 'classnames'
import {
    ClockCircleFilled,
    InfoCircleFilled,
    InfoCircleOutlined,
} from '@ant-design/icons'
import {
    IEditFormData,
    stateType,
    ClassifyType,
    getDefaultDataType,
    DefaultDataType,
    classifiedOptoins,
    sensitiveOptions,
} from './const'
import __ from './locale'
import styles from './styles.module.less'
import { EllipsisMiddle, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import {
    HasAccess,
    IGradeLabel,
    LogicViewType,
    getCommonDataType,
} from '@/core'
import CodeTableDetails from '../CodeTableManage/Details'
import DataEleDetails from '../DataEleManage/Details'
import { FontIcon } from '@/icons'
import DataClassifyFilters from './DataClassifyFilters'
import DelFieldsModal from './DelFieldsModal'
import { useDataViewContext } from './DataViewProvider'
import { AutoCompletionIcon } from './AutoCompletion/AutoCompletionIcon'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { getPopupContainer, isSemanticGovernanceApp } from '@/utils'
import { shareTypeList, openTypeList } from '../ResourcesDir/const'

interface IFieldList {
    fieldList: IEditFormData[]
    currentData: any
    isMarket?: boolean
    hideEditBtn?: boolean
    operationWid?: number
    isNoMargin?: boolean
    isStart?: boolean
    tagData?: IGradeLabel[]
    style?: CSSProperties | undefined
    tableScroll?: {
        x?: number | true | string
        y?: number | string
    }
    getContainer?: any
    showDelFieldTips?: boolean
    hiddenFilters?: boolean
    showCompletion?: boolean
    // 点击补全
    onClickCompletion?: () => void
    taskIsCompleted?: boolean
}

const FieldList: React.FC<IFieldList> = ({
    fieldList,
    currentData,
    isMarket,
    hideEditBtn,
    operationWid = 0,
    isNoMargin = false,
    isStart,
    tagData,
    style,
    tableScroll,
    getContainer,
    showDelFieldTips,
    hiddenFilters,
    showCompletion = false,
    onClickCompletion,
    taskIsCompleted,
}) => {
    const [searchKey, setSearchKey] = useState<string>('')
    const [codeTableOpen, setCodeTableOpen] = useState<boolean>(false)
    const [codeId, setCodeId] = useState<string>('')
    const [dataList, setDataList] = useState<IEditFormData[]>()
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    const [detailId, setDetailId] = useState<string>('')
    const [classifyFilters, setClassifyFilters] = useState<{
        classfity_type: ClassifyType
        label_id: string[]
    }>()
    const [delfieldList, setDelFieldList] = useState<any[]>([])
    const [openDelFields, setOpenDelFields] = useState<boolean>(false)
    const { checkPermissions } = useUserPermCtx()
    const { completeStatus, optionType, logicViewType } = useDataViewContext()
    // semanticGovernance 专用
    const isSemanticGovernance = isSemanticGovernanceApp()

    useEffect(() => {
        if (fieldList) {
            setDataList(fieldList)
            const delFields = fieldList?.filter(
                (item) => item.status === stateType.delete,
            )
            setDelFieldList(delFields)
        }
    }, [fieldList])

    const isTrueRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    const columns: any[] = [
        {
            title: __('字段业务名称'),
            dataIndex: 'business_name',
            key: 'business_name',
            ellipsis: true,
            width: 260,
            fixed: 'left',
            render: (text, record) => {
                return (
                    <div className={styles.fieldlistName}>
                        <div className={styles.name} title={text}>
                            {text}
                        </div>
                        {record?.business_timestamp && (
                            <div className={styles.isTimes}>
                                <Tooltip
                                    title={__('已设置为业务数据更新时间戳')}
                                >
                                    <ClockCircleFilled />
                                </Tooltip>
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('字段技术名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
            width: 260,
        },
        {
            title: __('关联数据标准'),
            dataIndex: 'standard',
            key: 'standard',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                const isCodeDel =
                    record.code_table_status &&
                    record.code_table_status !== 'enable'
                return (
                    <div className={styles.codeNameBox}>
                        <span
                            onClick={() => {
                                setDetailId(record.standard_code)
                                setDataEleDetailVisible(true)
                            }}
                            className={classnames(text && styles.codeName)}
                            title={text}
                        >
                            {text || '--'}
                        </span>
                    </div>
                )
            },
        },
        {
            title: __('关联码表'),
            dataIndex: 'code_table',
            key: 'code_table',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                const isCodeDel =
                    record.code_table_status &&
                    record.code_table_status !== 'enable'
                return (
                    <div className={styles.codeNameBox}>
                        <span
                            onClick={() => {
                                setCodeId(record.code_table_id)
                                setCodeTableOpen(true)
                            }}
                            className={classnames(
                                text && styles.codeName,
                                isCodeDel && styles.hasTag,
                            )}
                            title={text}
                        >
                            {text || '--'}
                        </span>
                        {isCodeDel && (
                            <span
                                className={classnames(
                                    styles.delTag,
                                    record.code_table_status === 'disable' &&
                                        styles.disable,
                                )}
                            >
                                {record.code_table_status === 'deleted'
                                    ? __('已删除')
                                    : __('已停用')}
                            </span>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            width: 100,
        },
        // {
        //     title: __('数据解析规则'),
        //     dataIndex: 'reset_convert_rules',
        //     key: 'reset_convert_rules',
        //     ellipsis: true,
        //     width: 180,
        //     render: (text) => text || '--',
        // },
        {
            title: __('原始数据类型'),
            dataIndex: 'original_data_type',
            key: 'original_data_type',
            ellipsis: true,
            width: 120,
        },
        {
            title: __('数据长度'),
            dataIndex: 'data_length',
            key: 'data_length',
            ellipsis: true,
            width: 100,
            render: (text, record) => {
                if (
                    ['decimal', 'char'].includes(
                        getCommonDataType(record.data_type),
                    )
                ) {
                    return record.reset_data_length || text
                }
                return '--'
            },
        },
        {
            title: __('数据精度'),
            dataIndex: 'data_accuracy',
            key: 'data_accuracy',
            ellipsis: true,
            width: 100,
            render: (text, record) =>
                getDefaultDataType(record.data_type) === DefaultDataType.DECIMAL
                    ? record.reset_data_accuracy || text
                    : '--',
        },
        {
            title: __('是否主键'),
            dataIndex: 'primary_key',
            key: 'primary_key',
            ellipsis: true,
            width: 100,
            render: (text) => (text ? __('是') : __('否')),
        },
        {
            title: (
                <div style={{ display: 'flex', alignItems: 'center ' }}>
                    {__('分类属性')}
                    <Tooltip
                        color="#fff"
                        overlayInnerStyle={{
                            whiteSpace: 'nowrap',
                            color: '#000',
                            width: 320,
                        }}
                        placement="bottom"
                        getPopupContainer={(n) => getPopupContainer() as any}
                        title={
                            <div
                                className={styles['attribute-title-container']}
                            >
                                <div className={styles['icon-instruction']}>
                                    {__('有')}
                                    <FontIcon
                                        name="icon-shuxing"
                                        className={styles.attrIcon}
                                    />
                                    {__('表示字段已分类')}
                                </div>
                                {isTrueRole && (
                                    <div className={styles['icon-instruction']}>
                                        {__('有')}
                                        <Badge
                                            dot
                                            color="#1890FF"
                                            offset={[-6, 16]}
                                        >
                                            <FontIcon
                                                name="icon-shuxing"
                                                className={styles.attrIcon}
                                            />
                                        </Badge>
                                        {__(
                                            '表示字段当前分类是根据探查结果进行的自动分类',
                                        )}
                                    </div>
                                )}
                            </div>
                        }
                    >
                        <InfoCircleOutlined className={styles.infoIcon} />
                    </Tooltip>
                </div>
            ),
            dataIndex: 'attribute_name',
            key: 'attribute_name',
            width: 276,
            ellipsis: true,
            render: (_, record) => (
                <div
                    title={record.attribute_path}
                    className={styles.attributeContainer}
                >
                    {record.attribute_name && (
                        <Badge
                            dot={
                                record.classfity_type === ClassifyType.Auto &&
                                isTrueRole
                            }
                            color="#1890FF"
                            offset={[-10, 16]}
                        >
                            <FontIcon
                                name="icon-shuxing"
                                className={styles.attrIcon}
                            />
                        </Badge>
                    )}
                    <div className={styles.attrInfo}>
                        <div className={styles.attrName}>
                            {record.attribute_name || '--'}
                        </div>
                        {record.attribute_path && (
                            <div className={styles.attrPath}>
                                <EllipsisMiddle>
                                    {record.attribute_path}
                                </EllipsisMiddle>
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: (
                <>
                    {__('数据分级标签')}
                    {/* {isTrueRole && (
                        <Tooltip
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                                fontSize: 12,
                            }}
                            placement="bottom"
                            title={__('来源“分类属性”')}
                        >
                            <InfoCircleOutlined className={styles.infoIcon} />
                        </Tooltip>
                    )} */}
                </>
            ),
            dataIndex: 'label_name',
            key: 'label_name',
            width: 230,
            ellipsis: true,
            render: (_, record) => (
                <>
                    {record.label_name && (
                        <FontIcon
                            name="icon-biaoqianicon"
                            className={styles.tagIcon}
                            style={{ color: record.label_icon }}
                        />
                    )}
                    <span
                        title={
                            record.label_name
                                ? `${__('数据分级标签：')}${record.label_name}`
                                : ''
                        }
                    >
                        {record.label_name || '--'}
                    </span>
                </>
            ),
        },
        {
            title: __('共享属性'),
            dataIndex: 'shared_type',
            key: 'shared_type',
            ellipsis: true,
            width: 100,
            render: (text) =>
                shareTypeList.find((o) => o.value === text)?.label || '--',
        },
        {
            title: __('开放属性'),
            dataIndex: 'open_type',
            key: 'open_type',
            ellipsis: true,
            width: 100,
            render: (text) =>
                openTypeList.find((o) => o.value === text)?.label || '--',
        },
        {
            title: __('敏感属性'),
            dataIndex: 'sensitive_type',
            key: 'sensitive_type',
            ellipsis: true,
            width: 100,
            render: (text) =>
                sensitiveOptions.find((o) => o.value === text)?.label || '--',
        },
        {
            title: __('涉密属性'),
            dataIndex: 'secret_type',
            key: 'secret_type',
            ellipsis: true,
            width: 100,
            render: (text) =>
                classifiedOptoins.find((o) => o.value === text)?.label || '--',
        },
    ]

    const searchField = () => {
        let data: any[] = searchKey
            ? fieldList.filter((item) => {
                  return (
                      item.business_name
                          .toLocaleLowerCase()
                          .includes(searchKey.toLocaleLowerCase()) ||
                      item.technical_name
                          .toLocaleLowerCase()
                          .includes(searchKey.toLocaleLowerCase())
                  )
              })
            : fieldList
        if (classifyFilters) {
            data = data.filter((item) => {
                if (classifyFilters.classfity_type === ClassifyType.NotLimit) {
                    if (classifyFilters.label_id.length > 0) {
                        return classifyFilters.label_id.includes(item.label_id)
                    }
                    return true
                }
                if (classifyFilters.classfity_type === ClassifyType.No) {
                    if (classifyFilters.label_id.length > 0) {
                        return (
                            classifyFilters.label_id.includes(item.label_id) &&
                            ![ClassifyType.Auto, ClassifyType.Manual].includes(
                                item.classfity_type,
                            )
                        )
                    }
                    return !item.classfity_type
                }

                if (classifyFilters.label_id.length === 0) {
                    return (
                        item.classfity_type === classifyFilters.classfity_type
                    )
                }

                return (
                    classifyFilters.label_id.includes(item.label_id) &&
                    item.classfity_type === classifyFilters.classfity_type
                )
            })
        }

        setDataList(data)
    }

    useEffect(() => {
        searchField()
    }, [searchKey, classifyFilters])

    return (
        <div
            className={classnames(
                isMarket && styles.isMarket,
                !isNoMargin
                    ? `${styles.fieldListWrapper}`
                    : `${styles.fieldListWrapper} ${styles.fieldListNoMarginWrapper}`,
            )}
        >
            <div className={styles.title}>
                <div className={styles.titleLeft}>
                    <div
                        title={currentData?.business_name}
                        className={styles.titleText}
                    >
                        {currentData?.business_name}
                    </div>
                    <div
                        title={currentData?.technical_name}
                        className={classnames(
                            styles.titleText,
                            styles.subTitleText,
                        )}
                    >
                        {currentData?.technical_name}
                    </div>
                </div>
                {!isMarket &&
                    currentData?.status === stateType.modify &&
                    currentData?.edit_status === 'draft' && (
                        <div
                            className={classnames(
                                styles.modifyTips,
                                styles.noMargin,
                            )}
                        >
                            <InfoCircleFilled className={styles.icon} />
                            {__(
                                '扫描发现源表更改，已自动生成草稿，通过${state}库表来查看和发布内容。',
                                {
                                    state: currentData.last_publish_time
                                        ? __('变更')
                                        : __('编辑'),
                                },
                            )}
                        </div>
                    )}
                <div
                    className={classnames(
                        styles.titleRight,
                        hideEditBtn && styles.noEditBtn,
                    )}
                    style={{ marginRight: operationWid }}
                >
                    <SearchInput
                        value={searchKey}
                        onKeyChange={(kw: string) => {
                            setSearchKey(kw)
                        }}
                        style={{ width: 272 }}
                        placeholder={__('搜索字段业务名称、技术名称')}
                    />
                    {isTrueRole && !hiddenFilters && (
                        <div className={styles.filters}>
                            <DataClassifyFilters
                                isStart={isStart}
                                tagData={tagData}
                                isButton
                                onChange={(p) => setClassifyFilters(p)}
                            />
                        </div>
                    )}
                    {delfieldList.length > 0 && showDelFieldTips && (
                        <div className={styles.delFiledTips}>
                            <InfoCircleFilled className={styles.titleIcon} />
                            <span>
                                {__('提示：有')}
                                {delfieldList.length}
                                {__('个标记删除的字段。')}
                            </span>
                            <span
                                onClick={() => setOpenDelFields(true)}
                                className={styles.deltext}
                            >
                                {__('查看删除字段')}
                            </span>
                        </div>
                    )}
                    {isSemanticGovernance &&
                        logicViewType === LogicViewType.DataSource &&
                        showCompletion &&
                        !taskIsCompleted && (
                            <AutoCompletionIcon
                                viewModal="list"
                                onClick={() => onClickCompletion?.()}
                            />
                        )}
                </div>
            </div>
            <div className={styles.list}>
                <Table
                    pagination={{
                        hideOnSinglePage: fieldList.length <= 10,
                        showQuickJumper: true,
                        responsive: true,
                        showLessItems: true,
                    }}
                    rowKey={(record, index) => index || 0}
                    dataSource={dataList}
                    columns={
                        isStart
                            ? columns
                            : columns.filter(
                                  (item) => item.key !== 'label_name',
                              )
                    }
                    className={styles['content-fourth-table']}
                    scroll={
                        tableScroll || {
                            y: 500,
                            x: 1300,
                        }
                    }
                    locale={{
                        emptyText: <Empty />,
                    }}
                />
            </div>
            {/* 查看码表详情 */}
            {codeTableOpen && !!codeId && (
                <CodeTableDetails
                    visible={codeTableOpen && !!codeId}
                    dictId={codeId}
                    onClose={() => {
                        setCodeTableOpen(false)
                        setCodeId('')
                    }}
                    getContainer={getContainer}
                    zIndex={1001}
                />
            )}
            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!detailId && (
                <DataEleDetails
                    visible={dataEleDetailVisible}
                    dataEleId={detailId}
                    onClose={() => setDataEleDetailVisible(false)}
                    dataEleMatchType={2}
                    getContainer={getContainer}
                    zIndex={1001}
                />
            )}
            {openDelFields && (
                <DelFieldsModal
                    fieldData={delfieldList}
                    onClose={() => setOpenDelFields(false)}
                    open={openDelFields}
                    sum={delfieldList.length}
                />
            )}
        </div>
    )
}

export default FieldList
