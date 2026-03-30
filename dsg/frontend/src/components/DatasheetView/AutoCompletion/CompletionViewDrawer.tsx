import { Button, Drawer, Space, Tooltip, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import { has } from 'lodash'
import { formatError, messageSuccess, postDataViewCompletion } from '@/core'
import { ReturnConfirmModal } from '@/ui'
import { info } from '@/utils/modalHelper'
import { AutoCompleteStatus, IconType, stateType } from '../const'
import { useDataViewContext } from '../DataViewProvider'
import { validateRepeatName } from '../helper'
import Icons from '../Icons'
import __ from '../locale'
import CompletionView from './CompletionView'
import styles from './styles.module.less'

interface ICompletionViewDrawer {
    open: boolean
    // 取消
    onClose: (error?: boolean) => void
    // 确定
    onOk: () => void
    // 重新生成
    onRebuild: () => void
    // 变为编辑模式
    onEdit: () => void
    // 请求更新补全数据
    onReqEditCompleteData: (value) => void
}

/**
 * 自动补全
 */
const CompletionViewDrawer = (props: ICompletionViewDrawer) => {
    const { open, onClose, onOk, onRebuild, onEdit, onReqEditCompleteData } =
        props
    const {
        optionType,
        completeStatus,
        setCompleteStatus,
        completeSelectData,
        setCompleteSelectData,
        completeData,
        setCompleteData,
        editedComplete,
        setEditedComplete,
        fieldsTableData,
        setFieldsTableData,
        datasheetInfo,
        setDatasheetInfo,
        logicViewType,
    } = useDataViewContext()
    // 字段信息
    const [fields, setFields] = useState<any[]>([])
    const [fields2, setFields2] = useState<any[]>([])
    // 库表名称
    const [viewName, setViewName] = useState<any>()
    const [viewName2, setViewName2] = useState<any>()
    // 库表描述
    const [viewDescription, setViewDescription] = useState<any>()
    const [viewDescription2, setViewDescription2] = useState<any>()
    // 是否只展示有补全结果
    const [onlyCompleteResult, setOnlyCompleteResult] = useState<boolean>(true)
    const [loading, setLoading] = useState<boolean>(false)

    // 库表信息配置
    const viewInfo = [
        { key: 'viewName', setFn: setViewName, setFn2: setViewName2 },
        {
            key: 'viewDescription',
            setFn: setViewDescription,
            setFn2: setViewDescription2,
        },
    ]

    useEffect(() => {
        if (open) {
            // 未补全 - 选择需补全数据
            if (completeStatus !== AutoCompleteStatus.Completed) {
                setViewName(completeSelectData?.viewName)
                setViewDescription(completeSelectData?.viewDescription)
                setFields(completeSelectData?.fields || [])
            } else {
                // 已补全 - 选择应用补全数据
                // 库表信息
                viewInfo.forEach((item) => {
                    if (has(completeData, item.key)) {
                        item.setFn(completeSelectData?.[item.key])
                        if (completeData?.[item.key].isCompleted) {
                            item.setFn2(completeData?.[item.key])
                        } else {
                            // 无补全数据以外部数据为准
                            item.setFn2({
                                ...completeData?.[item.key],
                                value: completeSelectData?.[item.key].value,
                                tips: completeData?.[item.key].selected
                                    ? completeSelectData?.[item.key].tips
                                    : '',
                            })
                        }
                    } else {
                        item.setFn(undefined)
                        item.setFn2(undefined)
                    }
                })

                // 字段信息
                if (
                    has(completeData, 'fields') &&
                    completeData.fields.length > 0
                ) {
                    let tempFields: any[] = []
                    const tempFields2 = completeData.fields.map((item) => {
                        const findItem = completeSelectData?.fields.find(
                            (f) => f.id === item.id,
                        )
                        tempFields = [
                            ...tempFields,
                            {
                                ...findItem,
                                isCompleted: item.isCompleted,
                            },
                        ]
                        // 无补全数据以外部数据为准
                        if (!item.isCompleted) {
                            return {
                                ...item,
                                business_name: findItem.business_name,
                            }
                        }
                        return item
                    })
                    const selectFields = tempFields2.filter(
                        (item) => item.selected,
                    )
                    const totalFields = [
                        ...selectFields,
                        ...fieldsTableData.filter(
                            (item) =>
                                !selectFields.find((f) => f.id === item.id),
                        ),
                    ]
                    setFields(tempFields)
                    setFields2(
                        tempFields2.map((item) => {
                            if (item.selected) {
                                return {
                                    ...item,
                                    tips: validateRepeatName(totalFields, item)
                                        ? __(
                                              '此名称和其他字段的业务名称重复，请修改',
                                          )
                                        : '',
                                }
                            }
                            return { ...item, tips: '' }
                        }),
                    )
                } else {
                    setFields([])
                    setFields2([])
                }
            }
        }
    }, [open, completeStatus])

    // 发起补全
    const handleInitiatingComplete = async () => {
        try {
            setLoading(true)
            // 不在未补全时发起，清空上次记录
            if (completeStatus !== AutoCompleteStatus.None) {
                await onReqEditCompleteData(null)
            }
            setEditedComplete(false)
            const fieldsSelected = fields
                .filter((item) => item.selected)
                .map((item) => item.id)
            const value = {
                complete_view_name: viewName.selected,
                complete_view_description: viewDescription.selected,
                complete_field_name: fieldsSelected.length > 0,
                ids:
                    fieldsSelected.length === fields.length
                        ? []
                        : fieldsSelected,
            }
            await postDataViewCompletion(datasheetInfo?.id, value)
            setCompleteStatus(AutoCompleteStatus.Completing)
            setCompleteSelectData(null)
            onOk()
        } catch (err) {
            if (err?.data?.code === 'DataView.FormView.CompletionNotFound') {
                return
            }
            if (err?.data?.code === 'DataView.FormView.FormViewIdNotExist') {
                message.info(__('无法操作，库表已不存在'))
                onClose(true)
            } else {
                formatError(err)
            }
        } finally {
            setLoading(false)
        }
    }

    // 取消
    const handleClose = () => {
        // 更新补全显示数据
        setCompleteSelectData({ viewName, viewDescription, fields })
        if (completeStatus === AutoCompleteStatus.Completed) {
            // 补全结果是否编辑过
            let notChanged = true
            let data = {}
            if (viewName2) {
                data = { viewName: viewName2 }
                notChanged = viewName2.value === completeData.viewName.value
            }
            if (viewDescription2) {
                data = { ...data, viewDescription: viewDescription2 }
                notChanged =
                    notChanged &&
                    viewDescription2.value ===
                        completeData.viewDescription.value
            }
            if (fields2?.length > 0) {
                data = { ...data, fields: fields2 }
                const completeDataBussinessNames =
                    completeData.fields.map((item) => item.business_name) || []
                const fields2BussinessNames =
                    fields2?.map((item) => item.business_name) || []
                notChanged =
                    notChanged &&
                    JSON.stringify(completeDataBussinessNames) ===
                        JSON.stringify(fields2BussinessNames)
            }
            setCompleteData(data)
            if (!editedComplete) {
                setEditedComplete(!notChanged)
            }
        }
        onClose()
    }

    // 应用补全数据
    const handleUsed = async () => {
        // 有异常提示
        if (viewName2?.tips || fields2.find((item) => item?.tips)) {
            info({
                title: __('无法应用'),
                icon: <ExclamationCircleFilled style={{ color: '#1890FF' }} />,
                content: (
                    <div>
                        <span>{__('请检查并完善带')}</span>
                        <span style={{ margin: '0 4px' }}>
                            <Icons type={IconType.ERROR} />
                        </span>
                        <span>{__('的异常信息')}</span>
                    </div>
                ),
                okText: __('确定'),
            })
            return
        }

        // 应用更新外部数据
        setEditedComplete(true)
        let useAll = true
        if (viewName2) {
            if (viewName2.selected) {
                setDatasheetInfo((prev) => ({
                    ...prev,
                    business_name: viewName2.value,
                    business_name_tips: '',
                }))
                setViewName(undefined)
                setViewName2(undefined)
            } else {
                useAll = false
            }
        }
        if (viewDescription2) {
            if (viewDescription2.selected) {
                setDatasheetInfo((prev) => ({
                    ...prev,
                    description: viewDescription2.value,
                }))
                setViewDescription(undefined)
                setViewDescription2(undefined)
            } else {
                useAll = false
            }
        }
        if (fields2?.length > 0) {
            const tempFieldsTableData = fieldsTableData.map((item) => {
                const findItem = fields2.find(
                    (f) => f.id === item.id && f.selected,
                )
                if (findItem) {
                    return {
                        ...item,
                        business_name: findItem.business_name,
                    }
                }
                return item
            })
            setFieldsTableData(
                tempFieldsTableData.map((item) => {
                    return {
                        ...item,
                        tips:
                            validateRepeatName(
                                tempFieldsTableData.filter(
                                    (it) => it.status !== stateType.delete,
                                ),
                                item,
                            ) && item.status !== stateType.delete
                                ? __('此名称和其他字段的业务名称重复，请修改')
                                : '',
                    }
                }),
            )
            // 过滤选中应用的数据
            let tempFields: any[] = []
            let tempFields2: any[] = []
            fields2.forEach((item, idx) => {
                if (!item.selected) {
                    tempFields = [...tempFields, fields[idx]]
                    tempFields2 = [...tempFields2, item]
                }
            })
            setFields(tempFields)
            setFields2(tempFields2)
            if (tempFields2.length > 0) {
                useAll = false
            }
        }
        // 全部应用后清空数据
        if (useAll) {
            setCompleteStatus(AutoCompleteStatus.UsedAll)
            setCompleteData(null)
            setCompleteSelectData(null)
            onClose()
        }
        messageSuccess(__('应用成功'))
    }

    // 重新生成
    const handleRebulid = () => {
        ReturnConfirmModal({
            content: __('若离开此页将放弃当前业务名称补全信息，请确认操作。'),
            onCancel: () => {
                setCompleteSelectData(null)
                setCompleteData(null)
                onReqEditCompleteData(null)
                onRebuild()
            },
        })
    }

    // 确定按钮是否可用 - 有选中可用
    const canSubmit = useMemo(() => {
        if (
            viewName?.selected ||
            viewDescription?.selected ||
            fields?.some((item) => item.selected)
        ) {
            return true
        }
        return false
    }, [viewName, viewDescription, fields])

    // 应用按钮是否可用 - 有选中可用
    const canUse = useMemo(() => {
        if (
            viewName2?.selected ||
            viewDescription2?.selected ||
            fields2?.some((item) => item.selected)
        ) {
            return true
        }
        return false
    }, [viewName2, viewDescription2, fields2])

    const footer = () => {
        return (
            <Space size={8} style={{ float: 'right' }}>
                <Button style={{ minWidth: 80 }} onClick={() => handleClose()}>
                    {__('取消')}
                </Button>
                {completeStatus !== AutoCompleteStatus.Completed && (
                    <Tooltip
                        title={!canSubmit ? __('请选择需要补全的信息') : ''}
                        placement="topRight"
                    >
                        <Button
                            style={{ minWidth: 80 }}
                            type="primary"
                            loading={loading}
                            disabled={!canSubmit}
                            onClick={() => handleInitiatingComplete()}
                        >
                            {__('确定')}
                        </Button>
                    </Tooltip>
                )}
                {completeStatus === AutoCompleteStatus.Completed && (
                    <Button
                        style={{ minWidth: 80 }}
                        onClick={() => handleRebulid()}
                    >
                        {__('重新生成')}
                    </Button>
                )}
                {completeStatus === AutoCompleteStatus.Completed &&
                    (optionType === 'edit' ? (
                        <Tooltip
                            title={!canUse ? __('请选择需要采纳的信息') : ''}
                            placement="topRight"
                        >
                            <Button
                                style={{ minWidth: 80 }}
                                type="primary"
                                disabled={!canUse}
                                onClick={() => handleUsed()}
                            >
                                {__('应用')}
                            </Button>
                        </Tooltip>
                    ) : (
                        <Button
                            style={{ minWidth: 80 }}
                            type="primary"
                            onClick={() => onEdit()}
                        >
                            {__('编辑')}
                        </Button>
                    ))}
            </Space>
        )
    }

    return (
        <div className={styles.completionViewDrawer}>
            <Drawer
                open={open}
                title={
                    completeStatus !== AutoCompleteStatus.Completed
                        ? optionType === 'edit'
                            ? __('自动补全')
                            : __('生成业务名称')
                        : optionType === 'edit'
                        ? __('结果确认')
                        : __('查看结果')
                }
                footer={footer()}
                placement="right"
                width="72%"
                contentWrapperStyle={{ minWidth: 800 }}
                bodyStyle={{
                    padding: 0,
                    margin: '10px 0',
                    display: 'flex',
                    overflow: 'hidden auto',
                }}
                getContainer={false}
                maskClosable={false}
                onClose={() => handleClose()}
                destroyOnClose
            >
                <CompletionView
                    fields={fields}
                    setFields={setFields}
                    viewName={viewName}
                    setViewName={setViewName}
                    viewDescription={viewDescription}
                    setViewDescription={setViewDescription}
                    onlyCompleteResult={onlyCompleteResult}
                    setOnlyCompleteResult={setOnlyCompleteResult}
                />

                {completeStatus === AutoCompleteStatus.Completed && (
                    <CompletionView
                        fields={fields2}
                        setFields={setFields2}
                        viewName={viewName2}
                        setViewName={setViewName2}
                        viewDescription={viewDescription2}
                        setViewDescription={setViewDescription2}
                        onlyCompleteResult={onlyCompleteResult}
                        setOnlyCompleteResult={setOnlyCompleteResult}
                        after
                    />
                )}
            </Drawer>
        </div>
    )
}

export default CompletionViewDrawer
