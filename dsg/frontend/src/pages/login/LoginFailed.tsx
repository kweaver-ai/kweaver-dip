import { Button } from 'antd'
import noRole from '@/assets/noRole.png'
import logo from '@/assets/logo2.svg'
import styles from '../styles.module.less'
import __ from '../locale'
import { getActualUrl } from '@/utils'

function LoginFailed() {
    const handleReturnLoginPage = () => {
        window.location.href = getActualUrl('/')
    }

    return (
        <div className={styles.loginFailed}>
            <img
                height="24px"
                width="123px"
                src={logo}
                alt="AnyFabric"
                aria-hidden
                className={styles.logo}
                onClick={handleReturnLoginPage}
            />
            <img
                height="280x"
                width="480px"
                src={noRole}
                alt="Login Failed"
                aria-hidden
            />
            <div className={styles.tips}>
                {__('您当前使用的账号未配置任何权限，无法登录')}
            </div>
            <Button className={styles.button} onClick={handleReturnLoginPage}>
                {__('返回登录页面')}
            </Button>
        </div>
    )
}

export default LoginFailed
