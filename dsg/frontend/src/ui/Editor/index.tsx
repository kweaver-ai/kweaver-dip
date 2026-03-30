import * as React from 'react'
import { useRef, useCallback, useState } from 'react'
import MonacoEditor, { monaco } from 'react-monaco-editor'
import { language } from 'monaco-editor/esm/vs/basic-languages/sql/sql'
import { noop } from 'lodash'
import { useGetState } from 'ahooks'
import sqlReservedWords from './sqlReservedWords'

interface SqlEditorType {
    value?: string
    onChange?: (value) => void
    width?: string | number
    initSource?: Array<{
        detail: string
        keywords: Array<string>
    }>
    height?: string | number
    readOnly?: boolean
    dataReservedWords?: Array<string>
    options?: monaco.editor.IStandaloneEditorConstructionOptions
}
const Editor = ({
    value = '',
    onChange = noop,
    width,
    initSource = [],
    height,
    readOnly = false,
    dataReservedWords = sqlReservedWords,
    options,
}: SqlEditorType) => {
    const codeContainer = useRef<any>(null)
    const editorCompletionItemProviderRef = useRef<monaco.IDisposable>()
    const [editorInstance, setEditor] = useState<any>(null)
    const [languageInstance, setLanguageInstance] = useState<any>(null)
    const [editValue, setEditValue] = useState<string>('')
    const [sourceKeyword, setSourceKeyword, getSourceKeyword] =
        useGetState(initSource)

    React.useEffect(() => {
        editorCompletionItemProviderRef?.current?.dispose()
        // codeContainer?.current?.dispose()
        if (codeContainer.current?.languages?.registerCompletionItemProvider) {
            const providerRef =
                codeContainer.current.languages.registerCompletionItemProvider(
                    'sql',
                    {
                        provideCompletionItems: getItems,
                    },
                )
            if (editorCompletionItemProviderRef) {
                editorCompletionItemProviderRef.current = providerRef
            }
        }
        setSourceKeyword(initSource)
    }, [initSource])

    const getItems = (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
        }
        const dataSource = [
            { detail: 'SQL', keywords: dataReservedWords },
            ...getSourceKeyword(),
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
            codeContainer.current = editor
            editor.languages.register({ id: 'sql' })
            editor.languages.setMonarchTokensProvider('sql', language)
            setLanguageInstance(editor)
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
        [initSource, editorCompletionItemProviderRef],
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
                readOnly,
                ...options,
            }}
            onChange={(srcipt) => {
                setEditValue(srcipt)
                onChange(srcipt)
            }}
            width={width}
            height={height}
            editorWillMount={editorWillMount}
            editorDidMount={editorDidMount}
            editorWillUnmount={() => {
                editorCompletionItemProviderRef?.current?.dispose()
            }}
        />
    )
}

export default Editor
