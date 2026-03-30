import { CaretDownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import classnames from 'classnames'
import { Button, Dropdown, MenuProps } from 'antd'
import React, { useContext, useState } from 'react'
import styles from './styles.module.less'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { AddOutlined, BusinessFormCountOutlined } from '@/icons'
import {
    FormTableKind,
    FormTableKindOptions,
    FormType,
    NewFormType,
} from '../Forms/const'
import { getActualUrl, OperateType } from '@/utils'
import CreateForm from '../Forms/CreateForm'
import CreateDataOriginForm from '../Forms/CreateDataOriginForm'
import CreateDataStandardForm from '../Forms/CreateDataStandardForm'
import ImportForm from '../Forms/ImportForm'
import { TaskInfoContext } from '@/context'
import { TabKey, ViewMode } from './const'
import { BizModelType } from '@/core'
import { useBusinessModelContext } from './BusinessModelProvider'
import CreateDataFusion from '../Forms/CreateDataFusion'

interface IModelForm {
    formCount?: number
    standardizationRate?: number
    modelId: string
    domainId: string
}
const ModelForm: React.FC<IModelForm> = ({
    formCount = 0,
    standardizationRate = '0',
    modelId,
    domainId,
}) => {
    const navigate = useNavigate()
    const { taskInfo } = useContext(TaskInfoContext)
    const [createFormVisible, setCreateFormVisible] = useState(false)
    // 导入对话框显示
    const [importFormVisible, setImportFormVisible] = useState(false)
    const { businessModelType } = useBusinessModelContext()
    // 数据原始表对话框显示
    const [createDataOriginVisible, setCreateDataOriginVisible] =
        useState<boolean>(false)
    // 数据标准表对话框显示
    const [createDataStandardVisible, setCreateDataStandardVisible] =
        useState<boolean>(false)
    // 数据据融合表对话框显示
    const [createDataFusionVisible, setCreateDataFusionVisible] =
        useState<boolean>(false)

    const menuItems: MenuProps['items'] = [
        {
            key: NewFormType.BLANK,
            label: __('空白业务表'),
        },
        {
            key: OperateType.IMPORT,
            label: __('本地导入'),
        },
    ]

    const handleClickMenuItem = ({ key }) => {
        switch (key) {
            case NewFormType.BLANK:
                setCreateFormVisible(true)
                break
            case OperateType.IMPORT:
                setImportFormVisible(true)
                break
            case FormTableKind.DATA_ORIGIN:
                setCreateDataOriginVisible(true)
                break
            case FormTableKind.DATA_STANDARD:
                setCreateDataStandardVisible(true)
                break
            case FormTableKind.DATA_FUSION:
                setCreateDataFusionVisible(true)
                break
            default:
                break
        }
    }

    const jump = (tab: TabKey) => {
        if (businessModelType === BizModelType.BUSINESS) {
            navigate(
                `/coreBusiness/${modelId}?domainId=${domainId}&viewType=${ViewMode.BArchitecture}&targetTab=${tab}`,
            )
        } else {
            navigate(
                `/coreData/${modelId}?domainId=${domainId}&viewType=${ViewMode.BArchitecture}&targetTab=${tab}`,
            )
        }
    }

    return (
        <>
            <div className={styles['left-content-item']}>
                <div className={styles['content-title']}>
                    <div className={styles['content-title-left']}>
                        <BusinessFormCountOutlined
                            className={classnames(
                                styles['form-icon'],
                                styles['content-title-icon'],
                            )}
                        />
                        {businessModelType === BizModelType.BUSINESS
                            ? __('业务表')
                            : __('数据表')}
                    </div>
                    <Button type="link" onClick={() => jump(TabKey.FORM)}>
                        {__('查看全部')}
                    </Button>
                </div>
                {!formCount ? (
                    <Empty
                        desc={
                            <div className={styles['empty-desc']}>
                                <div>
                                    {businessModelType === BizModelType.BUSINESS
                                        ? __('暂无业务表，点击下方按钮可新建')
                                        : __('暂无数据表，点击下方按钮可新建')}
                                </div>
                                <div>
                                    <Dropdown
                                        menu={{
                                            items:
                                                businessModelType ===
                                                BizModelType.BUSINESS
                                                    ? menuItems
                                                    : FormTableKindOptions.filter(
                                                          (item) => {
                                                              const dataKeys = [
                                                                  FormTableKind.DATA_ORIGIN,
                                                                  FormTableKind.DATA_STANDARD,
                                                                  FormTableKind.DATA_FUSION,
                                                              ]
                                                              return dataKeys.includes(
                                                                  item.value,
                                                              )
                                                          },
                                                      ).map((item) => ({
                                                          key: item.value,
                                                          label: item.label,
                                                      })),
                                            onClick: handleClickMenuItem,
                                        }}
                                    >
                                        <Button
                                            type="primary"
                                            icon={<AddOutlined />}
                                            className={styles.btn}
                                        >
                                            {__('新建')}
                                            <CaretDownOutlined />
                                        </Button>
                                    </Dropdown>
                                </div>
                            </div>
                        }
                        iconSrc={dataEmpty}
                    />
                ) : (
                    <div className={styles.statistics}>
                        <div className={styles['statistic-item']}>
                            <div className={styles['statistic-label']}>
                                {__('数量')}
                            </div>
                            <div className={styles['statistic-value']}>
                                {formCount}
                            </div>
                        </div>
                        <div className={styles['statistic-item']}>
                            <div className={styles['statistic-label']}>
                                {__('标准化率')}
                            </div>
                            <div className={styles['statistic-value']}>
                                {standardizationRate
                                    ? `${Number(standardizationRate).toFixed(
                                          2,
                                      )}%`
                                    : 0}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {createFormVisible && (
                <CreateForm
                    onClose={() => {
                        setCreateFormVisible(false)
                    }}
                    mid={modelId}
                    onUpdate={() => {}}
                    taskId={taskInfo.taskId}
                    taskType={taskInfo.taskType}
                    // jumpUrl={`domainId=${domainId}&viewType=${ViewMode.BArchitecture}`}
                    jumpWithWindow
                />
            )}
            <ImportForm
                visible={importFormVisible}
                formType={FormType.STANDARD}
                mid={modelId}
                update={() => jump(TabKey.FORM)}
                onClose={() => setImportFormVisible(false)}
            />

            {createDataOriginVisible && (
                <CreateDataOriginForm
                    visible={createDataOriginVisible}
                    onClose={() => {
                        setCreateDataOriginVisible(false)
                    }}
                    onConfirm={() => {
                        jump(TabKey.FORM)
                        setCreateDataOriginVisible(false)
                    }}
                    mid={modelId}
                />
            )}
            {createDataStandardVisible && (
                <CreateDataStandardForm
                    visible={createDataStandardVisible}
                    onClose={() => {
                        setCreateDataStandardVisible(false)
                    }}
                    onConfirm={() => {
                        jump(TabKey.FORM)
                        setCreateDataStandardVisible(false)
                    }}
                    mid={modelId}
                />
            )}
            {createDataFusionVisible && (
                <CreateDataFusion
                    visible={createDataFusionVisible}
                    onClose={() => {
                        setCreateDataFusionVisible(false)
                    }}
                    onConfirm={() => {
                        // 待跳转
                        jump(TabKey.FORM)
                        setCreateDataFusionVisible(false)
                    }}
                    mid={modelId}
                />
            )}
        </>
    )
}

export default ModelForm
