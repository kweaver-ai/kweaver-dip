import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { Input, Popover, Row } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import parser from 'cron-parser'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'

interface ICrontabEditor {
    value?: string
    onChange?: (value: string) => void
    onBlur?: (value: string) => void
    ref: any
}

const CrontabEditor: React.FC<ICrontabEditor> = forwardRef(
    (props: any, ref) => {
        const { value, onChange, onBlur } = props
        const [nextExecuteTime, setNextExecuteTime] = useState<string>('')
        const [error, setError] = useState<string>('')

        useImperativeHandle(ref, () => ({
            validate: () => validate(),
        }))

        // 验证 crontab 表达式
        const validate = async () => {
            try {
                const newValue = value?.trim()
                if (!newValue) {
                    setError(__('调度规则不能为空'))
                    return Promise.reject(new Error())
                }
                const cronArr = newValue.split(' ')
                if (cronArr.length !== 5) {
                    setError(__('请按照示例格式输入'))
                    return Promise.reject(new Error())
                }
                // 解析 cron 表达式
                parser.parseExpression(newValue)
                return Promise.resolve()
            } catch (err: any) {
                setError(err.message || __('无效的 Crontab 表达式'))
                return Promise.reject(new Error())
            }
        }

        // 处理输入变化
        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value
            onChange?.(newValue)
            if (!value?.trim() || value?.trim() !== newValue?.trim()) {
                setError('')
            }
        }

        const placeholder = `Crontab 表达式规则：
注：Linux中没有second，最小是miniute。
*   *   *   *   *
-   -   -  -   -
|    |    |    |    |
|    |    |    |    +----- 星期中星期几 (0 - 6) (星期天 为0)
|    |    |    +---------- 月份 (1 - 12)
|    |    +--------------- 一个月中的第几天 (1 - 31)
|    +-------------------- 小时 (0 - 23)
+------------------------- 分钟 (0 - 59)
例：30 21 * * *
表示每晚21:30分执行`

        return (
            <div className={classnames(styles.crontabEditor)}>
                <Row className={styles.crontabEditorTitle}>
                    <span className={styles.titleLeft}>
                        {__('Crontab 表达式说明：')}
                        <Popover
                            trigger="click"
                            content={
                                <div>
                                    <div style={{ color: 'rgb(0,0,0,0.45)' }}>
                                        # 每天 5 点半
                                    </div>
                                    <div style={{ color: 'rgb(0,0,0,0.85)' }}>
                                        30 5 * * ?
                                    </div>
                                    <div style={{ color: 'rgb(0,0,0,0.45)' }}>
                                        # 每天 6 到 8 点，每 10 分钟
                                    </div>
                                    <div style={{ color: 'rgb(0,0,0,0.85)' }}>
                                        */10 6-8 * * *
                                    </div>
                                </div>
                            }
                        >
                            <span className={styles.exampleLink}>
                                {__('查看示例')}
                            </span>
                        </Popover>
                    </span>
                    {error && (
                        <span className={styles.titleMiddle}>
                            <ExclamationCircleFilled
                                style={{ color: '#FAAD14', marginRight: 8 }}
                            />
                            <span className={styles.errorTitle}>
                                {__('Crontab 存在错误，请修改。')}
                            </span>
                            <Popover
                                trigger="click"
                                content={
                                    <div>
                                        <div
                                            style={{
                                                color: '#FF4D4F',
                                                marginBottom: 8,
                                            }}
                                        >
                                            {__('错误信息')}
                                        </div>
                                        <span>{error}</span>
                                    </div>
                                }
                            >
                                <span className={styles.errorInfo}>
                                    {__('查看错误信息')}
                                </span>
                            </Popover>
                        </span>
                    )}
                </Row>
                <Input.TextArea
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoSize={{ minRows: 12, maxRows: 12 }}
                    onBlur={(e) => onBlur?.(e.target.value?.trim())}
                />
            </div>
        )
    },
)

export default CrontabEditor
