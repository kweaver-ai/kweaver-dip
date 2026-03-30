import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from 'antd'
import __ from './locale'
import styles from './styles.module.less'
import RuleDetailMap from '../DatasourceExploration/RulesModal/RuleDetailMap'
import { ExplorationRuleTabs } from '../DatasourceExploration/const'
import { useDataViewContext } from '../DataViewProvider'
import {
    dataTypeMapping,
    formatError,
    getDatasheetViewDetails,
    getExploreRuleDetails,
    HasAccess,
} from '@/core'
import { Expand, Loader } from '@/ui'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const TitleEnum = {
    view: '库表级',
    row: '行级',
    field: '字段级',
}

function RuleDetail({ type, open, onClose, ruleId, ruleInfo }: any) {
    const { explorationData, setExplorationData } = useDataViewContext()
    const [ruleDetails, setRuleDetails] = useState<any>(null)
    const [fieldList, setFieldList] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const { checkPermissions } = useUserPermCtx()
    // 是否拥有工程师角色
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])
    useEffect(() => {
        if (open) {
            if (ruleId) {
                getDetails()
            } else {
                setRuleDetails(ruleInfo)
            }
        }
    }, [open, ruleId, ruleInfo])

    useEffect(() => {
        if (explorationData?.dataViewId) {
            if (explorationData?.fieldList?.length) {
                setFieldList(explorationData?.fieldList)
            } else {
                getFields(explorationData?.dataViewId)
            }
        }
    }, [])

    const getFields = async (dataViewId: string) => {
        try {
            const res = await getDatasheetViewDetails(dataViewId, {
                enable_data_protection: true,
            })
            // 过滤已删除、二进制字段
            const list = res?.fields
                ?.filter(
                    (item) =>
                        item.status !== 'delete' &&
                        !dataTypeMapping.binary.includes(item.data_type),
                )
                ?.map((item) => {
                    return {
                        ...item,
                        checked: false,
                    }
                })
            setExplorationData({
                ...explorationData,
                fieldList: list,
            })
            setFieldList(list)
        } catch (error) {
            formatError(error)
        }
    }

    const getDetails = async () => {
        setLoading(true)
        try {
            const res = await getExploreRuleDetails(ruleId)
            setRuleDetails(res)
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }
    const renderRuleContent = (info: any) => {
        return (
            <RuleDetailMap
                config={info?.rule_config}
                fields={fieldList}
                canShowSwitch={hasDataOperRole}
            />
        )
    }
    return (
        <Modal
            title={(TitleEnum?.[type] ?? '') + __('规则详情')}
            open={open}
            width={400}
            destroyOnClose
            footer={null}
            maskClosable
            getContainer={false}
            onCancel={onClose}
            bodyStyle={{ padding: 0, minHeight: '400px' }}
        >
            {loading ? (
                <div style={{ paddingTop: '60px' }}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.ruleModalBox}>
                    <div
                        className={styles.textItem}
                        style={{ alignItems: 'flex-start' }}
                    >
                        <div className={styles.label}>{__('规则名称')}：</div>
                        <div
                            className={styles.text}
                            style={{ whiteSpace: 'initial' }}
                        >
                            <Expand
                                rows={2}
                                content={ruleDetails?.rule_name ?? '--'}
                                expandTips={__('展开')}
                            />
                        </div>
                    </div>
                    <div
                        className={styles.textItem}
                        style={{ alignItems: 'flex-start' }}
                    >
                        <div className={styles.label}>{__('规则描述')}：</div>
                        <div
                            className={styles.text}
                            style={{ whiteSpace: 'initial' }}
                        >
                            <Expand
                                rows={2}
                                content={ruleDetails?.rule_description ?? '--'}
                                expandTips={__('展开')}
                            />
                        </div>
                    </div>
                    {renderRuleContent(ruleDetails)}
                </div>
            )}
        </Modal>
    )
}

export default RuleDetail
