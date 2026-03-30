import React from 'react'
import { Form, Input, Radio } from 'antd'
import styles from './styles.module.less'
import {
    ErrorInfo,
    keyboardCharactersReg,
    OperateType,
    useQuery,
} from '@/utils'
import { IAnalysesConclusion } from '@/core'
import { PageType } from '../Requirement/const'

interface IRadioDesc {
    radioLabel: string
    descLabel: string
    radioField: string
    descField: string
    data?: { name: string; value: number }[]
    conclusionInfo?: IAnalysesConclusion
    pageType?: PageType
}
const RadioDesc: React.FC<IRadioDesc> = ({
    radioLabel,
    descLabel,
    radioField,
    descField,
    data = [
        { name: '匹配', value: 2 },
        { name: '不匹配', value: 1 },
    ],
    conclusionInfo,
    pageType = PageType.ANALYSIS,
}) => {
    const query = useQuery()
    const mode =
        query.get('mode') || pageType === PageType.APPLY
            ? OperateType.DETAIL
            : ''

    return (
        <div className={styles.radioDescWrapper}>
            <Form.Item label={radioLabel} name={radioField}>
                <Radio.Group disabled={mode === OperateType.DETAIL}>
                    {data.map((item) => (
                        <Radio value={item.value} key={item.value}>
                            {item.name}
                        </Radio>
                    ))}
                </Radio.Group>
            </Form.Item>
            <Form.Item
                noStyle
                shouldUpdate={(pre, cur) => pre[radioField] !== cur[radioField]}
            >
                {({ getFieldValue }) => {
                    return getFieldValue(radioField) === 1 ? (
                        <Form.Item
                            label={descLabel}
                            name={descField}
                            rules={[
                                {
                                    pattern: keyboardCharactersReg,
                                    message: ErrorInfo.EXCEPTEMOJI,
                                },
                            ]}
                        >
                            {mode === OperateType.DETAIL ? (
                                <div className={styles.value}>
                                    {conclusionInfo?.[descField] || '--'}
                                </div>
                            ) : (
                                <Input.TextArea
                                    placeholder="请输入"
                                    maxLength={255}
                                    style={{ height: 80, resize: 'none' }}
                                />
                            )}
                        </Form.Item>
                    ) : null
                }}
            </Form.Item>
        </div>
    )
}

export default RadioDesc
