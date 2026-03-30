import {
    CheckCircleFilled,
    ClockCircleFilled,
    CloseOutlined,
    ExclamationCircleFilled,
    InfoCircleFilled,
    InfoCircleOutlined,
    QuestionCircleOutlined,
    TagFilled,
} from '@ant-design/icons'
import { Collapse, message, Space, TabsProps, Tooltip } from 'antd'

import classNames from 'classnames'
import moment from 'moment'
import { CSSProperties } from 'react'
import Icons from '@/components/DatasheetView/Icons'
import { dataTypeMapping, formatError, LogicViewType } from '@/core'
import { databaseTypesEleData } from '@/core/dataSource'
import {
    BinaryTypeOutlined,
    DatasheetViewColored,
    FontIcon,
    NoChangeColored,
    UnkownTypeOutlined,
} from '@/icons'
import { IconType as FontIconType } from '@/icons/const'
import { IformItem, SearchType as ST } from '@/ui/LightweightSearch/const'
import { excelTechnicalNameReg, getActualUrl } from '@/utils'
import { confirm, info } from '@/utils/modalHelper'
import {
    contentList,
    DefaultDataTypeChinese,
    getDefaultDataType,
    IconType,
    onLineStatus,
    RescCatlgType,
    scanList,
    stateList,
    stateTagList,
    stateType,
} from './const'
import __ from './locale'
import styles from './styles.module.less'

const { Panel } = Collapse

// 目录分类tab
export const rescCatlgItems: TabsProps['items'] = [
    {
        key: RescCatlgType.ORGSTRUC,
        label: __('组织架构'),
    },
    {
        key: RescCatlgType.RESC_CLASSIFY,
        label: __('资源分类'),
    },
]

/**
 * @params CLKTOEXPAND 点击展开节点
 * @params SEARCH 搜索
 * @params OTHER 其他情況-如首次进入目录
 */
export enum CatlgOperateType {
    CLKTOEXPAND = 'click_to_expand',
    SEARCH = 'search',
    OTHER = 'other',
}

export const scanTitle = () => {
    return (
        <>
            {__('扫描结果')}
            <Tooltip
                autoAdjustOverflow={false}
                color="white"
                placement="bottom"
                overlayClassName="datasheetViewScanTitleTipsWrapper"
                title={
                    <div className="roleTipsWrapper">
                        <div className="roleName">{__('扫描结果')}</div>
                        <div className="definition">
                            {__(
                                '扫描结果为最近一次扫描和之前一次扫描的数据对比结果，重新扫描后才会更新状态',
                            )}
                        </div>
                        <div className="line" />
                        <div className="scopeWrapper">
                            <div className="label">{__('状态说明：')}</div>
                            <div className="scopeItems">
                                {scanList.map((item) => (
                                    <div className="item" key={item.value}>
                                        <div className="tipIcon">
                                            {getScanState(item.value)}
                                        </div>
                                        <div className="tipText">
                                            <div>{item.desc}</div>
                                            {item.subDesc && (
                                                <div className="tipTextSub">
                                                    {item.subDesc}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                }
            >
                <InfoCircleOutlined className={styles.titleTipIcon} />
            </Tooltip>
        </>
    )
}

export const getScanState = (key: string) => {
    const { label, bgColor, tag } =
        scanList.find((item) => item.value === key) || {}
    return (
        <span className={styles.contentWrapper}>
            <span
                style={{
                    color: '#fff',
                    background: bgColor,
                    borderRadius: '50%',
                    marginRight: '8px',
                    padding: tag ? '0 2px' : 0,
                    fontSize: '12px',
                }}
            >
                {tag || <NoChangeColored style={{ fontSize: '16px' }} />}
            </span>
            {label}
        </span>
    )
}

export const getContentState = (key: string) => {
    const {
        label,
        color,
        bgColor = '#d8d8d8',
    } = contentList.find((item) => item.value === key) || {}
    return (
        <span
            style={{
                padding: '2px 6px',
                borderRadius: '24px',
                marginLeft: '4px',
                color,
                background: bgColor,
            }}
        >
            {label}
        </span>
    )
}

export const getState = (
    key: string,
    data?: any[],
    dotStyle?: CSSProperties,
) => {
    const list = data || stateList
    const { label, bgColor = '#d8d8d8' } =
        list.find((item) => item.value === key) || {}
    return label ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
                style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    marginRight: '8px',
                    borderRadius: '50%',
                    background: bgColor,
                    ...dotStyle,
                }}
            />
            {label}
        </div>
    ) : (
        '--'
    )
}

export const getStateTag = (key: string) => {
    const {
        label,
        color,
        isCircle,
        bgColor = '#d8d8d8',
    } = stateTagList.find((item) => item.key === key) || {}
    return (
        <span
            style={{
                padding: isCircle ? '0 2px' : '2px 4px',
                borderRadius: isCircle ? '50%' : '2px',
                color,
                background: bgColor,
                fontSize: '12px',
            }}
        >
            {label}
        </span>
    )
}

export const validateRepeatName = (data: any[], obj: any) => {
    const arry = data.filter((item) => item.id !== obj.id)
    const names = arry.map((item) => item.business_name)
    return names.includes(obj.business_name)
}

/**
 * 技术名称重复校验
 * @param data
 * @param obj
 * @returns
 */
export const validateTechnicalRepeatName = (data: any[], obj: any) => {
    const arry = data.filter((item) => item.id !== obj.id)
    const names = arry.map((item) => item.technical_name)
    return names.includes(obj.technical_name)
}

export const dataSourceTypeData = [
    {
        title: 'PostgreSQL',
        type: IconType.POSTGRESQL,
        id: IconType.POSTGRESQL,
        icon: <Icons type={IconType.POSTGRESQL} />,
    },
    {
        title: 'SQL Server',
        type: IconType.SQLSERVER,
        id: IconType.SQLSERVER,
        icon: <Icons type={IconType.SQLSERVER} />,
    },
    {
        title: 'MySQL',
        type: IconType.MYSQL,
        id: IconType.MYSQL,
        icon: <Icons type={IconType.MYSQL} />,
    },
    {
        title: 'MariaDB',
        type: IconType.MARIADB,
        id: IconType.MARIADB,
        icon: <Icons type={IconType.MARIADB} />,
    },
    {
        title: 'Oracle',
        type: IconType.ORACLE,
        id: IconType.ORACLE,
        icon: <Icons type={IconType.ORACLE} />,
    },
    {
        title: 'Apache Hive(hadoop2)',
        type: IconType.HIVE,
        id: IconType.HIVE,
        icon: <Icons type={IconType.HIVE} />,
    },
    {
        title: 'Apache Hive',
        type: IconType.HIVEJDBC,
        id: IconType.HIVEJDBC,
        icon: <Icons type={IconType.HIVE} />,
    },
    {
        title: 'ClickHouse',
        type: IconType.CLICKHOUSE,
        id: IconType.CLICKHOUSE,
        icon: <Icons type={IconType.CLICKHOUSE} />,
    },
    {
        title: __('未知数据源'),
        type: IconType.NULL,
        id: IconType.UNKNOWN,
        icon: <Icons type={IconType.UNKNOWN} />,
    },
]

export const getDataSourceTypeData = async () => {
    try {
        // 更新实例数据
        await databaseTypesEleData.handleUpdateDataBaseTypes()

        return databaseTypesEleData.dataTypes?.map((item: any) => {
            const { Colored } =
                databaseTypesEleData.dataBaseIcons[item.olkConnectorName]
            return {
                title: item.showConnectorName,
                type: item.olkConnectorName,
                id: item.olkConnectorName,
                icon: <Colored />,
            }
        })
    } catch (ex) {
        formatError(ex)
        return dataSourceTypeData
    }
}

export const showMessage = (
    total: number,
    errorList: any[],
    revokeAuditList: any[],
    using: number,
) => {
    const emptyList =
        errorList.filter(
            (item) => item.code === 'DataView.FormView.DatasourceEmpty',
        ) || []
    const errList =
        errorList.filter(
            (item) =>
                item.code !== 'DataView.FormView.DatasourceEmpty' &&
                item.code !== 'ERR_CANCELED',
        ) || []
    const cancelList =
        errorList.filter((item) => item.code === 'ERR_CANCELED') || []

    if (errList?.length > 0) {
        showErrorViewMessage(errList, total, emptyList)
        return
    }

    if (errorList.length === 0 && revokeAuditList.length > 0) {
        if (using === 2) {
            showAutoRevokeMessage(total, revokeAuditList)
        } else {
            showSuccessMessage(total)
        }
        return
    }

    info({
        title:
            emptyList?.length > 0 && errList.length === 0
                ? __('检测到以下数据源内无库表，将不予显示：')
                : __('以下数据源无法进行扫描：'),
        icon: <ExclamationCircleFilled style={{ color: '#1890FF' }} />,
        width: 480,
        content: (
            <div className={styles.messageOpenWrapper}>
                {errList?.length > 0 && (
                    <div className={styles.messageBox}>
                        {errList.map((item: any) => {
                            const { Colored } =
                                databaseTypesEleData.dataBaseIcons[
                                    item.type || 'maria'
                                ]
                            const text = `${item.name}（${__('原因：')}${
                                item.description
                            }。）`
                            return (
                                <div
                                    className={styles.messageItem}
                                    title={text}
                                >
                                    <Colored className={styles.icon} />
                                    {text}
                                </div>
                            )
                        })}
                    </div>
                )}
                {emptyList.length > 0 && (
                    <>
                        {errList.length > 0 && (
                            <div className={styles.messageOpenTitle}>
                                {__('检测到以下数据源内无库表，将不予显示：')}
                            </div>
                        )}
                        <div className={styles.messageBox}>
                            {emptyList.map((item) => {
                                const { Colored } =
                                    databaseTypesEleData.dataBaseIcons[
                                        item.type || 'maria'
                                    ]
                                return (
                                    <div
                                        className={styles.messageItem}
                                        title={item.name}
                                    >
                                        <Colored className={styles.icon} />
                                        {item.name}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        ),
        onOk() {
            if (total - errorList.length - cancelList.length > 0) {
                if (revokeAuditList.length > 0 && using === 2) {
                    showAutoRevokeMessage(total, revokeAuditList)
                } else {
                    showSuccessMessage(total - errorList.length)
                }
            }
        },
        okText: __('确定'),
    })
}

export const showSuccessMessage = (sum: number) => {
    if (sum === 0) return
    message.success({
        key: 'scanMessageKey',
        className: 'scanSucMessageBox',
        content: (
            <div
                style={{
                    display: 'flex',
                    textAlign: 'left',
                }}
            >
                <div>
                    <CheckCircleFilled style={{ fontSize: '20px' }} />
                </div>
                <div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px',
                        }}
                    >
                        <div style={{ fontSize: '16px', fontWeight: 550 }}>
                            {__('本次扫描了')}
                            {sum}
                            {__('个带结果的数据源')}
                        </div>
                        <CloseOutlined
                            onClick={() => message.destroy('scanMessageKey')}
                            style={{ color: '#000', cursor: 'pointer' }}
                        />
                    </div>
                    <div
                        style={{
                            color: 'rgba(0, 0, 0, 0.45)',
                            width: '380px',
                        }}
                    >
                        {__('可在当前列表的“扫描结果”中，查看变化情况。')}
                    </div>
                </div>
            </div>
        ),
        duration: 8,
    })
}

export const showAutoRevokeMessage = (total: number = 0, list: any[] = []) => {
    info({
        title: (
            <span>{`${__('本次扫描了')}${total}${__(
                '个带结果的数据源',
            )}`}</span>
        ),
        icon: <CheckCircleFilled style={{ fontSize: 20, color: '#52C41B' }} />,
        width: 480,
        content: (
            <div className={styles.messageOpenWrapper}>
                <div className={styles.desc}>
                    {__('可在当前列表的“扫描结果”中，查看变化情况。')}
                </div>
                <div className={styles.desc}>
                    {__(
                        '其中有部分库表由于源表有变化（源表更改或源表删除），已自动撤销审核：',
                    )}
                </div>
                {list?.length > 0 && (
                    <div className={styles.messageBox}>
                        {list.map((item, index) => {
                            const text = item?.name || item?.business_name
                            return (
                                <div
                                    className={classNames(
                                        styles.messageItem,
                                        styles.click,
                                    )}
                                    title={text}
                                    key={index}
                                    onClick={() => toDataViewDetails(item?.id)}
                                >
                                    <DatasheetViewColored
                                        className={styles.icon}
                                    />
                                    {text}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        ),
        onOk() {},
        okText: __('确定'),
    })
}

const errorListPanle = (dataViewErrorList: any[] = []) => {
    return (
        <div className={styles.messageBox}>
            <div className={styles.title}>
                {__('数据源内的部分数据表扫描失败')}
            </div>
            <Collapse
                defaultActiveKey={dataViewErrorList?.map((it, index) => index)}
                className={styles.collapseBox}
            >
                {dataViewErrorList?.map((item: any, index) => {
                    const {
                        name,
                        type,
                        error_view,
                        error_view_count,
                        scan_view_count,
                    } = item
                    const { Colored } =
                        databaseTypesEleData.dataBaseIcons[type || 'maria']
                    const heatderErrText = __(
                        '共${totle}张表，其中${count}张表扫描失败',
                        {
                            totle: scan_view_count || 0,
                            count: error_view_count || 0,
                        },
                    )
                    return (
                        <Panel
                            header={
                                <div className={styles.panelHeader}>
                                    <div className={styles.left}>
                                        <Colored className={styles.icon} />
                                        <span title={name}>{name}</span>
                                    </div>
                                    <div
                                        className={styles.right}
                                        title={heatderErrText}
                                        style={{
                                            color: '#e60012',
                                        }}
                                    >
                                        {heatderErrText}
                                    </div>
                                </div>
                            }
                            key={index}
                        >
                            {error_view?.map((it, ind) => {
                                const viewName = it?.technical_name
                                const errText = `${
                                    it?.error?.description || ''
                                }${it?.error?.solution || ''}`
                                return (
                                    <div
                                        className={styles.messageItem}
                                        key={ind}
                                    >
                                        <div
                                            className={styles.left}
                                            title={viewName}
                                        >
                                            <FontIcon
                                                name="icon-shujubiao"
                                                className={styles.icon}
                                                style={{ color: '#14CEAA' }}
                                            />
                                            {viewName}
                                        </div>
                                        <div
                                            className={styles.right}
                                            title={errText}
                                        >
                                            <InfoCircleOutlined
                                                className={styles.errIcon}
                                            />
                                            {errText}
                                        </div>
                                    </div>
                                )
                            })}
                        </Panel>
                    )
                })}
            </Collapse>
        </div>
    )
}

export const showErrorViewMessage = (
    list: any[] = [],
    total: number = 0,
    emptyList: any[] = [],
) => {
    const datasourceErrorList = [
        ...list.filter((item) => !item?.error_view),
        ...emptyList.map((item) => ({
            ...item,
            description: __('数据源内无库表。'),
        })),
    ]
    const dataViewErrorList = list?.filter((item) => !!item?.error_view?.length)
    info({
        title: __('以下对象扫描失败：'),
        icon: <InfoCircleFilled style={{ fontSize: 20, color: '126ee3' }} />,
        width: 720,
        content: (
            <div className={styles.errorListWrapper}>
                {datasourceErrorList?.length > 0 && (
                    <div
                        className={styles.messageBox}
                        style={
                            datasourceErrorList?.length &&
                            dataViewErrorList?.length
                                ? {
                                      marginBottom: '8px',
                                  }
                                : undefined
                        }
                    >
                        <div className={styles.title}>
                            {__('整个数据源扫描失败')}
                        </div>
                        <div className={styles.messageItemBox}>
                            {datasourceErrorList.map((item: any, index) => {
                                const name = item?.name || item?.business_name
                                const errText =
                                    (item.description || '') +
                                    (item.solution || '')
                                const { Colored } =
                                    databaseTypesEleData.dataBaseIcons[
                                        item.type || 'maria'
                                    ]
                                return (
                                    <div
                                        className={styles.messageItem}
                                        key={index}
                                    >
                                        <div
                                            className={styles.left}
                                            title={name}
                                        >
                                            <Colored className={styles.icon} />
                                            {name}
                                        </div>
                                        <div
                                            className={styles.right}
                                            title={errText}
                                        >
                                            <InfoCircleOutlined
                                                className={styles.errIcon}
                                            />
                                            {errText}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                {dataViewErrorList?.length > 0 &&
                    errorListPanle(dataViewErrorList)}
            </div>
        ),
        onOk() {
            if (total - (datasourceErrorList?.length || 0) > 0) {
                showSuccessMessage(total - datasourceErrorList.length)
            }
        },
        okText: __('确定'),
    })
}

export const toDataViewDetails = (id: string) => {
    const url = getActualUrl(
        `/datasheet-view/detail?datasourceTab=datasource&id=${id}&model=view`,
    )
    window.open(url, '_blank')
}

export const cancelScanVisible = (back: () => void) => {
    confirm({
        title: __('确定要终止扫描吗？'),
        icon: <ExclamationCircleFilled style={{ color: '#1890FF' }} />,
        width: 480,
        content: __(
            '终止扫描仅能终止未开始的任务，正在扫描的数据源无法终止，确定要执行此操作吗？',
        ),
        onOk() {
            back()
        },
        okText: __('确定'),
    })
}

export const getFieldTypeIcon = (
    item,
    fontSize?: number,
    customStyles = {},
) => {
    // eslint-disable-next-line
    fontSize = fontSize ? fontSize - 4 : fontSize
    switch (true) {
        case dataTypeMapping.char.includes(item.type):
            return (
                <FontIcon
                    style={{ fontSize, ...customStyles }}
                    name="icon-wenbenxing"
                />
            )
        case dataTypeMapping.int.includes(item.type):
            return (
                <FontIcon
                    style={{ fontSize, ...customStyles }}
                    name="icon-zhengshuxing"
                />
            )
        case dataTypeMapping.float.includes(item.type):
            return (
                <FontIcon
                    style={{ fontSize, ...customStyles }}
                    name="icon-xiaoshuxing"
                />
            )
        case dataTypeMapping.decimal.includes(item.type):
            return (
                <FontIcon
                    style={{ fontSize, ...customStyles }}
                    name="icon-gaojingduxing"
                />
            )
        case dataTypeMapping.datetime.includes(item.type):
            return (
                <FontIcon
                    name="icon-riqishijianxing"
                    style={{ fontSize, ...customStyles }}
                />
            )
        case dataTypeMapping.date.includes(item.type):
            return (
                <FontIcon
                    name="icon-riqixing"
                    style={{ fontSize, ...customStyles }}
                />
            )
        case dataTypeMapping.time.includes(item.type):
            return (
                <FontIcon
                    name="icon-shijianchuoxing"
                    style={{ fontSize, ...customStyles }}
                />
            )
        case dataTypeMapping.interval.includes(item.type):
            return (
                <FontIcon
                    name="icon-shijianduan11"
                    style={{ fontSize, ...customStyles }}
                />
            )
        case dataTypeMapping.bool.includes(item.type):
            return (
                <FontIcon
                    style={{ fontSize, ...customStyles }}
                    name="icon-buerxing"
                />
            )
        case dataTypeMapping.binary.includes(item.type):
            return (
                <BinaryTypeOutlined
                    style={{ fontSize: fontSize || 18, ...customStyles }}
                />
            )
        default:
            return (
                <UnkownTypeOutlined
                    style={{ fontSize: fontSize || 18, ...customStyles }}
                />
            )
    }
}

export const formatDataType = (originType: string) => {
    // 去除类型中的括号
    const index = originType?.indexOf('(') || originType?.indexOf('（')
    const type = index !== -1 ? originType?.substring(0, index) : originType
    return type
}

export const getExploreContent = (
    record: any,
    logicType: LogicViewType,
    isGradeOpen?: boolean,
) => {
    const exploredList = [
        {
            key: 'explored_data',
            icon: (
                <FontIcon
                    type={FontIconType.COLOREDICON}
                    name="icon-shenjizhongxin1-mianxian"
                />
            ),
            tips: record.explored_data
                ? __('已做数据质量探查')
                : __('未做数据质量探查'),
        },
        {
            key: 'explored_timestamp',
            icon: <ClockCircleFilled />,
            tips: record.explored_timestamp
                ? __('已做业务更新时间探查')
                : __('未做业务更新时间探查'),
        },
        {
            key: 'explored_classification',
            icon: <TagFilled />,
            tips: record.explored_classification
                ? __('已做数据分类${text}探查', {
                      text: isGradeOpen ? __('分级') : '',
                  })
                : __('未做数据分类${text}探查', {
                      text: isGradeOpen ? __('分级') : '',
                  }),
        },
    ]
    const list =
        logicType === LogicViewType.LogicEntity
            ? exploredList.filter(
                  (item) => item.key !== 'explored_classification',
              )
            : exploredList
    return (
        <Space size={8} className={styles.exploreContentBox}>
            {list.map((item) => {
                return (
                    <Tooltip
                        key={item.key}
                        placement="bottom"
                        color="#fff"
                        overlayInnerStyle={{
                            color: 'rgba(0,0,0,0.85)',
                        }}
                        title={item.tips}
                    >
                        <span
                            className={classNames(
                                styles.icon,
                                record[item.key] && styles.active,
                            )}
                        >
                            {item.icon}
                        </span>
                    </Tooltip>
                )
            })}
        </Space>
    )
}

export const fieldSearchList = [
    { value: '', dot: false, label: __('全部字段') },
    {
        value: '1',
        dot: false,
        label: (
            <span>
                <span style={{ marginRight: '5px' }}>
                    {getStateTag(stateType.new)}
                </span>
                {__('新增字段')}
            </span>
        ),
    },
    {
        value: '3',
        dot: false,
        label: (
            <span>
                <span style={{ marginRight: '5px' }}>
                    {getStateTag(stateType.modify)}
                </span>
                {__('更改字段')}
            </span>
        ),
    },
    {
        value: '2',
        dot: false,
        label: (
            <span>
                <span style={{ marginRight: '5px' }}>
                    <Icons type={IconType.ERROR} />
                </span>
                {__('异常字段')}
            </span>
        ),
    },
    {
        value: '4',
        dot: false,
        label: (
            <>
                <span style={{ marginRight: '5px' }}>
                    <FontIcon
                        type={FontIconType.FONTICON}
                        name="icon-zhuanhuanjiantou"
                        style={{ color: '#1890FF' }}
                    />
                </span>
                {__('转换类型的字段')}
                <Tooltip
                    title={
                        <div>
                            {__('转换类型：若字段有')}
                            <FontIcon
                                type={FontIconType.FONTICON}
                                name="icon-zhuanhuanjiantou"
                                style={{ color: '#1890FF', padding: '0 2px' }}
                            />
                            {__(
                                '标记，表示编辑当前字段信息时，手动更改了数据类型',
                            )}
                        </div>
                    }
                    placement="right"
                    color="#fff"
                    overlayInnerStyle={{
                        color: 'rgba(0,0,0,0.85)',
                        width: 383,
                    }}
                >
                    <QuestionCircleOutlined
                        className={styles['type-transform-tips']}
                    />
                </Tooltip>
            </>
        ),
    },
]

/** 搜索筛选项 */
export const SearchFilter: IformItem[] = [
    {
        label: __('所属数据源'),
        key: 'catalog_name',
        type: ST.Radio,
        options: [],
    },
]

export const timeStrToTimestamp = (searchObj: any) => {
    const obj: any = {}
    const timeFields = [
        'created_at_start',
        'created_at_end',
        'updated_at_start',
        'updated_at_end',
    ]
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in searchObj) {
        if (Object.prototype.hasOwnProperty.call(searchObj, key)) {
            obj[key] = searchObj[key]
                ? timeFields.includes(key)
                    ? moment(searchObj[key]).valueOf()
                    : searchObj[key]
                : undefined
        }
    }
    // 上线状态：下线需要单独增加自动下线状态
    if (
        searchObj?.online_status_list?.includes(onLineStatus.Offline) &&
        !searchObj?.online_status_list?.includes(onLineStatus.OfflineAuto)
    ) {
        obj.online_status_list = `${searchObj?.online_status_list},${onLineStatus.OfflineAuto}`
    }
    return obj
}

export const auditTipsModal = (text: string) => {
    info({
        title: `${__('您的')}${text}${__('申请已提交给审核员')}`,
        icon: (
            <CheckCircleFilled style={{ color: '#52C41B', fontSize: '24px' }} />
        ),
        content: (
            <div>
                <div>
                    {__('可前往')}
                    <span
                        style={{ color: '#126ee3', cursor: 'pointer' }}
                        onClick={() => toAuditClient()}
                    >
                        {__('【我的申请】')}
                    </span>
                    {__('查看审核进度。')}
                </div>
                {/* <div
                    style={{
                        color: 'rgb(0 0 0 / 45%)',
                        marginTop: 18,
                    }}
                >
                    {__(
                        '审核通过前：对于从未发布过的库表，查看的内容仍是草稿内容；对于已发布过的，查看的内容仍是上次发布的内容。',
                    )}
                </div> */}
            </div>
        ),
        okText: __('确定'),
    })
}

export const toAuditClient = () => {
    const url = getActualUrl('/personal-center/doc-audit-client/?target=apply')
    window.open(url, '_blank')
}

export const dataViewDetailsTitleStatus = (
    published: boolean,
    hasDraft: boolean,
    callBack: () => void,
) => {
    return (
        <span className={styles.detailsTitleStatus}>
            {hasDraft && (
                <Tooltip
                    placement="bottom"
                    title={
                        published
                            ? __('通过变更库表来查看和发布内容')
                            : __('通过编辑库表来发布内容')
                    }
                >
                    <span className={styles.draft}>{__('有草稿')}</span>
                </Tooltip>
            )}
            <span>{__('【未完成发布，当前展示最新草稿内容】')}</span>
        </span>
    )
}

export const ErrorTips = ({ title }: { title: string }) => {
    return (
        <Tooltip
            title={title}
            placement="right"
            color="#fff"
            overlayClassName="datasheetViewTreeTipsBox"
            overlayInnerStyle={{
                color: '#000',
            }}
        >
            <Icons type={IconType.ERROR} />
        </Tooltip>
    )
}

export const ExcelDataTypes = [
    'bigint',
    'double',
    'timestamp',
    'boolean',
    'varchar',
]

export const ExcelDataTypeOptions = ExcelDataTypes.map((item) => ({
    value: item,
    label: (
        <>
            <div className={styles['data-type-item']}>
                <span>{item}</span>
                <div className={styles['data-type-item-right']}>
                    <span className={styles['data-type-text']}>
                        {DefaultDataTypeChinese[getDefaultDataType(item)]}
                    </span>
                </div>
            </div>
            <div style={{ height: 4, background: 'white' }} />
        </>
    ),
}))

/**
 * 更新字段状态
 * @param fields 字段列表
 * @returns 字段列表
 */
export const updateExcelFieldsStatus = (fields: Array<any>): Array<any> => {
    return fields?.map((item) => {
        if (validateRepeatName(fields, item)) {
            return {
                ...item,
                tips: __('此名称和其他字段的业务名称重复，请修改'),
            }
        }
        if (!excelTechnicalNameReg.test(item.technical_name)) {
            return {
                ...item,
                tips: __('技术名称不能使用\\ /:*?"<>|，且不能使用大写字母'),
            }
        }
        if (validateTechnicalRepeatName(fields, item)) {
            return {
                ...item,
                tips: __('此名称和其他字段的技术名称重复，请修改'),
            }
        }
        return {
            ...item,
            tips: '',
        }
    })
}
