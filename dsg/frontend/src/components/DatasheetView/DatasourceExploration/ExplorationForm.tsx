import { CheckCircleFilled, InfoCircleFilled } from '@ant-design/icons'
import {
    Button,
    Form,
    Image,
    message,
    Modal,
    Radio,
    Select,
    Space,
    Tooltip,
} from 'antd'
import classnames from 'classnames'
import { uniqBy } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ContainerBar } from '@/components/BusinessDomain/Classification/helper'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    batchCreateExploreRule,
    createExploreTask,
    exploreOverview,
    formatError,
    getDatasourceConfig,
    getExploreReportStatus,
    IcreateExploreTask,
    LogicViewType,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import { FontIcon } from '@/icons'
import { Loader, ReturnConfirmModal } from '@/ui'
import { useQuery } from '@/utils'
import { info } from '@/utils/modalHelper'
import { useDataViewContext } from '../DataViewProvider'
import __ from '../locale'
import ChooseAttribute from './ChooseAttribute'
import {
    ClassifyConfigType,
    dataTypeMap,
    explorationContentType,
    ExplorationRule,
    explorationTaskStatus,
    ExplorationType,
    getRuleActionMap,
    InternalRuleTemplateMap,
    strategyType,
} from './const'
import ExplorationRules from './ExplorationRules'
import {
    BadgeRadio,
    explorationContentList,
    getDatasourceExplorationField,
    getExplorationStrategyList,
    getGuideFlagByKey,
    LabelTitle,
    strategyTips,
    updateGuideFlag,
} from './helper'
import styles from './styles.module.less'

interface IExplorationForm {
    onClose: (showTask?: boolean) => void
    formViewId?: string
    datasourceId?: string
    hiddenRadio?: boolean
    explorationType?: ExplorationType
}

const ExplorationForm = ({
    hiddenRadio = false,
    onClose,
    formViewId,
    datasourceId = '',
    explorationType = ExplorationType.Datasource,
}: IExplorationForm) => {
    const { pathname } = useLocation()
    const [form] = Form.useForm()
    const query = useQuery()
    const logic = (query.get('logic') ||
        LogicViewType.DataSource) as LogicViewType
    const [isGradeOpen] = useGradeLabelState()
    const [userInfo] = useCurrentUser()
    const { checkPermission } = useUserPermCtx()

    // 根据分类分级开关，显示不同内容
    const explorationContentLists = explorationContentList
        .map((item) => ({
            ...item,
            label:
                item.value === explorationContentType.Classification &&
                !isGradeOpen
                    ? item.subLabel
                    : item.label,
            statusLabel:
                item.value === explorationContentType.Classification &&
                !isGradeOpen
                    ? item.subStatusLabel
                    : item.statusLabel,
        }))
        .filter((item) => {
            if (item.value === explorationContentType.Classification) {
                return checkPermission('manageDataClassification')
            }
            return true
        })

    const [strategyValue, setStrategyValue] = useState<strategyType>(
        strategyType.All,
    )

    const [showContentTips, setShowContentTips] = useState<boolean>(true)
    const [showImageTips, setShowImageTips] = useState<boolean>(false)
    const [explorationStrategyList, setExplorationStrategyList] = useState<any>(
        getExplorationStrategyList(),
    )
    const [disabledBtn, setDisabledBtn] = useState<boolean>(false)
    const [disBtnTips, setDisBtnTips] = useState<string>('')
    const [exploreRunningStatusList, setExploreRunningStatusList] = useState<
        any[]
    >([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const {
        setShowMytask,
        logicViewType,
        explorationData,
        setExplorationData,
        isValueEvaluation,
    } = useDataViewContext()

    const [explorationContent, setExplorationContent] = useState<
        explorationContentType | undefined
    >(
        isValueEvaluation
            ? explorationContentType.Quality
            : explorationContentType.Timestamp,
    )

    const isDataViewDetails = pathname === '/datasheet-view/detail'
    const [selectedClassifyType, setSelectedClassifyType] =
        useState<ClassifyConfigType>(ClassifyConfigType.ALL_RECOGNITION)

    const [selectedAttributes, setSelectedAttributes] = useState<Array<any>>([])

    const [showChooseAttr, setShowChooseAttr] = useState<boolean>(false)

    const [noObjects, setNoObjects] = useState<boolean>(false)

    const isChanged = useMemo(() => {
        let flag = false
        if (explorationType === ExplorationType.Datasource) {
            const internalDatasouceRuleGroup =
                explorationData?.internalDatasouceRuleGroup
            if (!internalDatasouceRuleGroup) return false
            const metadataIds = getDatasourceExplorationField(
                internalDatasouceRuleGroup,
                'metadata',
            )
            const fieldIds: any[] = []
            Object.keys(internalDatasouceRuleGroup).forEach((key) => {
                if (key !== 'metadata' && key !== 'view') {
                    const rules = getDatasourceExplorationField(
                        internalDatasouceRuleGroup,
                        key,
                    )

                    const rule = {
                        field_type: key,
                        rules,
                    }
                    if (rules?.length) {
                        fieldIds.push(rule)
                    }
                }
            })
            flag =
                metadataIds?.length > 0 ||
                fieldIds?.length > 0 ||
                explorationData?.datasourceDataViewRuleList?.view?.rules
                    ?.length > 0 ||
                explorationData?.datasourceRuleConfig?.view?.rules?.length > 0
            if (!flag && strategyValue !== strategyType.IsConfig) {
                setDisabledBtn(true)
                setDisBtnTips(__('请开启任意探查规则后发起探查任务'))
            } else {
                setDisabledBtn(false)
                setDisBtnTips('')
            }
            return flag
        }
        // const fieldList = explorationData?.fieldList
        // flag =
        //     fieldList?.reduce((count, field) => {
        //         return count + field.enable_rules
        //     }, 0) === 0
        // // 没有启用规则
        // if (flag) {
        //     setDisabledBtn(true)
        //     setDisBtnTips(__('请开启任意探查规则后发起探查任务'))
        // }
        return flag
    }, [
        explorationData?.internalDatasouceRuleGroup,
        explorationData?.datasourceDataViewRuleList,
        explorationData?.fieldList,
        strategyValue,
    ])

    const cssjj = useMemo(() => {
        return explorationData?.cssjj
    }, [explorationData])

    useEffect(() => {
        if (formViewId || datasourceId) {
            if (explorationType === ExplorationType.Datasource) {
                getExploreOverview()
            }
            if (explorationContent === explorationContentType.Quality) {
                getExploreStatus()
                getExploreConfig()
            }
            setShowContentTips(
                getGuideFlagByKey(`af_${explorationContent}_guide`, userInfo),
            )
        }
    }, [formViewId, datasourceId])

    useEffect(() => {
        if (formViewId) {
            setExplorationData((pre) => ({
                ...pre,
                dataViewId: formViewId,
            }))
            initBatchCreateRule('metadata')
            initBatchCreateRule('field')
        }
    }, [formViewId])

    useEffect(() => {
        if (explorationData?.batchCreateRuleStatus) {
            const tips = Object.keys(
                explorationData?.batchCreateRuleStatus,
            )?.every((item) => !item)
                ? __('默认检测规则创建完成后，可确定')
                : ''
            setDisabledBtn(!!tips)
            setDisBtnTips(tips)
        }
    }, [explorationData?.batchCreateRuleStatus])

    useEffect(() => {
        if (datasourceId) {
            setExplorationData((pre) => ({
                ...pre,
                datasourceId,
            }))
        }
    }, [datasourceId])

    useEffect(() => {
        if (explorationContent !== explorationContentType.Quality) {
            setDisabledBtn(false)
            setDisBtnTips('')
        }
    }, [explorationContent])

    useEffect(() => {
        if (exploreRunningStatusList?.length === 3) {
            setDisabledBtn(true)
            setDisBtnTips(__('请选择探查内容'))
        }
    }, [exploreRunningStatusList])

    const onFinish = async () => {
        try {
            if (!explorationType) return
            let config = {}
            let data: IcreateExploreTask
            const total_sample = explorationData?.total_sample || 0
            if (
                explorationContent === explorationContentType.Classification &&
                selectedClassifyType ===
                    ClassifyConfigType.SPECIFIC_RECOGNITION &&
                !selectedAttributes.length
            ) {
                setNoObjects(true)
                return
            }
            if (explorationType === ExplorationType.Datasource) {
                const internalDatasouceRuleGroup =
                    explorationData?.internalDatasouceRuleGroup || {}
                const metadata = {
                    rules: getDatasourceExplorationField(
                        internalDatasouceRuleGroup,
                        'metadata',
                    ),
                }
                const field: any[] = []
                Object.keys(internalDatasouceRuleGroup).forEach((key) => {
                    if (key !== 'metadata' && key !== 'view') {
                        const rules = getDatasourceExplorationField(
                            internalDatasouceRuleGroup,
                            key,
                        )?.map((o) => ({
                            ...o,
                            dimension_type: InternalRuleTemplateMap[o.rule_id],
                        }))

                        const rule = {
                            field_type: key,
                            rules,
                        }
                        if (rules?.length && key !== 'number') {
                            field.push(rule)
                            if (key === dataTypeMap.int) {
                                field.push({
                                    field_type: dataTypeMap.float,
                                    rules,
                                })
                                field.push({
                                    field_type: dataTypeMap.decimal,
                                    rules,
                                })
                            }
                        }
                    }
                })
                const view = explorationData?.datasourceDataViewRuleList
                config = {
                    total_sample,
                    strategy: strategyValue,
                    metadata,
                    field: uniqBy(field, 'field_type'),
                    ...view,
                }
                data = {
                    datasource_id: datasourceId,
                    type: explorationContent,
                    config:
                        explorationContent !== explorationContentType.Quality
                            ? undefined
                            : strategyValue === strategyType.IsConfig
                            ? JSON.stringify({ strategy: strategyValue })
                            : JSON.stringify(config),
                    subject_ids:
                        explorationContent ===
                            explorationContentType.Classification &&
                        selectedClassifyType ===
                            ClassifyConfigType.SPECIFIC_RECOGNITION
                            ? selectedAttributes.map((item) => item.id)
                            : undefined,
                }
            } else {
                // 库表探查
                config = {
                    total_sample,
                }
                data = {
                    form_view_id: formViewId,
                    type: explorationContent,
                    config: JSON.stringify(config),
                    subject_ids:
                        explorationContent ===
                            explorationContentType.Classification &&
                        selectedClassifyType ===
                            ClassifyConfigType.SPECIFIC_RECOGNITION
                            ? selectedAttributes.map((item) => item.id)
                            : undefined,
                }
                const action = getRuleActionMap(
                    'list',
                    cssjj ? 'cssjj' : 'default',
                )
                const ruleList = await action({
                    offset: 1,
                    limit: 1000,
                    form_view_id: explorationData?.dataViewId,
                })
                const isDraftRule = ruleList?.filter((o) => o.draft)
                if (isDraftRule?.length) {
                    message.error(
                        __('存在${sum}个未完善的规则，请完善后点击确定', {
                            sum: isDraftRule?.length,
                        }),
                    )
                    return
                }
                if (
                    !ruleList?.filter((item) => item.enable)?.length &&
                    explorationContent === explorationContentType.Quality
                ) {
                    message.error(__('请开启任意探查规则后发起探查任务'))
                    return
                }
            }
            if (explorationContent !== explorationContentType.Quality) {
                delete data.config
            }
            await createExploreTask(data)
            if (isDataViewDetails) {
                message.success(__('发起探查成功'))
                onClose()
            } else {
                info({
                    title: __('成功发起探查!'),
                    icon: <CheckCircleFilled style={{ color: '#52C41B' }} />,
                    content: (
                        <div className={styles.confirmModal}>
                            {__(
                                '探查过程会持续一段时间，您可以关闭弹窗，进行其他操作，或者可以前往',
                            )}
                            <span
                                onClick={() => toExplorationTask()}
                                className={styles.confirmModalBtn}
                            >
                                {isValueEvaluation
                                    ? __('评估任务')
                                    : __('探查任务')}
                            </span>
                            {__('查看')}
                        </div>
                    ),
                    okText: __('关闭'),
                    onOk() {
                        onClose()
                    },
                })
            }
        } catch (err) {
            formatError(err)
        }
    }

    const toExplorationTask = () => {
        Modal.destroyAll()
        onClose(true)
        setShowMytask(true)
    }

    const getExploreOverview = async () => {
        try {
            const res = await exploreOverview({ datasource_id: datasourceId })
            const list = getExplorationStrategyList({
                ...res,
                not_explored_data_count:
                    res.view_count - res.explored_data_view_count,
            })
            setExplorationStrategyList(list)
        } catch (err) {
            formatError(err)
        }
    }

    const getExploreConfig = async () => {
        try {
            const configRes = await getDatasourceConfig(
                explorationType === ExplorationType.Datasource
                    ? {
                          datasource_id: datasourceId,
                      }
                    : { form_view_id: formViewId },
            )
            const config = configRes?.config ? JSON.parse(configRes.config) : {}
            setExplorationData((pre) => ({
                ...pre,
                total_sample: config?.total_sample || 0,
                datasourceRuleConfig: config,
            }))
        } catch (err) {
            formatError(err)
        }
    }

    const getExploreStatus = async () => {
        try {
            setIsLoading(true)
            const res = await getExploreReportStatus(
                explorationType === ExplorationType.Datasource
                    ? { datasource_id: datasourceId }
                    : { form_view_id: formViewId },
            )

            const list =
                res?.filter(
                    (item) =>
                        item.status === explorationTaskStatus.Running ||
                        item.status === explorationTaskStatus.Queuing,
                ) || []
            const content = explorationContentLists.find(
                (item) =>
                    !list?.map((it) => it.explore_type).includes(item.value),
            )?.value
            setDisBtnTips(!content ? __('请选择探查内容') : '')
            setDisabledBtn(!content)
            setExplorationContent(content)
            setExploreRunningStatusList(
                list.map((item) => ({
                    ...item,
                    value: item.explore_type,
                })),
            )
        } catch (err) {
            formatError(err)
        } finally {
            setIsLoading(false)
        }
    }

    const initBatchCreateRule = async (level: string) => {
        try {
            setExplorationData((pre) => ({
                ...pre,
                batchCreateRuleStatus: {
                    ...pre?.batchCreateRuleStatus,
                    [level]: true,
                },
            }))
            await batchCreateExploreRule({
                form_view_id: formViewId || '',
                rule_level: level,
            })
            setExplorationData((pre) => ({
                ...pre,
                batchCreateRuleStatus: {
                    ...pre?.batchCreateRuleStatus,
                    [level]: false,
                },
            }))
        } catch (err) {
            formatError(err)
        }
    }

    const getStrategyContent = (key: explorationContentType) => {
        switch (key) {
            case explorationContentType.Quality:
                return (
                    <>
                        {explorationType === ExplorationType.Datasource && (
                            <div>
                                <LabelTitle label={__('探查策略')} />
                                <div className={styles.contentFormItem}>
                                    {/* <div className={styles.contentLabel}>
                                        {__('选择探查策略')}
                                    </div> */}
                                    <div className={styles.contentText}>
                                        <BadgeRadio
                                            data={explorationStrategyList}
                                            onChange={(val: strategyType) => {
                                                setStrategyValue(val)
                                            }}
                                            value={strategyValue}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {strategyValue !== strategyType.IsConfig && (
                            <ExplorationRules
                                explorationType={explorationType}
                            />
                        )}
                    </>
                )
            case explorationContentType.Classification:
                return (
                    <div className={styles.classifyContainer}>
                        <div>
                            {showImageTips && explorationContent && (
                                <div
                                    className={classnames(styles.imageTips, {
                                        [styles.classifyTips]:
                                            explorationContent ===
                                            explorationContentType.Classification,
                                    })}
                                >
                                    <div className={styles.title}>
                                        {
                                            (
                                                strategyTips[
                                                    explorationContent
                                                ] as any
                                            )?.title
                                        }
                                    </div>
                                    <Image
                                        rootClassName={styles.img}
                                        height={400}
                                        src={
                                            strategyTips[explorationContent]
                                                ?.src
                                        }
                                        alt="tips"
                                        preview={false}
                                    />
                                    <div className={styles.tipsFooter}>
                                        <Button
                                            type="primary"
                                            onClick={() =>
                                                setShowImageTips(false)
                                            }
                                        >
                                            {__('知道了')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <ContainerBar>{__('本次探查的识别范围')}</ContainerBar>

                        <Radio.Group
                            onChange={(e) => {
                                setSelectedClassifyType(e.target.value)
                                setNoObjects(false)
                            }}
                            value={selectedClassifyType}
                        >
                            <div className={styles.classifySelectWrapper}>
                                <div className={styles.classifySelectItem}>
                                    <div>
                                        <Radio
                                            value={
                                                ClassifyConfigType.ALL_RECOGNITION
                                            }
                                        >
                                            {__('全部属性的识别')}
                                        </Radio>
                                    </div>
                                    <div className={styles.description}>
                                        {isGradeOpen
                                            ? __(
                                                  '运行整个业务对象下方全部属性的识别规则，将字段分类到匹配到属性上，并进行分级',
                                              )
                                            : __(
                                                  '运行整个业务对象下方全部属性的识别规则，将字段分类到匹配到属性上。',
                                              )}
                                    </div>
                                </div>
                                <div className={styles.classifySelectItem}>
                                    <div>
                                        <Radio
                                            value={
                                                ClassifyConfigType.SPECIFIC_RECOGNITION
                                            }
                                        >
                                            {__('指定属性的识别')}
                                        </Radio>
                                    </div>
                                    <div className={styles.description}>
                                        {isGradeOpen
                                            ? __(
                                                  '运行指定属性的识别规则，只将匹配当前属性的字段进行分类分级，不识别其它属性',
                                              )
                                            : __(
                                                  '运行指定属性的识别规则，只将匹配当前属性的字段进行分类，不识别其它属性',
                                              )}
                                    </div>
                                    {selectedClassifyType ===
                                        ClassifyConfigType.SPECIFIC_RECOGNITION && (
                                        <div
                                            className={
                                                styles.classifySelectItem
                                            }
                                        >
                                            <div
                                                className={styles.selectWrapper}
                                            >
                                                <Select
                                                    placeholder={__(
                                                        '请选择识别的属性',
                                                    )}
                                                    options={
                                                        selectedAttributes.length
                                                            ? selectedAttributes.map(
                                                                  (item) => ({
                                                                      value: item.id,
                                                                      label: (
                                                                          <div
                                                                              className={
                                                                                  styles.selectedOptionWrapper
                                                                              }
                                                                          >
                                                                              <FontIcon
                                                                                  name="icon-shuxing"
                                                                                  className={
                                                                                      styles.icon
                                                                                  }
                                                                              />
                                                                              <span
                                                                                  className={
                                                                                      styles.text
                                                                                  }
                                                                              >
                                                                                  {
                                                                                      item.name
                                                                                  }
                                                                              </span>
                                                                          </div>
                                                                      ),
                                                                  }),
                                                              )
                                                            : []
                                                    }
                                                    value={
                                                        selectedAttributes?.length
                                                            ? selectedAttributes.map(
                                                                  (item) =>
                                                                      item.id,
                                                              )
                                                            : undefined
                                                    }
                                                    mode="multiple"
                                                    open={false}
                                                    style={{ width: '100%' }}
                                                    onChange={(values) => {
                                                        setSelectedAttributes(
                                                            selectedAttributes.filter(
                                                                (item) =>
                                                                    values?.includes(
                                                                        item.id,
                                                                    ),
                                                            ),
                                                        )
                                                    }}
                                                />
                                            </div>
                                            {noObjects && (
                                                <div
                                                    className={styles.noObjects}
                                                >
                                                    {__('请选择识别的属性')}
                                                </div>
                                            )}
                                            <div>
                                                <Button
                                                    style={{ width: 80 }}
                                                    onClick={() => {
                                                        setShowChooseAttr(true)
                                                    }}
                                                >
                                                    {__('选择')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Radio.Group>
                    </div>
                )
            case explorationContentType.Timestamp:
                return showImageTips && explorationContent ? (
                    <div className={styles.imageTips}>
                        <div className={styles.title}>
                            {(strategyTips[explorationContent] as any)?.title}
                        </div>
                        <Image
                            rootClassName={styles.img}
                            height={400}
                            src={strategyTips[explorationContent]?.src}
                            alt="tips"
                            preview={false}
                        />
                        <div className={styles.tipsFooter}>
                            <Button
                                type="primary"
                                onClick={() => setShowImageTips(false)}
                            >
                                {__('知道了')}
                            </Button>
                        </div>
                    </div>
                ) : null
            default:
                return null
        }
    }

    return isLoading ? (
        <Loader />
    ) : (
        <div className={styles.formContent}>
            <Form
                className={styles.formWrapper}
                autoComplete="off"
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >
                {hiddenRadio ? undefined : (
                    <>
                        <LabelTitle label={__('探查内容')} />
                        <div className={styles.contentFormItem}>
                            {/* <div className={styles.contentLabel}>
                        {__('选择探查内容')}
                    </div> */}
                            <div className={styles.contentText}>
                                <BadgeRadio
                                    data={
                                        logic === LogicViewType.LogicEntity ||
                                        logicViewType ===
                                            LogicViewType.LogicEntity ||
                                        isValueEvaluation
                                            ? explorationContentLists.filter(
                                                  (item) =>
                                                      item.value ===
                                                      explorationContentType.Quality,
                                              )
                                            : explorationContentLists.filter(
                                                  (item) =>
                                                      item.value !==
                                                      explorationContentType.Quality,
                                              )
                                    }
                                    onChange={(val: explorationContentType) => {
                                        setExplorationContent(val)
                                        setShowImageTips(false)
                                        setShowContentTips(
                                            getGuideFlagByKey(
                                                `af_${val}_guide`,
                                                userInfo,
                                            ),
                                        )
                                        if (
                                            val ===
                                            explorationContentType.Quality
                                        ) {
                                            setExplorationData((pre) => ({
                                                ...pre,
                                                explorationRule:
                                                    ExplorationRule.Metadata,
                                            }))
                                        }
                                    }}
                                    value={explorationContent}
                                    disabledValue={exploreRunningStatusList}
                                />
                                {showContentTips && explorationContent && (
                                    <div className={styles.strategyTips}>
                                        <div
                                            className={classnames(
                                                styles.strategyTipsBox,
                                                explorationContent !==
                                                    explorationContentType.Quality &&
                                                    styles.noQuality,
                                            )}
                                        >
                                            {explorationContent !==
                                                explorationContentType.Classification && (
                                                <InfoCircleFilled
                                                    className={
                                                        styles.strategyIcon
                                                    }
                                                />
                                            )}
                                            <div>
                                                {explorationContent ===
                                                    explorationContentType.Classification &&
                                                !isGradeOpen
                                                    ? strategyTips[
                                                          explorationContent
                                                      ]?.closeTips
                                                    : strategyTips[
                                                          explorationContent
                                                      ]?.tips}
                                            </div>
                                        </div>
                                        <div
                                            className={
                                                explorationContent ===
                                                explorationContentType.Classification
                                                    ? styles.classifyStrategyBtn
                                                    : styles.strategyBtn
                                            }
                                        >
                                            {explorationContent ===
                                                explorationContentType.Timestamp && (
                                                <div
                                                    className={styles.tipsBtn}
                                                    onClick={() => {
                                                        setShowImageTips(true)
                                                    }}
                                                >
                                                    {__('查看操作指引')}
                                                </div>
                                            )}
                                            <div
                                                className={styles.tipsBtn}
                                                onClick={() => {
                                                    setShowContentTips(false)
                                                    setShowImageTips(false)
                                                    updateGuideFlag(
                                                        `af_${explorationContent}_guide`,
                                                        userInfo,
                                                    )
                                                }}
                                            >
                                                {__('不再提示')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
                {explorationContent && getStrategyContent(explorationContent)}
            </Form>
            <div className={styles.footer}>
                <Space size={16}>
                    <Button
                        onClick={() => {
                            if (isChanged) {
                                ReturnConfirmModal({
                                    onCancel: () => {
                                        onClose()
                                    },
                                })
                            } else {
                                onClose()
                            }
                        }}
                    >
                        {__('取消')}
                    </Button>
                    <Tooltip title={disBtnTips}>
                        <Button
                            type="primary"
                            disabled={disabledBtn}
                            onClick={() => form.submit()}
                        >
                            {__('发起探查')}
                        </Button>
                    </Tooltip>
                </Space>
            </div>
            {showChooseAttr && (
                <ChooseAttribute
                    open={showChooseAttr}
                    onClose={() => {
                        setShowChooseAttr(false)
                    }}
                    onOk={(values) => {
                        setSelectedAttributes(values)
                        setShowChooseAttr(false)
                        setNoObjects(false)
                    }}
                    selectedData={selectedAttributes}
                />
            )}
        </div>
    )
}

export default ExplorationForm
