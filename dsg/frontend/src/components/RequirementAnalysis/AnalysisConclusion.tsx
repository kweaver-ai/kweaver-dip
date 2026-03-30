import React, { useEffect } from 'react'
import { Form, FormInstance, Input, Radio } from 'antd'
import { analysisReasonableFields } from './const'
import RadioDesc from './RadioDesc'
import styles from './styles.module.less'
import {
    ErrorInfo,
    keyboardCharactersReg,
    OperateType,
    useQuery,
} from '@/utils'
import { IAnalysesConclusion } from '@/core'
import { PageType } from '../Requirement/const'

interface IConclusion {
    form: FormInstance
    conclusionInfo?: IAnalysesConclusion
    setIsChanged?: (val: boolean) => void
    pageType?: PageType
}
const AnalysisConclusion: React.FC<IConclusion> = ({
    form,
    conclusionInfo,
    setIsChanged = () => {},
    pageType = PageType.ANALYSIS,
}) => {
    const query = useQuery()
    const mode =
        query.get('mode') || pageType === PageType.APPLY
            ? OperateType.DETAIL
            : ''

    return (
        <Form
            form={form}
            labelAlign="left"
            autoComplete="off"
            className={styles.analysisConclusionForm}
            onValuesChange={() => {
                setIsChanged(true)
            }}
        >
            <div className={styles.title}>合理性判断</div>
            {analysisReasonableFields.map((item) => (
                <RadioDesc
                    {...item}
                    key={item.descField}
                    conclusionInfo={conclusionInfo}
                    pageType={pageType}
                />
            ))}
            <div className={styles.title}>可行性判断</div>
            <Form.Item label="需求可行性" name="demand_feasibility">
                <Radio.Group disabled={mode === OperateType.DETAIL}>
                    <Radio value={3}>可行</Radio>
                    <Radio value={2}>部分可行</Radio>
                    <Radio value={1}>不可行</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item
                noStyle
                shouldUpdate={(pre, cur) =>
                    pre.demand_feasibility !== cur.demand_feasibility
                }
            >
                {({ getFieldValue }) => {
                    if (getFieldValue('demand_feasibility') === 3) return null
                    return (
                        <Form.Item
                            label="说明"
                            name="demand_feasibility_desc"
                            rules={[
                                {
                                    pattern: keyboardCharactersReg,
                                    message: ErrorInfo.EXCEPTEMOJI,
                                },
                            ]}
                        >
                            {mode === OperateType.DETAIL ? (
                                <div className={styles.value}>
                                    {conclusionInfo?.demand_feasibility_desc ||
                                        '--'}
                                </div>
                            ) : (
                                <Input.TextArea
                                    placeholder="请输入"
                                    maxLength={255}
                                    style={{ height: 80, resize: 'none' }}
                                />
                            )}
                        </Form.Item>
                    )
                }}
            </Form.Item>

            <div className={styles.title}>结论说明</div>
            <Form.Item
                label="说明"
                name="final_report"
                rules={[
                    {
                        pattern: keyboardCharactersReg,
                        message: ErrorInfo.EXCEPTEMOJI,
                    },
                ]}
            >
                {mode === OperateType.DETAIL ? (
                    <div className={styles.value}>
                        {conclusionInfo?.final_report || '--'}
                    </div>
                ) : (
                    <Input.TextArea
                        placeholder="请输入"
                        maxLength={255}
                        style={{ height: 80, resize: 'none' }}
                    />
                )}
            </Form.Item>
        </Form>
    )
}
export default AnalysisConclusion
