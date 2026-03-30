import {
    Button,
    Form,
    Input,
    Radio,
    Space,
    Table,
    Tooltip,
    message,
} from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import classNames from 'classnames'
import { InfoCircleFilled, InfoCircleOutlined } from '@ant-design/icons'
import { cloneDeep } from 'lodash'
import CommonTitle from './CommonTitle'
import DemandInfo from './Details/DemandInfo'
import __ from './locale'
import styles from './styles.module.less'
import CreateResource from './CreateResource'
import {
    IAnalysisBackParams,
    IAnalysisResult,
    IDemandDetails,
    IDemandItemInfo,
    analysisBackV2,
    formatError,
    getAuditProcessFromConfCenter,
    getDetailsOfDemand,
} from '@/core'
import { DemandDetailView, Feasibility } from './const'
import { AddOutlined, FontIcon } from '@/icons'
import { Return, ReturnConfirmModal } from '@/ui'
import { IconType } from '@/icons/const'
import ChooseResource from './ChooseResource'
import Confirm from '../Confirm'
import ApplyPermission from './ApplyPermission'
import LogicViewDetail from '../DataAssetsCatlg/LogicViewDetail'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { TextAreaView } from '../AutoFormView/baseViewComponents'
import { htmlDecodeByRegExp } from '../ResourcesDir/const'

const Analysis = () => {
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const demandId = searchParams.get('demandId') || ''
    const demandName = searchParams.get('demandName') || ''
    // const backUrl = searchParams.get('backUrl') || ''
    // 需求申请人id
    const applierId = searchParams.get('applierId') || ''
    const [createOpen, setCreateOpen] = useState(false)
    const [items, setItems] = useState<IDemandItemInfo[]>([])
    const [analysisRes, setAnalysisRes] = useState<IAnalysisResult>()
    const [feasibility, setFeasibility] = useState<Feasibility>(
        Feasibility.Feasible,
    )
    const [conclusion, setConclusion] = useState('')
    const [operateItem, setOperateItem] = useState<IDemandItemInfo>()

    const [chooseResourceOpen, setChooseResourceOpen] = useState(false)
    const [delVisible, setDelVisible] = useState(false)
    const [removeVisible, setRemoveVisible] = useState(false)
    const [applyOpen, setApplyOpen] = useState(false)

    const [details, setDetails] = useState<IDemandDetails>()
    const [logicViewDetail, setLogicViewDetail] = useState(false)
    const [{ using }, updateUsing] = useGeneralConfig()
    const [existPermissionReq, setExistPermissionReq] = useState(true)

    const getDetails = async () => {
        const res = await getDetailsOfDemand(
            {
                id: demandId,
                fields: ['basic_info', 'analysis_result'],
            },
            { view: DemandDetailView.OPERAOTR },
        )
        setDetails(res)
        if (res.analysis_result) {
            setItems(res.analysis_result.items || [])
            setConclusion(res.analysis_result.conclusion)
            form.setFieldsValue({
                apply_reason: res.analysis_result.apply_reason,
            })
            setFeasibility(res.analysis_result.feasibility as Feasibility)
        }
    }

    // 获取是否配置权限申请审核策略
    const getAuditProcess = async () => {
        try {
            const res = await getAuditProcessFromConfCenter({
                audit_type: 'af-data-permission-request',
            })
            setExistPermissionReq(res.entries?.length > 0)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getDetails()
        getAuditProcess()
    }, [])

    const handleCreateResource = (data) => {
        // 编辑时更新数据
        if (operateItem) {
            const temp = cloneDeep(items)
            const index = items.findIndex((item) => item.res_id === data.res_id)
            if (index > -1) {
                temp[index] = data
            }
            setItems(temp)
            setOperateItem(undefined)
            return
        }
        setItems([data, ...items])
        setOperateItem(undefined)
    }

    const handleOk = async (type: 'save' | 'submit') => {
        const values = await form.validateFields()
        if (feasibility === Feasibility.Feasible && items.length === 0) {
            message.error(__('需求分析结论为可行的情况下，请添加资源进行分析'))
            return
        }
        const params: IAnalysisBackParams = {
            op_type: type,
            feasibility,
            conclusion,
            apply_reason: values.apply_reason,
            analysis_id: details?.analysis_result?.analysis_id || undefined,
            items: items.map((item) => {
                if (item.extend_info) {
                    return {
                        ...item,
                        extend_info: JSON.stringify({
                            ...item.extend_info,
                            spec: {
                                ...item.extend_info.spec,
                                usage: 'DemandManagement',
                                policies: item.extend_info.spec.policies.map(
                                    (policy) => ({
                                        subject_id: policy.subject_id,
                                        subject_type: policy.subject_type,
                                        actions: policy.actions,
                                    }),
                                ),
                                sub_views: item.extend_info.spec.sub_views.map(
                                    (sub) => ({
                                        ...sub,
                                        policies: sub.policies.map((subPo) => ({
                                            subject_id: subPo.subject_id,
                                            subject_type: subPo.subject_type,
                                            actions: subPo.actions,
                                        })),
                                    }),
                                ),
                                reason: values.apply_reason,
                            },
                        }),
                    }
                }
                return item
            }),
        }
        try {
            const res = await analysisBackV2(demandId, params)
            message.success(type === 'save' ? __('保存成功') : __('提交成功'))
            if (type === 'save') {
                navigate('/demand-mgt?tab=todo')
            } else {
                navigate('/demand-mgt?tab=done')
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleReturn = () => {
        ReturnConfirmModal({
            onCancel: () => {
                navigate('/demand-mgt?tab=todo')
            },
        })
    }

    const columns = [
        {
            title: (
                <div>
                    {__('数据资源名称')}
                    <span className={styles['tec-name-title']}>
                        {__('（技术名称）')}
                    </span>
                </div>
            ),
            dataIndex: 'res_busi_name',
            key: 'res_busi_name',
            render: (name, record) => (
                <div
                    className={styles['name-info-container']}
                    onClick={() => {
                        setLogicViewDetail(true)
                        setOperateItem(record)
                    }}
                >
                    <FontIcon
                        name="icon-shujubiaoshitu"
                        type={IconType.COLOREDICON}
                        className={styles.icon}
                    />
                    <div className={styles.names}>
                        <div
                            className={classNames(
                                styles.name,
                                // 根据上下线判断是否可点击
                                styles['selected-name'],
                            )}
                            title={name}
                        >
                            {name}
                        </div>
                        <div
                            className={styles['tech-name']}
                            title={record.res_tech_name}
                        >
                            {record.res_tech_name}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: __('资源状态'),
            dataIndex: 'res_status',
            key: 'res_status',
            render: (text, record) => {
                const { is_publish, is_online } = record
                // 已发布/上线状态
                const rescStatus =
                    (using === 1 && is_publish) || (using === 2 && is_online)
                const rescStatusLabel =
                    using === 1
                        ? is_publish
                            ? __('已发布')
                            : __('未发布')
                        : using === 2
                        ? is_online
                            ? __('已上线')
                            : __('已下线')
                        : ''
                return (
                    <div
                        className={classNames(
                            styles['online-flag'],
                            !rescStatus && styles['offline-flag'],
                        )}
                    >
                        {rescStatusLabel}
                    </div>
                )
            },
        },
        {
            title: __('描述'),
            dataIndex: 'res_desc',
            key: 'res_desc',
            ellipsis: true,
            render: (desc) => desc || '--',
        },
        {
            title: (
                <>
                    {__('操作')}
                    <Tooltip
                        color="#fff"
                        overlayInnerStyle={{ color: '#000' }}
                        title={
                            <div style={{ minWidth: 324 }}>
                                <div>
                                    {__(
                                        '可添加或删除资源的访问权限配置、或移除资源。',
                                    )}
                                </div>
                                <div>
                                    {__(
                                        '也支持直接添加资源，无需额外权限配置操作。',
                                    )}
                                </div>
                            </div>
                        }
                    >
                        <InfoCircleOutlined
                            className={styles['operate-tips-icon']}
                        />
                    </Tooltip>
                </>
            ),
            dataIndex: 'action',
            key: 'action',
            width: 240,
            render: (action, record: IDemandItemInfo) => (
                <Space size={12}>
                    {/* 配置审核策略才展示配置权限 */}
                    {existPermissionReq && (
                        <a
                            onClick={() => {
                                setApplyOpen(true)
                                setOperateItem(record)
                            }}
                        >
                            {__('配置权限')}
                        </a>
                    )}

                    {(record.extend_info || record.auth_apply_id) && (
                        <a
                            onClick={() => {
                                setDelVisible(true)
                                setOperateItem(record)
                            }}
                        >
                            {__('删除权限')}
                        </a>
                    )}

                    <a
                        onClick={() => {
                            setRemoveVisible(true)
                            setOperateItem(record)
                        }}
                    >
                        {__('移除资源')}
                    </a>
                </Space>
            ),
        },
    ]

    const getResource = (resources) => {
        setItems([
            ...items,
            ...resources
                .filter((r) => !items.find((i) => i.res_id === r.id))
                .map((item) => ({
                    res_id: item.id,
                    res_type: 'logicview',
                    res_busi_name: item.raw_name,
                    res_tech_name: item.name_en,
                    res_desc: item.raw_description,
                    res_status: item.is_online,
                    is_online: item.is_online,
                    is_publish: item.is_publish,
                })),
        ])
    }

    // 删除权限
    const handleDelete = () => {
        setItems(
            items.map((item) => {
                if (item.res_id === operateItem?.res_id) {
                    return { ...item, extend_info: '' }
                }
                return item
            }),
        )
        setOperateItem(undefined)
        setDelVisible(false)
    }

    // 移除资源
    const handleRemove = () => {
        setDelVisible(false)
        setItems(items.filter((item) => item.res_id !== operateItem?.res_id))
        setOperateItem(undefined)
        setRemoveVisible(false)
    }

    const handleApplyPermissionOk = (data) => {
        setItems(
            items.map((item) => {
                if (item.res_id === data.spec.id) {
                    const { auth_apply_id, ...rest } = item
                    return { ...rest, extend_info: data }
                }
                return item
            }),
        )
    }

    return (
        <div className={styles['analysis-wrapper']}>
            <div className={styles.header}>
                <Return title={demandName} onReturn={() => handleReturn()} />
            </div>
            <div className={styles['analysis-body']}>
                <div className={styles['analysis-content']}>
                    <div className={styles['analysis-content-title']}>
                        {__('需求分析')}
                    </div>

                    <div className={styles['analysis-content-info']}>
                        {details?.analysis_result?.confirm_reject_reason && (
                            <div className={styles['reject-tip-container']}>
                                <div className={styles['reject-tips']}>
                                    <div className={styles['reject-title']}>
                                        <InfoCircleFilled
                                            className={styles['tip-icon']}
                                        />
                                        {__('驳回说明')}
                                    </div>
                                    <div className={styles['reject-text']}>
                                        <TextAreaView
                                            initValue={htmlDecodeByRegExp(
                                                details.analysis_result
                                                    .confirm_reject_reason,
                                            )}
                                            rows={1}
                                            placement="end"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <DemandInfo details={details?.basic_info} />
                        <CommonTitle title={__('资源清单')} />
                        <div className={styles['demand-items-container']}>
                            <div className={styles['add-res-container']}>
                                {items.length === 0 && (
                                    <div className={styles['add-res-label']}>
                                        {__('添加资源')}
                                    </div>
                                )}
                                <Button
                                    type="primary"
                                    icon={<AddOutlined />}
                                    onClick={() => setChooseResourceOpen(true)}
                                >
                                    {__('添加资源')}
                                </Button>
                            </div>
                            {items.length > 0 && (
                                <Table
                                    columns={columns}
                                    dataSource={items}
                                    rowKey="res_id"
                                    rowClassName={
                                        styles['analysis-items-table-row']
                                    }
                                    style={{
                                        marginBottom: 54,
                                    }}
                                    pagination={false}
                                />
                            )}
                            <Form form={form} autoComplete="off">
                                <Form.Item
                                    label={__('申请理由')}
                                    name="apply_reason"
                                    rules={[
                                        {
                                            required:
                                                feasibility ===
                                                Feasibility.Feasible,
                                            message: __('请输入申请理由'),
                                        },
                                    ]}
                                >
                                    <Input.TextArea
                                        maxLength={300}
                                        showCount
                                        placeholder={__('请输入申请理由')}
                                        style={{
                                            resize: 'none',
                                            height: 80,
                                            width: 818,
                                        }}
                                    />
                                </Form.Item>
                            </Form>
                        </div>
                        <CommonTitle title={__('需求可行性结论')} />
                        <div className={styles['feasibility-container']}>
                            <div className={styles.row}>
                                <div className={styles.label}>
                                    {__('需求可行性：')}
                                </div>
                                <div className={styles.value}>
                                    <Radio.Group
                                        onChange={(e) =>
                                            setFeasibility(e.target.value)
                                        }
                                        value={feasibility}
                                    >
                                        <Radio value={Feasibility.Feasible}>
                                            {__('可行')}
                                        </Radio>
                                        <Radio value={Feasibility.Unfeasible}>
                                            {__('不可行')}
                                        </Radio>
                                    </Radio.Group>
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.label}>
                                    {__('分析结论说明：')}
                                </div>
                                <div className={styles.value}>
                                    <Input.TextArea
                                        maxLength={300}
                                        showCount
                                        value={conclusion}
                                        onChange={(e) =>
                                            setConclusion(e.target.value)
                                        }
                                        className={styles.textarea}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <Space size={14}>
                            <Button
                                onClick={() => navigate('/demand-mgt?tab=todo')}
                            >
                                {__('取消')}
                            </Button>
                            <Button onClick={() => handleOk('save')}>
                                {__('保存')}
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => handleOk('submit')}
                            >
                                {__('提交')}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
            {createOpen && (
                <CreateResource
                    open={createOpen}
                    onClose={() => {
                        setCreateOpen(false)
                        setOperateItem(undefined)
                    }}
                    onOK={handleCreateResource}
                    editData={operateItem}
                    applierId={applierId}
                />
            )}
            {chooseResourceOpen && (
                <ChooseResource
                    open={chooseResourceOpen}
                    onClose={() => setChooseResourceOpen(false)}
                    getResource={getResource}
                    selectedIds={items.map((item) => item.res_id)}
                />
            )}
            <Confirm
                open={delVisible}
                title={__('确定要删除本次配置的权限吗？')}
                content={__('您本次配置的权限将被删除，请确认操作。')}
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={432}
            />
            <Confirm
                open={removeVisible}
                title={__('确定要移除${name}资源吗？', {
                    name: operateItem?.res_busi_name,
                })}
                content={__('删除后资源本次配置的权限将被清除，请确认操作。')}
                onOk={handleRemove}
                onCancel={() => {
                    setRemoveVisible(false)
                }}
                width={432}
            />
            {applyOpen && (
                <ApplyPermission
                    open={applyOpen}
                    onClose={() => setApplyOpen(false)}
                    applierId={applierId}
                    sheetId={operateItem?.res_id!}
                    sheetName={operateItem?.res_busi_name!}
                    onOk={handleApplyPermissionOk}
                    editData={operateItem?.extend_info}
                    authApplyId={operateItem?.auth_apply_id}
                />
            )}
            {logicViewDetail && (
                <LogicViewDetail
                    open={logicViewDetail}
                    onClose={() => {
                        setLogicViewDetail(false)
                        setOperateItem(undefined)
                    }}
                    showShadow={false}
                    hasPermission={false}
                    id={operateItem?.res_id}
                />
            )}
        </div>
    )
}

export default Analysis
