import * as React from 'react'
import { useRef, useCallback, useState } from 'react'
import MonacoEditor, { monaco } from 'react-monaco-editor'
import { language } from 'monaco-editor/esm/vs/basic-languages/sql/sql'
import { noop } from 'lodash'
import sqlReservedWords from './sqlReservedWords'

interface SqlEditorType {
    value?: string
    onChange?: (value) => void
    width?: string | number
}
const SqlEditor = ({ value = '', onChange = noop, width }: SqlEditorType) => {
    // const codeContainer = useRef<HTMLDivElement>(null)
    const editorCompletionItemProviderRef = useRef<monaco.IDisposable>()
    const [editorInstance, setEditor] =
        useState<monaco.editor.IStandaloneCodeEditor>()

    const [editValue, setEditValue] = useState<string>('')

    const getItems = (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
        }
        const dataSource = [
            { detail: 'SQL', keywords: sqlReservedWords },
            //   { detail: 'Database', keywords: Array.from(dbKeywords) },
            //   { detail: 'Table', keywords: Array.from(tableKeywords) },
            //   { detail: 'Column', keywords: Array.from(schemaKeywords) },
            //   { detail: 'Variable', keywords: Array.from(variableKeywords) },
        ]
        return {
            suggestions: dataSource
                .filter(({ keywords }) => !!keywords)
                .reduce<monaco.languages.CompletionItem[]>(
                    (arr, { detail, keywords }) =>
                        arr.concat(
                            keywords!.map((str) => ({
                                label: str,
                                detail,
                                kind: monaco.languages.CompletionItemKind
                                    .Keyword,
                                insertText:
                                    detail === 'Variable' ? `$${str}$` : str,
                                range,
                            })),
                        ),
                    [],
                ),
        }
    }
    const editorWillMount = useCallback(
        (editor) => {
            editor.languages.register({ id: 'sql' })
            editor.languages.setMonarchTokensProvider('sql', language)
            // monaco.editor.setModelMarkers(editor.editor.getModel(), 'sql', [
            //     {
            //         // json为语言类型
            //         startLineNumber: 2,
            //         endLineNumber: 2,
            //         startColumn: 1,
            //         endColumn: 10,
            //         severity: monaco.MarkerSeverity.Error,
            //         message: `语法错误`,
            //     },
            // ])
            const providerRef = editor.languages.registerCompletionItemProvider(
                'sql',
                {
                    provideCompletionItems: getItems,
                },
            )
            if (editorCompletionItemProviderRef) {
                editorCompletionItemProviderRef.current = providerRef
            }
        },
        // [dispatch, editorCompletionItemProviderRef],
        [],
    )
    const editorDidMount = useCallback(
        (editor: monaco.editor.IStandaloneCodeEditor) => {
            setEditor(editor)
            const messageContribution = editor.getContribution(
                'editor.contrib.messageController',
            )
            editor.onDidChangeCursorSelection((e) => {
                editor.getModel()?.getValueInRange(e.selection)
            })
            // editor.onDidAttemptReadOnlyEdit(() => {
            //     (messageContribution as any).showMessage(editor.getPosition())
            // })
        },
        // [dispatch, editorCompletionItemProviderRef],
        [],
    )

    return (
        <MonacoEditor
            value={value}
            language="sql"
            theme="vs"
            options={{
                fontSize: 16 * 0.875,
                minimap: { enabled: false },
                scrollbar: {
                    scrollByPage: true,
                },
            }}
            onChange={(srcipt) => {
                setEditValue(srcipt)
                onChange(srcipt)
            }}
            width={width}
            editorWillMount={editorWillMount}
            editorDidMount={editorDidMount}
        />
    )
}

export default SqlEditor
