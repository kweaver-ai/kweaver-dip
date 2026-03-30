import React, { useContext, useEffect, useState } from 'react'
import { Button, Form, Input, message, Select, Typography } from 'antd'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { trim } from 'lodash'
import classnames from 'classnames'
import {
    checkCoreBusinessName,
    createCoreBusiness,
    deleteCoreBusiness,
    formatError,
    getCoreBusinessDetails,
    getCoreBusinesses,
    getObjects,
    ICoreBusinessDetails,
    IGetObject,
    ISystemItem,
    messageError,
    reqInfoSystemList,
    TaskExecutableStatus,
    updateCoreBusiness,
} from '@/core'
import styles from './styles.module.less'
import {
    ErrorInfo,
    formatTime,
    keyboardCharactersReg,
    nameReg,
    OperateType,
} from '@/utils'
import { TaskInfoContext } from '@/context'
import { Architecture, DataNode } from '../BusinessArchitecture/const'
import Confirm from '../Confirm'
import Loader from '@/ui/Loader'
import Empty from '@/ui/Empty'
import addEmpty from '@/assets/emptyAdd.svg'
import __ from './locale'
import CascaderDomain from './CascaderDomain'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { products, totalOperates } from './const'
import { AddOutlined } from '@/icons'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'

interface IAbstract {
    coreBizId?: string
}
/**
 * (废弃)
 * @param param0
 * @returns
 */
const CoreBusinessInfos: React.FC<IAbstract> = ({ coreBizId }) => {
    const { taskInfo, setTaskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)
    const [form] = Form.useForm()
    const [ellipsis, setEllipsis] = useState(false)
    const [visible, setVisible] = useState<boolean>(false)
    const [mode, setMode] = useState<'view' | 'edit'>('view')
    const [delVisible, setDelVisible] = useState(false)
    const [details, setDetails] = useState<ICoreBusinessDetails>()
    const [treeData, setTreeData] = useState<any[]>([])
    const [systems, setSystems] = useState<ISystemItem[]>([])
    const [matters, setMatters] = useState<DataNode[]>([])
    const [subDmId, setSubDmId] = useState('')
    const [loading, setLoading] = useState(false)
    const [delLoading, setDelLoading] = useState(false)
    const [editLoading, setEditLoading] = useState(false)

    // 获取信息系統列表
    const getInfoSystemList = async () => {
        try {
            const res = await reqInfoSystemList({
                limit: 2000,
                offset: 1,
            })
            setSystems(res.entries || [])
        } catch (error) {
            formatError(error)
        }
    }

    const getMatters = async () => {
        try {
            const res = await getObjects({
                limit: 0,
                id: '',
                is_all: true,
                type: Architecture.BMATTERS,
            })
            setMatters(res.entries)
        } catch (error) {
            formatError(error)
        }
    }

    // 获取业务模型详情
    const getDetails = async (id?: string) => {
        try {
            setLoading(true)
            if (!coreBizId && !id) return
            const res = await getCoreBusinessDetails(id || coreBizId!)
            const {
                subject_domain_id,
                subject_domain_name,
                business_domain_id,
                business_domain_name,
                business_matters,
                business_system,
                business_responsibilities,
                department_id,
                department_name,
                description,
                name,
                relevant_standards,
                topic_classification,
            } = res
            setDetails(res)
            const bSystemIds: string[] = []
            const bMatterIds: string[] = []
            business_system?.forEach((bs) => bSystemIds.push(bs.id))
            business_matters?.forEach((bm) => bMatterIds.push(bm.id))

            form.setFieldsValue({
                subject_domain_id: subject_domain_name,
                business_matters_id: bMatterIds,
                business_system_id: bSystemIds,
                business_responsibilities,
                department_id,
                description,
                name,
                relevant_standards,
                topic_classification,
            })
            setSubDmId(subject_domain_id)
            setTaskInfo({ ...taskInfo, canCompleted: true })
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
            setMode('view')
        }
    }

    useEffect(() => {
        setDetails(undefined)
        form.resetFields()
        // 获取所有信息系统
        getInfoSystemList()
        // 获取所有业务事项
        getMatters()
        if (taskInfo.taskId) {
            getDetails(taskInfo.new_main_business_id)
            if (
                !taskInfo.new_main_business_id &&
                taskInfo.executable_status === TaskExecutableStatus.COMPLETED
            ) {
                messageError(__('业务模型被删除'))
            }
            return
        }
        if (coreBizId) {
            getDetails()
        }
    }, [coreBizId, taskInfo.taskId])

    // 业务模型创建、编辑
    const handleForm = async () => {
        try {
            setEditLoading(true)
            await form.validateFields()
            const { ...values } = form.getFieldsValue()

            if (!details) {
                const res = await createCoreBusiness({
                    ...values,
                    task_id: taskInfo?.taskId,
                    subject_domain_id: values.subject_domain_id?.[1],
                })
                message.success(__('新建成功'))
                getDetails(res[0].id)
                setTaskInfo({ ...taskInfo, canCompleted: true })
            } else {
                const res = await updateCoreBusiness(
                    {
                        ...values,
                        task_id: taskInfo?.taskId,
                        subject_domain_id:
                            typeof values.subject_domain_id === 'string'
                                ? subDmId
                                : values.subject_domain_id?.[1],
                    },
                    details?.main_business_id || '',
                )
                message.success(__('编辑成功'))
                getDetails(res[0].id)
            }
        } catch (error) {
            if (error?.errorFields) {
                return
            }
            formatError(error)
        } finally {
            setEditLoading(false)
        }
    }

    // 删除业务模型
    const handleDelete = async () => {
        if (!details) return
        try {
            setDelLoading(true)
            await deleteCoreBusiness(details.main_business_id!, {
                taskId: taskInfo?.taskId,
                subject_domain_id: details.subject_domain_id,
            })
            message.success(__('删除成功'))
            setDetails(undefined)
            form.resetFields()
            setMode('view')
            setTaskInfo({ ...taskInfo, canCompleted: false })
        } catch (error) {
            formatError(error)
        } finally {
            setDelVisible(false)
            setDelLoading(false)
        }
    }

    const getValue = (field: string | string[], type?: string) => {
        if (Array.isArray(field)) {
            return details?.[field[0]]?.[field[1]] || '--'
        }
        if (type === 'time') {
            return details?.[field] ? formatTime(details?.[field]) : '--'
        }
        return details?.[field] || '--'
    }

    // 名称校验
    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        const busDomainId =
            typeof form.getFieldValue('subject_domain_id') === 'string'
                ? subDmId
                : form.getFieldValue('subject_domain_id')?.[1]
        const depId = form.getFieldValue('department_id')
        if (!busDomainId || !depId) return Promise.resolve()
        try {
            await checkCoreBusinessName({
                id: !details
                    ? undefined
                    : details?.main_business_id || coreBizId,
                name: trimValue,
                task_id: taskInfo?.taskId,
            })
            return Promise.resolve()
        } catch (error) {
            if (error.data.code === 'BusinessGrooming.Model.NameAlreadyExist') {
                return Promise.reject(new Error(error.data.description))
            }
            return Promise.resolve()
        }
    }

    const getRules = () => {
        return [
            {
                pattern: keyboardCharactersReg,
                message: ErrorInfo.EXCEPTEMOJI,
                transform: (val) => trim(val),
            },
        ]
    }

    // 业务域或部门变化时 若名称存在 则校验是否重复
    const onFieldsChange = (changedFields) => {
        if (
            ['department_id', 'subject_domain_id'].includes(
                changedFields?.[0]?.name?.[0],
            ) &&
            trim(form.getFieldValue('name'))
        ) {
            form.validateFields(['name'])
        }
    }

    // 空库表
    const renderEmpty = () => {
        return (
            <div className={styles.cbi_empty}>
                <Empty
                    desc={
                        <div>
                            {__('点击')}
                            <Button
                                type="link"
                                onClick={() => {
                                    form.resetFields()
                                    setMode('edit')
                                }}
                            >
                                【{__('新建')}】
                            </Button>
                            {__('按钮可新建业务模型')}
                        </div>
                    }
                    iconSrc={addEmpty}
                />
                <Button
                    style={{ marginTop: 16 }}
                    type="primary"
                    icon={<AddOutlined />}
                    onClick={() => {
                        form.resetFields()
                        setMode('edit')
                    }}
                >
                    {__('新建')}
                </Button>
            </div>
        )
    }

    return (
        <div className={styles.coreBusinessInfosWrapper}>
            {loading ? (
                <Loader />
            ) : checkTask(OperateType.CREATE) && !details && mode === 'view' ? (
                renderEmpty()
            ) : (
                <>
                    <div
                        className={classnames(
                            styles.cbi_top,
                            styles.tabContentTitle,
                        )}
                    >
                        <div>
                            {__('简介')}
                            {/* {taskInfo?.taskType ? __('业务模型信息') : ''} */}
                        </div>
                        <div hidden={mode === 'edit'}>
                            <Button
                                className={styles.cbi_operate}
                                onClick={() => {
                                    const bSystemIds: string[] = []
                                    const bMatterIds: string[] = []
                                    details?.business_system?.forEach((bs) =>
                                        bSystemIds.push(bs.id),
                                    )
                                    details?.business_matters?.forEach((bm) =>
                                        bMatterIds.push(bm.id),
                                    )
                                    form.setFieldsValue({
                                        subject_domain_id:
                                            details?.subject_domain_name,
                                        business_matters_id: bMatterIds,
                                        business_system_id: bSystemIds,
                                        business_responsibilities:
                                            details?.business_responsibilities,
                                        department_id: details?.department_id,
                                        description: details?.description,
                                        name: details?.name,
                                        relevant_standards:
                                            details?.relevant_standards,
                                        topic_classification:
                                            details?.topic_classification,
                                    })
                                    setMode('edit')
                                }}
                                hidden={!checkTask(OperateType.EDIT)}
                            >
                                {__('编辑')}
                            </Button>
                            <Button
                                className={styles.cbi_operate}
                                onClick={() => setDelVisible(true)}
                                hidden={!checkTask(OperateType.DELETE)}
                            >
                                {__('删除')}
                            </Button>
                        </div>
                        <div hidden={mode === 'view'}>
                            <Button
                                className={styles.cbi_operate}
                                onClick={() => {
                                    form.getFieldsError().forEach((info) => {
                                        if (info.errors.length > 0) {
                                            form.setFields([
                                                { ...info, errors: [] },
                                            ])
                                        }
                                    })
                                    setMode('view')
                                }}
                            >
                                {__('取消')}
                            </Button>
                            <Button
                                type="primary"
                                className={styles.cbi_operate}
                                onClick={handleForm}
                                loading={editLoading}
                            >
                                {__('确定')}
                            </Button>
                        </div>
                    </div>
                    <Form
                        form={form}
                        autoComplete="off"
                        layout="horizontal"
                        onFieldsChange={onFieldsChange}
                        scrollToFirstError
                        className={classnames(
                            styles.cbi_infoWrapper,
                            mode !== 'edit' && styles.previewForm,
                        )}
                        labelAlign="left"
                    >
                        <div className={styles.cbi_infoTitle}>
                            {__('基本属性')}
                        </div>
                        <Form.Item
                            label={__('业务模型名称')}
                            name="name"
                            validateFirst
                            validateTrigger={['onChange', 'onBlur']}
                            rules={[
                                {
                                    required: mode === 'edit',
                                    message: ErrorInfo.NOTNULL,
                                    transform: (value) => trim(value),
                                },
                                // {
                                //     pattern: nameReg,
                                //     message: ErrorInfo.ONLYSUP,
                                //     transform: (value) => trim(value),
                                // },
                                {
                                    validateTrigger: ['onBlur'],
                                    validator: (e, value) =>
                                        validateNameRepeat(value),
                                },
                            ]}
                        >
                            {mode === 'edit' ? (
                                <Input
                                    placeholder={__('请输入业务模型名称')}
                                    maxLength={128}
                                    style={{ width: 400 }}
                                />
                            ) : (
                                <div
                                    className={styles.value}
                                    title={getValue('name')}
                                >
                                    {getValue('name')}
                                </div>
                            )}
                        </Form.Item>

                        <Form.Item
                            label={__('所属部门')}
                            name="department_id"
                            rules={[
                                {
                                    required: mode === 'edit',
                                    message: __('请选择所属部门'),
                                },
                            ]}
                        >
                            {mode === 'edit' ? (
                                <DepartmentAndOrgSelect
                                    defaultValue={details?.department_id}
                                    getInitValueError={(result) => {
                                        if (result) {
                                            form.setFields([
                                                {
                                                    name: ['department_id'],
                                                    errors: [result],
                                                    value: null,
                                                },
                                            ])
                                        }
                                    }}
                                />
                            ) : (
                                <div
                                    className={styles.value}
                                    title={getValue('department_path')}
                                >
                                    {getValue('department_path')}
                                </div>
                            )}
                        </Form.Item>
                        <Form.Item
                            label={__('关联主题域')}
                            name="subject_domain_id"
                            rules={[
                                {
                                    required: mode === 'edit',
                                    message: __('请选择关联主题域'),
                                },
                            ]}
                        >
                            {mode === 'edit' ? (
                                <CascaderDomain width={400} />
                            ) : (
                                <div
                                    className={styles.value}
                                    title={getValue('subject_domain_name')}
                                >
                                    {getValue('subject_domain_name')}
                                </div>
                            )}
                        </Form.Item>
                        <Form.Item
                            label={__('描述')}
                            name="description"
                            // rules={getRules()}
                            rules={[
                                {
                                    transform: (value) => trim(value),
                                },
                            ]}
                        >
                            {mode === 'edit' ? (
                                <Input.TextArea
                                    placeholder={__('请输入描述')}
                                    maxLength={255}
                                    style={{
                                        height: 60,
                                        resize: 'none',
                                        width: 688,
                                    }}
                                />
                            ) : (
                                <div
                                    className={styles.value}
                                    title={getValue('description')}
                                >
                                    {getValue('description')}
                                </div>
                            )}
                        </Form.Item>

                        <div className={styles.cbi_infoTitle}>
                            {__('业务信息')}
                        </div>
                        <Form.Item
                            label={__('相关标准')}
                            name="relevant_standards"
                            rules={getRules()}
                        >
                            {mode === 'edit' ? (
                                <Input
                                    style={{ width: 400 }}
                                    placeholder={__('请输入相关标准')}
                                    maxLength={128}
                                />
                            ) : (
                                <div
                                    className={styles.value}
                                    title={getValue('relevant_standards')}
                                >
                                    {getValue('relevant_standards')}
                                </div>
                            )}
                        </Form.Item>
                        <Form.Item
                            label={__('主题分类')}
                            name="topic_classification"
                            rules={getRules()}
                        >
                            {mode === 'edit' ? (
                                <Input
                                    style={{ width: 400 }}
                                    placeholder={__('请输入主题分类')}
                                    maxLength={128}
                                />
                            ) : (
                                <div
                                    className={styles.value}
                                    title={getValue('topic_classification')}
                                >
                                    {getValue('topic_classification')}
                                </div>
                            )}
                        </Form.Item>
                        <Form.Item
                            label={__('相关业务责任')}
                            name="business_responsibilities"
                            rules={getRules()}
                        >
                            {mode === 'edit' ? (
                                <Input
                                    style={{ width: 400 }}
                                    placeholder={__('请输入相关业务责任')}
                                    maxLength={128}
                                />
                            ) : (
                                <div
                                    className={styles.value}
                                    title={getValue(
                                        'business_responsibilities',
                                    )}
                                >
                                    {getValue('business_responsibilities')}
                                </div>
                            )}
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) =>
                                pre.business_system_id !==
                                cur.business_system_id
                            }
                        >
                            {({ getFieldValue }) => {
                                const bSystem =
                                    getFieldValue('business_system_id')
                                return (
                                    <Form.Item
                                        label={__('信息系统')}
                                        name="business_system_id"
                                    >
                                        {mode === 'edit' ? (
                                            <Select
                                                style={{
                                                    width: 680,
                                                }}
                                                className={styles.cbi_select}
                                                placeholder={__(
                                                    '请选择信息系统',
                                                )}
                                                mode="multiple"
                                                maxTagCount={99}
                                                showSearch
                                                filterOption={(
                                                    input,
                                                    option,
                                                ) => {
                                                    return (
                                                        option?.children
                                                            ?.toString()
                                                            .toLowerCase()
                                                            .includes(
                                                                trim(
                                                                    input.toLowerCase(),
                                                                ),
                                                            ) || false
                                                    )
                                                }}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                                allowClear
                                                maxTagTextLength={20}
                                                notFoundContent={
                                                    <div
                                                        className={
                                                            styles.noData
                                                        }
                                                    >
                                                        {__('暂无数据')}
                                                    </div>
                                                }
                                            >
                                                {systems.map((sys) => (
                                                    <Select.Option
                                                        value={sys.id}
                                                        key={sys.id}
                                                        disabled={
                                                            bSystem?.length ===
                                                                99 &&
                                                            !bSystem?.includes(
                                                                sys.id,
                                                            )
                                                        }
                                                    >
                                                        {sys.name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        ) : (
                                            <div
                                                className={styles.tagContainer}
                                            >
                                                <Typography.Paragraph
                                                    ellipsis={
                                                        !visible
                                                            ? {
                                                                  rows: 5,
                                                                  expandable:
                                                                      true,
                                                                  symbol: (
                                                                      <span
                                                                          style={{
                                                                              visibility:
                                                                                  'hidden',
                                                                          }}
                                                                      >
                                                                          {__(
                                                                              '展开全部',
                                                                          )}
                                                                      </span>
                                                                  ),
                                                                  onEllipsis: (
                                                                      ell,
                                                                  ) =>
                                                                      setEllipsis(
                                                                          ell,
                                                                      ),
                                                              }
                                                            : false
                                                    }
                                                >
                                                    {Array.isArray(
                                                        getValue(
                                                            'business_system',
                                                        ),
                                                    ) &&
                                                    getValue('business_system')
                                                        .length > 0
                                                        ? getValue(
                                                              'business_system',
                                                          )?.map((i) => {
                                                              return (
                                                                  <span
                                                                      className={
                                                                          styles.tag
                                                                      }
                                                                      key={i.id}
                                                                      title={
                                                                          i.name
                                                                      }
                                                                  >
                                                                      {i.name}
                                                                  </span>
                                                              )
                                                          })
                                                        : '--'}
                                                </Typography.Paragraph>

                                                {visible ? (
                                                    <Button
                                                        type="link"
                                                        onClick={() =>
                                                            setVisible(false)
                                                        }
                                                        className={
                                                            styles.operateBtn
                                                        }
                                                    >
                                                        {__('收起')}
                                                        <UpOutlined />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="link"
                                                        onClick={() =>
                                                            setVisible(true)
                                                        }
                                                        style={{
                                                            visibility: ellipsis
                                                                ? 'visible'
                                                                : 'hidden',
                                                        }}
                                                        className={
                                                            styles.operateBtn
                                                        }
                                                    >
                                                        {__('展开全部')}
                                                        <DownOutlined />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </Form.Item>
                                )
                            }}
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) =>
                                pre.business_matters_id !==
                                cur.business_matters_id
                            }
                        >
                            {({ getFieldValue }) => {
                                const bMatters = getFieldValue(
                                    'business_matters_id',
                                )
                                return (
                                    <Form.Item
                                        label={__('来源业务事项')}
                                        name="business_matters_id"
                                    >
                                        {mode === 'edit' ? (
                                            <Select
                                                style={{
                                                    width: 680,
                                                }}
                                                className={styles.cbi_select}
                                                placeholder={__(
                                                    '请选择来源业务事项',
                                                )}
                                                mode="multiple"
                                                showSearch
                                                filterOption={(
                                                    input,
                                                    option,
                                                ) => {
                                                    return (
                                                        option?.children
                                                            ?.toString()
                                                            .toLowerCase()
                                                            .includes(
                                                                trim(
                                                                    input.toLowerCase(),
                                                                ),
                                                            ) || false
                                                    )
                                                }}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                                allowClear
                                                maxTagTextLength={20}
                                                notFoundContent={
                                                    <div
                                                        className={
                                                            styles.noData
                                                        }
                                                    >
                                                        {__('暂无数据')}
                                                    </div>
                                                }
                                            >
                                                {matters.map((matter) => (
                                                    <Select.Option
                                                        value={matter.id}
                                                        key={matter.id}
                                                        disabled={
                                                            bMatters?.length ===
                                                                6 &&
                                                            !bMatters?.includes(
                                                                matter.id,
                                                            )
                                                        }
                                                    >
                                                        {matter.name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        ) : (
                                            <div
                                                className={styles.tagContainer}
                                            >
                                                {Array.isArray(
                                                    getValue(
                                                        'business_matters',
                                                    ),
                                                ) &&
                                                getValue('business_matters')
                                                    .length > 0
                                                    ? getValue(
                                                          'business_matters',
                                                      )?.map((i) => {
                                                          return (
                                                              <span
                                                                  className={
                                                                      styles.tag
                                                                  }
                                                                  key={i.id}
                                                                  title={i.name}
                                                              >
                                                                  {i.name}
                                                              </span>
                                                          )
                                                      })
                                                    : '--'}
                                            </div>
                                        )}
                                    </Form.Item>
                                )
                            }}
                        </Form.Item>
                        <div hidden={mode === 'edit'}>
                            <div className={styles.cbi_infoTitle}>
                                {__('更新信息')}
                            </div>
                            <Form.Item
                                label={__('创建人/时间')}
                                name="createInfo"
                            >
                                <div className={styles.value}>
                                    {getValue('created_by')}
                                    &nbsp;/&nbsp;
                                    {getValue('created_at', 'time')}
                                </div>
                            </Form.Item>
                            <Form.Item
                                label={__('更新人/时间')}
                                name="updateInfo"
                            >
                                <div className={styles.value}>
                                    {getValue('updated_by')}
                                    &nbsp;/&nbsp;
                                    {getValue('updated_at', 'time')}
                                </div>
                            </Form.Item>
                        </div>
                    </Form>
                </>
            )}

            <Confirm
                open={delVisible}
                title={__('确认要删除业务模型吗？')}
                content={__(
                    '业务模型删除后，流程图、业务表、指标等内容将均被删除，请谨慎操作！',
                )}
                okText={__('确定')}
                cancelText={__('取消')}
                onOk={handleDelete}
                onCancel={() => setDelVisible(false)}
                width={432}
                okButtonProps={{ loading: delLoading }}
            />
        </div>
    )
}
export default CoreBusinessInfos
