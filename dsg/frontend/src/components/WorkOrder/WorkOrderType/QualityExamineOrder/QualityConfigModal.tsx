import { useEffect } from 'react'
import { Breadcrumb, Button, Drawer, Space } from 'antd'
import { noop } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import Return from '../../Return'
import { ExplorationType } from '@/components/DatasheetView/DatasourceExploration/const'
import ExplorationRules from '@/components/DatasheetView/DatasourceExploration/ExplorationRules'
import { useDataViewContext } from '@/components/DatasheetView/DataViewProvider'
import {
    formatError,
    batchCreateExploreRule,
    getDatasourceConfig,
} from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

/**
 * 质量检测模型配置
 */
const QualityConfigModal = ({
    workOrderTitle,
    viewData,
    open,
    readOnly = false,
    onClose = noop,
}: any) => {
    const { explorationData, setExplorationData } = useDataViewContext()
    const [{ third_party }] = useGeneralConfig()
    useEffect(() => {
        if (viewData) {
            setExplorationData({
                dataViewId: viewData?.id,
            })
            getExploreConfig()
            initBatchCreateRule('metadata')
            initBatchCreateRule('field')
        }
    }, [viewData])

    const getExploreConfig = async () => {
        try {
            const configRes = await getDatasourceConfig({
                form_view_id: viewData?.id,
            })
            const config = configRes?.config ? JSON.parse(configRes.config) : {}
            setExplorationData((pre) => ({
                ...pre,
                total_sample: config?.total_sample || 0,
                datasourceRuleConfig: config,
                explorationType: ExplorationType.FormView,
                field_max_height: readOnly ? 220 : 260,
                attribute_max_height: readOnly ? 235 : 339,
            }))
        } catch (err) {
            formatError(err)
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
                form_view_id: viewData?.id || '',
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

    const handleClose = (needRefresh = false) => {
        setExplorationData({})
        onClose(needRefresh)
    }
    const titleRender = () => {
        const text = readOnly ? __('查看规则配置') : __('配置质量检测规则')
        return (
            <Breadcrumb>
                <Breadcrumb.Item>
                    <a onClick={onClose}>{workOrderTitle}</a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>{text}</Breadcrumb.Item>
            </Breadcrumb>
        )
    }

    return (
        <Drawer
            open={open}
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles['opt-wrapper']}>
                <div className={styles.header}>
                    <Return onReturn={handleClose} title={titleRender()} />
                </div>
                <div className={styles.configBody}>
                    <div className={styles.content}>
                        <ExplorationRules
                            explorationType={ExplorationType.FormView}
                            viewMode={readOnly}
                            hiddenSample
                            sampleTip={
                                third_party ? __('全量数据采样') : undefined
                            }
                        />
                    </div>
                    {!readOnly && (
                        <div className={styles.footer}>
                            <Space size={16}>
                                <Button
                                    type="primary"
                                    onClick={() => handleClose(true)}
                                >
                                    {__('确定')}
                                </Button>
                            </Space>
                        </div>
                    )}
                </div>
            </div>
        </Drawer>
    )
}
export default QualityConfigModal
