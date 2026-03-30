import { FC, ReactNode } from 'react'
import { DndProvider, useDrop } from 'react-dnd'
import { noop } from 'lodash'
import { HTML5Backend } from 'react-dnd-html5-backend'
import classnames from 'classnames'
import styles from './styles.module.less'

interface IContainerDrop {
    children: ReactNode
    isDragging?: boolean
    onDrop?: (data) => void
}

const ContainerDrop: FC<IContainerDrop> = ({
    children,
    isDragging = false,
    onDrop = noop,
}) => {
    const [{ canDrop }, drop] = useDrop({
        accept: 'card',
        canDrop: (_item, monitor) => {
            return isDragging
        },
        collect: (monitor) => ({
            canDrop: !!monitor.canDrop(),
        }),
        drop: (data) => {
            if (isDragging) {
                onDrop(data)
            }
        },
    })

    return (
        <div
            className={classnames({
                [styles.itemContainer]: true,
                [styles.isDragging]: isDragging,
            })}
            ref={drop}
        >
            {children}
        </div>
    )
}

export default ContainerDrop
