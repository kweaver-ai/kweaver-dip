import React, {
    useCallback,
    useRef,
    useImperativeHandle,
    forwardRef,
    useMemo,
    CSSProperties,
} from 'react'
import ReactCodeMirror, {
    EditorView,
    ReactCodeMirrorRef,
} from '@uiw/react-codemirror'
import { vscodeLight } from '@uiw/codemirror-theme-vscode'
import { snippet, CompletionContext } from '@codemirror/autocomplete'
import { sql } from '@codemirror/lang-sql'
import cs from 'classnames'
import { format } from 'sql-formatter'
import { lowerCase } from 'lodash'
import { placeholdersPlugin } from './plugin/placeholders'
import styles from './styles.module.less'

interface Props {
    value: string
    onChange?: (value) => void
    readOnly?: boolean
    editable?: boolean
    placeholder?: string
    style?: CSSProperties
    lineNumbers?: boolean
    highlightActiveLine?: boolean
    grayBackground?: boolean
}

export const getFormatSql = (value: string) =>
    format(value, {
        // language: 'mysql',
        tabWidth: 2,
        // keywordCase: 'upper',
        linesBetweenQueries: 2,
    })

const Editor = (props: Props, ref) => {
    const {
        value,
        onChange,
        readOnly,
        editable,
        placeholder,
        style,
        lineNumbers,
        highlightActiveLine,
        grayBackground = false,
    } = props
    const editorRef = useRef<ReactCodeMirrorRef>(null)
    const insertText = useCallback((text: string, isTemplate?: boolean) => {
        const { view } = editorRef.current!
        if (!view) return
        const { state } = view
        if (!state) return
        const [range] = state?.selection?.ranges || []
        view.focus()
        if (isTemplate) {
            snippet(text)(
                {
                    state,
                    dispatch: view.dispatch,
                },
                {
                    label: text,
                    detail: text,
                },
                range.from,
                range.to,
            )
        } else {
            view.dispatch({
                changes: {
                    from: range.from,
                    to: range.to,
                    insert: text,
                },
                selection: {
                    anchor: range.from + text.length,
                },
            })
        }
    }, [])

    const clearText = useCallback(() => {
        const { view } = editorRef.current!
        if (!view) return
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: '',
            },
            selection: {
                anchor: 0,
            },
        })
        view.focus()
    }, [])

    useImperativeHandle(
        ref,
        () => {
            return {
                insertText,
                clearText,
                originEditorRef: editorRef,
            }
        },
        [insertText, clearText],
    )

    const KeyCompletions = (context: CompletionContext) => {
        const before = context?.matchBefore(/\w*/)
        if (!context?.explicit && !before) return null
        return {
            from: before ? before.from : context?.pos,
            options: ['SUM', 'MAX', 'MIN', 'AVERAGE', 'AVG'].map((k) => ({
                label: lowerCase(k),
                type: 'keyword',
            })),
        }
    }

    return (
        <div
            style={style}
            className={cs(
                grayBackground ? styles.grayBackground : '',
                highlightActiveLine ? '' : styles.hideActiveLine,
            )}
        >
            <ReactCodeMirror
                ref={editorRef}
                value={value}
                theme={vscodeLight}
                editable={editable}
                readOnly={readOnly}
                basicSetup={{
                    lineNumbers,
                    highlightActiveLine,
                }}
                height="100%"
                placeholder={placeholder}
                extensions={[
                    sql(),
                    sql().language.data.of({ autocomplete: KeyCompletions }),
                    placeholdersPlugin(
                        {
                            FFF: {
                                textColor: 'rgba(18, 110, 227, 1)',
                                backgroudColor: 'rgba(236, 244, 253, 1)',
                                borderColor: 'rgba(236, 244, 253, 1)',
                            },
                        },
                        (modalStyle, text) => {},
                        'name',
                    ),
                    EditorView.lineWrapping,
                ]}
                onChange={onChange}
            />
        </div>
    )
}
export default forwardRef(Editor)
