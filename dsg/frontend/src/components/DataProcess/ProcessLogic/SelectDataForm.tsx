import {
    CodeOutlined,
    ExclamationCircleFilled,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { Button, Input, Tooltip, message } from 'antd'
import { FC, useEffect, useState } from 'react'

import { noop, trim } from 'lodash'
import { TaskExecutableStatus } from '@/core'
import { DataColoredBaseIcon } from '@/core/dataSource'
import { AddOutlined, FormDetailOutlined, RecycleBinOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import { error } from '@/utils/modalHelper'
import empty from '../../../assets/dataEmpty.svg'
import __ from '../locale'
import styles from '../styles.module.less'
import SelectDataFormModel from './SelectDataFormModel'

interface SelectDataFormType {
    expand: boolean
    onChangeExpand: (value: boolean) => void
    defaultData: Array<any>
    onChangeDataForm: (data: Array<any>) => void
    onClickOpen: (formInfo) => void
    taskStatus: TaskExecutableStatus
    onUseTable?: (tableInfo: string) => void
    isShowUseTable?: boolean
}
const SelectDataForm: FC<SelectDataFormType> = ({
    expand,
    onChangeExpand,
    defaultData,
    onChangeDataForm,
    onClickOpen,
    taskStatus,
    onUseTable = noop,
    isShowUseTable = false,
}) => {
    // 所有数据
    const [allDataForm, setAllDataForm] = useState<Array<any>>(defaultData)

    const [keyword, setKeyword] = useState<string>('')

    const [searchResult, setSearchResult] = useState<Array<any>>([])

    const [hoverItem, setHoverItem] = useState<string>('')

    const [addStatus, setAddStatus] = useState<boolean>(false)

    const [tableErrorInfo, setTableErrorInfos] = useState<Array<any>>([])

    useEffect(() => {
        setAllDataForm(defaultData)
    }, [defaultData])

    useEffect(() => {
        if (trim(keyword)) {
            setSearchResult(
                allDataForm.filter((currentForm) =>
                    (currentForm?.name || currentForm.table_name)
                        .toLocaleLowerCase()
                        .includes(trim(keyword).toLocaleLowerCase()),
                ),
            )
        } else {
            setSearchResult(allDataForm)
        }
    }, [keyword, allDataForm])

    return (
        <div
            className={
                expand
                    ? styles.selectDataFormExpand
                    : styles.selectDataFormUnExpand
            }
        >
            {expand ? (
                <div className={styles.content}>
                    <div className={styles.title}>
                        <div className={styles.name}>
                            {__('数据表列表（${count}）', {
                                count: allDataForm.length || '0',
                            })}
                        </div>
                        <Tooltip placement="right" title={__('收起')}>
                            <div className={styles.expandIcon}>
                                <MenuFoldOutlined
                                    onClick={() => {
                                        onChangeExpand(false)
                                    }}
                                />
                            </div>
                        </Tooltip>
                    </div>
                    {!allDataForm.length ? (
                        <Empty
                            iconSrc={empty}
                            desc={
                                <div className={styles.emptyData}>
                                    <div className={styles.text}>
                                        {__('暂无数据')}
                                    </div>
                                    {taskStatus ===
                                    TaskExecutableStatus.COMPLETED ? null : (
                                        <div>
                                            <span>{__('可点击')}</span>
                                            <span
                                                className={styles.execBtn}
                                                onClick={() => {
                                                    setAddStatus(true)
                                                }}
                                            >
                                                {__('【添加】')}
                                            </span>
                                            <span>
                                                {__('按钮可添加数据表')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            }
                        />
                    ) : (
                        <>
                            <div className={styles.toolBar}>
                                <Input
                                    onChange={(e) => {
                                        setKeyword(e.target.value)
                                    }}
                                    prefix={<SearchOutlined />}
                                    placeholder={__('搜索数据表')}
                                    autoComplete="off"
                                    maxLength={128}
                                    allowClear
                                    style={{
                                        width:
                                            taskStatus ===
                                            TaskExecutableStatus.COMPLETED
                                                ? '100%'
                                                : '148px',
                                        marginRight: '8px',
                                    }}
                                />
                                {taskStatus ===
                                TaskExecutableStatus.COMPLETED ? null : (
                                    <Tooltip
                                        placement="bottom"
                                        title={__('添加数据表')}
                                    >
                                        <Button
                                            icon={<AddOutlined />}
                                            onClick={() => {
                                                setAddStatus(true)
                                            }}
                                            disabled={allDataForm?.length >= 50}
                                        />
                                    </Tooltip>
                                )}
                            </div>
                            {searchResult?.length ? (
                                <div className={styles.dataFormData}>
                                    {searchResult.map((current, index) => (
                                        <div
                                            className={styles.item}
                                            onMouseEnter={() =>
                                                setHoverItem(current.table_name)
                                            }
                                            onMouseLeave={() =>
                                                setHoverItem('')
                                            }
                                        >
                                            <div className={styles.nameInfo}>
                                                <FormDetailOutlined />
                                                <Tooltip
                                                    title={
                                                        <div
                                                            className={
                                                                styles.formNodeTootip
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles.systemInfo
                                                                }
                                                            >
                                                                <FormDetailOutlined />
                                                                <div
                                                                    className={
                                                                        styles.displayName
                                                                    }
                                                                >
                                                                    {current?.name ||
                                                                        current?.table_name}
                                                                </div>
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles.dataSource
                                                                }
                                                            >
                                                                <DataColoredBaseIcon
                                                                    type={
                                                                        current.datasource_type
                                                                    }
                                                                    style={{
                                                                        fontSize:
                                                                            '18px',
                                                                    }}
                                                                    iconType="Outlined"
                                                                />
                                                                <div
                                                                    className={
                                                                        styles.displayName
                                                                    }
                                                                >
                                                                    {
                                                                        current.datasource_name
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    }
                                                    placement="right"
                                                    color="#fff"
                                                    overlayInnerStyle={{
                                                        color: 'rgba(0,0,0,0.65)',
                                                    }}
                                                >
                                                    <div
                                                        className={styles.name}
                                                        onClick={() => {
                                                            onClickOpen(current)
                                                        }}
                                                    >
                                                        {current?.name ||
                                                            current?.table_name}
                                                    </div>
                                                </Tooltip>

                                                {hoverItem ===
                                                current.table_name ? (
                                                    <div
                                                        className={
                                                            styles.btnGroup
                                                        }
                                                    >
                                                        {taskStatus ===
                                                        TaskExecutableStatus.COMPLETED ? null : (
                                                            <Tooltip
                                                                placement="bottom"
                                                                title={__(
                                                                    '移除',
                                                                )}
                                                            >
                                                                <RecycleBinOutlined
                                                                    className={
                                                                        styles.icon
                                                                    }
                                                                    onClick={() => {
                                                                        setAllDataForm(
                                                                            allDataForm.filter(
                                                                                (
                                                                                    currentForm,
                                                                                ) =>
                                                                                    currentForm.table_name !==
                                                                                    current.table_name,
                                                                            ),
                                                                        )
                                                                        onChangeDataForm(
                                                                            allDataForm.filter(
                                                                                (
                                                                                    currentForm,
                                                                                ) =>
                                                                                    currentForm.table_name !==
                                                                                    current.table_name,
                                                                            ),
                                                                        )
                                                                        message.success(
                                                                            '移除成功',
                                                                        )
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                        {taskStatus ===
                                                        TaskExecutableStatus.COMPLETED ? null : isShowUseTable ? (
                                                            <Tooltip
                                                                placement="bottom"
                                                                title={__(
                                                                    '插入到编辑器',
                                                                )}
                                                            >
                                                                <CodeOutlined
                                                                    className={
                                                                        styles.icon
                                                                    }
                                                                    onClick={() => {
                                                                        onUseTable(
                                                                            `${current.catalog_name}.${current.schema}.${current.table_name}`,
                                                                        )
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Empty />
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div
                    className={styles.content}
                    onClick={() => {
                        onChangeExpand(true)
                    }}
                >
                    <div className={styles.icon}>
                        <Tooltip placement="right" title={__('展开')}>
                            <div className={styles.unExpandIcon}>
                                <MenuUnfoldOutlined />
                            </div>
                        </Tooltip>
                    </div>
                    <div className={styles.name}>{__('数据表列表')}</div>
                </div>
            )}

            {addStatus && (
                <SelectDataFormModel
                    onClose={() => {
                        setAddStatus(false)
                    }}
                    allDataForms={allDataForm}
                    onConfirm={(values, tableErrors) => {
                        // setAllDataForm([...allDataForm, ...values])
                        // const noExistDataForm = values.filter((currentData) => {
                        //     const findedForm = allDataForm.find(
                        //         (originForm) =>
                        //             originForm.name === currentData.name &&
                        //             currentData.datasource_id ===
                        //                 originForm.datasource_id,
                        //     )
                        //     if (findedForm) {
                        //         return false
                        //     }
                        //     return true
                        // })
                        if (tableErrors.length) {
                            error({
                                title: (
                                    <div
                                        style={{
                                            color: '#000',
                                            fontWeight: '550',
                                        }}
                                    >
                                        {__('以下数据表未添加成功')}
                                    </div>
                                ),
                                content: (
                                    <div className={styles.addFormDataError}>
                                        {tableErrors.map((currentError) => (
                                            <div>
                                                <span>
                                                    {currentError.name || ''}:
                                                </span>
                                                <span>
                                                    {currentError?.errorDescription ||
                                                        ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ),
                                icon: (
                                    <ExclamationCircleFilled
                                        style={{
                                            color: 'rgba(245, 34, 45, 1)',
                                        }}
                                    />
                                ),
                                width: 420,
                                okText: __('确定'),
                            })
                        }
                        onChangeDataForm([...allDataForm, ...values])
                    }}
                />
            )}
        </div>
    )
}

export default SelectDataForm
