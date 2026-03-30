import { Checkbox, Divider, Select } from 'antd'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { isEqual } from 'lodash'
import __ from '../../locale'
import {
    AccessOptMap,
    AccessOptsList,
    AccessType,
    IPermission,
    OptType,
    calcByte,
    getAccessArrByValue,
    getAccessOptions,
    getLabelByPermission,
    ruleValidate,
    transformPermission,
} from './helper'
import styles from './styles.module.less'

interface IVisitAccessSelect {
    /** 隐藏权限列表 */
    hiddenType?: OptType[]
    /** 额外隐藏权限列表  区分接口中 用户和应用不同权限 */
    extraHidden?: OptType[]
    /** 权限 */
    value?: IPermission[]
    /** 权限变更响应方法 */
    onChange?: (value: IPermission[]) => void
    /** 是否禁止操作 */
    disabled?: boolean
    /** 是否禁止拒绝权限 */
    canReject?: boolean
    /** 是否能快捷设置 */
    canCustom?: boolean
    /** 是否允许清空 */
    allowClear?: boolean
}

function VisitAccessSelect({
    hiddenType = [],
    extraHidden = [],
    value,
    onChange,
    disabled = false,
    canReject = true,
    canCustom = false,
    allowClear = false,
}: IVisitAccessSelect) {
    const [isCheckState, setIsCheckState] = useState<boolean>(false)
    const [current, setCurrent] = useState<any>()
    const [accessArr, setAccessArr] = useState<any[]>()
    const isChangeRef = useRef<boolean>(false)

    useEffect(() => {
        if (onChange && isChangeRef.current) {
            const arr = current ? transformPermission(current?.value) : []
            if (!isEqual(value, arr)) {
                onChange(arr)
            }
            isChangeRef.current = false
        }
    }, [current?.value])

    useEffect(() => {
        // 隐藏屏蔽权限
        const tempValue = value?.filter(
            (o) =>
                ![...hiddenType, ...extraHidden].includes(o.action as OptType),
        )

        const optAccess = (tempValue ?? []).map(
            (o) => AccessOptMap[`${o.action}-${o.effect}`],
        )
        setAccessArr(optAccess)
    }, [value])

    useEffect(() => {
        setCurrent(
            accessArr?.length
                ? {
                      label: getLabelByPermission(accessArr),
                      value: calcByte(accessArr),
                  }
                : undefined,
        )
    }, [accessArr])

    /** 权限列表限定 */
    const accessList = useMemo(() => {
        return AccessOptsList?.filter(
            (o) => ![...hiddenType, ...extraHidden].includes(o?.value),
        )
    }, [hiddenType, extraHidden])

    // 隐藏权限列表
    const hiddenByte = useMemo(() => {
        const result: number[] = []
        ;[...hiddenType, ...extraHidden].forEach((item) => {
            result.push(
                AccessOptMap[`${item}-${AccessType.Allow}`] as number,
                AccessOptMap[`${item}-${AccessType.Deny}`] as number,
            )
        })
        return result
    }, [hiddenType, extraHidden])

    /** 下拉选项 */
    const options = useMemo(
        () => getAccessOptions(accessList, canCustom),
        [accessList, canCustom],
    )
    const handleSelect = (selectValue: number) => {
        setAccessArr(selectValue ? getAccessArrByValue(selectValue) : [])
        isChangeRef.current = true
    }

    const handleCheckChange = () => {
        isChangeRef.current = true
    }

    // eslint-disable-next-line react/no-unstable-nested-components
    const DropDownRender = (menu: any) => {
        const handleCheck = (type: OptType, e: CheckboxChangeEvent) => {
            const isCheck = e.target.checked
            const curKey = e.target.value
            const validateAccess = ruleValidate(
                accessArr || [],
                isCheck,
                curKey,
            )
            const access = validateAccess.filter(
                (o) => !hiddenByte?.includes(o),
            )
            setAccessArr(access)
        }

        return (
            <>
                {isCheckState && canCustom ? (
                    <Checkbox.Group
                        className={styles['access-checkbox']}
                        value={accessArr}
                        onChange={handleCheckChange}
                    >
                        <div className={styles.line}>
                            <span>{__('访问权限')}</span>
                            <span>{__('允许')}</span>
                            <span>{__('拒绝')}</span>
                        </div>
                        {accessList.map((item) => (
                            <div className={styles.line} key={item.value}>
                                <span>{item.label}</span>
                                {/* 允许 */}
                                <Checkbox
                                    value={
                                        AccessOptMap[
                                            `${item.value}-${AccessType.Allow}`
                                        ]
                                    }
                                    onChange={(e) => handleCheck(item.value, e)}
                                />
                                {/* 拒绝 */}
                                <Checkbox
                                    value={
                                        AccessOptMap[
                                            `${item.value}-${AccessType.Deny}`
                                        ]
                                    }
                                    onChange={(e) => handleCheck(item.value, e)}
                                />
                            </div>
                        ))}
                    </Checkbox.Group>
                ) : (
                    menu
                )}

                {canReject && canCustom && (
                    <>
                        <Divider style={{ margin: '8px 0' }} />
                        <div className={styles['select-switcher']}>
                            <span
                                onClick={() => setIsCheckState(!isCheckState)}
                            >
                                {isCheckState
                                    ? __('返回快捷配置')
                                    : __('自定义配置')}
                            </span>
                        </div>
                    </>
                )}
            </>
        )
    }

    return options.length > 1 ? (
        <Select
            value={current}
            style={{ width: '100%' }}
            popupClassName={styles['access-select']}
            placeholder={__('请设置访问权限')}
            dropdownRender={(menu) => DropDownRender(menu)}
            onSelect={handleSelect}
            options={options}
            disabled={disabled}
            open={options.length > 1 ? undefined : false}
            showArrow={options.length > 1}
            allowClear={allowClear}
            onChange={(changedValue) => {
                if (!changedValue && allowClear) {
                    setAccessArr([])
                }
            }}
        />
    ) : (
        options?.[0].label || current
    )
}

export default memo(VisitAccessSelect, (prev, next) => isEqual(prev, next))
