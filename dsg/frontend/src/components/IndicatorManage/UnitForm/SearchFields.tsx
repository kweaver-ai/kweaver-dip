import React, { useMemo, useState } from 'react'
import { Tooltip } from 'antd'
import classNames from 'classnames'
import { InfoCircleOutlined } from '@ant-design/icons'
import { trim } from 'lodash'
import __ from '../locale'
import styles from './styles.module.less'
import { SearchInput } from '@/ui'
import Icons from '@/components/BussinessConfigure/Icons'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { disabledField } from '../const'

interface FieldType {
    id: string
    name_en: string
    name: string
    [key: string]: any
}

interface Props {
    onClick: (value: FieldType) => void
    options: FieldType[]
    placeholder?: string
    emptyDesc?: string
    hideOptions?: FieldType[]
}

const SearchFields: React.FC<Props> = ({
    onClick,
    options,
    placeholder,
    emptyDesc = __('暂无数据'),
    hideOptions = [],
}) => {
    // 筛选字段的数据
    // const [filterOptions, setFilterOptions] = useState<FieldType[]>(options)
    // 搜索库表字段
    const [keyword, setKeyword] = useState<string>('')
    // 字段筛选
    const handleChange = (value) => {
        setKeyword(value)
        // setFilterOptions(
        //     value
        //         ? options.filter(
        //               ({ name, name_en }) =>
        //                   name.includes(value) || name_en.includes(value),
        //           )
        //         : options,
        // )
    }

    const handleClick = (e, item) => {
        if (disabledField(item)) return
        e.stopPropagation()
        onClick?.(item)
    }

    const filterOptions = useMemo(() => {
        const hideIds = hideOptions.map(({ id }) => id)
        let opts = options.filter(({ id }) => !hideIds.includes(id))
        if (keyword) {
            opts = opts.filter(
                ({ name, name_en }) =>
                    name
                        ?.toLowerCase()
                        ?.includes(trim(keyword?.toLowerCase())) ||
                    name_en
                        ?.toLowerCase()
                        ?.includes(trim(keyword?.toLowerCase())),
            )
        }
        return opts
    }, [keyword, options, hideOptions])
    return (
        <div
            className={styles.searchFields}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={styles.search}>
                <SearchInput
                    placeholder={placeholder}
                    onKeyChange={handleChange}
                    value={keyword}
                    allowClear
                />
            </div>
            <div className={styles.searchContent}>
                {filterOptions.length ? (
                    filterOptions.map((item) => {
                        const { data_type, name, name_en, label_is_protected } =
                            item
                        return (
                            <div
                                key={name_en}
                                onClick={(e) => handleClick(e, item)}
                                className={classNames(
                                    styles.fields,
                                    disabledField(item) && styles.disabled,
                                )}
                            >
                                <Icons type={data_type} />
                                <div className={styles.fieldsInfo}>
                                    <div className={styles.name} title={name}>
                                        {name}
                                    </div>
                                    <div
                                        title={name_en}
                                        className={styles.enName}
                                    >
                                        {name_en}
                                    </div>
                                </div>
                                {disabledField(item) && (
                                    <Tooltip
                                        color="#fff"
                                        overlayInnerStyle={{
                                            color: 'rgba(0,0,0,0.85)',
                                        }}
                                        overlayStyle={{
                                            maxWidth: 600,
                                        }}
                                        placement="bottomRight"
                                        title={
                                            label_is_protected
                                                ? __(
                                                      '当前字段数据密级管控，不能进行度量计算，也不能作为分析维度查询其他数据',
                                                  )
                                                : __(
                                                      '当前字段数据受脱敏管控，不能查询最大值、最小值、分组求和以及根据分组计算平均值，也不能作为分析维度查询其他数据',
                                                  )
                                        }
                                    >
                                        <InfoCircleOutlined
                                            style={{ cursor: 'default' }}
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <div style={{ height: '100%', display: 'flex' }}>
                        <div style={{ margin: 'auto' }}>
                            {keyword ? (
                                <Empty />
                            ) : (
                                <Empty iconSrc={dataEmpty} desc={emptyDesc} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SearchFields
