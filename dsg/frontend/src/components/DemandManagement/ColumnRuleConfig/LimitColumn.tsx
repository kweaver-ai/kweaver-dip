import React, {
    forwardRef,
    memo,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react'
import { Checkbox } from 'antd'
import classnames from 'classnames'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { useUpdateEffect } from 'ahooks'
import { CheckboxValueType } from 'antd/lib/checkbox/Group'
import __ from '../locale'
import styles from './styles.module.less'
import { SearchInput, Empty } from '@/ui'
import Icons from '../Icons'
import { IDatasheetField } from '@/core'

interface ILimitColumn {
    fieldList: IDatasheetField[]
    initData?: any[]
    ref?: any
}
const LimitColumn: React.FC<ILimitColumn> = forwardRef(
    ({ fieldList, initData }: any, ref) => {
        const [searchKey, setSearchKey] = useState('')
        const [fields, setFields] = useState<IDatasheetField[]>([])
        const [showFields, setShowFields] = useState<any[]>([])
        const [indeterminate, setIndeterminate] = useState(false)
        const [checkAll, setCheckAll] = useState(false)
        const [checkedList, setCheckedList] = useState<any[]>([])

        useEffect(() => {
            if (initData) {
                setCheckedList(initData.map((item) => item.id))
            }
        }, [initData])

        const getCheckedFields = () => {
            return checkedList.map((id) => {
                const targetField: IDatasheetField = fieldList.find(
                    (f: IDatasheetField) => f.id === id,
                )!
                return {
                    id,
                    name_en: targetField.technical_name,
                    data_type: targetField.data_type,
                    name: targetField.business_name,
                }
            })
        }

        useImperativeHandle(ref, () => ({
            getCheckedFields,
        }))

        const initFieldsData = () => {
            const targetField = fieldList.find((f) => f.primary_key)
            const targetFields = fieldList.filter((f) => !f.primary_key)

            const data = (
                targetField ? [targetField, ...targetFields] : fieldList
            ).map((f) => ({
                ...f,
                label: (
                    <div className={styles.label}>
                        <div className={styles['icon-container']}>
                            <Icons type={f.data_type} fontSize={12} />
                        </div>
                        <span
                            className={classnames(
                                styles.name,
                                f.primary_key && styles['primary-key-name'],
                            )}
                            title={f.business_name}
                        >
                            {f.business_name}
                        </span>
                        {f.primary_key && (
                            <span className={styles['primary-key']}>
                                {__('主键')}
                            </span>
                        )}
                    </div>
                ),
                value: f.id,
                disabled: f.primary_key,
            }))
            setFields(data)
            setShowFields(data)
            // 设置主键字段为默认选中字段 setCheckedList
            if (targetField && !initData) {
                setCheckedList([targetField.id])
            }
        }

        const searchFields = () => {
            setShowFields(
                fields.filter((f) =>
                    f.business_name
                        .toLocaleLowerCase()
                        .includes(searchKey.toLocaleLowerCase()),
                ),
            )
        }

        useEffect(() => {
            initFieldsData()
        }, [fieldList])

        useUpdateEffect(() => {
            searchFields()
        }, [searchKey])

        useEffect(() => {
            if (showFields.every((f) => checkedList.includes(f.id))) {
                setIndeterminate(false)
                setCheckAll(true)
            } else if (showFields.some((f) => checkedList.includes(f.id))) {
                setIndeterminate(true)
                setCheckAll(false)
            } else {
                setIndeterminate(false)
                setCheckAll(false)
            }
        }, [showFields, checkedList])

        const onCheckAllChange = (e: CheckboxChangeEvent) => {
            // TODO: 全选时排除主键字段
            const data = e.target.checked
                ? searchKey
                    ? Array.from(
                          new Set([
                              ...showFields.map((f) => f.value),
                              ...checkedList,
                          ]),
                      )
                    : showFields.map((f) => f.value)
                : // 从全部选中项中 包含搜索结果的选中项过滤掉
                  checkedList.filter(
                      (id) =>
                          !showFields.find(
                              (f) => f.id === id && !f.primary_key,
                          ),
                  )

            setCheckedList(data)
        }

        const onChange = (list: any[]) => {
            let data = list
            if (searchKey) {
                data = Array.from(
                    new Set([
                        ...list,
                        ...checkedList.filter(
                            (id) => !showFields.find((f) => f.id === id),
                        ),
                    ]),
                )
            }
            setCheckedList(data)
        }

        return (
            <div className={styles['limit-column-wrapper']}>
                <div className={styles.operate}>
                    {showFields.length > 0 ? (
                        <Checkbox
                            className={styles['check-all']}
                            onChange={onCheckAllChange}
                            indeterminate={indeterminate}
                            checked={checkAll}
                        >
                            {__('全选')}
                        </Checkbox>
                    ) : (
                        <div />
                    )}

                    <SearchInput
                        placeholder={__('搜索字段名称')}
                        value={searchKey}
                        onKeyChange={(key) => setSearchKey(key)}
                        style={{ width: 280 }}
                    />
                </div>
                {showFields.length === 0 ? (
                    <Empty />
                ) : (
                    <Checkbox.Group
                        options={showFields}
                        onChange={onChange}
                        value={checkedList}
                    />
                )}
            </div>
        )
    },
)

export default memo(LimitColumn)
