import __ from './locale'
import styles from './styles.module.less'

function Footer() {
    const handleClickUserAgreement = () => {
        window.open('/Agreement/UserAgreement/ServiceAgreement-CN.html')
    }
    const handleClickPrivacy = () => {
        window.open('/Agreement/Privacy/Privacy-CN.html')
    }
    return (
        <div className={styles.footerWrapper}>
            <div>{__('登录即表示同意')}</div>
            <div className={styles.link} onClick={handleClickUserAgreement}>
                {__('用户协议')}
            </div>
            {__('、')}
            <div className={styles.link} onClick={handleClickPrivacy}>
                {__('隐私政策')}
            </div>
        </div>
    )
}

export default Footer
