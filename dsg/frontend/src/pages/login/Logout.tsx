import { useEffect } from 'react'
import Cookies from 'js-cookie'
import { Spin } from 'antd'
import styles from '../styles.module.less'
import { getActualUrl, getPlatformPrefix } from '@/utils'
import { tokenManager } from '@/utils/tokenManager'

function Logout() {
    useEffect(() => {
        tokenManager.clearAll()
        localStorage.setItem('logout_event', 'logout')
        setTimeout(() => {
            window.location.href = getActualUrl('/')
        }, 100)
    }, [])

    return (
        <div className={styles.loginSuccess}>
            <Spin />
        </div>
    )
}

export default Logout
