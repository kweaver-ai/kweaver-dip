import React, { FC, memo, useEffect, useRef, useState } from 'react'
import { Typography } from 'antd'
import { useDebounce, useSize, useUpdateEffect } from 'ahooks'

const { Text } = Typography

const EllipsisiMiddle: FC<{ children: string }> = ({ children }) => {
    const textRef = useRef<any>()
    const size = useSize(textRef)
    const [count, setCount] = useState<number>(0)
    const debouncedSuffix = useDebounce(count, { wait: 50 })
    const [text, setText] = useState<{ start: string; end: string }>({
        start: '',
        end: '',
    })

    useEffect(() => {
        setCount(Math.ceil((size?.width ?? 0) / 24))
    }, [size])
    useUpdateEffect(() => {
        if (children) {
            if (debouncedSuffix > children.length) {
                setText({
                    start: children,
                    end: '',
                })
            } else {
                const start = children
                    .slice(0, children.length - debouncedSuffix)
                    .trim()
                const end = children.slice(-debouncedSuffix).trim()
                setText({
                    start,
                    end,
                })
            }
        }
    }, [debouncedSuffix, children])

    return (
        <Text
            style={{ width: '100%', color: 'inherit' }}
            ellipsis={{ suffix: text.end }}
            ref={textRef}
        >
            {text.start}
        </Text>
    )
}

export default memo(EllipsisiMiddle)
