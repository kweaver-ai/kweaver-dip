import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import JSONBig from 'json-bigint'
import classnames from 'classnames'
import { isArray } from 'lodash'
import styles from './styles.module.less'

interface JSONCodeViewType {
    code: string
    className?: any
}
const JSONCodeView = ({ code, className = '' }: JSONCodeViewType) => {
    const [lineNumber, setLineNumber] = useState<number>(0)
    const container = useRef(null)
    useEffect(() => {
        setLineNumber(getCodeLine(JSONBig.parse(code), true))
    }, [code])

    /**
     * 获取总行数
     * @param formattedCode
     * @param initNumber
     * @returns
     */
    const getCodeLine = (formattedCode: any, isFirst) => {
        let count = 0
        if (checkCurrentDataType(formattedCode) === 'Object') {
            const codeKeys = Object.keys(formattedCode)
            if (isFirst) {
                count = count + 2 + codeKeys.length
            } else {
                count = count + 1 + codeKeys.length
            }
            codeKeys.forEach((currentKey) => {
                if (
                    checkCurrentDataType(formattedCode[currentKey]) ===
                        'Object' ||
                    checkCurrentDataType(formattedCode[currentKey]) === 'Array'
                ) {
                    count += getCodeLine(formattedCode[currentKey], false)
                }
            })
            return count
        }
        if (!isArray(formattedCode)) {
            return 0
        }
        if (isFirst) {
            count = count + 2 + formattedCode.length
        } else {
            count = count + 1 + formattedCode.length
        }
        formattedCode.forEach((currentCodeData) => {
            if (
                checkCurrentDataType(currentCodeData) === 'Object' ||
                checkCurrentDataType(currentCodeData) === 'Array'
            ) {
                count += getCodeLine(currentCodeData, false)
            }
        })
        return count
    }

    /**
     * 生成预览内容
     * @param formattedCode
     * @param isFirst
     * @returnstrue
     */
    const getCodeViewComponent = (
        formattedCode: any,
        isFirst: boolean,
        isEnd = true,
    ) => {
        if (checkCurrentDataType(formattedCode) === 'Object') {
            const codeKeys = Object.keys(formattedCode)
            return (
                <>
                    {isFirst ? (
                        <div
                            className={classnames(
                                styles.codeItem,
                                styles.bracket,
                            )}
                        >
                            {'{'}
                        </div>
                    ) : null}
                    {codeKeys.map((currentKey, index) => {
                        if (
                            checkCurrentDataType(formattedCode[currentKey]) ===
                            'String'
                        ) {
                            return (
                                <div
                                    className={classnames(
                                        styles.codeItem,
                                        styles.retract,
                                    )}
                                >
                                    <code>{`"${currentKey}": `}</code>
                                    <code>{`"${formattedCode[currentKey]}"`}</code>
                                    {index + 1 < codeKeys.length ? (
                                        <code
                                            style={{
                                                color: 'rgba(0,0,0,0.85)',
                                            }}
                                        >
                                            ,
                                        </code>
                                    ) : null}
                                </div>
                            )
                        }
                        if (
                            checkCurrentDataType(formattedCode[currentKey]) ===
                            'Number'
                        ) {
                            return (
                                <div
                                    className={classnames(
                                        styles.codeItem,
                                        styles.retract,
                                    )}
                                >
                                    <code>{`"${currentKey}": `}</code>
                                    <code
                                        style={{
                                            color: '#c92c2c',
                                        }}
                                    >{`${formattedCode[currentKey]}`}</code>
                                    {index + 1 < codeKeys.length ? (
                                        <code
                                            style={{
                                                color: 'rgba(0,0,0,0.85)',
                                            }}
                                        >
                                            ,
                                        </code>
                                    ) : null}
                                </div>
                            )
                        }
                        if (
                            checkCurrentDataType(formattedCode[currentKey]) ===
                                'Boolean' ||
                            checkCurrentDataType(formattedCode[currentKey]) ===
                                'Null'
                        ) {
                            return (
                                <div
                                    className={classnames(
                                        styles.codeItem,
                                        styles.retract,
                                    )}
                                >
                                    <code>{`"${currentKey}": `}</code>
                                    <code>{`${formattedCode[currentKey]}`}</code>
                                    {index + 1 < codeKeys.length ? (
                                        <code
                                            style={{
                                                color: 'rgba(0,0,0,0.85)',
                                            }}
                                        >
                                            ,
                                        </code>
                                    ) : null}
                                </div>
                            )
                        }
                        return (
                            <div className={styles.retract}>
                                <div className={classnames(styles.codeItem)}>
                                    <code>{`"${currentKey}": `}</code>
                                    <code className={styles.bracket}>
                                        {checkCurrentDataType(
                                            formattedCode[currentKey],
                                        ) === 'Array'
                                            ? '['
                                            : '{'}
                                    </code>
                                </div>
                                {getCodeViewComponent(
                                    formattedCode[currentKey],
                                    false,
                                    index + 1 < codeKeys.length,
                                )}
                            </div>
                        )
                    })}
                    <div
                        className={classnames(styles.codeItem, styles.bracket)}
                    >
                        {'}'}
                        {!isEnd ? (
                            <code style={{ color: 'rgba(0,0,0,0.85)' }}>,</code>
                        ) : null}
                    </div>
                </>
            )
        }
        if (isArray(formattedCode)) {
            return (
                <>
                    {formattedCode?.map((currentCodeData, index) => {
                        if (
                            checkCurrentDataType(currentCodeData) === 'String'
                        ) {
                            return (
                                <div
                                    className={classnames(
                                        styles.codeItem,
                                        styles.retract,
                                    )}
                                >
                                    <code>{`"${currentCodeData}"`}</code>
                                    {index + 1 < formattedCode.length ? (
                                        <code
                                            style={{
                                                color: 'rgba(0,0,0,0.85)',
                                            }}
                                        >
                                            ,
                                        </code>
                                    ) : null}
                                </div>
                            )
                        }
                        if (
                            checkCurrentDataType(currentCodeData) === 'Number'
                        ) {
                            return (
                                <div
                                    className={classnames(
                                        styles.codeItem,
                                        styles.retract,
                                    )}
                                >
                                    <code
                                        style={{
                                            color: '#c92c2c',
                                        }}
                                    >{`${currentCodeData}`}</code>
                                    {index + 1 < formattedCode.length ? (
                                        <code
                                            style={{
                                                color: 'rgba(0,0,0,0.85)',
                                            }}
                                        >
                                            ,
                                        </code>
                                    ) : null}
                                </div>
                            )
                        }
                        if (
                            checkCurrentDataType(currentCodeData) ===
                                'Boolean' ||
                            checkCurrentDataType(currentCodeData) === 'Null'
                        ) {
                            return (
                                <div
                                    className={classnames(
                                        styles.codeItem,
                                        styles.retract,
                                    )}
                                >
                                    <code>{`${currentCodeData}`}</code>
                                    {index + 1 < formattedCode.length ? (
                                        <code
                                            style={{
                                                color: 'rgba(0,0,0,0.85)',
                                            }}
                                        >
                                            ,
                                        </code>
                                    ) : null}
                                </div>
                            )
                        }
                        return (
                            <div className={styles.retract}>
                                <div
                                    className={classnames(
                                        styles.codeItem,
                                        styles.bracket,
                                    )}
                                >
                                    <code>
                                        {checkCurrentDataType(
                                            currentCodeData,
                                        ) === 'Array'
                                            ? '['
                                            : '{'}
                                    </code>
                                </div>
                                {getCodeViewComponent(
                                    currentCodeData,
                                    false,
                                    index + 1 < formattedCode.length,
                                )}
                            </div>
                        )
                    })}
                    <div
                        className={classnames(styles.codeItem, styles.bracket)}
                    >
                        {!isEnd ? (
                            <code style={{ color: 'rgba(0,0,0,0.85)' }}>,</code>
                        ) : null}
                    </div>
                </>
            )
        }
        return code
    }

    /**
     * 获取数据类型
     * @param formattedCode
     * @returns
     */
    const checkCurrentDataType = (formattedCode) => {
        return Object.prototype.toString
            .call(formattedCode)
            .replace(/[[\]]*/g, '')
            .split(' ')[1]
    }
    return (
        <div className={className}>
            <div className={styles.codeContainer}>
                <div className={styles.lineNumbers}>
                    {Array.from({ length: lineNumber }).map(
                        (currentLine, index) => {
                            return (
                                <div className={styles.line}>{index + 1}</div>
                            )
                        },
                    )}
                </div>
                <div className={styles.codeView} ref={container}>
                    <pre>{getCodeViewComponent(JSONBig.parse(code), true)}</pre>
                </div>
            </div>
        </div>
    )
}

export default JSONCodeView
