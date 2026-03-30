import { CloseCircleFilled } from '@ant-design/icons'
import { useUnmount } from 'ahooks'
import { useNavigate } from 'react-router-dom'
import {
    Tabs,
    Modal,
    Steps,
    Space,
    Button,
    Checkbox,
    Tooltip,
    Row,
    Col,
} from 'antd'
import React, { useEffect, useState, useRef, useMemo } from 'react'
import classnames from 'classnames'
import {
    formatError,
    ISubjectDomainItem,
    getBusinessDiagnosisDetails,
    createBusinessDiagnosis,
    DiagnosisPhase,
    editBusinessDiagnosis,
    rerunBusinessDiagnosis,
} from '@/core'
import __ from '@/components/BusinessDiagnosis/locale'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import emptyData from '@/assets/dataEmpty.svg'
import { BusinessProcessColored } from '@/icons'
import {
    diagnosisTips,
    diagnosisCheckboxList,
} from '@/components/BusinessDiagnosis/helper'

import { DiagnosisType } from '@/components/BusinessDiagnosis/const'

interface ICreateDiagnosis {
    open: boolean
    onClose: (isSearch?: boolean, isFlag?: string) => void
    isReDiagnosis?: boolean
    id?: string
    name?: string
    data?: any[]
    onShowDetail?: (id: string) => void
    taskId?: string
}
const CreateDiagnosis: React.FC<ICreateDiagnosis> = ({
    open,
    onClose,
    onShowDetail,
    isReDiagnosis,
    id,
    name,
    data,
    taskId,
}) => {
    const navigator = useNavigate()
    const [current, setCurrent] = useState<number>(0)
    const [tabActiveKey, setTabActiveKey] = useState<string>('0')
    const [phase, setPhase] = useState<DiagnosisPhase>(DiagnosisPhase.Running)
    const listInterval = useRef<any>()
    const [diagnosisId, setDiagnosisId] = useState<string>('')
    const [selectedNodeList, setSelectedNodeList] = useState<any[]>([])
    const [checkValue, setCheckValue] = useState<string[]>([
        DiagnosisType.Completeness,
        DiagnosisType.Maturity,
        DiagnosisType.BusinessFormComplexity,
        DiagnosisType.Consistency,
        DiagnosisType.SharingRate,
    ])
    const [failedDesc, setFailedDesc] = useState<string>('')
    const [createdRes, setCreatedRes] = useState<any>({})
    const [btnLoading, setBtnLoading] = useState<boolean>(false)

    useEffect(() => {
        if (data) {
            setSelectedNodeList(data)
        }
    }, [data])

    useUnmount(() => {
        if (listInterval?.current) {
            clearTimeout(listInterval.current)
        }
    })

    // 根据选中主干业务数量，调整诊断内容
    useMemo(() => {
        if (selectedNodeList.length === 1) {
            setCheckValue((prev) =>
                prev.filter((item) => item !== DiagnosisType.Consistency),
            )
        } else {
            setCheckValue((prev) => [
                ...prev.filter((item) => item !== DiagnosisType.Consistency),
                DiagnosisType.Consistency,
            ])
        }
    }, [selectedNodeList])

    useEffect(() => {
        if (phase !== DiagnosisPhase.Running && listInterval?.current) {
            clearTimeout(listInterval.current)
        }
    }, [phase])

    useEffect(() => {
        if (isReDiagnosis) {
            setCurrent(2)
            setDiagnosisId(id || '')
            handleRerun()
        } else {
            setCurrent(0)
            setTabActiveKey('0')
        }
    }, [])

    const getItems = (objs: ISubjectDomainItem[]) => {
        return objs.map((so) => {
            // const path =
            //     tabActiveKey === '1'
            //         ? so.department_name_path
            //         : tabActiveKey === '2'
            //         ? so?.business_system_name?.join('、')
            //         : so.path
            // const title =
            //     tabActiveKey === '1'
            //         ? __('部门：')
            //         : tabActiveKey === '2'
            //         ? __('信息系统：')
            //         : __('业务域：')
            return (
                <div className={styles.seletedItem} key={so.id}>
                    <div className={styles.leftInfo}>
                        <BusinessProcessColored className={styles.typeIcon} />
                        <div className={styles.infos}>
                            <div title={so.name} className={styles.name}>
                                {so.name}
                            </div>
                            {/* <div title={path} className={styles.path}>
                                {title}
                                {path}
                            </div> */}
                        </div>
                    </div>
                    {/* <CloseOutlined
                        className={styles.closeIcon}
                        onClick={() => delselectedDiagnosis(so.id)}
                    /> */}
                </div>
            )
        })
    }

    const getPhaseStae = async (curId: string) => {
        try {
            const res = await getBusinessDiagnosisDetails(curId)
            setDiagnosisId(res.id)
            setPhase(res.phase as DiagnosisPhase)
            setFailedDesc(res.message || '')
            if (res.phase === DiagnosisPhase.Running) {
                const interval = setTimeout(() => getPhaseStae(curId), 2000)
                listInterval.current = interval
            } else {
                listInterval.current = null
                setBtnLoading(false)
            }
        } catch (e) {
            const interval = setTimeout(() => getPhaseStae(curId), 2000)
            listInterval.current = interval
        }
    }

    const handleRerun = async () => {
        try {
            const res = await rerunBusinessDiagnosis(diagnosisId || id || '')
            setDiagnosisId(res.id || id)
            getPhaseStae(res.id || id)
            setFailedDesc('')
        } catch (e) {
            formatError(e)
            setFailedDesc(e?.data?.description)
        }
    }

    const handleCreate = async () => {
        try {
            const params: any = {
                dimensions: {
                    ...Object.fromEntries(
                        checkValue.map((item) => [
                            item,
                            checkValue.includes(item),
                        ]),
                    ),
                },
                processes: selectedNodeList.map((item) => item.id),
                task_id: taskId,
            }
            const res = await createBusinessDiagnosis(params)
            setBtnLoading(true)
            setDiagnosisId(res.id)
            getPhaseStae(res.id)
            setCreatedRes(res)
            setFailedDesc('')
        } catch (e) {
            formatError(e)
            setFailedDesc(e?.data?.description)
        } finally {
            setCurrent(current < 2 ? current + 1 : current)
        }
    }

    const handleCancel = async (isBack?: boolean) => {
        if (listInterval?.current) {
            clearTimeout(listInterval.current)
            listInterval.current = null
        }
        try {
            if (!(diagnosisId || id)) return
            await editBusinessDiagnosis({
                id: diagnosisId || id || '',
                canceled: true,
                name: name || createdRes?.name,
            })
        } finally {
            if (isBack) {
                setCurrent(current - 1)
            } else {
                onClose()
            }
        }
    }

    const toViewDetails = () => {
        onClose(true)
        if (onShowDetail) {
            onShowDetail(diagnosisId)
        }
        // navigator(`/business/diagnosis/details?id=${diagnosisId}`)
    }

    const getModalFooter = () => {
        return (
            <Space size={16}>
                {current === 0 && (
                    <>
                        <Button onClick={() => onClose()}>{__('取消')}</Button>
                        <Tooltip
                            title={
                                selectedNodeList.length === 0
                                    ? __('请选择主干业务')
                                    : ''
                            }
                        >
                            <Button
                                type="primary"
                                onClick={() => setCurrent(current + 1)}
                                disabled={selectedNodeList.length === 0}
                            >
                                {__('下一步')}
                            </Button>
                        </Tooltip>
                    </>
                )}
                {current === 1 && (
                    <>
                        <Button onClick={() => setCurrent(current - 1)}>
                            {__('上一步')}
                        </Button>
                        <Tooltip
                            title={
                                checkValue.length === 0
                                    ? __('至少勾选一个诊断内容中的选项')
                                    : ''
                            }
                        >
                            <Button
                                type="primary"
                                onClick={() => handleCreate()}
                                disabled={checkValue.length === 0}
                            >
                                {__('开始诊断')}
                            </Button>
                        </Tooltip>
                    </>
                )}
                {current === 2 && (
                    <>
                        {phase === DiagnosisPhase.Running && (
                            <>
                                <Button
                                    onClick={() => handleCancel(!isReDiagnosis)}
                                >
                                    {isReDiagnosis
                                        ? __('取消诊断')
                                        : __('取消并返回上一步')}
                                </Button>
                                <Button
                                    type="primary"
                                    // loading={btnLoading}
                                    onClick={() =>
                                        onClose(
                                            true,
                                            failedDesc ? '' : diagnosisId,
                                        )
                                    }
                                >
                                    {failedDesc
                                        ? __('关闭')
                                        : __('关闭并转后台运行')}
                                </Button>
                            </>
                        )}
                        {phase === DiagnosisPhase.Done && (
                            <Button
                                type="primary"
                                onClick={() => toViewDetails()}
                            >
                                {__('查看结果')}
                            </Button>
                        )}
                        {phase === DiagnosisPhase.Failed && (
                            <>
                                <Button
                                    onClick={() => handleCancel(!isReDiagnosis)}
                                >
                                    {isReDiagnosis
                                        ? __('取消诊断')
                                        : __('取消并返回上一步')}
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        if (isReDiagnosis) {
                                            handleRerun()
                                        } else {
                                            handleCreate()
                                        }
                                    }}
                                >
                                    {__('重新诊断')}
                                </Button>
                            </>
                        )}
                    </>
                )}
            </Space>
        )
    }

    const delselectedDiagnosis = (selectedId: string) => {
        const list = selectedNodeList.filter((item) => item.id !== selectedId)
        if (list.length === 0 && current === 1) {
            setCurrent(current - 1)
        }
        setSelectedNodeList(list)
    }

    const steps = [
        {
            title: __('选择主干业务'),
            content: (
                <div className={styles.content}>
                    <div className={styles.right} style={{ flex: 1 }}>
                        <div className={styles.top}>
                            <span className={styles.count}>
                                {__('已选择：')} {selectedNodeList.length}{' '}
                                {__('个')}
                            </span>
                            {/* <Button
                                type="link"
                                disabled
                                className={styles.clear}
                                onClick={() => setSelectedNodeList([])}
                            >
                                {__('全部移除')}
                            </Button> */}
                        </div>
                        <div className={styles.bottom}>
                            {selectedNodeList.length === 0 ? (
                                <Empty
                                    iconSrc={emptyData}
                                    desc={__('暂无数据')}
                                />
                            ) : (
                                getItems(selectedNodeList)
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: __('确认诊断信息'),
            content: (
                <div className={styles.secContent}>
                    <div className={styles['secContent-title']}>
                        {__('请选择诊断内容')}
                    </div>
                    <div className={styles['secContent-Checkbox']}>
                        <Checkbox.Group
                            value={checkValue}
                            onChange={(val: any) => setCheckValue(val)}
                            style={{ width: '100%' }}
                        >
                            <Row gutter={[0, 24]}>
                                {diagnosisCheckboxList.map((item) => (
                                    <Col
                                        key={item.value}
                                        span={8}
                                        className={styles.checkboxItem}
                                    >
                                        <Tooltip
                                            title={
                                                item.value ===
                                                    DiagnosisType.Consistency &&
                                                selectedNodeList.length === 1
                                                    ? __(
                                                          '单一主干业务无法分析一致性',
                                                      )
                                                    : ''
                                            }
                                        >
                                            <Checkbox
                                                className={classnames(
                                                    styles.checkbox,
                                                    {
                                                        [styles.checkboxBlueBg]:
                                                            item.value ===
                                                            DiagnosisType.Completeness,
                                                    },
                                                )}
                                                value={item.value}
                                                disabled={
                                                    !!item.disabled?.(
                                                        selectedNodeList,
                                                    )
                                                }
                                            />
                                        </Tooltip>
                                        {item.label}
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </div>
                    {/* <div className={styles['secContent-secTitle']}>
                        {__('请确认想要诊断的主干业务')}
                    </div>
                    <div className={styles['secContent-subTitle']}>
                        {__('共选中')}
                        {selectedNodeList.length || 0}
                        {__('个主干业务')}
                    </div>
                    <div className={styles['secContent-list']}>
                        {selectedNodeList.map((item) => {
                            return (
                                <div
                                    className={styles['secContent-list-item']}
                                    key={item.id}
                                >
                                    <div>
                                        <BusinessProcessColored
                                            className={
                                                styles['secContent-list-icon']
                                            }
                                        />
                                        <div
                                            className={
                                                styles['secContent-list-text']
                                            }
                                            title={item.name}
                                        >
                                            {item.name}
                                        </div>
                                    </div>
                                    <CloseCircleFilled
                                        className={
                                            styles['secContent-list-closeIcon']
                                        }
                                        onClick={() =>
                                            delselectedDiagnosis(item.id)
                                        }
                                    />
                                </div>
                            )
                        })}
                    </div> */}
                </div>
            ),
        },
        { title: __('诊断'), content: diagnosisTips(phase, failedDesc) },
    ]

    return (
        <Modal
            title={isReDiagnosis ? __('重新诊断') : __('发起诊断')}
            width={800}
            open={open}
            onCancel={() => onClose(true)}
            bodyStyle={{ height: 490 }}
            destroyOnClose
            maskClosable={false}
            className={styles.createModalWrapper}
            footer={<div className={styles.footer}>{getModalFooter()}</div>}
        >
            <div className={styles.createDiagnosisWrapper}>
                {!isReDiagnosis && (
                    <div className={styles.stepsBox}>
                        <div className={styles.steps}>
                            <Steps current={current} items={steps} />
                        </div>
                    </div>
                )}
                {steps[current].content}
            </div>
        </Modal>
    )
}
export default CreateDiagnosis
