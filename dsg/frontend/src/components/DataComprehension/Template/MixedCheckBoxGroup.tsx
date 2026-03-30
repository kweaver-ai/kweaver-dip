import React, { useState, useEffect, memo } from 'react'
import { Checkbox, Form } from 'antd'
import styles from './styles.module.less'

const MixedCheckboxGroup = ({ options = [], value = [], onChange }: any) => {
    const [indeterminateStates, setIndeterminateStates] = useState({})

    useEffect(() => {
        const newIndeterminateStates = {}
        options.forEach((item) => {
            if (item.children) {
                const childrenValues = item.children.map((child) => child.value)
                const selectedChildren = childrenValues.filter((childValue) =>
                    value.includes(childValue),
                )
                const isIndeterminate =
                    selectedChildren.length > 0 &&
                    selectedChildren.length < childrenValues.length
                if (indeterminateStates[item.value] !== isIndeterminate) {
                    newIndeterminateStates[item.value] = isIndeterminate
                }
            }
        })
        if (Object.keys(newIndeterminateStates).length > 0) {
            setIndeterminateStates((prev) => ({
                ...prev,
                ...newIndeterminateStates,
            }))
        }
    }, [value, options])

    // 处理一级复选框的选中事件
    const handleSingleChange = (itemValue) => (e) => {
        const newCheckedValues = e.target.checked
            ? [...value, itemValue]
            : value.filter((val) => val !== itemValue)
        onChange?.(newCheckedValues)
    }

    // 处理二级父级复选框的选中事件
    const handleParentChange = (parentValue, childrenValues) => (e) => {
        const newCheckedValues = e.target.checked
            ? [...value, parentValue, ...childrenValues]
            : value.filter(
                  (val) => val !== parentValue && !childrenValues.includes(val),
              )
        onChange?.(newCheckedValues)
    }

    // 处理二级子级复选框的选中事件
    const handleChildChange = (parentValue, childValue) => (e) => {
        const newCheckedValues = e.target.checked
            ? [...value, childValue]
            : value.filter((val) => val !== childValue)
        onChange?.(newCheckedValues)
    }

    return (
        <div className={styles.mixedCheckBox}>
            {options.map((item) => {
                if (item.children) {
                    const childrenValues = item.children.map(
                        (child) => child.value,
                    )
                    const allChildrenSelected = childrenValues.every(
                        (childValue) => value.includes(childValue),
                    )
                    const someChildrenSelected = childrenValues.some(
                        (childValue) => value.includes(childValue),
                    )

                    return (
                        <div key={item.value} className={styles.checkBoxItem}>
                            <Checkbox
                                indeterminate={indeterminateStates[item.value]}
                                checked={allChildrenSelected}
                                onChange={handleParentChange(
                                    item.value,
                                    childrenValues,
                                )}
                            >
                                {item.label}:
                            </Checkbox>
                            <div
                                style={{ marginLeft: 20 }}
                                className={styles.checkBoxChild}
                            >
                                {item.children.map((child) => (
                                    <Checkbox
                                        key={child.value}
                                        checked={value.includes(child.value)}
                                        onChange={handleChildChange(
                                            item.value,
                                            child.value,
                                        )}
                                    >
                                        {child.label}
                                    </Checkbox>
                                ))}
                            </div>
                        </div>
                    )
                }
                return (
                    <div key={item.value} className={styles.checkBoxItem}>
                        <Checkbox
                            checked={value.includes(item.value)}
                            onChange={handleSingleChange(item.value)}
                        >
                            {item.label}
                        </Checkbox>
                    </div>
                )
            })}
        </div>
    )
}
export default memo(MixedCheckboxGroup)
