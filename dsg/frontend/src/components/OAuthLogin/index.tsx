import Content from './Content'
import Footer from './Footer'
import About from './About'
import styles from './styles.module.less'

function OAuthLogin() {
    return (
        <div className={styles.container}>
            <div className={styles['background-container']} />
            <div className={styles.wrapper}>
                <div className={styles.oem}>
                    <div className={styles['oem-img']} />
                </div>
                <div className={styles.index}>
                    <div className={styles['wrap-header-bar']} />
                    <div className={styles['wrap-login']}>
                        <Content />
                    </div>
                    <div className={styles['wrap-footer']}>
                        <Footer />
                        <About />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OAuthLogin
