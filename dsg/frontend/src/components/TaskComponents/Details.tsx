import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Popconfirm, Tabs, TabsProps, Tooltip } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import moment from 'moment'
import classnames from 'classnames'
import {
    LoginPlatform,
    SortDirection,
    SortType,
    TaskConfigStatus,
    TaskPriority,
    TaskType,
    formatError,
    formsEnumConfig,
    getCoreBusinessIndicators,
    getCoreBusinesses,
    getFormsFieldsList,
} from '@/core'
import styles from './styles.module.less'
import ProjectIconOutlined from '@/icons/ProjectIconOutlined'
import {
    getTaskTypeIcon,
    TaskConfigStatusText,
    taskPriorityInfos,
    TaskTypeLabel,
    modalSubTypeList,
    dataModelSubTypeList,
} from './helper'
import PreTask from './PreTask'
import OperateRecord from './OperateRecord'
import { statusInfos } from '../MyTask/const'
import { StatusLabel } from '../MyTask/custom/StatusComponent'
import { getTaskDetail } from '@/core/apis/taskCenter'
import { TaskDetail } from '@/core/apis/taskCenter/index.d'
import { PriorityLabel } from './PrioritySelect'
import __ from './locale'
import Icons from '../BussinessConfigure/Icons'
import Empty from '@/ui/Empty'
import empty from '../../assets/dataEmpty.svg'
import Detail from '../BusinessModeling/CoreBusinessIndicator/Detail'
import {
    getOssResourceUrl,
    getPlatformNumber,
    stardOrignizeTypeList,
} from '@/utils'
import { ExecutorLabel } from '../MyTask/custom/ExecutorComponent'
import DataList from './DataList'

const initialQueryParams = {
    offset: 1,
    limit: 999,
    direction: SortDirection.DESC,
    sort: SortType.CREATED,
    keyword: '',
}
interface IDetails {
    taskId: string
    projectId?: string
    getTaskType?: (taskType: TaskType) => void
}
const Details: React.FC<IDetails> = ({ taskId, projectId, getTaskType }) => {
    const navigator = useNavigate()
    const platform = getPlatformNumber()

    const [taskDetails, setTaskDetails] = useState<TaskDetail>({
        config_status: TaskConfigStatus.NORMAL,
    })
    const [formFields, setFormFields] = useState<{
        [id: string]: Array<any>
    }>({})
    const [dataTypeOptions, setDataTypeOptions] = useState<Array<any>>([])

    const [projectForms, setProjectFroms] = useState<Array<any>>([])

    const [isloadError, setIsLoadError] = useState(false)

    const [projectIndicators, setProjectIndicators] = useState<Array<any>>([])

    const [indicatorViewId, setIndictorViewId] = useState<string>('')

    const [imageUrl, setImageUrl] = useState('')

    const contentWi = useMemo(() => {
        return taskDetails.task_type &&
            [
                TaskType.DATACOLLECTING,
                TaskType.DATAPROCESSING,
                TaskType.INDICATORPROCESSING,
            ].includes(taskDetails.task_type)
            ? 294
            : 437
    }, [taskDetails])

    const getImage = async (id: string) => {
        const url = await getOssResourceUrl(id)
        setImageUrl(url)
    }

    const getDetails = async () => {
        if (!taskId) return

        const res = await getTaskDetail(taskId)
        setTaskDetails(res)
        if (res.image) {
            getImage(res.image)
        }
        getTaskType?.(res.task_type || TaskType.NORMAL)
        if (res.task_type === TaskType.INDICATORPROCESSING) {
            setProjectIndicators(res?.data || [])
        } else {
            setProjectFroms(res?.data || [])
            getFormDetails(res?.data)
        }
    }

    const getFormDetails = async (formData) => {
        if (formData?.length > 0) {
            const [fileds, enumConfig] = await Promise.all([
                Promise.all(
                    formData.map((formInfo) => getFormFields(formInfo.id)),
                ),
                formsEnumConfig(),
            ])
            setDataTypeOptions(enumConfig?.data_type || [])
            setFormFields(
                fileds.reduce((preData, currentData) => {
                    return {
                        ...preData,
                        ...currentData,
                    }
                }, {}),
            )
        }
    }

    const getFormFields = async (formId) => {
        const { entries } = await getFormsFieldsList(formId, { limit: 999 })
        return {
            [formId]: entries,
        }
    }

    useEffect(() => {
        getDetails()
    }, [taskId, projectId])

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: __('前序任务'),
            children: (
                <PreTask
                    nodeId={taskDetails.node_id}
                    projectId={taskDetails.project_id}
                />
            ),
        },
        {
            key: '2',
            label: __('操作记录'),
            children: (
                <div className={styles.operateRecord}>
                    <OperateRecord taskId={taskId} />
                </div>
            ),
        },
    ]

    const getProjectDataForms = async (id, currentTaskId) => {
        try {
            const res = await getCoreBusinesses({
                // ...searchCondition,
                offset: 1,
                project_id: id,
                // id: taskInfo.subDomainId,
            })
            if (res?.entries?.[0]?.business_model_id) {
                const { entries } = await getCoreBusinessIndicators({
                    ...initialQueryParams,
                    mid: res?.entries?.[0]?.business_model_id,
                })
                setProjectFroms(entries)
                getFormDetails(entries)
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    const isUseMidle = useMemo(() => {
        return [TaskType.MODELINGDIAGNOSIS, TaskType.STANDARDNEW].includes(
            taskDetails?.task_type as TaskType,
        )
    }, [taskDetails])

    const middleContent = useMemo(() => {
        if (isUseMidle) {
            return (
                <div>
                    <div className={styles.title}>
                        {taskDetails?.task_type === TaskType.MODELINGDIAGNOSIS
                            ? __('关联主干业务')
                            : __('关联标准文件')}
                    </div>
                    <div className={styles.datalist}>
                        <DataList
                            data={taskDetails?.data}
                            type={taskDetails?.task_type}
                        />
                    </div>
                </div>
            )
        }
        return null
    }, [taskDetails])

    return (
        <div className={styles.detailWrapper}>
            <div className={styles.left}>
                <div className={styles.taskName} title={taskDetails.name}>
                    {taskDetails.name}
                </div>
                {taskDetails.project_id && (
                    <>
                        <div className={styles.rowContent}>
                            <div className={styles.label}>
                                {__('关联项目名称')}
                            </div>
                            <div
                                className={classnames(
                                    styles.projectContent,
                                    styles.content,
                                )}
                            >
                                {taskDetails?.image &&
                                imageUrl &&
                                !isloadError ? (
                                    <img
                                        alt="project"
                                        // src={`/api/task-center/v1/oss/${taskDetails?.image}`}
                                        src={imageUrl}
                                        height={24}
                                        width={24}
                                        className={styles.projectCover}
                                        onErrorCapture={() =>
                                            setIsLoadError(true)
                                        }
                                    />
                                ) : (
                                    <div className={styles.emptyWrapper}>
                                        <ProjectIconOutlined
                                            style={{ fontSize: 12 }}
                                        />
                                    </div>
                                )}

                                <span title={taskDetails.project_name}>
                                    {taskDetails.project_name}
                                </span>
                            </div>
                        </div>
                        <div className={styles.rowContent}>
                            <div className={styles.label}>
                                {__('任务所在阶段/节点')}
                            </div>
                            <div
                                className={styles.content}
                                style={{
                                    maxWidth: contentWi,
                                }}
                            >
                                {taskDetails.stage_name
                                    ? `${taskDetails.stage_name}/${taskDetails.node_name}`
                                    : taskDetails.node_name}
                            </div>
                        </div>
                    </>
                )}
                <div className={styles.rowContent}>
                    <div className={styles.label}>{__('任务类型')}</div>
                    <div
                        className={styles.content}
                        style={{
                            maxWidth: contentWi,
                        }}
                    >
                        <div className={styles.taskTypeIconWrapper}>
                            {getTaskTypeIcon(
                                taskDetails.task_type || TaskType.NORMAL,
                            )}
                        </div>
                        {
                            TaskTypeLabel[
                                taskDetails.task_type || TaskType.NORMAL
                            ]
                        }
                    </div>
                </div>
                {[TaskType.MODEL, TaskType.DATAMODELING].includes(
                    taskDetails.task_type as TaskType,
                ) && (
                    <div className={styles.rowContent}>
                        <div className={styles.label}>
                            {platform === LoginPlatform.default
                                ? __('关联业务流程')
                                : __('关联主干业务')}
                        </div>
                        <div className={styles.content}>
                            {taskDetails.domain_name || '--'}
                            {taskDetails.config_status ===
                                TaskConfigStatus.DOMAINDELETE && (
                                <Tooltip
                                    title={
                                        TaskConfigStatusText[
                                            TaskConfigStatus.DOMAINDELETE
                                        ]
                                    }
                                    placement="right"
                                >
                                    <ExclamationCircleOutlined
                                        className={styles.domainDelIcon}
                                    />
                                </Tooltip>
                            )}
                        </div>
                    </div>
                )}
                {[TaskType.MODEL, TaskType.DATAMODELING].includes(
                    taskDetails.task_type as TaskType,
                ) && (
                    <div className={styles.rowContent}>
                        <div className={styles.label}>{__('任务子类型')}</div>
                        <div className={styles.content}>
                            {taskDetails.model_child_task_types?.length
                                ? taskDetails.model_child_task_types?.map(
                                      (item) => (
                                          <span className={styles.taskSubType}>
                                              {
                                                  [
                                                      ...modalSubTypeList,
                                                      ...dataModelSubTypeList,
                                                  ].find(
                                                      (type) =>
                                                          type.value === item,
                                                  )?.label
                                              }
                                          </span>
                                      ),
                                  )
                                : '--'}
                        </div>
                    </div>
                )}

                {/* 项目id不存在则为游离任务 游离任务会关联业务治理下的主题域下的业务模型 */}
                {taskDetails.task_type &&
                    ![
                        TaskType.DATACOMPREHENSION,
                        TaskType.MODEL,
                        TaskType.DATAMODELING,
                        TaskType.DATASHEETVIEW,
                    ].includes(taskDetails.task_type) &&
                    !projectId && (
                        <div className={styles.rowContent}>
                            <div className={styles.label}>
                                {__('关联业务模型')}
                            </div>
                            <div
                                className={styles.content}
                                style={{
                                    maxWidth: contentWi,
                                }}
                            >
                                {taskDetails.business_model_name || '--'}
                                {[
                                    TaskConfigStatus.DOMAINDELETE,
                                    TaskConfigStatus.MAINBUSDELETE,
                                ].includes(taskDetails.config_status) && (
                                    <Tooltip
                                        title={
                                            TaskConfigStatusText[
                                                taskDetails.config_status
                                            ]
                                        }
                                        placement="right"
                                    >
                                        <ExclamationCircleOutlined
                                            className={styles.domainDelIcon}
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    )}

                {TaskType.FIELDSTANDARD === taskDetails.task_type &&
                    typeof taskDetails.org_type === 'number' && (
                        <div className={styles.rowContent}>
                            <div className={styles.label}>
                                {__('新建标准的分类')}
                            </div>
                            <div
                                className={styles.content}
                                style={{
                                    maxWidth: contentWi,
                                }}
                            >
                                {stardOrignizeTypeList.find(
                                    (item) =>
                                        item.value === taskDetails.org_type,
                                )?.label || '--'}
                            </div>
                        </div>
                    )}

                {TaskType.DATACOMPREHENSION === taskDetails.task_type && (
                    <div className={styles.rowContent}>
                        <div className={styles.label}>
                            {__('关联数据资源目录')}
                        </div>
                        <div
                            className={styles.content}
                            title={
                                taskDetails?.data && taskDetails.data.length > 0
                                    ? taskDetails.data
                                          .map((info) => info.name)
                                          .join('；')
                                    : '--'
                            }
                            style={{
                                maxWidth: contentWi,
                            }}
                        >
                            <div className={styles.contentMore}>
                                {taskDetails?.data &&
                                taskDetails.data.length > 0
                                    ? taskDetails.data
                                          .map((info) => info.name)
                                          .join('；')
                                    : '--'}
                            </div>
                            {taskDetails.config_status ===
                                TaskConfigStatus.CATALOGDELETE && (
                                <Tooltip
                                    title={
                                        TaskConfigStatusText[
                                            taskDetails.config_status
                                        ]
                                    }
                                    placement="right"
                                >
                                    <ExclamationCircleOutlined
                                        className={styles.domainDelIcon}
                                    />
                                </Tooltip>
                            )}
                        </div>
                    </div>
                )}
                <div className={styles.rowContent}>
                    <div className={styles.label}>{__('任务状态')}</div>
                    <div
                        className={styles.content}
                        style={{
                            maxWidth: contentWi,
                        }}
                    >
                        {statusInfos
                            .filter((info) => info.value === taskDetails.status)
                            .map((info) => {
                                return (
                                    <StatusLabel
                                        taskId={taskDetails.id}
                                        taskType={taskDetails.task_type}
                                        status={taskDetails?.status}
                                        label={info.label}
                                        color={info.color}
                                        bgColor={info.backgroundColor}
                                    />
                                )
                            })}
                    </div>
                </div>
                <div className={styles.rowContent}>
                    <div className={styles.label}>{__('任务执行人')}</div>
                    <div className={styles.content}>
                        <ExecutorLabel
                            label={taskDetails.executor_name || '未分配'}
                        />
                    </div>
                </div>
                <div className={styles.rowContent}>
                    <div className={styles.label}>{__('任务优先级')}</div>
                    <div
                        className={styles.content}
                        style={{
                            maxWidth: contentWi,
                        }}
                    >
                        <PriorityLabel
                            label={
                                taskPriorityInfos[
                                    taskDetails.priority || TaskPriority.COMMON
                                ].label
                            }
                            color={
                                taskPriorityInfos[
                                    taskDetails.priority || TaskPriority.COMMON
                                ].color
                            }
                        />
                    </div>
                </div>
                <div className={styles.rowContent}>
                    <div className={styles.label}>{__('截止日期')}</div>
                    <div
                        className={styles.content}
                        style={{
                            maxWidth: contentWi,
                        }}
                    >
                        {taskDetails?.deadline
                            ? moment(taskDetails.deadline * 1000).format(
                                  'YYYY-MM-DD',
                              )
                            : '--'}
                    </div>
                </div>
                <div className={styles.rowContent}>
                    <div className={styles.label}>{__('任务描述')}</div>
                    <div
                        className={styles.content}
                        style={{
                            maxWidth: contentWi,
                            lineBreak: 'anywhere',
                        }}
                    >
                        {taskDetails.description || '--'}
                    </div>
                </div>
            </div>
            {taskDetails.task_type &&
                [TaskType.DATACOLLECTING, TaskType.DATAPROCESSING].includes(
                    taskDetails.task_type,
                ) && (
                    <div className={styles.formList}>
                        <div className={styles.formTitle}>
                            {__('关联业务表')}
                            {taskDetails.config_status ===
                                TaskConfigStatus.FORMDELETE && (
                                <span className={styles.errorIcon}>
                                    {/* {taskDetails.config_status ===
                                TaskConfigStatus.FORMDELETE && (
                                <Tooltip
                                    title={
                                        TaskConfigStatusText[
                                            taskDetails.config_status
                                        ]
                                    }
                                    placement="right"
                                >
                                    <ExclamationCircleOutlined
                                        className={styles.domainDelIcon}
                                    />
                                </Tooltip>
                            )} */}
                                    <Tooltip
                                        title={
                                            TaskConfigStatusText[
                                                taskDetails.config_status
                                            ]
                                        }
                                        placement="right"
                                    >
                                        <ExclamationCircleOutlined
                                            className={styles.domainDelIcon}
                                        />
                                    </Tooltip>
                                </span>
                            )}
                        </div>
                        <div className={styles.list}>
                            {projectForms && projectForms.length > 0 ? (
                                projectForms.map((form) => {
                                    return (
                                        <div>
                                            <Popconfirm
                                                title={
                                                    <div
                                                        className={
                                                            styles.formFieldView
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.formName
                                                            }
                                                            title={form?.name}
                                                        >
                                                            {form?.name}
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.fieldContent
                                                            }
                                                        >
                                                            {formFields[form.id]
                                                                ?.length > 0 ? (
                                                                formFields[
                                                                    form.id
                                                                ]?.map(
                                                                    (field) => {
                                                                        const zhDataType =
                                                                            dataTypeOptions.find(
                                                                                (
                                                                                    it,
                                                                                ) => {
                                                                                    return (
                                                                                        it.value_en ===
                                                                                        field.data_type
                                                                                    )
                                                                                },
                                                                            )
                                                                        return (
                                                                            <div
                                                                                className={
                                                                                    styles.fieldItem
                                                                                }
                                                                            >
                                                                                <div
                                                                                    className={
                                                                                        styles.fieldDataType
                                                                                    }
                                                                                >
                                                                                    <Icons
                                                                                        type={
                                                                                            zhDataType.value ||
                                                                                            ''
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div
                                                                                    className={
                                                                                        styles.fieldName
                                                                                    }
                                                                                    title={
                                                                                        field.name
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        field.name
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    },
                                                                )
                                                            ) : (
                                                                <div
                                                                    className={
                                                                        styles.fieldEmpty
                                                                    }
                                                                >
                                                                    {__(
                                                                        '暂无数据',
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                }
                                                placement="rightTop"
                                                getPopupContainer={(node) =>
                                                    node?.parentNode as HTMLElement
                                                }
                                            >
                                                <div
                                                    className={styles.item}
                                                    title={form.name}
                                                >
                                                    {form.name}
                                                </div>
                                            </Popconfirm>
                                        </div>
                                    )
                                })
                            ) : (
                                <Empty
                                    iconSrc={empty}
                                    desc={__('关联业务表均被删除')}
                                />
                            )}
                        </div>
                    </div>
                )}
            {taskDetails.task_type &&
                taskDetails.task_type === TaskType.INDICATORPROCESSING && (
                    <div className={styles.formList}>
                        <div className={styles.formTitle}>
                            {__('关联业务指标')}
                            {/* {taskDetails.config_status ===
                                TaskConfigStatus.INDICATORDELETE && (
                                <span className={styles.errorIcon}>
                                   
                                    <Tooltip
                                        title={
                                            TaskConfigStatusText[
                                                taskDetails.config_status
                                            ]
                                        }
                                        placement="right"
                                    >
                                        <ExclamationCircleOutlined
                                            className={styles.domainDelIcon}
                                        />
                                    </Tooltip>
                                </span>
                            )} */}
                        </div>
                        <div className={styles.list}>
                            {projectIndicators &&
                            projectIndicators.length > 0 ? (
                                projectIndicators.map((Indicators) => {
                                    return (
                                        <div className={styles.indicatorItem}>
                                            <div
                                                className={styles.indicatorName}
                                                title={Indicators.name}
                                            >
                                                {Indicators.name}
                                            </div>
                                            <Button
                                                className={
                                                    styles.indicatorViewBtn
                                                }
                                                type="link"
                                                onClick={() => {
                                                    setIndictorViewId(
                                                        Indicators.id,
                                                    )
                                                }}
                                            >
                                                {__('详情')}
                                            </Button>
                                        </div>
                                    )
                                })
                            ) : (
                                <Empty
                                    iconSrc={empty}
                                    desc={__('关联业务指标均被删除')}
                                />
                            )}
                        </div>
                    </div>
                )}

            <div className={styles.middleLine} hidden={!isUseMidle}>
                {middleContent}
            </div>
            <div className={styles.right}>
                {projectId ? (
                    <Tabs
                        defaultActiveKey="1"
                        destroyInactiveTabPane
                        items={items}
                        style={{ marginTop: 5 }}
                    />
                ) : (
                    <>
                        <div className={styles.title}>{__('操作记录')}</div>
                        <div className={styles.operateRecord}>
                            <OperateRecord taskId={taskId} />
                        </div>
                    </>
                )}
            </div>
            {indicatorViewId ? (
                <Detail
                    id={indicatorViewId}
                    onClose={() => {
                        setIndictorViewId('')
                    }}
                    getContainer={document.getElementById('root')}
                    style={{ position: 'absolute', top: 0 }}
                    mask
                />
            ) : null}
        </div>
    )
}

export default Details
