import { Dropdown, message, Tooltip } from 'antd'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ExclamationCircleFilled, RightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { TaskInfoContext } from '@/context'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    deleteIndicatorModel,
    delIndicator,
    formatError,
    getIndicatorList,
} from '@/core'
import {
    AddOutlined,
    EllipsisOutlined,
    IndicatorModelOutlined,
    IndicatorThinColored,
} from '@/icons'
import { confirm } from '@/utils/modalHelper'
import { TabKey } from '../BusinessModeling/const'
import { OptionModel } from '../MetricModel/const'
import { IndicatorOperateType, ModelOperateType } from './const'
import __ from './locale'
import styles from './styles.module.less'

interface SelectIndicatorListType {
    indicatorModels: Array<any>
    onAddCreateModel: () => void
    mid: string
    onSeletedModel: (value) => void
    onEditModel: (value) => void
    onDeleteModel: (value) => void
    onSeletedIndicator: (value) => void // 选择指标
    onDeleteIndicator: (value) => void // 删除指标
    errorIndicatorModel?: Array<string>
}

const SelectIndicatorList = ({
    indicatorModels,
    onAddCreateModel,
    onEditModel,
    mid,
    onSeletedModel,
    onDeleteModel,
    onSeletedIndicator,
    onDeleteIndicator,
    errorIndicatorModel = [],
}: SelectIndicatorListType) => {
    const { checkPermission } = useUserPermCtx()
    const { taskInfo } = React.useContext(TaskInfoContext)
    const [modelsData, setModelsData] = useState<any>({})
    const [selectedModelId, setSelectedModelId] = useState<string>('')
    const [hoverModel, setHoverModel] = useState<string>('')
    const [hoverIndicator, setHoverIndicator] = useState<string>('')
    const navigator = useNavigate()
    const redirect = useLocation()

    const hasOprAccess = React.useMemo(
        () => checkPermission('manageBusinessModelAndBusinessDiagnosis'),
        [checkPermission],
    )

    const moreModelItems = [
        {
            key: ModelOperateType.EDIT,
            label: __('编辑'),
        },
        {
            key: ModelOperateType.DETAIL,
            label: __('详情信息'),
        },
        {
            key: ModelOperateType.DELETE,
            label: __('删除'),
        },
    ]

    const moreIndicatorItems = [
        {
            key: IndicatorOperateType.EDIT,
            label: __('编辑'),
        },
        {
            key: IndicatorOperateType.DELETE,
            label: __('删除'),
        },
    ]

    useEffect(() => {
        if (indicatorModels && indicatorModels.length) {
            const newModelsData = indicatorModels.reduce(
                async (predata, indicatorModel, index) => {
                    if (predata) {
                        return predata
                    }
                    return {
                        ...predata,
                        [indicatorModel.id]: {
                            expand: false,
                            indicatorData: [],
                        },
                    }
                },
                { ...modelsData },
            )
            setModelsData(newModelsData)
            setSelectedModelId(indicatorModels[0].id)
            handleExpandModelNode(indicatorModels[0], true)
        }
    }, [indicatorModels])

    const handleOperateModel = (modelData, type) => {
        switch (type) {
            case ModelOperateType.EDIT:
                navigator(
                    `/formGraph/metricModel${redirect.search}&mid=${mid}&redirect=${redirect.pathname}&iid=${modelData.id}&optionModel=${OptionModel.EditModel}&targetTab=${TabKey.INDICATOR}`,
                )
                break
            case ModelOperateType.DETAIL:
                // 编辑详情
                onEditModel(modelData)
                break
            case ModelOperateType.DELETE:
                deleteModel(modelData.id)
                break
            default:
                break
        }
    }

    /**
     * 新建指标
     */
    const createIndicator = (modelId) => {
        navigator(
            `/formGraph/metricModel${redirect.search}&mid=${mid}&redirect=${redirect.pathname}&iid=${modelId}&optionModel=${OptionModel.CreateMetric}&targetTab=${TabKey.INDICATOR}`,
        )
    }

    /**
     * 删除模型
     */
    const deleteModel = (modelId) => {
        confirm({
            title: __('确定要删除当前模型吗？'),
            icon: <ExclamationCircleFilled style={{ color: '#F5222D' }} />,
            content: __(
                '删除模型会导致正在使用的指标一并会被删除，请谨慎操作!',
            ),
            okText: __('确定'),
            cancelText: __('取消'),
            onOk: async () => {
                try {
                    await deleteIndicatorModel(mid, modelId)
                    message.success(__('删除成功'))
                    setModelsData({})
                    onDeleteModel(modelId)
                } catch (ex) {
                    formatError(ex)
                }
            },
        })
    }

    const handleOperateIndicator = (indicatorId, modelData, type) => {
        switch (type) {
            case IndicatorOperateType.EDIT:
                // 编辑
                handleEditIndicator(indicatorId, modelData.id)
                break
            case IndicatorOperateType.DELETE:
                handleDeleteIndicator(indicatorId, modelData.id)
                break
            default:
                break
        }
    }

    /**
     * 编辑指标
     * handleEditIndicator
     */
    const handleEditIndicator = (indicatorId, modelId) => {
        navigator(
            `/formGraph/metricModel${redirect.search}&mid=${mid}&redirect=${redirect.pathname}&iid=${modelId}&indicatorId=${indicatorId}&optionModel=${OptionModel.EditMetric}&targetTab=${TabKey.INDICATOR}`,
        )
        // window.location.replace(
        //     getActualUrl(
        //         `/formGraph/metricModel${redirect.search}&mid=${mid}&redirect=${redirect.pathname}&iid=${modelId}&indicatorId=${indicatorId}&optionModel=${OptionModel.EditMetric}&targetTab=${TabKey.INDICATOR}`,
        //     ),
        // )
    }
    /**
     * 删除指标
     * @param indicatorId
     * @param modelId
     */
    const handleDeleteIndicator = (indicatorId, modelId) => {
        confirm({
            title: __('确定要删除当前指标吗？'),
            icon: <ExclamationCircleFilled style={{ color: '#F5222D' }} />,
            content: __('删除指标会导致正在使用该指标的业务异常，请谨慎操作!'),
            okText: __('确定'),
            cancelText: __('取消'),
            onOk: async () => {
                try {
                    await delIndicator(indicatorId)
                    message.success(__('删除成功'))
                    setModelsData({
                        ...modelsData,
                        [modelId]: {
                            ...modelsData[modelId],
                            indicatorData: modelsData[
                                modelId
                            ].indicatorData.filter(
                                (indicatorItem) =>
                                    indicatorItem.indicator_id !== indicatorId,
                            ),
                        },
                    })
                    onDeleteIndicator(modelId)
                } catch (ex) {
                    formatError(ex)
                }
            },
        })
    }

    /**
     * 展开模型节点
     */
    const handleExpandModelNode = async (modelData, status) => {
        if (status) {
            const data = await getIndicatorList(modelData.id)
            setModelsData({
                ...modelsData,
                [modelData.id]: {
                    indicatorData: data,
                    expand: status,
                },
            })
        } else {
            setModelsData({
                ...modelsData,
                [modelData.id]: {
                    ...modelsData[modelData.id],
                    expand: status,
                },
            })
        }
    }

    const renderTreeNode = (modelData) => {
        return (
            <div>
                <div
                    className={classnames(
                        styles.treeNode,
                        styles.fatherNode,
                        selectedModelId === modelData.id
                            ? styles.selectedTreeNode
                            : '',
                    )}
                    onMouseEnter={() => setHoverModel(modelData.id)}
                    onMouseLeave={() => setHoverModel('')}
                    onClick={() => {
                        handleExpandModelNode(
                            modelData,
                            !modelsData[modelData.id]?.expand,
                        )
                        setSelectedModelId(modelData.id)
                        onSeletedModel(modelData.id)
                        onSeletedIndicator(null)
                    }}
                    title={modelData.name}
                >
                    <RightOutlined
                        className={classnames(
                            styles.arrow,
                            modelsData[modelData.id]?.expand &&
                                styles.expandArrow,
                            modelData.count === 0 && styles.hiddenArrow,
                        )}
                    />

                    <IndicatorModelOutlined />
                    <div className={styles.rightContent}>
                        <div className={classnames(styles.nodeName)}>
                            {modelData.name}
                        </div>
                        {hoverModel === modelData.id && hasOprAccess && (
                            <div className={styles.operate}>
                                <div
                                    className={styles.moreOperate}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Dropdown
                                        menu={{
                                            items: moreModelItems,
                                            onClick: ({ key, domEvent }) => {
                                                domEvent.stopPropagation()
                                                handleOperateModel(
                                                    modelData,
                                                    key,
                                                )
                                            },
                                        }}
                                        getPopupContainer={(node) =>
                                            node.parentElement || node
                                        }
                                        overlayStyle={{
                                            width: 100,
                                        }}
                                    >
                                        <div className={styles.iconWrapper}>
                                            <EllipsisOutlined
                                                className={styles.operateIcon}
                                                style={{
                                                    fontSize: 20,
                                                }}
                                            />
                                        </div>
                                    </Dropdown>
                                </div>

                                <div
                                    className={
                                        errorIndicatorModel.includes(
                                            modelData.id,
                                        )
                                            ? styles.iconWrapperDisabled
                                            : styles.iconWrapper
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (
                                            errorIndicatorModel.includes(
                                                modelData.id,
                                            )
                                        ) {
                                            return
                                        }
                                        createIndicator(modelData.id)
                                    }}
                                >
                                    <Tooltip
                                        placement="bottom"
                                        title={__('新建业务指标')}
                                    >
                                        <AddOutlined
                                            className={styles.operateIcon}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {modelsData[modelData.id]?.expand &&
                    modelsData[modelData.id]?.indicatorData?.map(
                        (indicatorInfo) => (
                            <div
                                className={classnames(
                                    styles.treeNode,
                                    styles.leavesNode,
                                )}
                                style={
                                    errorIndicatorModel.includes(modelData.id)
                                        ? {
                                              color: `rgba(0, 0, 0, 0.25)`,
                                              cursor: 'not-allowed',
                                          }
                                        : {}
                                }
                                onClick={() => {
                                    if (
                                        errorIndicatorModel.includes(
                                            modelData.id,
                                        )
                                    ) {
                                        return
                                    }
                                    setSelectedModelId(modelData.id)
                                    onSeletedModel(modelData.id)
                                    onSeletedIndicator(
                                        `${
                                            indicatorInfo.indicator_id
                                        },${new Date().getTime()}`,
                                    )
                                }}
                                onMouseEnter={() =>
                                    setHoverIndicator(
                                        indicatorInfo.indicator_id,
                                    )
                                }
                                onMouseLeave={() => setHoverIndicator('')}
                                title={indicatorInfo.name}
                            >
                                <IndicatorThinColored />
                                <div className={styles.rightContent}>
                                    <div
                                        className={classnames(styles.nodeName)}
                                        style={
                                            errorIndicatorModel.includes(
                                                modelData.id,
                                            )
                                                ? {
                                                      color: `rgba(0, 0, 0, 0.25)`,
                                                      cursor: 'not-allowed',
                                                  }
                                                : {}
                                        }
                                    >
                                        {indicatorInfo.name}
                                    </div>
                                    {hoverIndicator ===
                                        indicatorInfo.indicator_id &&
                                        hasOprAccess &&
                                        !errorIndicatorModel.includes(
                                            modelData.id,
                                        ) && (
                                            <div className={styles.operate}>
                                                <div
                                                    className={
                                                        styles.moreOperate
                                                    }
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Dropdown
                                                        menu={{
                                                            items: moreIndicatorItems,
                                                            onClick: ({
                                                                key,
                                                                domEvent,
                                                            }) => {
                                                                domEvent.stopPropagation()
                                                                handleOperateIndicator(
                                                                    indicatorInfo.indicator_id,
                                                                    modelData,
                                                                    key,
                                                                )
                                                            },
                                                        }}
                                                        getPopupContainer={(
                                                            node,
                                                        ) =>
                                                            node.parentElement ||
                                                            node
                                                        }
                                                        overlayStyle={{
                                                            width: 100,
                                                        }}
                                                    >
                                                        <div
                                                            className={
                                                                styles.iconWrapper
                                                            }
                                                        >
                                                            <EllipsisOutlined
                                                                className={
                                                                    styles.operateIcon
                                                                }
                                                                style={{
                                                                    fontSize: 20,
                                                                }}
                                                            />
                                                        </div>
                                                    </Dropdown>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        ),
                    )}
            </div>
        )
    }

    return (
        <div className={styles.selectIIndicatorContainer}>
            <div className={styles.tltleBar}>
                <div className={styles.titleText}>{__('指标模型')}</div>

                <Tooltip placement="bottom" title={__('新建业务指标模型')}>
                    <div
                        className={styles.titleBtn}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onAddCreateModel()
                        }}
                        hidden={!hasOprAccess}
                    >
                        <AddOutlined />
                    </div>
                </Tooltip>
            </div>
            <div className={styles.treeContainer}>
                {indicatorModels.map((modelInfo) => {
                    return renderTreeNode(modelInfo)
                })}
            </div>
        </div>
    )
}

export default SelectIndicatorList
