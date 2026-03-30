import React, { HTMLAttributes } from 'react'
import { Select } from 'antd'
import { SelectProps } from 'antd/es/select'
import styles from './styles.module.less'
import __ from './locale'
import { stardOrignizeTypeList } from '@/utils'

interface IStdTypeSelect extends SelectProps {}

const stdTypeList = stardOrignizeTypeList.slice(1)

/**
 * 任务优先级选择组件
 */
export const StdTypeSelect: React.FC<IStdTypeSelect> = ({ ...props }) => {
    return (
        <Select
            className={styles.formsBase}
            placeholder={__('请选择新建标准的分类')}
            options={stdTypeList}
            getPopupContainer={(node) => node.parentNode}
            {...props}
        />
    )
}
