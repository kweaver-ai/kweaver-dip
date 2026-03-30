import { FC, useRef } from 'react'
import { Button, Space, Tooltip } from 'antd'
import { useSize } from 'ahooks'
import { noop } from 'lodash'
import __ from '../locale'
import styles from './styles.module.less'
import Editor from '@/ui/Editor'

/**
 * 接口IViewProps定义了库表组件的属性。
 *
 * @property {string} sqlSentence - 显示的SQL语句。
 * @property {() => void} [onSetConfig] - 设置配置的回调函数。可选。
 * @property {() => void} [onDeleteConfig] - 删除配置的回调函数。可选。
 */
interface IViewProps {
    sqlSentence: string
    onSetConfig?: () => void
    onDeleteConfig?: () => void
    status: boolean
    taskIsCompleted: boolean
}
/**
 * 数据过滤库表组件。
 *
 * 该组件用于展示数据过滤规则，并提供配置和删除规则的操作按钮。
 *
 * @param sqlSentence SQL语句，用于展示当前的过滤规则。
 * @param onSetConfig 配置规则的回调函数，点击配置按钮时触发。
 * @param onDeleteConfig 删除规则的回调函数，点击删除按钮时触发。
 * @returns 返回库表组件的JSX结构。
 */
const View: FC<IViewProps> = ({
    sqlSentence,
    onSetConfig = noop,
    onDeleteConfig = noop,
    status,
    taskIsCompleted,
}) => {
    // 使用ref获取编辑区域的大小，用于调整编辑器的高度。
    const editRef = useRef<HTMLDivElement>(null)
    // 使用自定义hook获取编辑区域的尺寸。
    const listSize = useSize(editRef)

    return (
        <div className={styles.viewContentWrapper}>
            <div className={styles.titleBarWrapper}>
                <div className={styles.title}>{__('数据过滤规则')}</div>
                {status || taskIsCompleted ? null : (
                    <Space size={8}>
                        <Tooltip
                            title={
                                status
                                    ? __('源表已删除，无法配置数据过滤规则')
                                    : ''
                            }
                        >
                            <Button
                                className={styles.btn}
                                type="primary"
                                onClick={() => {
                                    onSetConfig()
                                }}
                                disabled={status}
                            >
                                {__('配置规则')}
                            </Button>
                        </Tooltip>
                        <Button
                            className={styles.btn}
                            onClick={() => {
                                onDeleteConfig()
                            }}
                        >
                            {__('删除规则')}
                        </Button>
                    </Space>
                )}
            </div>

            <div className={styles.contentWrapper} ref={editRef}>
                <Editor
                    value={sqlSentence}
                    // 根据编辑区域的大小动态调整编辑器的高度。
                    height={
                        listSize?.height
                            ? listSize.height - 22
                            : 'calc(100% - 22px)'
                    }
                    onChange={noop}
                    initSource={[]}
                    readOnly
                />
            </div>
        </div>
    )
}

export default View
