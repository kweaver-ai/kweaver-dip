import { useEffect, useMemo, useRef, useState } from 'react'
import { CloseOutlined, CopyOutlined } from '@ant-design/icons'
import ReactCodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror'

import {
    syntaxHighlighting,
    StreamLanguage,
    HighlightStyle,
} from '@codemirror/language'
import { tags } from '@lezer/highlight'
import createTheme from '@uiw/codemirror-themes'
import { vscodeLight, vscodeDark } from '@uiw/codemirror-theme-vscode'
import { message, Tabs, Tooltip } from 'antd'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { go } from '@codemirror/legacy-modes/mode/go'
import { java } from '@codemirror/legacy-modes/mode/clike'
import { python } from '@codemirror/legacy-modes/mode/python'
import styles from './styles.module.less'
import __ from '../../locale'
import { formatError, getExampleCode } from '@/core'
import { FontIcon } from '@/icons'

interface IExampleCode {
    open: boolean
    onClose: () => void
    id: string
}

// 创建自定义高亮样式
// const customHighlightStyle = HighlightStyle.define([
//     { tag: tags.keyword, color: '#0000ff', fontWeight: 'bold' },
//     { tag: tags.string, color: '#a31515' },
//     { tag: tags.comment, color: '#008000', fontStyle: 'italic' },
//     { tag: tags.variableName, color: '#001080' },
//     { tag: tags.function(tags.variableName), color: '#795e26' },
//     // 添加更多标签样式...
// ])

const customTheme = createTheme({
    theme: 'light',
    settings: {
        background: 'rgba(240, 242, 246, 0.45)',
        foreground: 'rgba(240, 242, 246, 0.45)',
        caret: '#526fff',
        selection: '#e5e5e6',
        selectionMatch: '#e5e5e6',
        lineHighlight: 'rgba(0, 0, 0, 0.04)',
        gutterBackground: 'rgba(240, 242, 246, 0.45)',
        gutterForeground: 'rgba(240, 242, 246, 0.45)',
    },
    styles: [
        { tag: tags.comment, color: '#a0a1a7' },
        { tag: tags.keyword, color: '#a626a4' },
        { tag: [tags.string, tags.special(tags.brace)], color: '#50a14f' },
        { tag: tags.number, color: '#986801' },
        { tag: tags.bool, color: '#986801' },
        { tag: tags.null, color: '#986801' },
        { tag: tags.operator, color: '#0184bc' },
        { tag: tags.variableName, color: '#e45649' },
        { tag: tags.function(tags.variableName), color: '#4078f2' },
        { tag: tags.typeName, color: '#c18401' },
        { tag: tags.definition(tags.typeName), color: '#c18401' },
        { tag: tags.className, color: '#c18401' },
        { tag: tags.propertyName, color: '#4078f2' },
    ],
})

// 自定义主题，基于 vscodeLight 但修改背景色

const ExampleCode = ({ open, onClose, id }: IExampleCode) => {
    const languageList = [
        {
            label: 'Shell',
            key: 'shell',
        },
        {
            label: 'Java',
            key: 'java',
        },
        {
            label: 'Go',
            key: 'go',
        },
        {
            label: 'Python',
            key: 'python',
        },
    ]
    const [activeTab, setActiveTab] = useState<string>('shell')

    const editorRef = useRef<ReactCodeMirrorRef>(null)

    const [value, setValue] = useState<string>('')

    const [allCodeList, setAllCodeList] = useState<{ [key: string]: any }>({})

    const languageConfig = useMemo(() => {
        switch (activeTab) {
            case 'java':
                return StreamLanguage.define(java as any)
            case 'go':
                return StreamLanguage.define(go as any)
            case 'python':
                return StreamLanguage.define(python as any)
            case 'shell':
                return StreamLanguage.define(shell as any)
            default:
                return StreamLanguage.define(shell as any)
        }
    }, [activeTab])

    useEffect(() => {
        if (id) {
            getExampleCodeValue()
        }
    }, [id])

    useEffect(() => {
        if (allCodeList) {
            setValue(allCodeList?.[`${activeTab}_example_code`] || '')
        }
    }, [allCodeList, activeTab])

    const getExampleCodeValue = async () => {
        try {
            const res = await getExampleCode(id)
            setAllCodeList(res)
        } catch (err) {
            formatError(err)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(value)
        message.success(__('复制成功'))
    }

    return (
        <div className={styles.exampleCodeContainer}>
            <div className={styles.titleWrapper}>
                <div className={styles.title}>
                    <div className={styles.titleIcon} />
                    <div className={styles.titleText}>{__('使用示例')}</div>
                </div>
                <div className={styles.closeBtn} onClick={onClose}>
                    <CloseOutlined />
                </div>
            </div>

            <div className={styles.contentWrapper}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as string)}
                    items={languageList}
                />
                <div className={styles.codeWrapper}>
                    <ReactCodeMirror
                        ref={editorRef}
                        value={value}
                        editable={false}
                        theme={vscodeLight}
                        readOnly
                        basicSetup={{
                            lineNumbers: true,
                            highlightActiveLine: true,
                            syntaxHighlighting: true,
                        }}
                        height="100%"
                        extensions={
                            languageConfig
                                ? [
                                      languageConfig,
                                      // syntaxHighlighting(customHighlightStyle),
                                      //   EditorView.lineWrapping,
                                  ]
                                : []
                        }
                        style={{
                            background: 'rgba(240,242,246,0.45)',
                        }}
                    />
                    <Tooltip title={__('复制')} placement="bottom">
                        <div className={styles.copyBtn} onClick={handleCopy}>
                            <FontIcon
                                name="icon-fuzhi"
                                style={{ fontSize: 16 }}
                            />
                        </div>
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}

export default ExampleCode
