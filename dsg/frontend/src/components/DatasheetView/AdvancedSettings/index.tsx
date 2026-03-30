import { message } from 'antd'
import { FC, useEffect, useState } from 'react'

import { ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons'
import {
    deleteFilterRule,
    formatError,
    getDatasheetViewDetails,
    getFilterRule,
} from '@/core'
import { Loader } from '@/ui'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { confirm } from '@/utils/modalHelper'
import { AdvancedSettingStatus } from '../const'
import __ from '../locale'
import ConfigDrawer from './ConfigDrawer'
import SettingsEmpty from './SettingsEmpty'
import styles from './styles.module.less'
import View from './View'

interface IAdvancedSettings {
    fieldsList?: Array<any>
    dataViewId: string
    taskIsCompleted: boolean
}
const AdvancedSettings: FC<IAdvancedSettings> = ({
    fieldsList = [],
    dataViewId,
    taskIsCompleted,
}) => {
    const [settingStatus, setSettingStatus] = useState<AdvancedSettingStatus>()

    const [loading, setLoading] = useState(true)

    const [filterRule, setFilterRule] = useState<string>('')

    const [originStatus, setOriginStatus] = useState<boolean>(false)

    const [openConfig, setOpenConfig] = useState<boolean>(false)
    useEffect(() => {
        getDetails()
    }, [])

    /**
     * 异步获取详细信息的函数。
     *
     * 该函数用于初始化或重置某些状态，比如加载状态和设置状态。它将加载状态设置为false，表示加载操作结束，
     * 并将设置状态设置为EMPTY，可能表示设置界面或相关数据尚未填充。
     *
     * @remarks
     * 此函数假设在某些上下文中被调用，用于处理高级设置的状态。它不接受任何参数，也不返回任何值。
     * 主要作用是协调界面状态，为用户提供一个清晰的界面反馈。
     */
    const getDetails = async () => {
        const [{ filter_rule }, { status }] = await Promise.all([
            getFilterRule(dataViewId),
            getDatasheetViewDetails(dataViewId),
        ])
        setLoading(false) // 结束加载状态，让用户知道数据或界面即将准备好。
        if (filter_rule) {
            setSettingStatus(AdvancedSettingStatus.VIEW)
            // 将设置状态设为空，可能表示尚未进行任何设置。
            setFilterRule(filter_rule)
        } else {
            setSettingStatus(AdvancedSettingStatus.EMPTY)
        }

        setOriginStatus(status === 'delete')
    }

    /**
     * 异步处理删除过滤规则的操作。
     *
     * 此函数尝试删除指定数据库表的过滤规则。如果删除成功，它将设置设置状态为为空。
     * 如果删除过程中发生错误，错误将被捕获并进行格式化处理。
     *
     * @remarks
     * 此函数依赖于外部定义的 `deleteFilterRule` 和 `formatError` 函数，以及 `dataViewId` 和 `setSettingStatus` 变量。
     *
     * @async
     * @throws {Error} 如果删除过滤规则时发生错误，将抛出异常。
     */
    const handleDeleteFilterRule = async () => {
        try {
            // 调用删除过滤规则的函数，传入数据库表ID。
            await deleteFilterRule(dataViewId)
            // 删除成功后，设置设置状态为为空。
            setSettingStatus(AdvancedSettingStatus.EMPTY)
            message.success(__('删除成功'))
        } catch (error) {
            // 捕获并处理删除过程中可能出现的错误。
            formatError(error)
        }
    }

    /**
     * 根据设置状态获取对应的设置组件。
     * @param status 设置状态，决定渲染哪个配置组件。
     * @returns 返回对应状态的设置组件，如果没有对应状态则返回null。
     */
    const getSettingComponents = (status) => {
        switch (status) {
            case AdvancedSettingStatus.EMPTY:
                // 空状态下的设置组件，用于引导用户进行配置。
                return (
                    <SettingsEmpty
                        onChange={() => {
                            setOpenConfig(true)
                        }}
                        status={originStatus}
                        taskIsCompleted={taskIsCompleted}
                    />
                )
            case AdvancedSettingStatus.VIEW:
                // 查看状态下的设置组件，展示已配置的过滤规则。
                return (
                    <div className={styles.viewContainer}>
                        {originStatus && (
                            <div className={styles.modifyTips}>
                                <InfoCircleFilled className={styles.icon} />
                                {__('源表已删除，无法配置数据过滤规则')}
                            </div>
                        )}
                        <div className={styles.viewWrapper}>
                            <View
                                sqlSentence={filterRule}
                                onSetConfig={() => {
                                    setOpenConfig(true)
                                }}
                                onDeleteConfig={() => {
                                    confirm({
                                        title: __('确定要删除规则吗？'),
                                        content: __(
                                            '删除后将不再做数据过滤，默认可输出全部数据。',
                                        ),
                                        icon: (
                                            <ExclamationCircleFilled
                                                style={{ color: '#faad14' }}
                                            />
                                        ),
                                        okText: __('确定'),
                                        cancelText: __('取消'),
                                        onOk: handleDeleteFilterRule,
                                    })
                                }}
                                status={originStatus}
                                taskIsCompleted={taskIsCompleted}
                            />
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className={styles.container}>
            {loading ? (
                <div className={styles.container}>
                    <Loader />
                </div>
            ) : (
                getSettingComponents(settingStatus)
            )}
            {openConfig && (
                <ConfigDrawer
                    visible={openConfig}
                    fieldList={fieldsList}
                    defaultSql={filterRule}
                    dataViewId={dataViewId}
                    onCancel={(sql) => {
                        if (sql !== filterRule) {
                            ReturnConfirmModal({
                                onCancel: () => {
                                    setOpenConfig(false)
                                },
                            })
                        } else if (filterRule) {
                            setOpenConfig(false)
                        } else {
                            setOpenConfig(false)
                        }
                    }}
                    onClose={() => {
                        setOpenConfig(false)
                    }}
                    onConfirm={(sql) => {
                        setFilterRule(sql)
                        setSettingStatus(AdvancedSettingStatus.VIEW)
                        setOpenConfig(false)
                    }}
                />
            )}
        </div>
    )
}

export default AdvancedSettings
