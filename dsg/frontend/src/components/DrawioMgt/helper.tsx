import {
    Dropdown,
    MenuProps,
    Popconfirm,
    Radio,
    TabsProps,
    Tooltip,
} from 'antd'
import React, {
    HTMLAttributes,
    ReactNode,
    useContext,
    useMemo,
    useState,
} from 'react'
import Icon, {
    CaretDownOutlined,
    CaretUpOutlined,
    DownOutlined,
    LinkOutlined,
    UpOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import __ from './locale'
import FlowchartIconOutlined from '@/icons/FlowchartIconOutlined'
import MoreVerticalOutlined from '@/icons/MoreVerticalOutlined'
import styles from './styles.module.less'
import {
    AddOutlined,
    RecycleBinOutlined,
    SubFlowchartOutlined,
    BusinessFormOutlined,
    IndicatorThinColored,
} from '@/icons'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import {
    flowformsCountQuery,
    flowSaveContent,
    formatError,
    TaskType,
    getDrawioUrl,
} from '@/core'
import { getActualUrl, OperateType as OT } from '@/utils'
import { Architecture } from '../BusinessArchitecture/const'

import { ReactComponent as L2Svg } from '@/icons/svg/outlined/L2.svg'
import { ReactComponent as FlowChartDeprtSvg } from '@/icons/svg/outlined/flowChartDeprt.svg'
import { NewFormType } from '../Forms/const'

/**
 * 流程图节点类型
 * @param NORMAL 普通节点
 * @param PROCESS 流程节点
 * @param TOTAL 整体信息
 * @param NONE 无
 */
enum CellInfosType {
    NORMAL = 'normal',
    PROCESS = 'process',
    TOTAL = 'total',
    NONE = 'none',
}

/**
 * 流程图相关操作
 * @param Pro_DELETE 流程删除
 * @param Pro_UNBIND 流程解绑
 * @param Pro_PREVIEW 流程查看
 * @param Pro_OPEN 流程新窗口
 * @param Pro_CREATE 流程创建
 * @param Pro_CITE 流程关联
 * @param Form_CREATE 表创建
 * @param Form_CITE 表关联
 * @param Form_IMPORT 表导入
 * @param Datasource_IMPORT 数据源导入
 * @param Form_DELETE 表删除
 * @param Form_EDIT 表编辑
 */
enum OperateType {
    Pro_DELETE = 'pro_delete',
    Pro_UNBIND = 'pro_unbind',
    Pro_PREVIEW = 'pro_preview',
    Pro_OPEN = 'pro_open',
    Pro_CREATE = 'pro_create',
    Pro_CITE = 'pro_cite',
    Pro_IMPORT = 'pro_import',
    Form_PREVIEW = 'form_preview',
    Form_CREATE = 'form_create',
    Form_CITE = 'form_cite',
    Form_IMPORT = 'form_import',
    Datasource_IMPORT = 'datasource_import',
    Form_DELETE = 'form_delete',
    Form_EDIT = 'form_edit',
    Model_CREATE = 'model_create',
    Model_LINK = 'model_link',
    Model_DELETE = 'model_delete',
}
const enum SelectedStatus {
    // 未选中
    UnChecked = 'unchecked',

    // 半选
    Indeterminate = 'indeterminate',

    // 选中
    Checked = 'checked',
}
/**
 * 子流程操作菜单项
 */
const processMenuItems: MenuProps['items'] = [
    {
        key: OperateType.Pro_CITE,
        label: (
            <div style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                {__('从已有流程中引用')}
            </div>
        ),
    },
    {
        key: OperateType.Pro_CREATE,
        label: (
            <div style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                {__('新建流程图')}
            </div>
        ),
    },
    {
        key: OperateType.Pro_IMPORT,
        label: (
            <div style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                {__('导入流程图')}
            </div>
        ),
    },
]

/**
 * 业务表操作菜单项
 */
const formMenuItems: MenuProps['items'] = [
    {
        key: OperateType.Form_CITE,
        label: <div className={styles.dm_Textleft}>{__('关联业务节点表')}</div>,
    },
    {
        key: OperateType.Form_CREATE,
        label: <div className={styles.dm_Textleft}>{__('新建业务节点表')}</div>,
    },
    {
        key: OperateType.Form_IMPORT,
        label: <div className={styles.dm_Textleft}>{__('导入业务节点表')}</div>,
    },
    // {
    //     key: OperateType.Datasource_IMPORT,
    //     label: <div className={styles.dm_Textleft}>{__('数据源导入')}</div>,
    // },
]

// 业务指标选项
const metricMenuItems: MenuProps['items'] = [
    // {
    //     key: OperateType.Model_CREATE,
    //     label: (
    //         <div className={styles.dm_Textleft}>{__('新建业务指标模型')}</div>
    //     ),
    // },
    {
        key: OperateType.Model_LINK,
        label: <div className={styles.dm_Textleft}>{__('关联业务指标')}</div>,
    },
]
const metricMenuItemsNoAccess: MenuProps['items'] = [
    {
        key: OperateType.Model_LINK,
        label: <div className={styles.dm_Textleft}>{__('关联业务指标')}</div>,
    },
]

interface IProcessItem extends HTMLAttributes<HTMLDivElement> {
    data: any
    more?: boolean
    del?: boolean
    onOperate?: (operate) => void
}
/**
 * 子流程item组件
 * @param data 展示数据
 * @param more 更多按钮显示/隐藏
 * @param del 删除按钮显示/隐藏
 * @param onOperate 相关操作
 */
const ProcessItem: React.FC<IProcessItem> = ({
    data,
    more = true,
    del = true,
    onOperate,
    ...porps
}) => {
    // 更多按钮的显示隐藏
    const [hidden, setHidden] = useState(true)

    // 菜单项显示/隐藏
    const [open, setOpen] = useState(false)

    // 更多按钮的背景色
    const [bg, setBg] = useState('rgba(0, 0, 0, 0)')

    // 菜单项
    const items: MenuProps['items'] = [
        {
            key: OperateType.Pro_UNBIND,
            label: <div className={styles.dm_textCenter}>{__('解绑')}</div>,
        },
        {
            key: OperateType.Pro_DELETE,
            label: (
                <Popconfirm
                    title={
                        <div style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                            {__('你确定要移除吗？')}
                        </div>
                    }
                    onConfirm={() => onOperate?.(OperateType.Pro_DELETE)}
                    zIndex={1200}
                    placement="topRight"
                >
                    <div className={styles.dm_textCenter}>{__('移除')}</div>
                </Popconfirm>
            ),
        },
    ]

    // 菜单项选中
    const handleMenuClick: MenuProps['onClick'] = (e) => {
        if (e.key !== OperateType.Pro_DELETE) {
            onOperate?.(e.key)
            setOpen(false)
        }
    }

    return (
        <div
            className={styles.processItemWrapper}
            aria-hidden
            onFocus={() => {}}
            onMouseOver={() => {
                setHidden(false)
            }}
            onMouseLeave={() => {
                setHidden(true)
            }}
            {...porps}
        >
            <div className={styles.pi_topWrapper}>
                {data?.flowchart_level === 1 ? (
                    <FlowchartIconOutlined
                        className={styles.pi_icon}
                        style={{
                            color: '#126ee3',
                            background: 'rgb(18 110 227 / 6%)',
                        }}
                    />
                ) : (
                    <SubFlowchartOutlined
                        className={styles.pi_icon}
                        style={{ background: 'rgb(18 110 227 / 6%)' }}
                    />
                )}
                <span
                    className={styles.pi_name}
                    title={data?.flowchart_name || '--'}
                    onClick={() => onOperate?.(OperateType.Pro_PREVIEW)}
                >
                    {data?.flowchart_name || '--'}
                </span>
                <div className={styles.pi_btnWrapper}>
                    <Tooltip title={__('查看流程所属业务模型')}>
                        <LinkOutlined
                            className={styles.pi_link}
                            onClick={() => onOperate?.(OperateType.Pro_OPEN)}
                            hidden={!data?.is_ref}
                        />
                    </Tooltip>
                    <Popconfirm
                        title={
                            <div style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                                {__('你确定要移除吗？')}
                            </div>
                        }
                        onConfirm={() => onOperate?.(OperateType.Pro_DELETE)}
                        placement="topRight"
                    >
                        <Tooltip title={__('移除')}>
                            <RecycleBinOutlined
                                hidden={!del}
                                className={styles.pi_link}
                                style={{ marginLeft: 8 }}
                            />
                        </Tooltip>
                    </Popconfirm>
                    {/* {more && (
                        <span
                            className={styles.pi_more}
                            style={{ backgroundColor: bg, marginLeft: 8 }}
                            hidden={hidden}
                            onFocus={() => {}}
                            onMouseOver={() => {
                                setBg('rgba(0, 0, 0, 0.04)')
                            }}
                            onMouseLeave={() => {
                                setHidden(true)
                                setBg('rgba(0, 0, 0, 0)')
                            }}
                        >
                            <Dropdown
                                menu={{
                                    items,
                                    onClick: handleMenuClick,
                                    onFocus: () => setBg('rgba(0, 0, 0, 0.04)'),
                                    onMouseOver: () =>
                                        setBg('rgba(0, 0, 0, 0.04)'),
                                }}
                                placement="bottomRight"
                                trigger={['click']}
                                overlayStyle={{ minWidth: 64 }}
                                onOpenChange={setOpen}
                                open={open}
                            >
                                <MoreVerticalOutlined />
                            </Dropdown>
                        </span>
                    )} */}
                </div>
            </div>
        </div>
    )
}

interface IBusFormItem extends HTMLAttributes<HTMLDivElement> {
    data: any
    more?: boolean
    small?: boolean
    onOperate: (operate) => void
    type?: string
}
/**
 * 业务表item组件
 * @param data 展示数据
 * @param more 更多按钮显示/隐藏
 * @param small 信息省略/全部
 * @param onOperate 相关操作
 */
const BusFormItem: React.FC<IBusFormItem> = ({
    data,
    more = true,
    small = true,
    onOperate,
    type, // 区分是指标或者还是业务表
    ...props
}) => {
    // 更多按钮的显示隐藏
    const [hidden, setHidden] = useState(true)

    // 菜单项显示/隐藏
    const [open, setOpen] = useState(false)

    // 更多按钮的背景色
    const [bg, setBg] = useState('rgba(0, 0, 0, 0)')

    // 菜单项
    const items: MenuProps['items'] = [
        {
            key: OperateType.Form_EDIT,
            label: <div className={styles.dm_textCenter}>{__('编辑')}</div>,
        },
        {
            key: OperateType.Form_DELETE,
            label: (
                <Popconfirm
                    title={
                        <div style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                            {__('你确定要移除吗？')}
                        </div>
                    }
                    onConfirm={() => {
                        onOperate(OperateType.Form_DELETE)
                        setOpen(false)
                    }}
                    onCancel={() => {
                        setOpen(false)
                    }}
                    zIndex={1200}
                    placement="topRight"
                >
                    <div className={styles.dm_textCenter}>{__('移除')}</div>
                </Popconfirm>
            ),
        },
    ]

    // 菜单项选中
    const handleMenuClick: MenuProps['onClick'] = (e) => {
        if (e.key !== OperateType.Form_DELETE) {
            onOperate(e.key)
            setOpen(false)
        }
    }

    return (
        <div
            className={styles.processItemWrapper}
            aria-hidden
            onFocus={() => {}}
            onMouseOver={() => {
                setHidden(false)
            }}
            onMouseLeave={() => {
                setHidden(true)
            }}
            {...props}
        >
            <div className={styles.pi_topWrapper}>
                {type === 'metric' ? (
                    <IndicatorThinColored
                        className={styles.pi_icon}
                        style={{
                            fontSize: 16,
                            color: '#3E75FF',
                            background: 'none',
                        }}
                    />
                ) : (
                    <BusinessFormOutlined
                        className={styles.pi_icon}
                        style={{
                            fontSize: 16,
                            color: '#3E75FF',
                            background: 'none',
                        }}
                    />
                )}

                <span
                    className={
                        type !== 'metric'
                            ? classnames(
                                  styles.pi_name,
                                  more && styles.pi_name_more,
                              )
                            : styles.metric_name
                    }
                    title={data.name}
                    onClick={() =>
                        type !== 'metric' && onOperate(OperateType.Form_PREVIEW)
                    }
                >
                    {data.name}
                </span>
                <span className={styles.pi_formTipsIcon}>
                    {!data?.is_completed &&
                        data?.form_type === NewFormType.DSIMPORT && (
                            <Tooltip title={__('业务节点表属性不完整')}>
                                <ExclamationCircleOutlined
                                    className={styles.formTipsIcon}
                                />
                            </Tooltip>
                        )}
                </span>
                <div className={styles.pi_btnWrapper}>
                    {more && (
                        <Dropdown
                            menu={{
                                items,
                                onClick: handleMenuClick,
                                onFocus: () => setBg('rgba(0, 0, 0, 0.04)'),
                                onMouseOver: () => setBg('rgba(0, 0, 0, 0.04)'),
                            }}
                            placement="bottomRight"
                            trigger={['hover']}
                            overlayStyle={{ minWidth: 64 }}
                            onOpenChange={setOpen}
                            open={open}
                            getPopupContainer={(n) =>
                                n.parentElement?.parentElement || n
                            }
                        >
                            <span
                                className={styles.pi_more}
                                style={{ backgroundColor: bg }}
                                hidden={hidden}
                                onFocus={() => {}}
                                onMouseOver={() => {
                                    setBg('rgba(0, 0, 0, 0.04)')
                                }}
                                onMouseLeave={() => {
                                    setHidden(true)
                                    setBg('rgba(0, 0, 0, 0)')
                                }}
                            >
                                <MoreVerticalOutlined />
                            </span>
                        </Dropdown>
                    )}
                </div>
            </div>
            {type !== 'metric' && (
                <div
                    className={styles.pi_bottomWrapper}
                    hidden={small}
                    title={data?.node_name}
                >
                    {__('节点')}
                    {data?.node_name || '--'}
                </div>
            )}
        </div>
    )
}

interface ISubTitle extends HTMLAttributes<HTMLDivElement> {
    text: ReactNode | string
    menu?: boolean
    menuDisabledText?: string
    menuItems: MenuProps['items']
    menuMinWi?: number
    onOperate: (operate) => void
}
/**
 * 子标题组件
 * @param text 标题
 * @param menu 菜单按钮显示/隐藏
 * @param menuItems 下拉菜单项
 * @param onOperate 菜单项相关操作
 */
const SubTitle: React.FC<ISubTitle> = ({
    text,
    menu = true,
    menuDisabledText,
    menuItems,
    menuMinWi = 136,
    onOperate,
    ...props
}) => {
    // 下拉菜单显示/隐藏
    const [dropDownShow, setDropDownShow] = useState(false)
    // 流程图相关信息
    const { drawioInfo } = useContext(DrawioInfoContext)

    useMemo(() => {
        if (drawioInfo?.cellInfos) {
            setDropDownShow(false)
        }
    }, [drawioInfo?.cellInfos?.id])

    return (
        <div
            id="SubTitle"
            className={styles.subTitleWrapper}
            {...props}
            onBlur={() => {
                setDropDownShow(false)
            }}
        >
            {text}
            {menu && (
                <Dropdown
                    menu={{
                        items: menuItems,
                        onClick: (menuInfo) => {
                            setDropDownShow(false)
                            onOperate(menuInfo.key)
                        },
                    }}
                    trigger={['click']}
                    placement="bottomRight"
                    overlayStyle={{ minWidth: menuMinWi }}
                    open={dropDownShow}
                    onOpenChange={(bo) => {
                        setDropDownShow(bo)
                    }}
                    getPopupContainer={(node) =>
                        node.parentElement as HTMLElement
                    }
                    disabled={!!menuDisabledText}
                >
                    <Tooltip title={menuDisabledText} placement="topRight">
                        <span
                            className={styles.st_iconWrapper}
                            style={{
                                color: menuDisabledText
                                    ? 'rgba(0, 0, 0, 0.25)'
                                    : undefined,
                                cursor: menuDisabledText
                                    ? 'not-allowed'
                                    : 'pointer',
                            }}
                        >
                            <AddOutlined
                                className={styles.st_iconArrow}
                                style={{ fontSize: 12 }}
                            />
                            {/* {dropDownShow ? (
                                <DownOutlined className={styles.st_iconArrow} />
                            ) : (
                                <UpOutlined className={styles.st_iconArrow} />
                            )} */}
                        </span>
                    </Tooltip>
                </Dropdown>
            )}
        </div>
    )
}

interface IBasicTitle extends HTMLAttributes<HTMLDivElement> {
    text: ReactNode | string
    icon?: boolean
}
/**
 * 基本标题展示收起组件
 * @param text 标题
 * @param icon 收起展示按钮显示/隐藏
 */
const BasicTitle: React.FC<IBasicTitle> = ({
    text,
    icon = true,
    children,
    ...props
}) => {
    // 信息是否展示
    const [show, setShow] = useState(true)

    return (
        <div className={styles.basicTitleWrapper} {...props}>
            <div className={styles.bt_titleWrapper}>
                {text}
                {icon &&
                    (show ? (
                        <UpOutlined
                            className={styles.bt_titleIcon}
                            onClick={() => setShow(!show)}
                        />
                    ) : (
                        <DownOutlined
                            className={styles.bt_titleIcon}
                            onClick={() => setShow(!show)}
                        />
                    ))}
            </div>
            {show && children}
            <div className={styles.bt_line} hidden={show} />
        </div>
    )
}

interface IListEmpty extends HTMLAttributes<HTMLDivElement> {
    text: ReactNode | string
    add?: boolean
}
/**
 * 列表空组件
 * @param text 标题
 * @param add 是否可添加
 */
const ListEmpty: React.FC<IListEmpty> = ({ text, add = true, ...props }) => {
    return (
        <div className={styles.listEmptyWrapper} {...props}>
            <div>{text}</div>
            {add && <div>{__('可点击【+】按钮进行关联')}</div>}
        </div>
    )
}

interface IFormLabel extends HTMLAttributes<HTMLDivElement> {
    text: string
    item?: any
}
/**
 * 业务表名称组件
 * @param text 名称
 */
const FormLabel: React.FC<IFormLabel> = ({ text, item, ...props }) => {
    return (
        <div className={styles.formLabelWrapper} {...props}>
            <BusinessFormOutlined
                className={styles.fl_icon}
                style={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.64)' }}
            />
            <span className={styles.fl_name} title={text} onClick={() => {}}>
                {text}
            </span>
            {!item?.is_completed &&
                item?.form_type === NewFormType.DSIMPORT && (
                    <Tooltip title={__('业务节点表属性不完整')}>
                        <ExclamationCircleOutlined
                            className={styles.formTipsIcon}
                        />
                    </Tooltip>
                )}
        </div>
    )
}

interface IFlowChooseItem extends HTMLAttributes<HTMLDivElement> {
    data: any
    icon?: ReactNode
    small?: boolean
    recommeded?: boolean
    selDisabled?: boolean
    disabledId?: string
    checked: boolean
    showExpIcon?: boolean
    onChecked: () => void
    onExpand?: () => void
}
/**
 * 子流程选择Item组件
 * @param data 展示数据
 * @param small 信息省略/全部
 * @param recommeded 推荐标志显示/隐藏
 * @param checked 是否选中
 * @param onChecked 选中操作
 */
const FlowChooseItem: React.FC<IFlowChooseItem> = ({
    data,
    small = true,
    recommeded = false,
    icon = <FlowchartIconOutlined className={styles.fci_icon} />,
    // disabledId,
    checked,
    onChecked,
    selDisabled = false,
    showExpIcon = false,
    onExpand = () => {},
    ...props
}) => {
    const { department_name, subject_domain_name } = data
    return (
        <div
            className={styles.flowChooseItemWrapper}
            onClick={() => !selDisabled && onChecked()}
            {...props}
        >
            <div className={styles.fci_leftWrapper}>
                <div className={styles.fci_topWrapper}>
                    {icon}
                    <span
                        className={styles.fci_name}
                        title={data?.name || data?.flowchart_name}
                    >
                        {data?.name || data?.flowchart_name}
                    </span>
                    <div className={styles.fci_tagWrapper} hidden={!recommeded}>
                        <span className={styles.fci_tag}>{__('智能推荐')}</span>
                    </div>
                    {showExpIcon && (
                        <div className={styles.fci_expand} onClick={onExpand}>
                            <SubFlowchartOutlined className={styles.fci_icon} />
                            {data.isExpand ? (
                                <CaretDownOutlined
                                    className={styles.fci_downIcon}
                                />
                            ) : (
                                <CaretUpOutlined
                                    className={styles.fci_downIcon}
                                />
                            )}
                        </div>
                    )}
                    <Radio
                        disabled={selDisabled}
                        className={styles.fci_radio}
                        checked={checked}
                        value={data?.flowchart_id || data?.id}
                    />
                </div>
                <div className={styles.fci_bottomWrapper} hidden={small}>
                    <div className={styles.fci_item}>
                        {getIcon(Architecture.DEPARTMENT)}
                        <span
                            className={styles.fci_deprtName}
                            title={department_name || '--'}
                        >
                            {department_name || '--'}
                        </span>
                    </div>
                    <div className={styles.fci_item}>
                        {getIcon(2)}
                        <span
                            className={styles.fci_domainName}
                            title={subject_domain_name || '--'}
                        >
                            {subject_domain_name || '--'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// del-子流程测试
export const testSubFlow = {
    entries: [
        {
            main_business_id: '252a6de5-d1be-49f1-882a-c82023770afb111',
            business_model_id: 'db2ce43c-461b-4ea3-8a78-56fd836029b111',
            flowchart_id: '152fd6b8-6b3c-435a-aec1-1c649103eab0',
            flowchart_name: '11-五步工作流程',
            flowchart_level: 2,
        },
        {
            main_business_id: '252a6de5-d1be-49f1-882a-c82023770afb222',
            business_model_id: 'db2ce43c-461b-4ea3-8a78-56fd836029b222',
            flowchart_id: '3e6a2c9d-0715-492d-b1c8-5ffe77efd29b222',
            flowchart_name: '12-五步工作流程',
            flowchart_level: 2,
        },
    ],
    total_count: 2,
}

export const getIcon = (type: string | number) => {
    switch (type) {
        case 2:
            return <Icon component={L2Svg} />
        case Architecture.DEPARTMENT:
            return <Icon component={FlowChartDeprtSvg} />
        default:
            return undefined
    }
}

/**
 * 保存流程图请求
 * @param mid 业务模型id
 * @param fid 流程图id
 * @param saved 保存变为更新
 * @param data drawio文件信息
 * @returns true-成功, false-失败
 */
const saveFlowRequest = async (
    mid,
    fid,
    taskId?,
    data?,
    df?,
    saved = 'false',
): Promise<boolean> => {
    const { content, isModified } = data
    // 判断文件是否修改
    if (!saved && !isModified) {
        return Promise.resolve(true)
    }
    if (!mid || !fid) {
        return Promise.resolve(false)
    }
    try {
        // 修改即保存
        const blob = new Blob([content])
        const formData = new FormData()
        formData.append('file', blob)
        // formData.append('nodes', allCells)
        if (taskId) {
            formData.append('task_id', taskId)
        }
        await flowSaveContent(mid, fid, formData, saved)
        window.postMessage(
            JSON.stringify({
                event: 'af_saveSuccess',
            }),
            '*',
        )
        return Promise.resolve(true)
    } catch (e) {
        formatError(e)
        window.postMessage(
            JSON.stringify({
                event: 'af_saveFailed',
            }),
            '*',
        )
        return Promise.resolve(false)
    } finally {
        // 通知drawio保存结束
        df?.iframe?.current?.contentWindow?.postMessage(
            JSON.stringify({
                event: 'dio_stopSpin',
            }),
            '*',
        )
    }
}

/**
 * 部分操作前保存，获取drawio内容
 * @param df drawio信息
 * @param flag 操作标识
 */
const operateAfterSave = (df, flag) => {
    window.postMessage(
        JSON.stringify({
            event: 'af_saveLoading',
        }),
        '*',
    )
    // drawio查询文件内容
    df?.iframe?.current?.contentWindow?.postMessage(
        JSON.stringify({
            event: 'dio_getFlowContent',
            flag,
        }),
        '*',
    )
}

/**
 * 打开新窗口查看引用的业务模型
 */
const openWindowPreviewFlow = (data) => {
    const { main_business_id, viewType } = data
    window.open(
        getActualUrl(
            `/coreBusiness/${main_business_id}?viewType=${
                viewType !== 'null' ? viewType : 'domain'
            }`,
        ),
    )
}

/**
 * 确定流程图的模式
 * @param vm 整体模式
 * @param is_ref 是否为引用
 * @returns
 */
const getViewmode = (vm, read_only) => {
    if (vm !== '1') {
        return read_only ? '1' : '0'
    }
    return vm
}

/**
 * 获取drawio的url
 * @param viewmode 整体模式
 * @param mid 模型id
 * @param fid 流程图id
 * @param title 标题
 * @returns
 */
const changeToDrawioUrl = (
    viewmode: string | null,
    read_only: boolean,
    mid?: string,
    fid?: string,
    title?: string,
    taskId?: string,
    userId?: string,
    isDraft?: boolean,
    versionId?: string,
) => {
    const mode = getViewmode(viewmode, read_only)
    // return `http://localhost:8005?viewmode=${mode}&mid=${mid}&fid=${fid}&title=${title}&dev=1&taskId=${taskId}&userId=${userId}`
    return `${
        window.location.origin
    }${`/anyfabric/drawio-app/?viewmode=${mode}&mid=${mid}&fid=${fid}&title=${title}&taskId=${taskId}&userId=${userId}${getDrawioUrl(
        { isDraft, selectedVersion: versionId },
    )}`}`
}

/**
 * @description 流程目录类型
 * @parma FLOWCHART 流程图
 * @parma FORM 表单
 * @parma SWIMLANE 泳道节点
 * @parma NORMAL 表单节点
 * @parma PROCESS 子流程节点
 */
enum FlowchartTreeNodeType {
    FLOWCHART = 'flowchart',
    FORM = 'form',
    NORMAL = 'normal',
    PROCESS = 'process',
    SWIMLANE = 'swimlane',
}

/**
 * 更新流程图关联的表单数量
 * @param df drawio相关信息
 * @param fid 流程id
 */
const updateFormCount = async ({
    df,
    fid,
    is_draft,
    version_id,
}: {
    df: any
    fid: string
    is_draft?: boolean
    version_id?: string
}) => {
    const res = await flowformsCountQuery(fid, {
        is_draft,
        version_id,
    })
    noticeDrawioChangeFormCount(df, res)
}

/**
 * 通知drawio更新表单数量
 * @param df drawio相关信息
 * @param data 表单数据[{forms_counts: number; node_id: string}]
 */
const noticeDrawioChangeFormCount = (df, data) => {
    df?.iframe?.current?.contentWindow?.postMessage(
        JSON.stringify({
            event: 'dio_changeFormsNumber',
            forms: data,
        }),
        '*',
    )
}

/**
 * 导入文件选择后通知drawio
 * @param info 导入的文件
 * @param ref
 * @param flag 标识 root-根流程图,other-其他
 */
const noticeDrawioImportFile = async (info, ref) => {
    if (info) {
        const fileName = info.name
        let result = await fileToString(info)
        if (
            /(\.v(dx|sdx?))($|\?)/i.test(fileName) ||
            /(\.vs(x|sx?))($|\?)/i.test(fileName)
        ) {
            result = await fileToBase64(info)
            ref?.current?.contentWindow?.postMessage(
                JSON.stringify({
                    event: 'dio_importLocalFile',
                    importFile: result,
                    fileName,
                }),
                '*',
            )
            return undefined
        }
        return result
        // window.postMessage(
        //     JSON.stringify({
        //         event: 'af_fileXmlContent',
        //         content: result,
        //     }),
        //     '*',
        // )
    }
    return undefined
}

/**
 * 文件转为base64
 * @param file
 * @returns
 */
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        /// FileReader类就是专门用来读文件的
        const reader = new FileReader()
        // 开始读文件
        // readAsDataURL: dataurl它的本质就是图片的二进制数据， 进行base64加密后形成的一个字符串，
        reader.readAsDataURL(file)
        // 成功和失败返回对应的信息，reader.result一个base64，可以直接使用
        reader.onload = () => resolve(reader.result)
        // 失败返回失败的信息
        reader.onerror = (error) => reject(error)
    })
}

/**
 * 文件转为string
 * @param file
 * @returns
 */
const fileToString = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsText(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = (error) => reject(error)
    })
}

/**
 * base64转位File
 * @param base64 数据
 * @param filename 文件名
 * @returns
 */
const base64ToFile = (base64, filename) => {
    const arr = base64.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const suffix = mime.split('/')[1] // 图片后缀
    const bstr = atob(arr[1])
    let n = bstr.length - 1
    const u8arr = new Uint8Array(n)
    while (n) {
        u8arr[n] = bstr.charCodeAt(n)
        n -= 1
    }
    return new File([u8arr], `${filename}`)
}

/**
 * 解析分页名称
 * @param info 文件的xml信息
 */
const analysisXmlSheet = (info: string) => {
    const infoArr: any[] = []
    const xmlDoc = new DOMParser().parseFromString(info, 'text/xml')
    const nodes = xmlDoc.getElementsByTagName('diagram')
    for (let i = 0; i < nodes.length; i += 1) {
        infoArr.push({
            name: nodes[i].getAttribute('name') || '',
            id: nodes[i].getAttribute('id') || '',
        })
    }
    return infoArr
}

/**
 * 流程图信息
 * @param mid 所属业务模型id
 * @param fid 流程图id
 * @param title 流程图名称
 * @param isRoot 是否为根流程图
 * @param is_ref 是否为引用
 * @param innerVm 当前流程图的模式 '1'-查看,'0'-编辑
 * @param read_only 是否只读
 * @param mbsid 所属业务模型id
 * @param path 路径
 * @param 当前viewKey 当前viewKey
 */
interface IFlowchartInfo extends Object {
    mid: string
    fid: string
    title: string
    isRoot: boolean
    is_ref: boolean
    read_only: boolean
    mbsid: string
    path: string
    absolutePath: string
    viewKey?: string
}

export default class FlowchartInfoManager {
    infos: IFlowchartInfo[]

    root?: IFlowchartInfo

    current?: IFlowchartInfo

    constructor(data: IFlowchartInfo[], cur?: IFlowchartInfo) {
        this.infos = data
        this.root = data?.[0]
        this.current = cur
    }

    find(key: string) {
        return this.infos.find((info) => info?.path === key)
    }

    deleteData(key: string) {
        this.infos = this.infos.filter((info) => info?.path !== key)
    }

    deleteDatas(key: string) {
        this.infos
            .filter((info) => info.path.startsWith(`${key}/`))
            .forEach((info) => this.deleteData(info.path))
    }

    addData(item: IFlowchartInfo) {
        if (this.find(item.path)) {
            this.deleteData(item.path)
        }
        this.infos.push(item)
    }

    updateData(key: string, updateInfo: any) {
        const updateItem = this.find(key)
        if (updateItem) {
            const changeInfo = { ...updateItem, ...updateInfo }
            if (this.root?.path === key) {
                this.root = { ...this.root, ...updateInfo }
                this.deleteData(key)
                this.infos.splice(0, 0, changeInfo)
            } else {
                this.addData(changeInfo)
            }
        }
        if (this.current?.path === key) {
            this.current = { ...this.current, ...updateInfo }
        }
    }

    clearData() {
        this.infos = []
    }

    onCurrentData(key: string) {
        this.current = this.find(key)
    }
}

// (任务)相关场景操作集
const totalOperates = [OT.CREATE, OT.EDIT]
const products = [
    { operate: totalOperates, task: 'none' },
    { operate: totalOperates, task: TaskType.MODEL },
]

/**
 * @param PROCESSNAV  流程导航
 * @param FLOWPATH   只看流程
 * @param BUSINSTABLE    只看业务表
 * @param INDICATOR    只看指标
 */
enum ViewType {
    PROCESSNAV = 1,
    FLOWPATH = 2,
}

// // 视角
// export const viewOptionList = [
//     {
//         label: __('流程导航'),
//         value: ViewType.PROCESSNAV,
//     },
//     {
//         label: __('仅显示流程'),
//         value: ViewType.FLOWPATH,
//     },
// ]

/**
 * 流程tab类型
 * @param ALL   全部
 * @param CUR_DEPARTMENT    本部门
 * @param CUR_MAINBUSINS  本业务模型
 */
enum FlowPathType {
    ALL = 'businessAssets',
    CUR_DEPARTMENT = 'dataCatlg',
    CUR_MAINBUSINS = 'technologicalAssets',
}

const FlowPathTypeList = {
    [FlowPathType.ALL]: 1,
    [FlowPathType.CUR_DEPARTMENT]: 2,
    [FlowPathType.CUR_MAINBUSINS]: 3,
}

// 流程tab
const getFlowTabItems = (): TabsProps['items'] => {
    return [
        {
            key: FlowPathType.ALL,
            label: __('全部'),
        },
        {
            key: FlowPathType.CUR_DEPARTMENT,
            label: __('本部门'),
        },
        // {
        //     key: FlowPathType.CUR_MAINBUSINS,
        //     label: __('本业务模型'),
        // },
    ]
}

const testFlowList = [
    {
        business_model_id: 'model_111',
        department_name: '部门或组织名称',
        flowchart_id: '152fd6b8-6b3c-435a-aec1-1c649103eab0',
        flowchart_level: 1,
        flowchart_name: '流程图名称111',
        hit_score: 111,
        main_business_id: 'main_id',
        reason: '推荐原因111',
        subject_domain_name: '主题域名称111',
    },
    {
        business_model_id: 'model_222',
        department_name: '部门或组织名称',
        flowchart_id: '7d0f3ace-120b-45b1-bf4c-ff5afd217460',
        flowchart_level: 1,
        flowchart_name: '流程图名称222',
        hit_score: 222,
        main_business_id: 'main_id',
        reason: '推荐原因222',
        subject_domain_name: '主题域名称222',
    },
    {
        business_model_id: 'model_333',
        department_name: '部门或组织名称',
        flowchart_id: '333',
        flowchart_level: 1,
        flowchart_name: '流程图名称333',
        hit_score: 333,
        main_business_id: 'main_id',
        reason: '推荐原因333',
        subject_domain_name: '主题域名称333',
    },
]

// 树结构转为列表
// export const treeTolist = (tree: Array<any>) => {
//     const list: any = []
//     const queue = [...tree]
//     while (queue.length) {
//         const node = queue.shift()
//         const { children } = node
//         if (children) {
//             queue.push(...children)
//         }
//         list.push(node)
//     }
//     return list
// }

/**
 * 广度遍历树，转为列表
 * @param key ID对应参数名称
 * @param tree Array<T> 树结构数据
 * @param parentId 父节点ID
 * @returns Array<T>
 */
const treeTolist = (key: string, tree: Array<any>, parentId: string) => {
    const listTemp: Array<any> = []
    tree?.forEach((node) => {
        // 遍历最上层
        listTemp.push({
            ...node,
            parentId: parentId || '',
        })
        // 如果有子结点,再遍历子结点
        if (node.children?.length > 0) {
            const childList = treeTolist(key, node.children, node[key]) // 递归
            Object.assign(listTemp, listTemp.concat(childList))
        }
    })

    return listTemp
}

export {
    CellInfosType,
    OperateType,
    SelectedStatus,
    processMenuItems,
    formMenuItems,
    metricMenuItems,
    metricMenuItemsNoAccess,
    ProcessItem,
    BusFormItem,
    SubTitle,
    BasicTitle,
    ListEmpty,
    FormLabel,
    FlowChooseItem,
    saveFlowRequest,
    openWindowPreviewFlow,
    getViewmode,
    changeToDrawioUrl,
    FlowchartTreeNodeType,
    updateFormCount,
    noticeDrawioChangeFormCount,
    operateAfterSave,
    noticeDrawioImportFile,
    analysisXmlSheet,
    base64ToFile,
    totalOperates,
    products,
    FlowPathType,
    FlowPathTypeList,
    ViewType,
    getFlowTabItems,
    treeTolist,
}

export type { IFlowchartInfo }
