import { noop } from 'lodash'
import { FC } from 'react'
import { Button, Tooltip } from 'antd'
import { Empty } from '@/ui'
import dataEmpty from '../../../assets/dataEmpty.svg'
import __ from '../locale'
import styles from './styles.module.less'

interface ISettingsEmptyProps {
    onChange?: () => void
    status: boolean
    taskIsCompleted: boolean
}
/**
 * 设置为空的组件。
 *
 * 该组件用于展示一个空的状态，引导用户进行数据过滤规则的配置。当用户还没有配置任何规则时，
 * 会显示这个组件，提示用户可以进行配置。
 *
 * @param onChange 配置更改的回调函数，默认为一个空操作。
 * @returns 返回一个展示空状态的div元素，包含一个提示信息和一个配置按钮。
 */
const SettingsEmpty: FC<ISettingsEmptyProps> = ({
    onChange = noop,
    status,
    taskIsCompleted,
}) => {
    return (
        <div className={styles.emptyContainer}>
            <div className={styles.titleBarWrapper}>
                <div className={styles.title}>{__('配置数据过滤规则')}</div>
            </div>
            <div className={styles.contentWrapper}>
                <Empty
                    iconSrc={dataEmpty}
                    desc={__(
                        '尚未配置规则，若您对需要对输出的数据进行过滤，可进行配置',
                    )}
                />
                <Tooltip
                    title={
                        status
                            ? __('源表已删除，无法配置数据过滤规则')
                            : taskIsCompleted
                            ? __('任务已完成无法配置，可进入库表管理进行操作')
                            : ''
                    }
                >
                    <Button
                        disabled={status || taskIsCompleted}
                        onClick={onChange}
                        style={{ marginTop: 20 }}
                    >
                        {__('配置数据过滤规则')}
                    </Button>
                </Tooltip>
            </div>
        </div>
    )
}

export default SettingsEmpty
