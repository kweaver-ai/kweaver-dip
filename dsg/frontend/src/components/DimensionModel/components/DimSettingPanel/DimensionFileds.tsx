import { Checkbox } from 'antd'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import classnames from 'classnames'
import { memo, useCallback, useEffect, useState } from 'react'
import { useDrop } from 'react-dnd'
import Empty from '@/ui/Empty'
import empty from '@/assets/dataEmpty.svg'
import { DragDropType, IFieldMeta } from '.'
import __ from '../../locale'
import FieldItem from './FieldItem'
import styles from './styles.module.less'
import { OptDimType } from './DimConfProvider'

const EmptyView = (
    <div className={styles['empty-view']}>
        <Empty
            desc={
                <div>
                    <div>{__('暂无数据')}</div>
                    <div>{__('拖入左侧事实表字段作为维度字段')}</div>
                </div>
            }
            iconSrc={empty}
        />
    </div>
)

/**
 * 事实表字段选择
 * @returns
 */
function DimensionFileds({ bindItems, handleBind }: any) {
    const [{ canDrop, isOver }, drop] = useDrop({
        accept: DragDropType,
        canDrop: (_item) => {
            return true
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    })

    const [checkAll, setCheckAll] = useState(false)
    const [checkedItems, setCheckedItems] = useState<IFieldMeta[]>([])
    const [indeterminate, setIndeterminate] = useState(true)

    const isCheckedId = useCallback(
        (id: string) => checkedItems?.some((o) => o.factFieldId === id),
        [checkedItems],
    )

    useEffect(() => {
        const isIndeterminate =
            bindItems?.length !== checkedItems?.length &&
            checkedItems?.length !== 0
        setIndeterminate(isIndeterminate)
        setCheckAll(
            bindItems?.length === checkedItems?.length && bindItems?.length > 0,
        )
    }, [checkedItems, bindItems])

    const handleCheckAll = (e: CheckboxChangeEvent) => {
        const isChecked = e.target.checked
        setCheckedItems(isChecked ? bindItems ?? [] : [])
        setIndeterminate(false)
        setCheckAll(isChecked)
    }

    const handleItemCheck = (isChecked: boolean, item: IFieldMeta) => {
        if (isChecked) {
            if (!isCheckedId(item.factFieldId)) {
                setCheckedItems([...checkedItems, item])
            }
        } else {
            const items = checkedItems.filter(
                (o) => o.factFieldId !== item.factFieldId,
            )
            setCheckedItems(items)
        }
    }

    const handleItemRemove = (isChecked: boolean, item: any) => {
        handleBind(OptDimType.DELETE, item)

        if (isChecked) {
            const retItems = checkedItems?.filter(
                (o) => o.factFieldId !== item.factFieldId,
            )
            setCheckedItems(retItems)
        }
    }

    const handleBatchRemove = () => {
        handleBind(OptDimType.DELETE, checkedItems)
        setCheckedItems([])
    }

    return (
        <div className={styles['attrs-wrapper']}>
            <div className={styles['attrs-wrapper-all']}>
                <Checkbox
                    indeterminate={indeterminate}
                    onChange={handleCheckAll}
                    checked={checkAll}
                    disabled={!bindItems?.length}
                >
                    {__('维度字段')}({(bindItems || [])?.length})
                </Checkbox>
                {checkedItems.length > 0 && (
                    <div className={styles['attrs-wrapper-all-tip']}>
                        {__('已选')} <span>{checkedItems.length}</span>
                        {__('个字段')}
                        <span
                            className={styles.btn}
                            onClick={handleBatchRemove}
                        >
                            {__('移除')}
                        </span>
                    </div>
                )}
            </div>

            <div
                className={classnames({
                    [styles['attrs-wrapper-list']]: true,
                    [styles['can-drop']]: canDrop,
                    [styles['is-over']]: isOver,
                    [styles['is-empty']]: !bindItems?.length,
                })}
                ref={drop}
            >
                {!bindItems?.length
                    ? EmptyView
                    : bindItems?.map((o) => (
                          <FieldItem
                              key={o.factFieldId}
                              item={o}
                              checked={isCheckedId(o.factFieldId)}
                              handleCheck={handleItemCheck}
                              handleRemove={handleItemRemove}
                          />
                      ))}
            </div>
        </div>
    )
}

export default memo(DimensionFileds)
