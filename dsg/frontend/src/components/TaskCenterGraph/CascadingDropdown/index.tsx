import { RightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import type React from 'react'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import styles from './styles.module.less'

// 定义级联选项的类型
interface CascaderOption {
    value: string
    label: string
    children?: CascaderOption[]
}

interface CascadingDropdownProps extends PropsWithChildren {
    options: CascaderOption[]
    defaultValue?: string
    onSelect?: (
        selectedOption: CascaderOption,
        selectedPath: CascaderOption[],
    ) => void
}

const CascadingDropdown: React.FC<CascadingDropdownProps> = ({
    options,
    defaultValue,
    onSelect,
    children,
}) => {
    // 查找默认选中的选项
    const findDefaultOption = () => {
        if (!defaultValue) return null
        return options.find((option) => option.value === defaultValue) || null
    }

    const [visible, setVisible] = useState<boolean>(false)
    const [selectedFirstLevel, setSelectedFirstLevel] =
        useState<CascaderOption | null>(findDefaultOption())
    const containerRef = useRef<HTMLDivElement>(null)
    const childRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [dropdownWidth, setDropdownWidth] = useState<number>(0)
    const [showTooltip, setShowTooltip] = useState<boolean>(false)

    // 初始化默认选中项
    useEffect(() => {
        const defaultOption = findDefaultOption()
        if (defaultOption) {
            setSelectedFirstLevel(defaultOption)
        }
    }, [defaultValue, options])

    // 当可见性变化时更新下拉菜单宽度
    useEffect(() => {
        if (visible && childRef.current) {
            // 使用 setTimeout 确保在 DOM 更新后获取宽度
            setTimeout(() => {
                if (childRef.current) {
                    const buttonWidth = childRef.current.offsetWidth
                    setDropdownWidth(buttonWidth)

                    // 直接设置下拉菜单宽度，以防 React 状态更新不及时
                    if (dropdownRef.current) {
                        dropdownRef.current.style.width = `${buttonWidth}px`
                    }
                }
            }, 0)
        }
    }, [visible])

    // 处理窗口大小变化
    useEffect(() => {
        const updateDropdownWidth = () => {
            if (visible && childRef.current && dropdownRef.current) {
                const buttonWidth = childRef.current.offsetWidth
                setDropdownWidth(buttonWidth)
                dropdownRef.current.style.width = `${buttonWidth}px`
            }
        }

        window.addEventListener('resize', updateDropdownWidth)
        return () => window.removeEventListener('resize', updateDropdownWidth)
    }, [visible])

    // 处理点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                visible &&
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setVisible(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [visible])

    const handleButtonClick = () => {
        setVisible(!visible)
    }

    const handleFirstLevelClick = (option: CascaderOption) => {
        setSelectedFirstLevel(option)
        if (!option.children || option.children.length === 0) {
            // 如果第一级没有子选项，则直接选择
            handleFinalSelection(option, [option])
        }
    }

    const handleSecondLevelClick = (option: CascaderOption) => {
        if (selectedFirstLevel) {
            handleFinalSelection(option, [selectedFirstLevel, option])
        }
    }

    const handleFinalSelection = (
        option: CascaderOption,
        path: CascaderOption[],
    ) => {
        setVisible(false)

        if (onSelect) {
            onSelect(option, path)
        }

        // 显示选择结果提示
        showSelectionTooltip()
    }

    // 显示选择结果提示
    const showSelectionTooltip = () => {
        setShowTooltip(true)
        // 3秒后自动隐藏提示
        setTimeout(() => {
            setShowTooltip(false)
        }, 3000)
    }

    return (
        <div className={styles.cascadingDropdownContainer} ref={containerRef}>
            <div
                ref={childRef}
                className={styles.cascaderButton}
                onClick={handleButtonClick}
            >
                {children}
            </div>

            {/* 级联下拉菜单 */}
            {visible && (
                <div
                    ref={dropdownRef}
                    className={styles.customCascaderDropdown}
                    style={{
                        width:
                            dropdownWidth > 0 ? `${dropdownWidth}px` : '100%',
                    }}
                >
                    <div className={styles.cascaderMenuContainer}>
                        {/* 一级菜单 */}
                        <div className={styles.cascaderMenu}>
                            {options.map((option) => (
                                <div
                                    key={option.value}
                                    className={classnames({
                                        [styles.cascaderMenuItem]: true,
                                        [styles.cascaderMenuItemActive]:
                                            selectedFirstLevel?.value ===
                                            option.value,
                                    })}
                                    onClick={() =>
                                        handleFirstLevelClick(option)
                                    }
                                >
                                    <span>{option.label}</span>
                                    {option.children &&
                                        option.children.length > 0 && (
                                            <span
                                                className={
                                                    styles.cascaderMenuItemExpandIcon
                                                }
                                            >
                                                <RightOutlined
                                                    style={{
                                                        fontSize: 10,
                                                        color: 'rgba(0,0,0,0.65)',
                                                    }}
                                                />
                                            </span>
                                        )}
                                </div>
                            ))}
                        </div>

                        {/* 二级菜单 */}
                        {selectedFirstLevel &&
                            selectedFirstLevel.children &&
                            selectedFirstLevel.children.length > 0 && (
                                <div className={styles.cascaderMenu}>
                                    {selectedFirstLevel.children.map(
                                        (option) => (
                                            <div
                                                key={option.value}
                                                className={
                                                    styles.cascaderMenuItem
                                                }
                                                onClick={() =>
                                                    handleSecondLevelClick(
                                                        option,
                                                    )
                                                }
                                            >
                                                <span>{option.label}</span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CascadingDropdown
