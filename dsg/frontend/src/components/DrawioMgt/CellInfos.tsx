import { DrawerProps, Input, List, message } from 'antd'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetState, useLocalStorageState } from 'ahooks'
import { trim } from 'lodash'
import styles from './styles.module.less'
import {
    formatError,
    messageError,
    flowBindFlowQuery,
    flowBindFormsQuery,
    flowCreateWithModel,
    flowDeleteFormModel,
    getFormsFieldsList,
    transformQuery,
} from '@/core'
import __ from './locale'
import FlowchartInfoManager, {
    BasicTitle,
    BusFormItem,
    CellInfosType,
    formMenuItems,
    metricMenuItems,
    getViewmode,
    noticeDrawioChangeFormCount,
    openWindowPreviewFlow,
    operateAfterSave,
    OperateType,
    ProcessItem,
    processMenuItems,
    saveFlowRequest,
    SubTitle,
} from './helper'
import { OperateType as OptType, getActualUrl } from '@/utils'
import SiderDrawer from '../SiderDrawer'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import CiteForm from './CiteForm'
import CiteFlow from './CiteFlow'
import ImportForm from '../Forms/ImportForm'
import Empty from '@/ui/Empty'
import dataEmpty from '../../assets/dataEmpty.svg'

import CreateForm from '../Forms/CreateForm'
import FieldTableView from '../FormGraph/FieldTableView'

import ImportFlow from './ImportFlow'
import CreateModel from '../BussinessConfigure/CreateModel' // 创建指标
import ViewMetricModal from '../BussinessConfigure/ViewMetricModal' // 创建指标
import SelectMetricList from './SelectMetricList' // 选择关联指标
import { OptionModel } from '../MetricModel/const'

import { FormTableKind, NewFormType } from '../Forms/const'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

interface ICellInfos extends DrawerProps {
    mode: string
    flowchartId: string
    pMbid?: string
    open: boolean
    onClose: () => void
}

/**
 * 节点信息侧边栏
 * @param open boolean 显示/隐藏
 * @param onClose () => void
 */
const CellInfos: React.FC<ICellInfos> = ({
    mode,
    flowchartId,
    pMbid,
    open,
    onClose,
}) => {
    // 流程图相关信息
    const { drawioInfo, setDrawioInfo } = useContext(DrawioInfoContext)
    const [df, setDf, getDf] = useGetState<any>()
    useMemo(() => {
        setDf(drawioInfo)
    }, [drawioInfo])
    // 存储信息
    const [afFlowchartInfo, setAfFlowchartInfo] = useLocalStorageState<any>(
        `${flowchartId}`,
    )
    const flowInfosMg = useMemo(() => {
        return new FlowchartInfoManager(
            afFlowchartInfo?.flowchartData?.infos || [],
            afFlowchartInfo?.flowchartData?.current,
        )
    }, [afFlowchartInfo])
    const navigator = useNavigate()
    // 请求load
    const [loading, setLoading] = useState(false)
    const [waiting, setWaiting, getWaiting] = useGetState(true)

    // 对话框显示,【true】显示,【false】隐藏
    const [citeFlowVisible, setCiteFlowVisible] = useState(false)
    const [importFlowVisible, setImportFlowVisible] = useState(false)
    const [citeFormVisible, setCiteFormVisible] = useState(false)
    const [createFormVisible, setCreateFormVisible] = useState(false)
    const [importFormVisible, setImportFormVisible] = useState(false)
    // 从数据源导入业务表
    const [importFromDSOpen, setImportFromDSOpen] = useState(false)
    const [preFormVisible, setPreFormVisible] = useState(false)
    const [createVisible, setCreateVisible] = useState(false)
    const [metricVisible, setMetricVisible] = useState(false)
    const [previewMetric, setPreviewMetric] = useState(false)
    const [viewModel, setViewModel] = useState('Create')
    const [selectedList, setSelectedList, getSelectedList] = useGetState<any>(
        {},
    )

    // 节点名称,描述
    const [name, setName, getName] = useGetState<string>('')
    const [description, setDescription] = useState<string>('')
    const [nameEdit, setNameEdit, getNameEdit] = useGetState<boolean>(false)

    // 子流程数据集
    const [flowList, setFlowList, getFlowList] = useGetState<any[]>([])
    // 表单数据集
    const [formList, setFormList] = useState<any[]>([])
    const [metricList, setMetricList] = useState<any[]>([])
    const [flowFormList, setFlowFormList] = useState<any[]>([])
    // 字段数据集
    const [fields, setFields] = useState<any[]>([])
    // 操作的表单
    const [formItem, setFormItem, getFormItem] = useGetState<any>()
    const [completeFormOpen, setCompleteFormOpen] = useState(false)
    const { isDraft, selectedVersion } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])
    // 当前模式
    const vm = useMemo(() => {
        return getViewmode(drawioInfo.viewmode, flowInfosMg.current?.read_only)
    }, [drawioInfo?.viewmode, flowInfosMg])

    // 获取最新数据
    const getLatestData = () => {
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            setAfFlowchartInfo(temp)
            return new FlowchartInfoManager(
                temp?.flowchartData?.infos || [],
                temp?.flowchartData?.current,
            )
        }
        return undefined
    }

    useMemo(async () => {
        if (drawioInfo?.currentFid) {
            await getLatestData()
        }
    }, [drawioInfo?.currentFid])

    useEffect(() => {
        setFlowList([])
        setFormList([])
        setMetricList([])
        setFlowFormList([])
        setFields([])
        setFormItem(undefined)
        if (open && getDf()?.cellInfos) {
            // 赋值名称、描述
            setName(getDf()?.cellInfos?.value)
            setDescription(getDf()?.cellInfos?.description)
            // 获取相关数据
            if (getDf()?.cellInfos?.shape === CellInfosType.PROCESS) {
                // 获取子流程
                queryFlowList()
            } else if (getDf()?.cellInfos?.shape === CellInfosType.TOTAL) {
                // 显示全部信息前先保存
                setWaiting(true)
                if (vm === '1') {
                    queryFormList()
                    return
                }
                operateAfterSave(getDf(), 'forFlowSideInfo')
            } else {
                // 获取表单
                queryFormList()
            }
        }
    }, [drawioInfo?.cellInfos?.id, open])

    useEffect(() => {
        // drawio的消息处理
        const handleMessage = (e) => {
            try {
                if (typeof e?.data === 'string') {
                    const data = JSON.parse(e?.data)
                    const { event } = data
                    switch (event) {
                        case 'af_changeCellValue':
                            // 同步drawio中的cell值
                            changeCellValueFromDio(data)
                            break
                        case 'af_flowContent':
                            // 获取drawio文件内容
                            saveFlowForJump(data)
                            break
                        default:
                            break
                    }
                }
            } catch (error) {
                // console.log('error ', error)
            }
        }

        window.addEventListener('message', handleMessage, false)
        return () => {
            window.removeEventListener('message', handleMessage, false)
        }
    }, [])

    // drawio文本值同步到输入框
    const changeCellValueFromDio = (data) => {
        if (getNameEdit()) {
            return
        }
        const { cellInfos } = data
        if (!cellInfos.id) {
            return
        }
        if (
            cellInfos?.shape === CellInfosType.NORMAL ||
            cellInfos?.shape === CellInfosType.PROCESS
        ) {
            setName(cellInfos?.value)
            setDrawioInfo({
                ...getDf(),
                cellInfos,
            })
        }
    }

    // 跳转前保存流程图
    const saveFlowForJump = async (data?) => {
        const { flag } = data
        if (
            [
                'forFlowSideInfo',
                'forCreateForm',
                'forEditForm',
                'forCreateFlow',
                'forCiteFlow',
                'forImportFlow',
                'forJumpOpen',
                'forJumpFlow',
                'forEditIndicator',
            ].includes(flag)
        ) {
            const fm = await getLatestData()
            const bo = await saveFlowRequest(
                fm?.current?.mid,
                fm?.current?.fid,
                getDf()?.taskId,
                data,
                getDf(),
            )
            switch (flag) {
                case 'forCreateFlow':
                    createFlow()
                    break
                case 'forEditForm':
                    gotoFormsPage(getFormItem())
                    break
                case 'forEditIndicator':
                    gotoModelPage(getSelectedList())
                    break
                case 'forCiteFlow':
                    setWaiting(false)
                    break
                case 'forCreateForm':
                    setCreateFormVisible(true)
                    break
                case 'forFlowSideInfo':
                    queryFormList()
                    break
                case 'forJumpFlow':
                    previewFlow()
                    break
                case 'forImportFlow':
                    setImportFlowVisible(true)
                    break
                default:
                    break
            }
        }
    }

    // 输入项值变化同步到drawio
    const handleValueChanged = (type, val) => {
        let evtName = 'dio_changeCellValue'
        if (type === 'name') {
            setName(val)
        } else {
            setDescription(val)
            evtName = 'dio_changeCellDescription'
        }
        setDrawioInfo({
            ...getDf(),
            cellInfos: { ...getDf().cellInfos, value: val },
        })
        // 通知drawio同步更改cell的值
        getDf()?.iframe?.current?.contentWindow?.postMessage(
            JSON.stringify({
                event: evtName,
                id: getDf()?.cellInfos?.id,
                value: val,
            }),
            '*',
        )
    }

    // 查询表单列表
    const queryFormList = async () => {
        try {
            setLoading(true)
            const fm = await getLatestData()
            const res = await flowBindFormsQuery(
                fm?.current?.mid,
                fm?.current?.fid,
                {
                    node_id: getDf()?.cellInfos?.id,
                    ...versionParams,
                },
            )
            setFormList(res.node_related)
            setMetricList(res.node_related_indicators)
            setFlowFormList(res.flow_related)
            // 更新数量
            if (getDf()?.cellInfos?.id) {
                noticeDrawioChangeFormCount(getDf(), [
                    {
                        forms_counts: res.node_related.length || 0,
                        node_id: getDf()?.cellInfos?.id,
                    },
                ])
            }
        } catch (e) {
            setFormList([])
            setMetricList([])
            setFlowFormList([])
            // formatError(e)
        } finally {
            setLoading(false)
            setWaiting(false)
        }
    }

    // 查询子流程列表
    const queryFlowList = async () => {
        try {
            setLoading(true)
            const fm = await getLatestData()
            let lastInfo
            if (getFlowList().length > 0) {
                lastInfo = getFlowList()?.[0]
            }
            const res = await flowBindFlowQuery(
                fm?.current?.mid,
                fm?.current?.fid,
                {
                    node_id: getDf()?.cellInfos?.id,
                    ...versionParams,
                },
            )
            const flow = res?.[0]
            if (
                flow &&
                ((flow?.is_ref && flow?.main_business_id) ||
                    (!flow?.is_ref && flow?.flowchart_id))
            ) {
                setFlowList(res)
                // if (lastInfo?.flowchart_id !== flow?.flowchart_id) {
                //     bindFlowChanged(getDf()?.cellInfos?.id)
                // }
            } else {
                setFlowList([])
            }
        } catch (e) {
            setFlowList([])
            // formatError(e)
        } finally {
            setLoading(false)
        }
    }

    // 获取表单字段信息
    const queryFormFields = async (item?) => {
        try {
            const res = await getFormsFieldsList(item?.id, {
                limit: 0,
                ...versionParams,
            })
            setFields(res.entries)
        } catch (error) {
            setFields([])
            formatError(error)
        }
    }

    // 子流程的相关操作
    const handleFlowOperate = (key, item?) => {
        switch (key) {
            case OperateType.Pro_CREATE:
                operateAfterSave(getDf(), 'forCreateFlow')
                break
            case OperateType.Pro_CITE:
                setWaiting(true)
                setCiteFlowVisible(true)
                operateAfterSave(getDf(), 'forCiteFlow')
                break
            case OperateType.Pro_DELETE:
                deleteFlow(item)
                break
            case OperateType.Pro_PREVIEW:
                if (vm === '1') {
                    previewFlow()
                    return
                }
                operateAfterSave(getDf(), 'forJumpFlow')
                break
            case OperateType.Pro_OPEN:
                if (vm !== '1') {
                    operateAfterSave(getDf(), 'forJumpOpen')
                }
                openWindowPreviewFlow({
                    ...flowList[0],
                    viewType: getDf()?.viewType,
                })
                break
            case OperateType.Pro_UNBIND:
                // unbindFlow(item)
                break
            case OperateType.Pro_IMPORT:
                operateAfterSave(getDf(), 'forImportFlow')
                break
            default:
                break
        }
    }

    // 创建子流程并跳转
    const createFlow = async () => {
        try {
            const fm = await getLatestData()
            const res = await flowCreateWithModel(
                `${getName()}`,
                getDf()?.cellInfos?.id,
                getDf()?.taskId,
                fm?.current?.mid,
                fm?.current?.fid,
            )
            // 流程图相关信息存储
            const { business_model_id, flowchart_id } = res[0]
            const path = `${fm?.current?.path}/${
                getDf()?.cellInfos?.id
            }/${flowchart_id}`
            const flowInfo = {
                mid: business_model_id,
                fid: flowchart_id,
                title: getName(),
                isRoot: false,
                is_ref: false,
                innerVm: vm || '1',
                read_only: false,
                mbsid: fm?.current?.mbsid || '',
                path,
                absolutePath: '',
            }
            fm?.addData(flowInfo)
            fm?.onCurrentData(path)
            setAfFlowchartInfo({
                ...afFlowchartInfo,
                flowchartData: fm,
            })
            setDrawioInfo({ ...getDf(), currentFid: flowchart_id })
            message.success(__('新建成功'))
        } catch (e) {
            formatError(e)
        }
    }

    // 子流程解除绑定
    const unbindFlow = async (item) => {}

    // 子流程删除
    const deleteFlow = async (item) => {
        try {
            const fm = await getLatestData()
            await flowDeleteFormModel(
                getDf()?.cellInfos?.id,
                item?.business_model_id,
                'model',
                '',
                fm?.current?.mid,
                fm?.current?.fid,
            )
            message.success(__('移除成功'))
            setFlowList([])
            bindFlowChanged(getDf()?.cellInfos?.id)
        } catch (e) {
            formatError(e)
        }
    }

    // 导入子流程
    const importFlow = () => {
        setImportFlowVisible(true)
    }

    // 子流程绑定变更
    const bindFlowChanged = (id: string) => {
        window.postMessage(
            JSON.stringify({
                event: 'af_bindFlowChanged',
                id,
            }),
            '*',
        )
    }

    // 查看子流程图
    const previewFlow = async () => {
        const {
            flowchart_id,
            flowchart_name,
            is_ref,
            business_model_id,
            main_business_id,
        } = getFlowList()[0]
        if (is_ref && !flowchart_id) {
            messageError(__('当前引用的业务模型下无业务流程'))
            return
        }
        const fm = await getLatestData()
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            // 流程图相关信息存储
            const path = `${fm?.current?.path}/${
                getDf()?.cellInfos?.id
            }/${flowchart_id}`
            const oldData = fm?.find(path)
            const flowInfo = {
                mid: business_model_id,
                fid: flowchart_id,
                title: flowchart_name,
                isRoot: false,
                is_ref,
                read_only: fm?.current?.read_only || is_ref,
                mbsid: main_business_id || fm?.current?.mbsid,
                path,
                absolutePath: oldData?.absolutePath || '',
            }
            fm?.addData(flowInfo)
            fm?.onCurrentData(path)
            setAfFlowchartInfo({
                ...temp,
                flowchartData: fm,
            })
            setDrawioInfo({ ...getDf(), currentFid: flowchart_id })
        }
    }

    // 业务表的相关操作
    const handleFormOperate = async (key, item?) => {
        setFormItem(item)
        switch (key) {
            case OperateType.Form_PREVIEW:
                queryFormFields(item)
                setPreFormVisible(true)
                break
            case OperateType.Form_DELETE:
                deleteForm(item)
                break
            case OperateType.Form_CREATE:
                operateAfterSave(getDf(), 'forCreateForm')
                break
            case OperateType.Form_CITE:
                setCiteFormVisible(true)
                break
            case OperateType.Form_IMPORT:
                await getLatestData()
                setImportFormVisible(true)
                break
            case OperateType.Datasource_IMPORT:
                setImportFromDSOpen(true)
                break
            case OperateType.Form_EDIT: {
                operateAfterSave(getDf(), 'forEditForm')
                break
            }
            default:
                break
        }
    }

    // 指标的相关操作
    const handleMetricOperate = async (key, item?) => {
        setFormItem(item)
        switch (key) {
            case OperateType.Model_CREATE:
                setCreateVisible(true)
                break
            case OperateType.Model_LINK:
                setMetricVisible(true)
                break
            case OperateType.Form_DELETE:
                deleteMetric(item)
                break
            case OperateType.Form_PREVIEW: // 指标预览数据
                setSelectedList(item)
                setPreviewMetric(true)
                break
            case OperateType.Form_EDIT: {
                setSelectedList(item)
                operateAfterSave(getDf(), 'forEditIndicator')
                break
            }
            default:
                break
        }
    }
    // 表单页面url相关
    const formUrlParam = () => {
        if (getDf()) {
            const {
                viewmode,
                viewType,
                taskId,
                saved,
                taskType,
                projectId,
                backUrl,
                rootFlowId,
                taskExecutableStatus,
            } = getDf()
            const tempStr = window.localStorage.getItem(`${flowchartId}`)
            if (tempStr !== null) {
                const temp = JSON.parse(tempStr || '')
                return `viewType=${viewType}&business_model_id=${
                    temp?.flowchartData?.current?.mid
                }&flowchart_id=${
                    temp?.flowchartData?.current?.fid
                }&rootFlowId=${rootFlowId}&viewmode=${viewmode}&taskId=${taskId}&saved=${saved}&defaultModel=${
                    viewmode === '1' ? 'view' : 'edit'
                }&taskType=${taskType}&taskExecutableStatus=${taskExecutableStatus}&projectId=${projectId}&backUrl=${backUrl}`
            }
        }
        return ''
    }

    // 跳转表单页面
    const gotoFormsPage = (formData) => {
        const formId = formData?.id
        const fm = getLatestData()
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            setAfFlowchartInfo({
                ...temp,
                isRecord: true,
            })
            const url = formUrlParam()

            if (formData.form_type === NewFormType.DSIMPORT) {
                navigator(
                    `/formGraph/importFromDS?mid=${fm?.root?.mid}&fid=${formId}&dfid=${formData?.from_table_id}&isComplete=${formData?.is_completed}&redirect=/drawio&${url}&defaultModel=edit&targetTab=form&isDraft=${isDraft}&versionId=${selectedVersion}`,
                )
            } else {
                navigator(
                    `/formGraph/view?mid=${fm?.root?.mid}&fid=${formId}&redirect=/drawio&${url}&isDraft=${isDraft}&versionId=${selectedVersion}`,
                )
            }
        }
    }
    // 跳转指标页面
    const gotoModelPage = (item) => {
        const fm = getLatestData()
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            setAfFlowchartInfo({
                ...temp,
                isRecord: true,
            })
            // const url = formUrlParam()
            const { id } = item

            const backUrl = encodeURIComponent(
                `/drawio${window.location.search}`,
            )
            window.location.replace(
                getActualUrl(
                    `/coreIndicator/${fm?.root?.mbsid}?id=${id}&optType=${OptType.EDIT}&redirect=${backUrl}`,
                ),
            )
        }
    }
    //  指标删除
    const deleteMetric = async (item) => {
        try {
            const fm = await getLatestData()
            await flowDeleteFormModel(
                getDf()?.cellInfos?.id,
                item?.id,
                'indicator',
                '',
                fm?.current?.mid,
                fm?.current?.fid,
            )
            message.success(__('移除成功'))
        } catch (e) {
            formatError(e)
        } finally {
            queryFormList()
        }
    }

    // 表单删除
    const deleteForm = async (item) => {
        try {
            const fm = await getLatestData()
            await flowDeleteFormModel(
                getDf()?.cellInfos?.id,
                item?.id,
                'form',
                '',
                fm?.current?.mid,
                fm?.current?.fid,
            )
            message.success(__('移除成功'))
        } catch (e) {
            formatError(e)
        } finally {
            queryFormList()
        }
    }

    return (
        <SiderDrawer
            titleText={
                getDf()?.cellInfos?.shape === CellInfosType.TOTAL
                    ? vm === '1'
                        ? __('流程信息')
                        : __('流程配置')
                    : vm === '1'
                    ? __('节点信息')
                    : __('节点配置')
            }
            mask={false}
            autoFocus={false}
            onClose={onClose}
            open={open}
            placement="right"
            className={styles.cellInfosWrapper}
            footer={undefined}
            style={
                mode === 'preview'
                    ? {
                          position: 'absolute',
                          overflow: 'hidden',
                          marginTop: 52,
                          borderRight: '1px solid rgb(0 0 0 / 6%)',
                      }
                    : {
                          position: 'absolute',
                          marginTop: 52,
                          overflow: 'hidden',
                          zIndex: 999,
                      }
            }
            getContainer={false}
        >
            <BasicTitle
                text={__('基本信息')}
                icon={false}
                hidden={getDf()?.cellInfos?.shape === CellInfosType.TOTAL}
            >
                <div hidden={vm === '1'} className={styles.ci_infosWrapper}>
                    <div className={styles.ci_rowWrapper}>
                        <span
                            style={{
                                color: '#ff4d4f',
                                marginRight: 4,
                                fontSize: 16,
                            }}
                            hidden={
                                getDf()?.cellInfos?.shape !==
                                CellInfosType.PROCESS
                            }
                        >
                            *
                        </span>
                        {__('节点名称')}：
                    </div>
                    <Input
                        placeholder={__('请输入名称')}
                        style={{ marginTop: 10 }}
                        value={name}
                        onChange={(e) =>
                            handleValueChanged('name', e.target.value)
                        }
                        maxLength={128}
                        onFocus={() => setNameEdit(true)}
                        onBlur={() => setNameEdit(false)}
                    />
                    <div className={styles.ci_rowWrapper}>
                        {__('节点描述')}：
                    </div>
                    <Input.TextArea
                        style={{
                            height: 76,
                            resize: `none`,
                            margin: '10px 0 8px',
                        }}
                        placeholder={__('请输入描述')}
                        maxLength={255}
                        value={description}
                        onChange={(e) =>
                            handleValueChanged('description', e.target.value)
                        }
                    />
                </div>
                <div hidden={vm !== '1'} className={styles.ci_infosWrapper}>
                    <div className={styles.ci_rowWrapper}>
                        <span className={styles.ci_rowTitle}>
                            {__('节点名称')}：
                        </span>
                        <span
                            title={getDf()?.cellInfos?.value}
                            className={styles.ci_rowName}
                        >
                            {getDf()?.cellInfos?.value || '--'}
                        </span>
                    </div>
                    <div className={styles.ci_rowWrapper}>
                        <span className={styles.ci_rowTitle}>
                            {__('节点描述')}：
                        </span>
                        <span
                            title={getDf()?.cellInfos?.description}
                            className={styles.ci_rowDesc}
                            style={{
                                color: getDf()?.cellInfos?.description
                                    ? undefined
                                    : 'rgb(0 0 0 / 45%)',
                            }}
                        >
                            {getDf()?.cellInfos?.description || __('暂无描述')}
                        </span>
                    </div>
                </div>
            </BasicTitle>
            <div hidden={getDf()?.cellInfos?.shape !== CellInfosType.PROCESS}>
                <SubTitle
                    text={__('关联子流程')}
                    style={{ fontWeight: 550, marginBottom: 11 }}
                    menuDisabledText={
                        trim(name) ? '' : __('请输入节点名称后，再关联子流程')
                    }
                    menuItems={processMenuItems}
                    onOperate={handleFlowOperate}
                    menu={vm !== '1' && flowList.length === 0}
                />
                <List
                    dataSource={flowList}
                    renderItem={(item) => (
                        <List.Item
                            key={item?.flowchart_id || item?.main_business_id}
                        >
                            <ProcessItem
                                data={item}
                                onOperate={(o) => handleFlowOperate(o, item)}
                                more={vm !== '1'}
                                del={vm !== '1'}
                            />
                        </List.Item>
                    )}
                    locale={{
                        emptyText: (
                            <Empty
                                desc={
                                    <>
                                        <div>{__('暂无子流程图')}</div>
                                        {vm !== '1' && (
                                            <div>
                                                {__('可点击【+】按钮进行关联')}
                                            </div>
                                        )}
                                    </>
                                }
                                iconSrc={dataEmpty}
                            />
                        ),
                    }}
                    loading={loading}
                    className={styles.ci_list}
                    split={false}
                />
            </div>
            <div hidden={getDf()?.cellInfos?.shape !== CellInfosType.TOTAL}>
                <SubTitle
                    text={__('流程关联业务节点表')}
                    menuItems={formMenuItems}
                    onOperate={handleFormOperate}
                    style={{ fontWeight: 550, marginBottom: 11 }}
                    menu={vm !== '1'}
                    menuMinWi={122}
                />
                <List
                    dataSource={flowFormList}
                    renderItem={(item) => (
                        <List.Item key={item.id}>
                            <BusFormItem
                                data={item}
                                onOperate={(o) => handleFormOperate(o, item)}
                                more={vm !== '1'}
                                small
                            />
                        </List.Item>
                    )}
                    locale={{
                        emptyText: (
                            <Empty
                                desc={
                                    <>
                                        <div>{__('暂无业务节点表')}</div>
                                        {vm !== '1' && (
                                            <div>
                                                {__('可点击【+】按钮进行关联')}
                                            </div>
                                        )}
                                    </>
                                }
                                iconSrc={dataEmpty}
                            />
                        ),
                    }}
                    loading={loading || getWaiting()}
                    className={styles.ci_list}
                    split={false}
                />
            </div>
            <div hidden={getDf()?.cellInfos?.shape === CellInfosType.PROCESS}>
                <SubTitle
                    text={
                        getDf()?.cellInfos?.shape === CellInfosType.NORMAL
                            ? __('关联业务节点表')
                            : __('节点关联业务节点表')
                    }
                    menuItems={formMenuItems}
                    onOperate={handleFormOperate}
                    style={{ fontWeight: 550, marginBottom: 11 }}
                    menu={
                        vm !== '1' &&
                        getDf()?.cellInfos?.shape === CellInfosType.NORMAL
                    }
                    menuMinWi={
                        getDf()?.cellInfos?.shape === CellInfosType.NORMAL
                            ? 122
                            : 100
                    }
                />
                <List
                    dataSource={formList}
                    renderItem={(item) => (
                        <List.Item key={item.id}>
                            <BusFormItem
                                data={item}
                                onOperate={(o) => handleFormOperate(o, item)}
                                more={
                                    vm !== '1' &&
                                    getDf()?.cellInfos?.shape ===
                                        CellInfosType.NORMAL
                                }
                                small={
                                    getDf()?.cellInfos?.shape !==
                                    CellInfosType.TOTAL
                                }
                            />
                        </List.Item>
                    )}
                    locale={{
                        emptyText: (
                            <Empty
                                desc={
                                    <>
                                        <div>{__('暂无业务表')}</div>
                                        {vm !== '1' &&
                                            getDf()?.cellInfos?.shape ===
                                                CellInfosType.NORMAL && (
                                                <div>
                                                    {__(
                                                        '可点击【+】按钮进行关联',
                                                    )}
                                                </div>
                                            )}
                                    </>
                                }
                                iconSrc={dataEmpty}
                            />
                        ),
                    }}
                    loading={loading || getWaiting()}
                    className={styles.ci_list}
                    split={false}
                />
            </div>

            {/* 关联业务指标 */}
            <div hidden={getDf()?.cellInfos?.shape === CellInfosType.PROCESS}>
                <SubTitle
                    text={
                        getDf()?.cellInfos?.shape === CellInfosType.NORMAL
                            ? '关联业务指标'
                            : '节点关联业务指标'
                    }
                    menuItems={metricMenuItems}
                    onOperate={handleMetricOperate}
                    style={{ fontWeight: 550, marginBottom: 11 }}
                    menu={
                        vm !== '1' &&
                        getDf()?.cellInfos?.shape === CellInfosType.NORMAL
                    }
                />
                <List
                    dataSource={metricList}
                    renderItem={(item) => (
                        <List.Item key={item.id}>
                            <BusFormItem
                                data={item}
                                onOperate={(o) => handleMetricOperate(o, item)}
                                more={
                                    vm !== '1' &&
                                    getDf()?.cellInfos?.shape ===
                                        CellInfosType.NORMAL
                                }
                                small={false}
                                type="metric"
                            />
                        </List.Item>
                    )}
                    locale={{
                        emptyText: (
                            <Empty
                                desc={
                                    <>
                                        <div>{__('暂无关联业务指标')}</div>
                                        {vm !== '1' &&
                                            getDf()?.cellInfos?.shape ===
                                                CellInfosType.NORMAL && (
                                                <div>
                                                    {__(
                                                        '可点击【+】按钮进行关联',
                                                    )}
                                                </div>
                                            )}
                                    </>
                                }
                                iconSrc={dataEmpty}
                            />
                        ),
                    }}
                    loading={loading || getWaiting()}
                    className={styles.ci_list}
                    split={false}
                />
            </div>
            <CiteForm
                visible={citeFormVisible}
                existing={
                    getDf()?.cellInfos?.shape === CellInfosType.TOTAL
                        ? flowFormList.map((f) => f.id)
                        : formList.map((f) => f.id)
                }
                flowchartId={flowchartId}
                onClose={(op) => {
                    setCiteFormVisible(false)
                    if (op) {
                        handleFormOperate(op)
                    }
                }}
                onSure={() => {
                    setCiteFormVisible(false)
                    queryFormList()
                }}
            />
            <CiteFlow
                visible={citeFlowVisible}
                waiting={getWaiting()}
                flowchartId={flowchartId}
                onClose={(op) => {
                    setCiteFlowVisible(false)
                    handleFlowOperate(op)
                }}
                onSure={() => {
                    setCiteFlowVisible(false)
                    queryFlowList()
                }}
            />
            <ImportForm
                visible={importFormVisible}
                formType={2}
                mid={getDf()?.rootMid}
                node_id={getDf()?.cellInfos?.id}
                flowchart_id={flowInfosMg?.current?.fid}
                taskId={getDf()?.taskId}
                update={() => {
                    queryFormList()
                }}
                onClose={() => setImportFormVisible(false)}
                onlyShowTableKind={FormTableKind.BUSINESS}
            />
            {/* <ImportFromDataSource
                open={importFromDSOpen}
                onClose={() => setImportFromDSOpen(false)}
                mid={getDf()?.rootMid}
                onUpdate={() => {
                    queryFormList()
                }}
                taskId={getDf()?.taskId}
                jumpUrl={formUrlParam()}
                node_id={getDf()?.cellInfos?.id}
                pMbid={pMbid || ''}
                isDrawio
                flowchartId={flowchartId}
            /> */}
            <FieldTableView
                visible={preFormVisible}
                formId={formItem?.id}
                items={fields}
                model="view"
                onClose={() => {
                    setPreFormVisible(false)
                    setFields([])
                }}
                isDrawio
            />
            <CreateForm
                visible={createFormVisible}
                onClose={() => {
                    setCreateFormVisible(false)
                }}
                okText={__('下一步')}
                taskId={getDf()?.taskId}
                jumpUrl={formUrlParam()}
                mid={getDf()?.rootMid}
                node_id={getDf()?.cellInfos?.id}
                flowchart_id={flowInfosMg?.current?.fid}
                onUpdate={() => {
                    queryFormList()
                }}
                onlyShowTableKind={FormTableKind.BUSINESS}
                title={__('新建业务节点表')}
            />
            <ImportFlow
                visible={importFlowVisible}
                mid={flowInfosMg?.current?.mid || ''}
                node_id={getDf()?.cellInfos?.id}
                node_name={getDf()?.cellInfos?.value}
                flowchart_id={flowInfosMg?.current?.fid}
                taskId={getDf()?.taskId}
                onClose={() => setImportFlowVisible(false)}
                onSure={() => {
                    queryFlowList()
                }}
            />
            {/* 新建指标模型 */}
            {createVisible && (
                <CreateModel
                    onClose={() => {
                        setCreateVisible(false)
                    }}
                    jumpUrl={formUrlParam()}
                    mid={getDf()?.rootMid} // 业务模型id
                    viewType={OptionModel.CreateModel}
                    taskId={getDf()?.taskId}
                />
            )}
            {/* 查看指标数据 */}
            {previewMetric && (
                <ViewMetricModal
                    onClose={() => {
                        setPreviewMetric(false)
                    }}
                    indicatorId={getSelectedList()?.id} // 业务模型id
                    metricList={metricList}
                />
            )}
            {/* 关联指标模型 */}
            {metricVisible && (
                <SelectMetricList
                    flowchartId={flowchartId}
                    values={metricList}
                    mid={getDf()?.rootMid} // 业务模型id
                    onClose={() => {
                        setMetricVisible(false)
                    }}
                    onConfirm={(values) => {
                        queryFormList()
                        setMetricVisible(false)
                    }}
                />
            )}
            {/* 完善业务表 */}
            {completeFormOpen && (
                <CreateForm
                    onClose={() => {
                        setCompleteFormOpen(false)
                    }}
                    mid={getDf()?.rootMid}
                    onUpdate={() => {
                        queryFormList()
                    }}
                    taskId={getDf()?.taskId}
                    formType={NewFormType.DSIMPORT}
                    formInfo={formItem}
                    jumpUrl={formUrlParam()}
                />
            )}
        </SiderDrawer>
    )
}

export default CellInfos
