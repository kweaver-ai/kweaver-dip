import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from 'antd'
import classnames from 'classnames'
import Loader from '@/ui/Loader'
import styles from './styles.module.less'
import CreateModel from './CreateModel'
import { AddOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import empty from '@/assets/emptyAdd.svg'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import { getIndicatorModels } from '@/core'
import DragBox from '../DragBox'
import MetricModel from '../MetricModel'
import { OptionModel } from '../MetricModel/const'
import SelectIndicatorList from './SelectIndicatorList'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface BussinessConfigureType {
    // 业务模型id
    mid: string
}
interface editModelInffo {
    description: string
    modelId: string
    name: ''
}
const BussinessConfigure: React.FC<BussinessConfigureType> = ({ mid }) => {
    const { checkPermission } = useUserPermCtx()

    const [defaultSize, setDefaultSize] = useState<Array<number>>([15, 85])
    const [createVisible, setCreateVisible] = useState(false)
    const [viewType, setViewType] = useState('')
    const [loading, setLoading] = useState(true)
    const [modelValue, setModelValue] = useState<editModelInffo>()
    const [modelData, setModelData] = useState<any>([])
    const [selectedModel, setSelectedModel] = useState<string>('')
    const [selectedIndicator, setSelectedIndicator] = useState<string>('')
    const [searchParams, setSearchParams] = useSearchParams()
    const taskId = searchParams.get('taskId') || ''
    const [errorIndicatorModel, setErrorIndicatorModel] = useState<
        Array<string>
    >([])

    useEffect(() => {
        if (mid) {
            setLoading(true)
            initLoadIndicator()
        }
    }, [mid])

    /**
     * 初始化获取所有指标模型
     */
    const initLoadIndicator = async () => {
        const { entries } = await getIndicatorModels(mid, {
            limit: 999,
        })
        setModelData(entries)
        setSelectedModel(entries[0]?.id)
        setLoading(false)
    }

    // 新建模型弹窗
    const createModel = () => {
        setCreateVisible(true)
        setViewType(OptionModel.CreateModel)
    }
    // 编辑指标模型
    const editModel = (value) => {
        const newobj: editModelInffo = {
            modelId: value.id,
            description: value.description,
            name: value.name,
        }
        setCreateVisible(true)
        setViewType(OptionModel.EditModel)
        setModelValue(newobj)
    }
    // 模型详情信息修改左侧列表name
    const editModelInfo = (values) => {
        const { id, newname } = values
        setModelData(
            modelData.map((item) => {
                if (item.id === id) {
                    return {
                        ...item,
                        name: newname,
                    }
                }
                return { ...item }
            }),
        )
    }
    const renderEmpty = () => {
        const hasAddAccess = checkPermission(
            'manageBusinessModelAndBusinessDiagnosis',
        )
        return hasAddAccess ? (
            <div className={styles.dataEmpty}>
                <Empty
                    iconSrc={empty}
                    desc={__('点击 【新建】按钮可新建业务指标')}
                />

                <Button
                    onClick={() => createModel()}
                    type="primary"
                    icon={<AddOutlined />}
                    className={styles.createBtn}
                >
                    {__('新建')}
                </Button>
            </div>
        ) : (
            <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
        )
    }
    return (
        <div
            className={classnames(
                styles.container,
                modelData.length === 0
                    ? styles.businCfgHasNoData
                    : styles.businCfgShadow,
            )}
        >
            {loading ? (
                <Loader />
            ) : modelData.length === 0 ? (
                <>
                    <div className={styles.tabContentTitle}>
                        {__('业务指标')}
                    </div>
                    <div className={styles.tabContent}>
                        <div className={styles.empty}>{renderEmpty()}</div>
                    </div>
                </>
            ) : (
                <div>
                    <DragBox
                        defaultSize={defaultSize}
                        minSize={[120, 500]}
                        maxSize={[600, Infinity]}
                        onDragEnd={(size) => {
                            setDefaultSize(size)
                        }}
                        gutterStyles={{
                            background: '#FFF',
                            width: '4px',
                            cursor: 'ew-resize',
                            position: 'relative',
                            top: '6px',
                        }}
                        gutterSize={4}
                        existPadding={false}
                    >
                        <div
                            style={{
                                overflow: 'hidden',
                            }}
                        >
                            <SelectIndicatorList
                                indicatorModels={modelData}
                                onAddCreateModel={createModel}
                                onEditModel={editModel}
                                mid={mid}
                                errorIndicatorModel={errorIndicatorModel}
                                onSeletedModel={setSelectedModel}
                                onSeletedIndicator={setSelectedIndicator}
                                onDeleteModel={(id) => {
                                    setModelData(
                                        modelData.filter(
                                            (modelInfo) => modelInfo.id !== id,
                                        ),
                                    )
                                }}
                                onDeleteIndicator={(id) => {
                                    setModelData(
                                        modelData.map((modelInfo) =>
                                            modelInfo.id === id
                                                ? {
                                                      ...modelInfo,
                                                      count:
                                                          modelInfo.count > 0
                                                              ? modelInfo.count -
                                                                1
                                                              : 0,
                                                  }
                                                : modelInfo,
                                        ),
                                    )
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                height: 'calc(100vh - 52px)',
                            }}
                        >
                            <MetricModel
                                modelId={mid}
                                optionModel={OptionModel.MetricDetail}
                                metricModelId={selectedModel}
                                metricId={selectedIndicator}
                                onModelFormError={(errorModelId) => {
                                    setErrorIndicatorModel([
                                        ...errorIndicatorModel,
                                        errorModelId,
                                    ])
                                }}
                            />
                        </div>
                    </DragBox>
                </div>
            )}
            {createVisible && (
                <CreateModel
                    onClose={() => {
                        setCreateVisible(false)
                    }}
                    modelValue={modelValue}
                    mid={mid}
                    taskId={taskId}
                    viewType={viewType as OptionModel}
                    onEditModel={editModelInfo}
                />
            )}
        </div>
    )
}

export default BussinessConfigure
