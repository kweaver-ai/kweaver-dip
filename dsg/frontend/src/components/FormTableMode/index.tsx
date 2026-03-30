import {
    FC,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Modal, Space, Tabs, Tooltip, message } from 'antd'
import { InfoCircleFilled } from '@ant-design/icons'
import { noop } from 'lodash'
import HeaderToolBar from './HeaderToolBar'
import { combUrl, getQueryData } from '../FormGraph/helper'
import { StandardDataDetail, ViewModel } from './const'
import { BianJiYeMianColored } from '@/icons'
import {
    IGradeLabel,
    TaskExecutableStatus,
    TaskStatus,
    TaskType,
    formatError,
    saveBusinessFormFields,
    saveFields,
    saveFormGraph,
} from '@/core'
import { NewFormType } from '../Forms/const'
import { getActualUrl } from '@/utils'
import styles from './styles.module.less'
import __ from './locale'
import EditFormConfig from '../FormGraph/EditFormConfig'
import FieldsTable from './FieldsTable'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import ViewFormDetail from '../FormGraph/ViewFormDetail'

interface IFormGraphModel {
    ref: any
    initData?: any
    formType
    graphContent?: string
    updateChangeBtn?: (status: boolean) => void
    isStart: boolean
    tagData: IGradeLabel[]
    initDepartmentId?: string
}

const FormTableMode: FC<IFormGraphModel> = forwardRef(
    (
        {
            initData,
            formType,
            graphContent,
            updateChangeBtn = noop,
            isStart,
            tagData,
            initDepartmentId,
        }: any,
        ref,
    ) => {
        // 初始数据 initFields 字段数组， initFormInfo 除字段以外的表数据
        const { fields: initFields, ...initFormInfo } = initData
        // 地址栏的参数
        const [searchParams, setSearchParams] = useSearchParams()
        //
        const navigator = useNavigate()
        // 表id
        const fid = searchParams.get('fid') || ''
        // 主干业务id
        const mid = searchParams.get('mid') || ''

        // 需要重定向的地址
        const redirect = searchParams.get('redirect')

        // 任务id
        const taskId = searchParams.get('taskId') || ''

        // 当前的模式
        const [model, setModel] = useState(
            searchParams.get('defaultModel') || 'view',
        )
        // 表数据
        const [formInfo, setFormInfo] = useState<any>(initFormInfo)

        // 字段数组
        const [fields, setFields] = useState<Array<any>>(initFields)
        // 地址栏参数的字符串
        const { search } = useLocation()
        // 存储需要的地址栏参数
        const [queryData, setQueryData] = useState<any>(getQueryData(search))
        // 保存结果
        const [saveResultData, setSaveResultData] = useState<Array<string>>([])

        // 业务表信息编辑的ref， 用于存储子组件方法
        const formTableRef: any = useRef()

        // 当前编辑的业务表信息
        const [editFormId, setEditFormId] = useState<string>('')

        const [saveBtnStatus, setSaveBtnStatus] = useState<boolean>(false)

        const [isShowEdit, setIsShowEdit] = useState<boolean>(false)
        const { checkPermission } = useUserPermCtx()

        // 编码规则/码表集合
        const standardRuleDetails: StandardDataDetail = new StandardDataDetail(
            [],
            [],
        )

        // 监听初始数据变化更新表和字段的信息
        useEffect(() => {
            const { fields: currentFields, ...currentFormInfo } = initData
            setFormInfo(currentFormInfo)
            setFields(currentFields)
            initStandardRuleDetails()
            initEditStatus()
        }, [initData])

        useEffect(() => {
            updateChangeBtn(saveBtnStatus)
        }, [saveBtnStatus])

        /**
         * 初始化获取标准类型
         */
        const initStandardRuleDetails = async () => {}

        const initEditStatus = () => {
            const querySearch = getQueryData(search)
            let res = true
            if (
                taskId &&
                querySearch &&
                ((querySearch.taskType &&
                    querySearch.taskType !== TaskType.MODEL &&
                    querySearch.taskType !== TaskType.DATAMODELING) ||
                    (querySearch.taskStatus &&
                        querySearch.taskStatus === TaskStatus.COMPLETED) ||
                    (querySearch.taskExecutableStatus &&
                        querySearch.taskExecutableStatus !==
                            TaskExecutableStatus.EXECUTABLE))
            ) {
                setModel('view')
                res = false
            }
            setIsShowEdit(
                res &&
                    !!checkPermission(
                        'manageBusinessModelAndBusinessDiagnosis',
                    ),
            )
        }

        /**
         * 保存业务表数据
         */
        const handleSaveData = async (values) => {
            try {
                if (formType === NewFormType.BLANK) {
                    const { unquoted_fields } = await saveFields(mid, fid, {
                        fields: values.map((field) => ({
                            ...field,
                            label_id: Array.isArray(field.label_id)
                                ? field.label_id[field.label_id.length - 1]
                                : field.label_id,
                        })),
                        task_id: taskId,
                    })
                    if (graphContent) {
                        await saveFormGraph(mid, fid || '', {
                            task_id: taskId,
                            content: graphContent,
                        })
                    }
                    message.success('保存成功')
                    if (unquoted_fields.length) {
                        setSaveResultData(
                            unquoted_fields.map((unquoted) => unquoted.name),
                        )
                    } else {
                        if (searchParams.get('jumpMode') !== 'win') {
                            navigator(combUrl(queryData))
                            return
                        }
                        window.open(getActualUrl(combUrl(queryData)), '_self')
                    }
                } else {
                    await saveBusinessFormFields(mid, fid, {
                        fields: values.map((field) => ({
                            ...field,
                            label_id: Array.isArray(field.label_id)
                                ? field.label_id[field.label_id.length - 1]
                                : field.label_id,
                        })),
                        task_id: taskId,
                    })
                    message.success(__('保存成功'))
                    if (searchParams.get('jumpMode') === 'win') {
                        window.open(getActualUrl(combUrl(queryData)), '_self')
                        return
                    }
                    navigator(combUrl(queryData))
                }
            } catch (ex) {
                if (
                    ex?.data?.code === 'BusinessGrooming.Form.InvalidParameter'
                ) {
                    message.error(__('信息不完整，请完善后再保存'))
                    return
                }
                formatError(ex)
            }
        }

        /**
         * 切换模式到编辑模式
         */
        const handleSwitchModeToEdit = () => {
            const locationUrl = window.location.href
            const regx = /defaultModel=view/i

            window.history.replaceState(
                {},
                'title',
                locationUrl.replace(regx, 'defaultModel=edit'),
            )
            setModel('edit')
        }

        useImperativeHandle(ref, () => ({
            getTargetData: () => {
                return {
                    ...formInfo,
                    fields: formTableRef?.current?.getFields() || [],
                }
            },
            validateFields: formTableRef?.current?.validateFields,
            getDepartmentId: () => {
                return initDepartmentId
            },
        }))

        return (
            <div className={styles.tableContainer}>
                <HeaderToolBar
                    model={model as ViewModel}
                    onSwitchModel={handleSwitchModeToEdit}
                    onSave={() => {
                        formTableRef?.current?.onSave(handleSaveData)
                    }}
                    formInfo={formInfo}
                    queryData={queryData}
                    saveDisabled={saveBtnStatus}
                    isShowEdit={isShowEdit}
                />
                <div className={styles.contentWrapper}>
                    <div className={styles.titleText}>{__('业务表列表')}</div>
                    <div className={styles.contentContainer}>
                        <div
                            onClick={() => {
                                setEditFormId(formInfo.id)
                            }}
                            className={styles.formNameText}
                        >
                            <span className={styles.nameText}>
                                {formInfo.name}
                            </span>
                            {model === ViewModel.Edit ? (
                                <Tooltip title={__('编辑业务表信息')}>
                                    <BianJiYeMianColored
                                        className={styles.editBtn}
                                    />
                                </Tooltip>
                            ) : null}
                        </div>

                        <div className={styles.titleLines} />
                        <div style={{ height: 'calc(100% - 63px)' }}>
                            <FieldsTable
                                ref={formTableRef}
                                model={model as ViewModel}
                                initFields={fields}
                                taskId={taskId}
                                formInfo={formInfo}
                                standardRuleDetail={standardRuleDetails}
                                updateSaveBtn={setSaveBtnStatus}
                                onSave={handleSaveData}
                                formType={formType}
                                isStart={isStart}
                                tagData={tagData}
                                initDepartmentId={initDepartmentId}
                            />
                        </div>
                    </div>
                    {editFormId ? (
                        model === ViewModel.Edit ? (
                            <EditFormConfig
                                formId={editFormId}
                                mid={mid}
                                model={model}
                                taskId={taskId}
                                onClose={() => {
                                    setEditFormId('')
                                }}
                                onUpdate={(info) => {
                                    setFormInfo({
                                        ...formInfo,
                                        ...info,
                                    })
                                }}
                            />
                        ) : (
                            <ViewFormDetail
                                formId={editFormId}
                                mid={mid}
                                onClose={() => {
                                    setEditFormId('')
                                }}
                            />
                        )
                    ) : null}
                </div>

                {saveResultData.length ? (
                    <Modal
                        open
                        width={480}
                        onCancel={() => {
                            // setDeleteFormNode(null)
                        }}
                        title={null}
                        closable={false}
                        maskClosable={false}
                        getContainer={false}
                        className={styles.tipMessage}
                        footer={
                            <div>
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        navigator(combUrl(queryData))
                                        setSaveResultData([])
                                    }}
                                >
                                    {__('知道了')}
                                </Button>
                            </div>
                        }
                    >
                        <div className={styles.dupBody}>
                            <div>
                                <span className={styles.dupInfoIcon}>
                                    <InfoCircleFilled />
                                </span>
                            </div>
                            <div className={styles.dupContent}>
                                <div className={styles.dupTitle}>
                                    {__(
                                        '引用的字段可能已被删除，系统已将其变更为复制',
                                    )}
                                </div>
                                <div className={styles.dupNamelist}>
                                    <Space wrap>
                                        {saveResultData.map(
                                            (hasFiled, index) => {
                                                return (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                        }}
                                                    >
                                                        <div
                                                            className={
                                                                styles.dupNameItem
                                                            }
                                                            title={hasFiled}
                                                        >
                                                            {hasFiled}
                                                        </div>
                                                        {index + 1 ===
                                                        saveResultData.length
                                                            ? ''
                                                            : '、'}
                                                    </div>
                                                )
                                            },
                                        )}
                                    </Space>
                                </div>
                            </div>
                        </div>
                    </Modal>
                ) : null}
            </div>
        )
    },
)

export default FormTableMode
