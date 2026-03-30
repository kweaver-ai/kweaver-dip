import { useEffect, useState } from 'react'
import __ from './locale'
import styles from './styles.module.less'
import { getApplicationVersion } from '@/core'

function About() {
    // 版本号
    const [version, setVersion] = useState<string>()

    const getVersion = async () => {
        const res = await getApplicationVersion()
        let v = res?.version || ''
        if (v && res?.build_date) {
            v = `${v}-${res.build_date}`
        }
        setVersion(v)
    }

    useEffect(() => {
        getVersion()
    }, [])

    return (
        <div className={styles.aboutWrapper}>
            <div>{__('版本信息 ${version}', { version })}</div>
            <div className={styles.colLine} />
            <div>{__('沪ICP备09089247号-9')}</div>
        </div>
    )
}

export default About
