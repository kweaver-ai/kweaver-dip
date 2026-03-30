import React, { forwardRef, useImperativeHandle } from 'react'
import { Form } from 'antd'
import ConfigIndcatorForm from './ConfigIndcatorForm'
import { IndicatorType, TabsKey } from './const'
import { useQuery } from '@/utils'
import styles from './styles.module.less'

interface IMoreAttrbute {
    onChange?: (values: any) => void
}

const MoreAttribute = forwardRef((props: IMoreAttrbute, ref) => {
    const [form] = Form.useForm()
    const query = useQuery()
    const indicatorId = query.get('indicatorId') || ''
    const indicatorType = (query.get('type') ||
        IndicatorType.ATOM) as IndicatorType
    const operate = query.get('operate') || ''

    useImperativeHandle(ref, () => ({
        form,
    }))

    return (
        <div className={styles.moreAttribute}>
            <ConfigIndcatorForm
                form={form}
                indicatorType={
                    indicatorType === IndicatorType.ATOM
                        ? TabsKey.ATOMS
                        : TabsKey.DERIVE
                }
                onFinish={(val) => {
                    props.onChange?.(val)
                }}
                indicatorId={indicatorId}
            />
        </div>
    )
})

export default MoreAttribute
