import React from 'react'
import { Radio, RadioChangeEvent } from 'antd'
import __ from '../locale'
import { ConfigType, FormulaType } from '../const'
import styles from './styles.module.less'

interface Props {
    onChange: (e: RadioChangeEvent) => void
    formulaType: FormulaType
    value: ConfigType
}

const ConfigMode: React.FC<Props> = ({ onChange, value, formulaType }) => {
    return (
        <div className={styles.configType}>
            <span>{__('配置方式')}：</span>
            <Radio.Group value={value} onChange={onChange}>
                <Radio value={ConfigType.SQL}>{__('SQL')}</Radio>

                <Radio value={ConfigType.VIEW}>
                    {formulaType === FormulaType.WHERE
                        ? __('字段限定')
                        : __('字段聚合')}
                </Radio>
            </Radio.Group>
        </div>
    )
}

export default ConfigMode
