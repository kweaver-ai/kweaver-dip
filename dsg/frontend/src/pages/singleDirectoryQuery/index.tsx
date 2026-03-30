import styles from '../styles.module.less'
import {
    RouterStack,
    useRouteStack,
} from '@/components/SingleDirectoryQuery/RouterStack'

const SingleDirectoryQueryPage = () => {
    const { current: CurrentPage, stack, ...rest } = useRouteStack()
    return (
        // eslint-disable-next-line react/jsx-no-constructed-context-values
        <RouterStack.Provider value={{ stack, ...rest }}>
            <div className={styles.architectureWrapper}>
                <CurrentPage />
            </div>
        </RouterStack.Provider>
    )
}

export default SingleDirectoryQueryPage
