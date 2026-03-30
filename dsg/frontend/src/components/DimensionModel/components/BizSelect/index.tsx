import classnames from 'classnames'
import { memo, useState } from 'react'
import { BusinessFormOutlined, DatasheetViewColored } from '@/icons'
import __ from '../../locale'
import ChooseBizTable from '../ChooseBizTable'
import FieldPreview from '../FieldPreview'
import styles from './styles.module.less'

export enum ISelectType {
    Fact,
    Dimension,
}
/**
 * 选择业务表
 * @returns
 */
function BizSelect({
    title,
    border,
    type,
    placeholder,
    selected,
    onSelected,
    bindIds,
    checkedNode,
}: {
    title?: string
    border?: boolean
    type?: ISelectType
    placeholder?: string
    selected?: any
    checkedNode?: any
    onSelected?: (item: any) => void
    bindIds?: string[]
}) {
    const [visible, setVisible] = useState<boolean>(false)
    const [preview, setPreview] = useState<boolean>(false)

    const placeholderTxt = placeholder || __('请选择业务表')

    return (
        <>
            <div
                className={classnames({
                    [styles['biz-select']]: true,
                    [styles['hidden-border']]: !border,
                })}
                style={{ flex: 1 }}
            >
                {selected && (
                    <div className={styles['biz-select-icon']}>
                        <DatasheetViewColored />
                    </div>
                )}
                {!selected && type === ISelectType.Dimension ? (
                    <div
                        className={styles['biz-select-choose']}
                        onClick={() => setVisible(true)}
                    >
                        {placeholderTxt}
                    </div>
                ) : (
                    <>
                        <div
                            className={classnames({
                                [styles['biz-select-title']]: true,
                                [styles['is-placeholder']]: !selected,
                            })}
                        >
                            {selected ? (
                                <span
                                    onClick={() => setPreview(true)}
                                    title={selected?.cnName}
                                >
                                    {selected?.cnName}
                                </span>
                            ) : (
                                placeholderTxt
                            )}
                        </div>
                        <div
                            className={styles['biz-select-btn']}
                            onClick={() => setVisible(true)}
                        >
                            {__('选择')}
                        </div>
                    </>
                )}
            </div>
            <div style={{ position: 'absolute' }}>
                <ChooseBizTable
                    title={title}
                    checked={checkedNode}
                    visible={visible}
                    bindIds={bindIds}
                    onClose={() => setVisible(false)}
                    onSure={(o) => {
                        onSelected?.(o)
                        setVisible(false)
                    }}
                />
                <FieldPreview
                    tableId={selected?.id}
                    visible={preview}
                    onClose={() => setPreview(false)}
                />
            </div>
        </>
    )
}

export default memo(BizSelect)
