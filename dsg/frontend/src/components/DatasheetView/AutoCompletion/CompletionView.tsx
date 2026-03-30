import React, { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { Checkbox, Switch, Tooltip } from 'antd'
import { InfoCircleFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { useDebounceFn } from 'ahooks'
import styles from './styles.module.less'
import __ from '../locale'
import { AutoCompleteStatus, IconType } from '../const'
import { useDataViewContext } from '../DataViewProvider'
import { DatasheetViewColored, FontIcon } from '@/icons'
import { IconType as FontIconType } from '@/icons/const'
import { Empty, SearchInput } from '@/ui'
import { getFieldTypeEelment, validateRepeatName } from '../helper'
import { highLight } from '@/components/ApiServices/const'
import Icons from '../Icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { formatError, getDataViewRepeat } from '@/core'

interface IViewInfo {
    value: string
    editValue?: string
    // 是否选中
    selected?: boolean
    // 是否是补全的
    isCompleted?: boolean
    // 在编辑中
    isEdit?: boolean
    // 错误
    tips?: string
}

interface ICompletionView {
    // 字段信息
    fields: any[]
    // 库表名称
    viewName: IViewInfo
    // 库表描述
    viewDescription: IViewInfo
    // 是否补全后 - 已补全状态需要
    after?: boolean
    setFields: Dispatch<SetStateAction<any>>
    setViewName: Dispatch<SetStateAction<IViewInfo>>
    setViewDescription: Dispatch<SetStateAction<IViewInfo>>
    // 是否只展示有补全结果
    onlyCompleteResult: boolean
    setOnlyCompleteResult: Dispatch<SetStateAction<boolean>>
}

const CompletionView = (props: ICompletionView) => {
    const {
        after,
        fields,
        viewName,
        viewDescription,
        setFields,
        setViewName,
        setViewDescription,
        onlyCompleteResult = true,
        setOnlyCompleteResult,
    } = props
    const {
        optionType,
        completeStatus,
        datasheetInfo,
        fieldsTableData,
        logicViewType,
    } = useDataViewContext()
    // 搜索值
    const [searchValue, setSearchValue] = useState<string>('')
    // 编辑值
    const [editValue, setEditValue] = useState<string>()

    // 不同显示方案
    const type = useMemo(() => {
        // 选择补全信息
        if (completeStatus !== AutoCompleteStatus.Completed) {
            return 1
        }
        // 补全前
        if (!after) {
            return 2
        }
        // 补全后要区分操作模式
        if (optionType === 'view') {
            return 3
        }
        return 4
    }, [completeStatus, after, optionType])

    // 是否显示库表信息
    const showViewInfo = useMemo(
        () => viewName || viewDescription,
        [viewName, viewDescription],
    )

    // 展示的字段
    const fieldsList = useMemo(() => {
        // 搜索的
        if (searchValue) {
            return (
                fields?.filter(
                    (item) =>
                        item.business_name
                            .toLocaleLowerCase()
                            .includes(searchValue.toLocaleLowerCase()) ||
                        item.technical_name
                            .toLocaleLowerCase()
                            .includes(searchValue.toLocaleLowerCase()),
                ) || []
            )
        }
        // 有补全的
        if (
            onlyCompleteResult &&
            completeStatus === AutoCompleteStatus.Completed
        ) {
            return fields?.filter((item) => item.isCompleted)
        }
        return fields
    }, [searchValue, fields, onlyCompleteResult])

    // 顶部标题
    const getTitle = () => {
        if (type === 1) {
            return (
                <div
                    className={classnames(
                        styles.title,
                        after && styles.leftLine,
                    )}
                >
                    <div className={styles.content}>
                        <InfoCircleFilled className={styles.info_icon} />
                        <span className={styles.name}>
                            {__('请选择需要补全的信息')}
                        </span>
                    </div>
                </div>
            )
        }
        return (
            <div className={classnames(styles.title, after && styles.leftLine)}>
                <div className={styles.content}>
                    <span className={styles.left_icon} />
                    <span className={styles.right_icon} />
                    <span className={styles.name}>
                        {type === 2 ? __('补全前') : __('补全后')}
                    </span>
                    {[4].includes(type) && (
                        <>
                            <InfoCircleFilled className={styles.info_icon} />
                            <span className={styles.name}>
                                {__('请选择需要采纳的信息')}
                            </span>
                        </>
                    )}
                </div>
                <div className={styles.line} />
            </div>
        )
    }

    // 库表信息配置
    const viewInfoConfig = {
        name: {
            key: 'business_name',
            maxLength: 255,
            title: __('名称：'),
            icon: <DatasheetViewColored className={styles.icon} />,
            placeholder: __('请输入库表业务名称'),
            showCount: false,
            canEmpty: false,
            setFn: setViewName,
        },
        desc: {
            key: 'technical_name',
            maxLength: 300,
            title: __('描述：'),
            icon: (
                <FontIcon
                    type={FontIconType.COLOREDICON}
                    name="icon-xuqiushenheicon"
                    className={classnames(styles.icon, styles.descIcon)}
                />
            ),
            placeholder: __('请输入库表技术名称'),
            showCount: true,
            canEmpty: true,
            setFn: setViewDescription,
        },
    }

    // 库表名称校验
    const nameVerify = async (
        name: string,
        flag: 'business_name' | 'technical_name',
        tempViewName = viewName,
    ) => {
        // 没选中，不校验
        if (!tempViewName.selected) {
            setViewName({
                ...tempViewName,
                tips: '',
            })
            return
        }
        try {
            const res = await getDataViewRepeat({
                form_id: datasheetInfo?.id,
                name,
                datasource_id: datasheetInfo?.datasource_id,
                name_type: flag,
                type: logicViewType,
            })
            setViewName({
                ...tempViewName,
                tips: res ? __('库表业务名称和其他库表重复，请修改') : '',
            })
        } catch (err) {
            formatError(err)
        }
    }
    const { run: nameVerifyFn } = useDebounceFn(nameVerify, {
        wait: 400,
        leading: false,
        trailing: true,
    })

    // 库表信息选中
    const handleViewInfoSelect = (checked, flag: 'name' | 'desc') => {
        if (flag === 'name') {
            const tempViewName = {
                ...viewName,
                selected: checked,
            }
            setViewName(tempViewName)
            if (type === 4) {
                nameVerify(tempViewName.value, 'business_name', tempViewName)
            }
            return
        }
        setViewDescription((prev) => ({
            ...prev,
            selected: checked,
        }))
    }

    // 字段名称校验
    const fieldsVerify = (
        field: any,
        isEdit: boolean,
        name?: string,
        tempFields = fields,
    ) => {
        const list = tempFields.map((item) => {
            if (item.id === field.id) {
                return {
                    ...item,
                    business_name: name,
                }
            }
            return item
        })
        // 以补全选中数据+外部其余数据总为准
        const selectFields = list.filter((item) => item.selected)
        const totalFields = [
            ...selectFields,
            ...fieldsTableData.filter(
                (item) => !selectFields.find((f) => f.id === item.id),
            ),
        ]
        setFields(
            tempFields.map((item) => {
                if (item.id === field.id) {
                    return {
                        ...item,
                        isEdit,
                        business_name: isEdit
                            ? field.business_name
                            : name || field.business_name,
                        tips: item.selected
                            ? validateRepeatName(totalFields, {
                                  ...item,
                                  business_name: name,
                              })
                                ? __('此名称和其他字段的业务名称重复，请修改')
                                : ''
                            : '',
                    }
                }
                if (item.selected) {
                    return {
                        ...item,
                        tips: validateRepeatName(totalFields, item)
                            ? __('此名称和其他字段的业务名称重复，请修改')
                            : '',
                    }
                }
                return { ...item, tips: '' }
            }),
        )
    }

    // 字段选中
    const handleFieldSelect = (checked, field) => {
        const tempFields = fields.map((f) => {
            if (f.id === field.id) {
                return {
                    ...f,
                    selected: checked,
                }
            }
            return f
        })
        setFields(tempFields)
        if (type === 4) {
            // 选中变更校验重名
            fieldsVerify(
                tempFields.find((item) => item.id === field.id),
                false,
                field.business_name,
                tempFields,
            )
        }
    }

    // 库表信息
    const getViewInfoItem = (item, flag: 'name' | 'desc') => {
        if (!item) return ''
        const attr = viewInfoConfig[flag]

        return (
            <div
                className={classnames(
                    styles.viewInfo_item,
                    item.selected && styles.selectItem,
                )}
                onClick={() => {
                    if (item.isEdit) {
                        return
                    }
                    handleViewInfoSelect(!item.selected, flag)
                }}
            >
                {[1, 4].includes(type) && (
                    <Checkbox
                        className={styles.checkbox}
                        checked={item.selected}
                        onChange={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleViewInfoSelect(e.target.checked, flag)
                        }}
                    />
                )}
                {attr.icon}
                {attr.title}
                {item.isEdit ? (
                    <SearchInput
                        value={editValue}
                        onBlur={(e) => {
                            const value = e.target?.value.trim()
                            attr.setFn((prev) => ({
                                ...prev,
                                value: attr.canEmpty
                                    ? value
                                    : value || item.value,
                                isEdit: false,
                            }))
                        }}
                        onChange={(e) => {
                            const value = e.target?.value.trim()
                            setEditValue(value)
                            if (flag === 'name' && value) {
                                nameVerifyFn(value, 'business_name')
                            }
                        }}
                        maxLength={attr.maxLength}
                        showCount={attr.showCount}
                        placeholder={attr.placeholder}
                        autoFocus
                        showIcon={false}
                        allowClear={false}
                        status={item.tips ? 'error' : ''}
                        suffix={
                            item.tips && (
                                <Tooltip
                                    title={item.tips}
                                    placement="right"
                                    color="#fff"
                                    overlayClassName="datasheetViewTreeTipsBox"
                                    overlayInnerStyle={{
                                        color: '#000',
                                    }}
                                >
                                    <Icons type={IconType.ERROR} />
                                </Tooltip>
                            )
                        }
                    />
                ) : (
                    <>
                        <span className={styles.name} title={item.value}>
                            <span className={styles.nameText}>
                                {item.value || '--'}
                            </span>
                            {item.isCompleted && [3, 4].includes(type) && (
                                <div className={styles.dot} />
                            )}
                            {type === 4 && item.tips && (
                                <Tooltip
                                    title={item.tips}
                                    placement="right"
                                    color="#fff"
                                    overlayClassName="datasheetViewTreeTipsBox"
                                    overlayInnerStyle={{
                                        color: '#000',
                                    }}
                                >
                                    <Icons
                                        type={IconType.ERROR}
                                        style={{
                                            color: '#F5222D',
                                            marginLeft: 8,
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </span>
                        {type === 4 && (
                            <FontIcon
                                name="icon-edit"
                                className={classnames(styles.opIcon)}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    setEditValue(item.value)
                                    attr.setFn((prev) => ({
                                        ...prev,
                                        isEdit: true,
                                    }))
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        )
    }

    return (
        <div className={classnames(styles.completionView)}>
            {getTitle()}

            {/* 库表信息 */}
            {showViewInfo && (
                <div
                    className={classnames(
                        styles.viewInfo,
                        after && styles.leftLine,
                        fields?.length === 0 && styles.expend,
                    )}
                >
                    <div
                        className={classnames(
                            styles.info_title,
                            type === 1 && styles.info_title_big,
                        )}
                    >
                        <div className={styles.left}>{__('库表信息')}</div>
                    </div>
                    {getViewInfoItem(viewName, 'name')}
                    {viewName && viewDescription && (
                        <div className={styles.line} />
                    )}
                    {getViewInfoItem(viewDescription, 'desc')}
                </div>
            )}

            {/* 字段信息 */}
            {fields?.length > 0 && (
                <div
                    className={classnames(
                        styles.fieldsInfo,
                        after && styles.leftLine,
                    )}
                >
                    <div
                        className={classnames(
                            styles.info_title,
                            type === 1 && styles.info_title_big,
                        )}
                    >
                        <span className={styles.left}>
                            {[1, 4].includes(type) && (
                                <Checkbox
                                    className={styles.checkbox}
                                    indeterminate={
                                        !fields.every((f) => f.selected) &&
                                        fields.some((f) => f.selected)
                                    }
                                    checked={fields.every((f) => f.selected)}
                                    onChange={(e) => {
                                        const totalFields = [
                                            ...fields,
                                            ...fieldsTableData.filter(
                                                (item) =>
                                                    !fields.find(
                                                        (f) => f.id === item.id,
                                                    ),
                                            ),
                                        ]
                                        setFields((prev) =>
                                            prev.map((f) => ({
                                                ...f,
                                                selected: e.target.checked,
                                                tips: e.target.checked
                                                    ? validateRepeatName(
                                                          totalFields,
                                                          f,
                                                      ) &&
                                                      __(
                                                          '此名称和其他字段的业务名称重复，请修改',
                                                      )
                                                    : '',
                                            })),
                                        )
                                    }}
                                />
                            )}

                            {__('字段信息')}
                            {[1, 4].includes(type) && (
                                <span className={styles.subTitle}>
                                    {__('（已选${num1}/${num2}）', {
                                        num1: `${
                                            fields.filter((f) => f.selected)
                                                .length
                                        }`,
                                        num2: `${fields.length}`,
                                    })}
                                </span>
                            )}
                        </span>
                        <span className={styles.right}>
                            {type === 1 && (
                                <SearchInput
                                    placeholder={__('搜索字段业务、技术名称')}
                                    value={searchValue}
                                    onKeyChange={(keyword: string) =>
                                        setSearchValue(keyword)
                                    }
                                    style={{ width: 352 }}
                                />
                            )}
                            {[3, 4].includes(type) && (
                                <>
                                    <Switch
                                        checked={onlyCompleteResult}
                                        size="small"
                                        onChange={(checked) =>
                                            setOnlyCompleteResult(checked)
                                        }
                                    />
                                    <span className={styles.subTitle}>
                                        {__('只看有补全结果')}
                                    </span>
                                </>
                            )}
                        </span>
                    </div>
                    {fieldsList.length > 0 ? (
                        <div className={styles.fieldsList}>
                            {fieldsList.map((item) => (
                                <div
                                    className={classnames(
                                        styles.tableItem,
                                        item.selected && styles.selectItem,
                                    )}
                                    key={item.id}
                                    onClick={() => {
                                        if (item.isEdit) {
                                            return
                                        }
                                        handleFieldSelect(!item.selected, item)
                                    }}
                                >
                                    {[1, 4].includes(type) && (
                                        <Checkbox
                                            className={styles.checkbox}
                                            checked={item.selected}
                                            onChange={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleFieldSelect(
                                                    e.target.checked,
                                                    item,
                                                )
                                            }}
                                        />
                                    )}
                                    <span className={styles.iconBox}>
                                        {getFieldTypeEelment(
                                            {
                                                ...item,
                                                type: item.data_type,
                                            },
                                            20,
                                            'top',
                                        )}
                                    </span>
                                    <div className={styles.nameBox}>
                                        <div className={styles.name}>
                                            {item.isEdit ? (
                                                <SearchInput
                                                    showIcon={false}
                                                    value={editValue}
                                                    onBlur={(e) => {
                                                        const value =
                                                            e.target?.value.trim()
                                                        fieldsVerify(
                                                            item,
                                                            false,
                                                            value,
                                                        )
                                                    }}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value.trim()
                                                        setEditValue(value)
                                                        fieldsVerify(
                                                            item,
                                                            true,
                                                            value,
                                                        )
                                                    }}
                                                    maxLength={255}
                                                    placeholder={__(
                                                        '请填写业务字段名称',
                                                    )}
                                                    autoFocus
                                                    allowClear={false}
                                                    status={
                                                        item.tips ? 'error' : ''
                                                    }
                                                    suffix={
                                                        item.tips && (
                                                            <Tooltip
                                                                title={
                                                                    item.tips
                                                                }
                                                                placement="right"
                                                                color="#fff"
                                                                overlayClassName="datasheetViewTreeTipsBox"
                                                                overlayInnerStyle={{
                                                                    color: '#000',
                                                                }}
                                                            >
                                                                <Icons
                                                                    type={
                                                                        IconType.ERROR
                                                                    }
                                                                />
                                                            </Tooltip>
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <>
                                                    <span
                                                        title={`${__(
                                                            '业务名称',
                                                        )}：${
                                                            item.business_name
                                                        }`}
                                                        className={
                                                            styles.nameTextBox
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.nameText
                                                            }
                                                            dangerouslySetInnerHTML={{
                                                                __html: highLight(
                                                                    item.business_name,
                                                                    searchValue,
                                                                    'datasheetHighLight',
                                                                ),
                                                            }}
                                                        />
                                                        {item.isCompleted &&
                                                            [3, 4].includes(
                                                                type,
                                                            ) && (
                                                                <div
                                                                    className={
                                                                        styles.dot
                                                                    }
                                                                />
                                                            )}
                                                        {type === 4 &&
                                                            item.tips && (
                                                                <Tooltip
                                                                    title={
                                                                        item.tips
                                                                    }
                                                                    placement="right"
                                                                    color="#fff"
                                                                    overlayClassName="datasheetViewTreeTipsBox"
                                                                    overlayInnerStyle={{
                                                                        color: '#000',
                                                                    }}
                                                                >
                                                                    <Icons
                                                                        type={
                                                                            IconType.ERROR
                                                                        }
                                                                        style={{
                                                                            color: '#F5222D',
                                                                            marginLeft: 8,
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                    </span>
                                                    {type === 4 && (
                                                        <FontIcon
                                                            name="icon-edit"
                                                            className={classnames(
                                                                styles.opIcon,
                                                            )}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                e.preventDefault()
                                                                setEditValue(
                                                                    item.business_name,
                                                                )
                                                                setFields(
                                                                    fields.map(
                                                                        (f) => {
                                                                            if (
                                                                                f.id ===
                                                                                item.id
                                                                            ) {
                                                                                return {
                                                                                    ...f,
                                                                                    isEdit: true,
                                                                                }
                                                                            }
                                                                            return f
                                                                        },
                                                                    ),
                                                                )
                                                            }}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <span
                                            className={styles.code}
                                            title={`${__('技术名称')}：${
                                                item.technical_name
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: highLight(
                                                    item.technical_name,
                                                    searchValue,
                                                    'datasheetHighLight',
                                                ),
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty
                            style={{ marginTop: 48 }}
                            desc={searchValue ? undefined : __('暂无数据')}
                            iconSrc={searchValue ? undefined : dataEmpty}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export default CompletionView
