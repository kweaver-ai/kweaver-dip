import React, { ReactNode } from 'react'
import Split, { SplitProps } from 'react-split'
import { useMount } from 'ahooks'
import styles from './styles.module.less'
import dragVertical from '@/icons/svg/colored/dragVertical.svg'

interface IDragVertical extends SplitProps {
    children: [ReactNode, ReactNode]
    expand: boolean
    defaultSize: Array<number>
    isHidden?: boolean
    gutterSize?: number
}

const DragVertical: React.FC<IDragVertical> = ({
    children,
    expand,
    defaultSize,
    gutterSize = 20,
    isHidden = true,
    ...props
}) => {
    const { minSize, maxSize } = props

    useMount(() => {
        const gutter = document.getElementsByClassName(
            'gutter gutter-vertical',
        )[0]
        while (gutter.firstChild) {
            gutter.removeChild(gutter.firstChild)
        }
        const icon = document.createElement('img')
        icon.src = dragVertical
        icon.className = `gutterIcon`
        gutter.append(icon)
    })
    return (
        <Split
            className={styles['drag-vertical']}
            sizes={expand ? defaultSize : [100, 0]}
            minSize={expand ? minSize : [100, 0]}
            maxSize={expand ? maxSize : [Infinity, 800]}
            gutterSize={expand ? gutterSize : 0}
            direction="vertical"
            cursor="ns-resize"
            gutterStyle={() =>
                !isHidden
                    ? {
                          background: 'transparent',
                          height: `${gutterSize || 0}px`,
                          cursor: 'ns-resize',
                          visibility: 'visible',
                      }
                    : {
                          background: 'transparent',
                          height: '0px',
                          cursor: 'ns-resize',
                          visibility: 'hidden',
                      }
            }
            {...props}
        >
            <div
                className={styles['drag-vertical-top']}
                style={{
                    height: `calc(${defaultSize[0]}% - ${
                        expand ? gutterSize : 0 / 2
                    }px)`,
                }}
            >
                {children[0]}
            </div>
            <div
                className={styles['drag-vertical-bottom']}
                style={{
                    height: `calc(${defaultSize[1]}% - ${
                        expand ? gutterSize : 0 / 2
                    }px)`,
                }}
                hidden={isHidden}
            >
                {children[1]}
            </div>
        </Split>
    )
}

export default React.memo(DragVertical)
