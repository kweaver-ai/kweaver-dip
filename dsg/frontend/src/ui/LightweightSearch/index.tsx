import React, {
    useState,
    forwardRef,
    useEffect,
    useMemo,
    useImperativeHandle,
} from 'react'
import { Button, Dropdown, Collapse, Checkbox, DatePicker } from 'antd'
import { isEqual } from 'lodash'
import classnames from 'classnames'
import { DownOutlined, UpOutlined, CheckOutlined } from '@ant-design/icons'
import moment from 'moment'
import { FiltersOutlined, FontIcon } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { ILightweightSearch, IformItem, SearchType } from './const'

const { Panel } = Collapse

const LightweightSearch: React.FC<ILightweightSearch> = forwardRef(
    (props: ILightweightSearch, ref) => {
        const {
            formData,
            onChange,
            defaultValue = {},
            width,
            filterTopNode,
            isButton = true,
            compClassName,
            hiddenItemCb,
            showReset = false,
            placement,
            ...other
        } = props

        const isSingel = formData.length === 1
        // const defaultValueLabel = formData[0]?.options?.find(
        //     (o) => o.value === defaultValue?.[formData[0]?.key],
        // )?.label
        // const singleDefaultLabel = `${__('已选')}${formData[0]?.label}：${
        //     formData[0]?.options?.find(
        //         (o) => o.value === defaultValue?.[formData[0]?.key],
        //     )?.label || __('不限')
        // }`
        const [openDropdown, setOpenDropdown] = useState<boolean>(false)
        const [filterTitle, setFilterTitle] = useState<string>(
            isSingel
                ? formData[0]?.initLabel || `${formData[0]?.label}${__('不限')}`
                : __('筛选'),
        )
        const [searchCondition, setSearchCondition] =
            useState<any>(defaultValue)

        const [checkboxVal, setCheckboxVal] = useState<any>({})
        const [timeValue, setTimeValue] = useState<any>()

        useEffect(() => {
            setFilterTitle(
                formData.length === 1
                    ? formData[0]?.initLabel ||
                          `${formData[0]?.label}${__('不限')}`
                    : __('筛选'),
            )
        }, [formData.length])

        useEffect(() => {
            formData.forEach((fItem) => {
                if (fItem.type === SearchType.Checkbox) {
                    setCheckboxVal((prev) => ({
                        ...prev,
                        [fItem.key]: defaultValue?.[fItem.key],
                    }))
                } else if (fItem.type === SearchType.RangePicker) {
                    if (defaultValue?.[fItem.key]?.length) {
                        setTimeValue([
                            defaultValue?.[fItem.key]?.[0]
                                ? moment(defaultValue?.[fItem.key]?.[0])
                                : undefined,
                            defaultValue?.[fItem.key]?.[1]
                                ? moment(defaultValue?.[fItem.key]?.[1])
                                : undefined,
                        ])
                    }
                }
            })
        }, [defaultValue])

        useEffect(() => {
            // eslint-disable-next-line no-restricted-syntax
            for (const key in searchCondition) {
                if (
                    Object.prototype.hasOwnProperty.call(searchCondition, key)
                ) {
                    // 已选值不在options中，改为默认值
                    if (
                        !formData
                            .find((item) => item.key === key)
                            ?.options?.find(
                                (item) => item.value === searchCondition[key],
                            )
                    ) {
                        setSearchCondition({
                            ...searchCondition,
                            [key]: defaultValue[key],
                        })
                    }
                }
            }
        }, [formData])

        useImperativeHandle(ref, () => ({
            reset,
        }))

        const reset = (newValue) => {
            setSearchCondition(newValue || defaultValue)
            setCheckboxVal({})
            setFilterTitle(
                isSingel
                    ? formData[0]?.initLabel ||
                          `${formData[0]?.label}${__('不限')}`
                    : __('筛选'),
            )
        }

        const filterIsActive = useMemo(() => {
            return (
                Object.values(searchCondition).length > 1 &&
                !isEqual(defaultValue, searchCondition)
            )
        }, [searchCondition])

        const getItem = (formItem: IformItem, single?: boolean) => {
            const { Component } = formItem
            switch (formItem.type) {
                case SearchType.Radio:
                    return formItem.options.map((item, index) => {
                        return (
                            <div
                                key={index}
                                className={classnames(
                                    styles.filterItem,
                                    isSingel && styles.singleFilterItem,
                                    searchCondition[formItem.key] ===
                                        item.value && styles.active,
                                    searchCondition[formItem.key] ===
                                        defaultValue[formItem.key] &&
                                        styles.default,
                                )}
                                onClick={() => {
                                    const search = {
                                        ...searchCondition,
                                        [formItem.key]: item.value,
                                    }
                                    onChange(search, formItem.key)
                                    setSearchCondition(search)
                                    if (isSingel) {
                                        setOpenDropdown(false)
                                        setFilterTitle(
                                            item.value !==
                                                defaultValue[formItem.key]
                                                ? formItem?.initLabel
                                                    ? item.label
                                                    : `${__('已选')}${
                                                          formItem.label
                                                      }：${item.label}`
                                                : formItem?.initLabel ||
                                                      `${formItem.label}${__(
                                                          '不限',
                                                      )}`,
                                        )
                                    }
                                }}
                            >
                                {!isSingel && (
                                    <CheckOutlined
                                        style={{
                                            visibility:
                                                searchCondition[
                                                    formItem.key
                                                ] === item.value
                                                    ? 'initial'
                                                    : 'hidden',
                                            marginRight: '5px',
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                                {item?.icon && (
                                    <span className={styles.icon}>
                                        {item?.icon}
                                    </span>
                                )}
                                <span
                                    title={item.label}
                                    className={styles.itemText}
                                >
                                    {item.label}
                                </span>
                            </div>
                        )
                    })
                case SearchType.Checkbox:
                    return (
                        <Checkbox.Group
                            className={styles.checkboxWrapper}
                            value={checkboxVal?.[formItem.key] || []}
                            onChange={(val) => {
                                const search = {
                                    ...searchCondition,
                                    [formItem.key]: val.join(
                                        formItem?.separator || ',',
                                    ),
                                }
                                setSearchCondition(search)
                                setCheckboxVal((prev) => ({
                                    ...prev,
                                    [formItem.key]: val,
                                }))
                                onChange(search, formItem.key)
                                if (isSingel) {
                                    const selected = val
                                        .map(
                                            (item) =>
                                                formItem.options.find(
                                                    (option) =>
                                                        option.value === item,
                                                )?.label,
                                        )
                                        .join('、')
                                    setFilterTitle(
                                        isEqual(val, defaultValue[formItem.key])
                                            ? formItem?.initLabel ||
                                                  `${formItem.label}${__(
                                                      '不限',
                                                  )}`
                                            : formItem?.initLabel
                                            ? selected
                                            : `${__('已选')}${
                                                  formItem.label
                                              }：${selected}`,
                                    )
                                }
                            }}
                        >
                            {formItem.options.map((it, index) => {
                                return (
                                    <Checkbox value={it.value} key={index}>
                                        <span title={it.label}>{it.label}</span>
                                    </Checkbox>
                                )
                            })}
                        </Checkbox.Group>
                    )
                case SearchType.MultipleSelect:
                    return (
                        <Checkbox.Group
                            onChange={(e) => {
                                const search = {
                                    ...searchCondition,
                                    [formItem.key]: e,
                                }
                                onChange(search, formItem.key)
                                setSearchCondition(search)
                            }}
                            value={searchCondition[formItem.key]}
                            style={{ width: '100%' }}
                        >
                            {formItem.options.map((item, index) => {
                                const isHidden = hiddenItemCb?.(
                                    searchCondition,
                                    item,
                                )
                                return isHidden ? null : (
                                    <div
                                        className={classnames(
                                            styles.filterItem,
                                            isSingel && styles.singleFilterItem,
                                        )}
                                        key={index}
                                    >
                                        <Checkbox value={item.value}>
                                            <span
                                                className={
                                                    styles.labelContainer
                                                }
                                            >
                                                {item?.icon && (
                                                    <span
                                                        className={styles.icon}
                                                    >
                                                        {item?.icon}
                                                    </span>
                                                )}
                                                <span
                                                    title={item.label}
                                                    className={styles.label}
                                                >
                                                    {item.label}
                                                </span>
                                            </span>
                                        </Checkbox>
                                    </div>
                                )
                            })}
                        </Checkbox.Group>
                    )
                case SearchType.RangePicker:
                    return (
                        <div className={styles.timeContainer}>
                            <DatePicker.RangePicker
                                style={{ width: '100%' }}
                                getPopupContainer={(node) =>
                                    node.parentNode as HTMLElement
                                }
                                value={timeValue}
                                placeholder={[__('开始时间'), __('结束时间')]}
                                onChange={(date, dateString) => {
                                    const search = {
                                        ...searchCondition,
                                        [formItem.key]: date,
                                    }
                                    setTimeValue(date)
                                    onChange(search, formItem.key)
                                    setSearchCondition(search)
                                }}
                            />
                        </div>
                    )
                case SearchType.Customer:
                    return (
                        Component && (
                            <Component
                                value={searchCondition[formItem.key]}
                                onChange={(value: any) => {
                                    const search = {
                                        ...searchCondition,
                                        [formItem.key]: value,
                                    }
                                    onChange(search, formItem.key)
                                    setSearchCondition(search)
                                }}
                                {...formItem.componentProps}
                            />
                        )
                    )
                default:
                    return null
            }
        }

        const dropdownItems = [
            {
                key: '1',
                label: (
                    <div
                        className={styles.filterContent}
                        style={{
                            width: width || (isSingel ? 'auto' : '240px'),
                        }}
                    >
                        {isSingel &&
                            !showReset &&
                            formData.map((formItem) => {
                                return (
                                    <div
                                        key={formItem.key}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {getItem(formItem)}
                                    </div>
                                )
                            })}
                        {(!isSingel || showReset) && (
                            <>
                                <div className={styles.title}>
                                    <div>{__('筛选')}</div>
                                    <a
                                        type="text"
                                        onClick={() => {
                                            setSearchCondition(defaultValue)
                                            onChange(defaultValue)
                                            setCheckboxVal({})
                                            setTimeValue(null)
                                            setFilterTitle(
                                                isSingel
                                                    ? formData[0]?.initLabel ||
                                                          `${
                                                              formData[0]?.label
                                                          }${__('不限')}`
                                                    : __('筛选'),
                                            )
                                        }}
                                        className={styles.resetBtn}
                                    >
                                        {__('重置筛选')}
                                    </a>
                                </div>

                                {isSingel && showReset ? (
                                    formData.map((formItem) => {
                                        return (
                                            <div key={formItem.key}>
                                                {getItem(formItem)}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <Collapse
                                        defaultActiveKey={formData.map(
                                            (item) => item.key,
                                        )}
                                        ghost
                                        expandIconPosition="end"
                                        className={styles.filterCollapse}
                                        // eslint-disable-next-line react/no-unstable-nested-components
                                        expandIcon={({ isActive }) =>
                                            isActive ? (
                                                <UpOutlined />
                                            ) : (
                                                <DownOutlined />
                                            )
                                        }
                                    >
                                        {formData.map((formItem) => {
                                            return (
                                                <Panel
                                                    header={formItem.label}
                                                    key={formItem.key}
                                                >
                                                    {getItem(formItem)}
                                                </Panel>
                                            )
                                        })}
                                    </Collapse>
                                )}
                            </>
                        )}
                    </div>
                ),
            },
        ]

        const handleOpenDropdownChange = (flag: boolean) => {
            setOpenDropdown(flag)
        }

        return (
            <div className={styles.filterBox}>
                <Dropdown
                    menu={{ items: dropdownItems }}
                    trigger={['click']}
                    onOpenChange={handleOpenDropdownChange}
                    open={openDropdown}
                    placement={placement}
                    overlayClassName={styles.filterDropdown}
                    getPopupContainer={
                        (other?.getPopupContainer as any) ||
                        ((node) => node.parentElement || node)
                    }
                >
                    {isButton ? (
                        filterTopNode ? (
                            <Button
                                className={classnames(
                                    styles.filterBtn,
                                    filterIsActive && styles.filterBtnActive,
                                    compClassName,
                                )}
                                title={filterTitle}
                            >
                                {filterTopNode}
                            </Button>
                        ) : (
                            <Button
                                className={classnames(
                                    styles.filterBtn,
                                    filterIsActive && styles.filterBtnActive,
                                    compClassName,
                                )}
                                title={filterTitle}
                            >
                                <FontIcon
                                    name="icon-shaixuan"
                                    className={styles.filterIcon}
                                    style={{ marginRight: 8 }}
                                />
                                <span className={styles.filterText}>
                                    {filterTitle}
                                </span>
                                <span className={styles.dropIcon}>
                                    {openDropdown ? (
                                        <UpOutlined />
                                    ) : (
                                        <DownOutlined />
                                    )}
                                </span>
                            </Button>
                        )
                    ) : (
                        <div
                            className={classnames(
                                styles.filterBtn,
                                filterIsActive && styles.filterBtnActive,
                                compClassName,
                            )}
                            title={filterTitle}
                        >
                            {filterTopNode || (
                                <>
                                    <FontIcon
                                        name="icon-shaixuan"
                                        className={styles.filterIcon}
                                        style={{ marginRight: 8 }}
                                    />
                                    {/* <FiltersOutlined
                                className={styles.filterIcon}
                                style={{ marginRight: 8 }}
                            /> */}
                                    <span className={styles.filterText}>
                                        {filterTitle}
                                    </span>
                                    <span className={styles.dropIcon}>
                                        {openDropdown ? (
                                            <UpOutlined />
                                        ) : (
                                            <DownOutlined />
                                        )}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </Dropdown>
            </div>
        )
    },
)
export default LightweightSearch
