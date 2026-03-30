import { useEffect, useRef, memo } from 'react'
import __ from './locale'
import styles from './styles.module.less'
import { getPlatformNumber } from '@/utils'

function Content() {
    const platform = getPlatformNumber()

    const iframeRef = useRef(null)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            window.location.href = `/af/api/session/v1/login?state=${new Date().getTime()}`
        }
    }, [])

    return (
        <iframe
            src={`/af/api/session/v1/login?state=${new Date().getTime()}&platform=${platform}`}
            ref={iframeRef}
            className={styles.iframe}
            title={__('登录')}
        />
    )
}

export default memo(Content)
