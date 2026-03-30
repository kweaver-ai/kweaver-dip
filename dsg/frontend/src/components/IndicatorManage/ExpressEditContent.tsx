import { AutoComplete, Input, Tooltip } from 'antd'
import {
    FC,
    useState,
    ReactNode,
    useEffect,
    forwardRef,
    useImperativeHandle,
    ChangeEvent,
    useRef,
} from 'react'
import { set } from 'lodash'
import { useGetState } from 'ahooks'
import {
    EditContentElementType,
    ExpressionStatus,
    FormatTypeTXT,
    TabsKey,
    atomsExpressionRegx,
    atomsFuncRegx,
    changeFormatToType,
    changeFuncValues,
    onlyFuncNameOptions,
    operationOptions,
    operationOptionsReg,
    operationRegx,
} from './const'
import { OperationalInput } from './OperationalInput'
import CustomerInput from './CustomerInput'
import styles from './styles.module.less'
import { formatError, reqBusinObjField, FormatDataTypeTXT } from '@/core'
import { getFieldTypeIcon, getOperationSignIcon } from './helper'
import { useCatalogColumn } from '../DimensionModel/helper'

interface ExpressEditContentType {
    ref?: any
    value?: Array<string>
    onChange: (value: Array<string>) => void
    tableId?: string
    tabType: TabsKey
    indictorList?: Array<any>
}

const ExpressEditContent: FC<ExpressEditContentType> = forwardRef(
    (props: any, ref) => {
        const {
            value = [''],
            onChange,
            tableId = '',
            tabType,
            indictorList = [],
        } = props
        const [allEelement, setAllElement] = useState<
            Array<{
                type: EditContentElementType
                focusStatus: boolean
            }>
        >([
            {
                type: EditContentElementType.BasicInput,
                focusStatus: false,
            },
        ])

        const [allValues, setAllValues] = useState<Array<string>>([''])

        const [fieldOptions, setFieldOptions] = useState<Array<any>>([])

        const [fieldsCount, setFieldsCount] = useState<number>(0)

        const [indictorOptions, setIndictorOptions, getIndictorOptions] =
            useGetState<Array<any>>([])
        const parentDiv: any = useRef()
        const { loading, getColumnsById } = useCatalogColumn()

        // useEffect(() => {
        //     onChange(allValues)
        // }, [allValues])

        useEffect(() => {
            if (tableId) {
                getFactFieldsList(tableId, '', [])
            }
        }, [tableId])

        useEffect(() => {
            if (tabType === TabsKey.ATOMS) {
                if (value.join('') === '' && value.length === 1) {
                    setAllValues(value)
                    setAllElement([
                        {
                            type: EditContentElementType.BasicInput,
                            focusStatus: false,
                        },
                    ])
                } else if (
                    value.join('') !== allValues.join('') ||
                    value.length !== allValues.length
                ) {
                    setAllValues(value)
                    if (value.length !== allEelement.length) {
                        setAllElement(
                            value.map((currentData, index) => {
                                switch (true) {
                                    case atomsFuncRegx.test(currentData):
                                        return {
                                            type: EditContentElementType.OperationalInput,
                                            focusStatus: false,
                                        }
                                    case operationRegx.test(currentData):
                                        return {
                                            type: EditContentElementType.OperationSymbol,
                                            focusStatus: false,
                                        }
                                    default:
                                        return {
                                            type: allEelement?.[index]?.type
                                                ? allEelement[index].type
                                                : EditContentElementType.BasicInput,
                                            focusStatus: false,
                                        }
                                }
                            }),
                        )
                    }
                }
            } else if (
                value.join('') !== allValues.join('') ||
                value.length !== allValues.length
            ) {
                setAllValues(value)
                if (value.length !== allEelement.length) {
                    setAllElement(
                        value.map((currentData) => {
                            switch (true) {
                                case operationRegx.test(currentData):
                                    return {
                                        type: EditContentElementType.OperationSymbol,
                                        focusStatus: false,
                                    }
                                default:
                                    return {
                                        type: EditContentElementType.BasicInput,
                                        focusStatus: false,
                                    }
                            }
                        }),
                    )
                }
            }
        }, [value])

        useEffect(() => {
            if (indictorList.length) {
                setIndictorOptions(
                    indictorList.map((currentData) => ({
                        value: currentData.name,
                        id: currentData.id,
                        label: currentData.name,
                    })),
                )
            }
        }, [indictorList])

        const getFactFieldsList = async (id, keyword, initData) => {
            try {
                const res = await getColumnsById(id)
                const entries = res.data
                const total_count = res.data.length
                setFieldOptions([
                    ...entries.map((currentData) => ({
                        value: currentData.id,
                        label: (
                            <div className={styles.selectMetaOptions}>
                                <Tooltip
                                    title={FormatDataTypeTXT(
                                        currentData.data_type,
                                    )}
                                    overlayInnerStyle={{
                                        color: 'rgba(0,0,0,0.85)',
                                    }}
                                    color="#fff"
                                    placement="left"
                                >
                                    <div>
                                        {getFieldTypeIcon(
                                            currentData?.original_data_type ||
                                                currentData.data_type,
                                        )}
                                    </div>
                                </Tooltip>

                                <div
                                    style={{
                                        marginLeft: '10px',
                                    }}
                                    className={styles.name}
                                    title={currentData.business_name}
                                >
                                    {currentData.business_name}
                                </div>
                            </div>
                        ),
                        name: (
                            <div
                                className={styles.optionLabelPropContainer}
                                title={currentData.business_name}
                            >
                                <div className={styles.name}>
                                    {currentData.business_name}
                                </div>
                            </div>
                        ),
                        filterKey: currentData.business_name,
                        detail: currentData,
                    })),
                ])
                setFieldsCount(total_count)
            } catch (ex) {
                formatError(ex)
            }
        }

        /**
         * 滚动加载信息系统
         * @param e
         */
        const getFieldOptionsByScroll = (e, searchKey) => {
            const { target } = e
            if (
                target.scrollTop + target.offsetHeight ===
                    target.scrollHeight &&
                fieldsCount > fieldOptions.length
            ) {
                getFactFieldsList(tableId, searchKey, fieldOptions)
            }
        }

        const matchOperation = (currentValue: string, index) => {
            if (currentValue && Number.isNaN(Number(currentValue))) {
                operationOptionsReg.forEach((currentReg) => {
                    if (currentReg.RegExp.test(currentValue)) {
                        const newElements = [
                            ...allEelement.map((current) => ({
                                ...current,
                                focusStatus: false,
                            })),
                        ]
                        const newValues = [
                            ...allValues.map((current, currentIndex) =>
                                currentIndex === index ? '' : current,
                            ),
                        ]
                        newElements.splice(
                            index,
                            0,
                            {
                                type: EditContentElementType.BasicInput,
                                focusStatus: false,
                            },
                            {
                                type: EditContentElementType.OperationalInput,
                                focusStatus: true,
                            },
                        )
                        newValues.splice(index, 0, '', currentReg.value)
                        setAllElement([...newElements])
                        setAllValues([...newValues])
                    }
                })
            }
        }
        const getElementFromType = (
            type: EditContentElementType,
            currentIndex,
            focusStatus,
        ) => {
            switch (type) {
                case EditContentElementType.OperationSymbol:
                    return (
                        <div
                            key={currentIndex}
                            className={styles.operationContainer}
                        >
                            {getOperationSignIcon(allValues?.[currentIndex])}
                        </div>
                    )
                case EditContentElementType.OperationalInput:
                    return (
                        <OperationalInput
                            optionLabelProp="name"
                            optionFilterProp="filterKey"
                            // ref={allEelement[currentIndex].dataRef}
                            value={changeFuncValues(
                                allValues?.[currentIndex].replace(/[{}]/g, ''),
                            )}
                            onChange={(currentValue) => {
                                onChange(
                                    allValues.map((allValue, index) =>
                                        index === currentIndex
                                            ? currentValue
                                            : allValue,
                                    ),
                                )
                            }}
                            key={currentIndex}
                            onFocus={() => {
                                setAllElement(
                                    allEelement.map((currentElem, index) =>
                                        index === currentIndex
                                            ? {
                                                  ...currentElem,
                                                  focusStatus: true,
                                              }
                                            : {
                                                  ...currentElem,
                                                  focusStatus: false,
                                              },
                                    ),
                                )
                            }}
                            onPopDelete={() => {
                                handleDeleteElement(currentIndex)
                            }}
                            onPopLeftMove={() => {
                                moveToLeftElement(currentIndex)
                            }}
                            onPopRightMove={() => {
                                moveToRightElement(currentIndex)
                            }}
                            onFieldSearch={(searchKey) => {
                                getFactFieldsList(tableId, searchKey, [])
                            }}
                            focusStatus={focusStatus}
                            fieldOptions={fieldOptions}
                            onPopupScroll={(e, searchKey) => {
                                getFieldOptionsByScroll(e, searchKey)
                            }}
                        />
                    )
                default:
                    return tabType === TabsKey.ATOMS ? (
                        <CustomerInput
                            // ref={allEelement[currentIndex].dataRef}
                            onBlur={(e) => {
                                matchOperation(
                                    (e.target as HTMLInputElement).value || '',
                                    currentIndex,
                                )
                            }}
                            onChange={(newValue, option) => {
                                const newAllValues = [...allValues]
                                newAllValues[currentIndex] = newValue
                                onChange(newAllValues)
                            }}
                            options={operationOptions}
                            key={currentIndex}
                            value={allValues[currentIndex]}
                            onPopDelete={() => {
                                handleDeleteElement(currentIndex)
                            }}
                            onPopLeftMove={() => {
                                moveToLeftElement(currentIndex)
                            }}
                            onPopRightMove={() => {
                                moveToRightElement(currentIndex)
                            }}
                            onFocus={() => {
                                setAllElement(
                                    allEelement.map((currentElem, index) =>
                                        index === currentIndex
                                            ? {
                                                  ...currentElem,
                                                  focusStatus: true,
                                              }
                                            : {
                                                  ...currentElem,
                                                  focusStatus: false,
                                              },
                                    ),
                                )
                            }}
                            focusStatus={focusStatus}
                            checkInputStatus={(newValue) => {
                                if (
                                    /^(COUNT|SUM|AVG|MAX|MIN|COUNT\(DISTINCT([\s]*)\)|([0-9]*)){1}$/.test(
                                        newValue,
                                    )
                                ) {
                                    return true
                                }
                                return false
                            }}
                            maxLength={128}
                        />
                    ) : (
                        <CustomerInput
                            options={indictorOptions}
                            // ref={allEelement[currentIndex].dataRef}
                            onChange={(newValue, option) => {
                                const newAllValues = [...allValues]
                                const findData = indictorOptions.find(
                                    (currentOption) =>
                                        currentOption.value === newValue,
                                )
                                newAllValues[currentIndex] = findData
                                    ? `{{${findData.id}}}`
                                    : /^[0-9]*$/.test(newValue)
                                    ? newValue
                                    : `{{${newValue}}}`

                                onChange(newAllValues)
                            }}
                            key={currentIndex}
                            value={
                                indictorOptions.find(
                                    (currentOption) =>
                                        currentOption.id ===
                                        allValues?.[currentIndex].replace(
                                            /[{}]/g,
                                            '',
                                        ),
                                )?.value ||
                                allValues?.[currentIndex]
                                    .replace(/^[{]{2}/, '')
                                    .replace(/[}]{2}$/, '')
                            }
                            onPopDelete={() => {
                                handleDeleteElement(currentIndex)
                            }}
                            onPopLeftMove={() => {
                                moveToLeftElement(currentIndex)
                            }}
                            onPopRightMove={() => {
                                moveToRightElement(currentIndex)
                            }}
                            onFocus={(e: any) => {
                                const event = e as ChangeEvent<HTMLInputElement>
                                event?.target?.setSelectionRange(
                                    event.target.value.length,
                                    event.target.value.length,
                                )
                                setAllElement(
                                    allEelement.map((currentElem, index) =>
                                        index === currentIndex
                                            ? {
                                                  ...currentElem,
                                                  focusStatus: true,
                                              }
                                            : {
                                                  ...currentElem,
                                                  focusStatus: false,
                                              },
                                    ),
                                )
                            }}
                            focusStatus={focusStatus}
                            needChecked
                            checkInputStatus={(newValue) => {
                                const findData = getIndictorOptions().find(
                                    (currentOption) =>
                                        currentOption.value === newValue,
                                )
                                if (findData || /^[0-9]*$/.test(newValue)) {
                                    return true
                                }
                                return false
                            }}
                            checkIsLabel={(newValue) => {
                                const findData = getIndictorOptions().find(
                                    (currentOption) =>
                                        currentOption.value === newValue,
                                )
                                if (findData) {
                                    return true
                                }
                                return false
                            }}
                            maxLength={128}
                            getPopupContainer={(node) =>
                                node.parentNode || node
                            }
                        />
                    )
            }
        }

        const reCombFuncData = (lastData, newData) => {
            const lastDataParams = changeFuncValues(
                lastData.replace(/[{}]/g, ''),
            )
            const newDataParams = changeFuncValues(newData.replace(/[{}]/g, ''))
            if (newDataParams[1]) {
                return `${lastDataParams[0]}(${
                    lastDataParams[2] ? `${lastDataParams[2]} ` : ''
                }{{${newDataParams[1]}}})`
            }
            return `${newDataParams[0]}(${
                newDataParams[2] ? `${newDataParams[2]} ` : ''
            }{{${lastDataParams[1]}}})`
        }

        const handleDeleteElement = (index) => {
            if (index > 0) {
                if (
                    (allEelement[index - 2]?.type ===
                        EditContentElementType.OperationSymbol &&
                        allValues[index - 2] === ')') ||
                    (allEelement[index - 1]?.type ===
                        EditContentElementType.OperationSymbol &&
                        allValues[index - 1] === '(')
                ) {
                    setAllElement([
                        ...allEelement.filter((currentData, currentIndex) => {
                            if (currentIndex === index - 1) {
                                return false
                            }
                            return true
                        }),
                    ])
                    const result = [
                        ...allValues.filter(
                            (currenData, currentIndex) =>
                                index - 1 !== currentIndex,
                        ),
                    ]
                    onChange(result)
                } else if (tabType === TabsKey.ATOMS) {
                    if (index === allEelement.length - 1) {
                        if (
                            allEelement[index - 1].type ===
                            EditContentElementType.OperationalInput
                        ) {
                            setAllElement([
                                ...allEelement.map(
                                    (currentData, currentIndex) =>
                                        currentIndex === index - 1
                                            ? {
                                                  ...currentData,
                                                  focusStatus: true,
                                              }
                                            : {
                                                  ...currentData,
                                                  focusStatus: false,
                                              },
                                ),
                            ])
                        } else {
                            const newElements = [...allEelement]
                            const newValues = [...allValues]
                            newElements.splice(index - 1, 2)
                            newValues.splice(index - 1, 2)
                            if (
                                !newElements.length ||
                                newElements[newElements.length - 1].type ===
                                    EditContentElementType.OperationalInput ||
                                newElements[newElements.length - 1].type ===
                                    EditContentElementType.OperationSymbol
                            ) {
                                newElements.splice(newElements.length, 0, {
                                    type: EditContentElementType.BasicInput,
                                    focusStatus: true,
                                })
                                newValues.splice(newElements.length, 0, '')
                            }
                            setAllElement(newElements)
                            onChange(newValues)
                        }
                    } else if (
                        allEelement[index - 1].type ===
                        EditContentElementType.OperationSymbol
                    ) {
                        setAllElement([
                            ...allEelement
                                .filter((currentData, currentIndex) => {
                                    if (
                                        currentIndex === index - 1 ||
                                        currentIndex === index
                                    ) {
                                        return false
                                    }
                                    return true
                                })
                                .map((currentElem, currentIndex) => {
                                    return index - 2 === currentIndex
                                        ? { ...currentElem, focusStatus: true }
                                        : {
                                              ...currentElem,
                                              focusStatus: false,
                                          }
                                }),
                        ])
                        onChange([
                            ...allValues.filter(
                                (currenData, currentIndex) =>
                                    !(
                                        currentIndex === index - 1 ||
                                        currentIndex === index
                                    ),
                            ),
                        ])
                    } else {
                        setAllElement([
                            ...allEelement
                                .filter((currentData, currentIndex) => {
                                    if (currentIndex === index) {
                                        return false
                                    }
                                    return true
                                })
                                .map((currentElem, currentIndex) => {
                                    return index - 1 === currentIndex
                                        ? { ...currentElem, focusStatus: true }
                                        : {
                                              ...currentElem,
                                              focusStatus: false,
                                          }
                                }),
                        ])
                        onChange([
                            ...allValues.filter(
                                (currenData, currentIndex) =>
                                    !(currentIndex === index),
                            ),
                        ])
                    }
                } else {
                    setAllElement([
                        ...allEelement
                            .filter((currentData, currentIndex) => {
                                if (
                                    currentIndex === index - 1 ||
                                    currentIndex === index
                                ) {
                                    return false
                                }
                                return true
                            })
                            .map((currentElem, currentIndex) => {
                                return index - 2 === currentIndex
                                    ? { ...currentElem, focusStatus: true }
                                    : {
                                          ...currentElem,
                                          focusStatus: false,
                                      }
                            }),
                    ])
                    onChange([
                        ...allValues.filter(
                            (currenData, currentIndex) =>
                                !(
                                    currentIndex === index - 1 ||
                                    currentIndex === index
                                ),
                        ),
                    ])
                }
            } else if (
                allEelement[index].type ===
                EditContentElementType.OperationalInput
            ) {
                setAllElement([
                    {
                        type: EditContentElementType.BasicInput,
                        focusStatus: true,
                    },
                    ...allEelement.filter(
                        (current, currentIndex) => currentIndex !== 0,
                    ),
                ])
            }
        }

        useImperativeHandle(ref, () => ({
            onAddData: (type, defaultValue) => {
                let foucusIndex = -1
                allEelement.forEach((itemData, index) => {
                    if (itemData.focusStatus) {
                        foucusIndex = index
                    }
                })

                if (foucusIndex !== -1) {
                    const newElements = [...allEelement]
                    const newValues = [...allValues]
                    if (type === EditContentElementType.OperationSymbol) {
                        if (defaultValue === '(') {
                            newElements.splice(foucusIndex, 0, {
                                type,
                                focusStatus: false,
                            })
                            newValues.splice(foucusIndex, 0, defaultValue)
                        } else if (
                            foucusIndex < allValues.length - 1 &&
                            defaultValue === ')'
                        ) {
                            newElements.splice(foucusIndex + 1, 0, {
                                type,
                                focusStatus: false,
                            })
                            newValues.splice(foucusIndex + 1, 0, defaultValue)
                        } else if (
                            allValues[foucusIndex - 1] === ')' &&
                            allEelement[foucusIndex - 1].type ===
                                EditContentElementType.OperationSymbol
                        ) {
                            newElements.splice(foucusIndex, 0, {
                                type,
                                focusStatus: false,
                            })
                            newValues.splice(foucusIndex, 0, defaultValue)
                        } else if (
                            foucusIndex !== allEelement.length - 1 &&
                            (allEelement[foucusIndex + 1].type ===
                                EditContentElementType.OperationalInput ||
                                allEelement[foucusIndex + 1].type ===
                                    EditContentElementType.BasicInput)
                        ) {
                            newElements.splice(
                                foucusIndex,
                                2,
                                {
                                    ...allEelement[foucusIndex],
                                    focusStatus: false,
                                },
                                {
                                    type,
                                    focusStatus: false,
                                },
                                {
                                    type: allEelement[foucusIndex + 1].type,
                                    focusStatus: true,
                                },
                            )
                            newValues.splice(foucusIndex + 1, 0, defaultValue)
                        } else if (
                            foucusIndex !== 0 &&
                            allEelement[foucusIndex - 1].type ===
                                EditContentElementType.OperationalInput &&
                            !allValues[foucusIndex]
                        ) {
                            newElements.splice(
                                foucusIndex,
                                1,

                                {
                                    type,
                                    focusStatus: false,
                                },
                                {
                                    type: EditContentElementType.BasicInput,
                                    focusStatus: true,
                                },
                            )
                            newValues.splice(foucusIndex, 0, defaultValue)
                        } else {
                            newElements.splice(
                                foucusIndex,
                                1,
                                {
                                    ...allEelement[foucusIndex],
                                    focusStatus: false,
                                },
                                {
                                    type,
                                    focusStatus: false,
                                },
                                {
                                    type: EditContentElementType.BasicInput,
                                    focusStatus: true,
                                },
                            )
                            newValues.splice(
                                foucusIndex + 1,
                                0,
                                defaultValue,
                                '',
                            )
                        }
                    } else if (
                        type === EditContentElementType.OperationalInput
                    ) {
                        if (foucusIndex === allEelement.length - 1) {
                            newElements.splice(
                                foucusIndex,
                                1,

                                {
                                    type,
                                    focusStatus: false,
                                },
                                {
                                    type: EditContentElementType.BasicInput,
                                    focusStatus: true,
                                },
                            )
                            if (
                                allEelement[foucusIndex].type ===
                                EditContentElementType.OperationalInput
                            ) {
                                newValues.splice(
                                    foucusIndex,
                                    1,
                                    reCombFuncData(
                                        allValues[foucusIndex],
                                        defaultValue,
                                    ),
                                    '',
                                )
                            } else {
                                newValues.splice(
                                    foucusIndex,
                                    1,
                                    defaultValue,
                                    '',
                                )
                            }
                        } else {
                            newElements.splice(
                                foucusIndex,
                                1,

                                {
                                    type,
                                    focusStatus: true,
                                },
                            )
                            if (
                                allEelement[foucusIndex].type ===
                                EditContentElementType.OperationalInput
                            ) {
                                newValues.splice(
                                    foucusIndex,
                                    1,
                                    reCombFuncData(
                                        allValues[foucusIndex],
                                        defaultValue,
                                    ),
                                )
                            } else {
                                newValues.splice(foucusIndex, 1, defaultValue)
                            }
                        }
                    } else {
                        newElements.splice(
                            foucusIndex,
                            1,

                            {
                                type,
                                focusStatus: true,
                            },
                        )
                        newValues.splice(foucusIndex, 1, defaultValue)
                    }

                    setAllElement([...newElements])
                    onChange([...newValues])
                } else {
                    const newElements = [...allEelement]
                    const newValues = [...allValues]
                    foucusIndex = allValues.length - 1
                    if (type === EditContentElementType.OperationSymbol) {
                        if (defaultValue === '(') {
                            newElements.splice(foucusIndex, 0, {
                                type,
                                focusStatus: false,
                            })
                            newValues.splice(foucusIndex, 0, defaultValue)
                        } else if (
                            foucusIndex < allValues.length - 1 &&
                            defaultValue === ')'
                        ) {
                            newElements.splice(foucusIndex + 1, 0, {
                                type,
                                focusStatus: false,
                            })
                            newValues.splice(foucusIndex + 1, 0, defaultValue)
                        } else if (
                            allValues[foucusIndex - 1] === ')' &&
                            allEelement[foucusIndex - 1].type ===
                                EditContentElementType.OperationSymbol
                        ) {
                            newElements.splice(foucusIndex - 1, 0, {
                                type,
                                focusStatus: false,
                            })
                            newValues.splice(foucusIndex - 1, 0, defaultValue)
                        } else if (
                            foucusIndex !== 0 &&
                            allEelement[foucusIndex - 1].type ===
                                EditContentElementType.OperationalInput &&
                            !allValues[foucusIndex]
                        ) {
                            newElements.splice(
                                foucusIndex,
                                1,

                                {
                                    type,
                                    focusStatus: false,
                                },
                                {
                                    type: EditContentElementType.BasicInput,
                                    focusStatus: true,
                                },
                            )
                            newValues.splice(foucusIndex, 0, defaultValue)
                        } else {
                            newElements.splice(
                                foucusIndex + 1,
                                0,
                                {
                                    type,
                                    focusStatus: false,
                                },
                                {
                                    type: EditContentElementType.BasicInput,
                                    focusStatus: true,
                                },
                            )
                            newValues.splice(
                                foucusIndex + 1,
                                0,
                                defaultValue,
                                '',
                            )
                        }
                    } else if (
                        type === EditContentElementType.OperationalInput
                    ) {
                        newElements.splice(
                            foucusIndex,
                            1,

                            {
                                type,
                                focusStatus: true,
                            },
                            {
                                type: EditContentElementType.BasicInput,
                                focusStatus: false,
                            },
                        )
                        if (
                            allEelement[foucusIndex].type ===
                            EditContentElementType.OperationalInput
                        ) {
                            newValues.splice(
                                foucusIndex,
                                1,
                                reCombFuncData(
                                    allValues[foucusIndex],
                                    defaultValue,
                                ),
                                '',
                            )
                        } else {
                            newValues.splice(foucusIndex, 1, defaultValue, '')
                        }
                    } else {
                        newElements.splice(
                            foucusIndex,
                            1,

                            {
                                type,
                                focusStatus: true,
                            },
                        )
                        newValues.splice(foucusIndex, 1, defaultValue)
                    }

                    setAllElement([...newElements])
                    onChange([...newValues])
                }
            },
            onFcous: () => {
                setAllElement([
                    ...allEelement.map((currentData, index) =>
                        index === allEelement.length - 1
                            ? {
                                  ...currentData,
                                  focusStatus: true,
                              }
                            : {
                                  ...currentData,
                                  focusStatus: false,
                              },
                    ),
                ])
            },
        }))

        const moveToLeftElement = (currentIndex) => {
            if (currentIndex !== 0) {
                if (
                    allEelement[currentIndex - 1].type !==
                    EditContentElementType.OperationSymbol
                ) {
                    setAllElement([
                        ...allEelement.map((currentData, index) =>
                            currentIndex - 1 === index
                                ? {
                                      ...currentData,
                                      focusStatus: true,
                                  }
                                : {
                                      ...currentData,
                                      focusStatus: false,
                                  },
                        ),
                    ])
                } else {
                    moveToLeftElement(currentIndex - 1)
                }
            }
        }

        const moveToRightElement = (currentIndex) => {
            if (currentIndex !== allEelement.length - 1) {
                if (
                    allEelement[currentIndex + 1].type !==
                    EditContentElementType.OperationSymbol
                ) {
                    setAllElement([
                        ...allEelement.map((currentData, index) =>
                            currentIndex + 1 === index
                                ? {
                                      ...currentData,
                                      focusStatus: true,
                                  }
                                : {
                                      ...currentData,
                                      focusStatus: false,
                                  },
                        ),
                    ])
                } else {
                    moveToRightElement(currentIndex + 1)
                }
            }
        }

        return (
            <div
                className={styles.expresssEditConatainer}
                onClick={(e) => {
                    const allInput =
                        (e?.target as HTMLDivElement)?.getElementsByTagName(
                            'input',
                        ) || []
                    if (allInput) {
                        allInput[allInput.length - 1]?.focus()
                    }
                    setAllElement(
                        allEelement.map((current, index) =>
                            index === allEelement.length - 1
                                ? {
                                      ...current,
                                      focusStatus: true,
                                  }
                                : {
                                      ...current,
                                      focusStatus: false,
                                  },
                        ),
                    )
                }}
                ref={parentDiv}
            >
                {allValues.map((currentElement, index) =>
                    getElementFromType(
                        allEelement[index]?.type ||
                            EditContentElementType.BasicInput,
                        index,
                        allEelement[index]?.focusStatus || false,
                    ),
                )}
            </div>
        )
    },
)

export default ExpressEditContent
