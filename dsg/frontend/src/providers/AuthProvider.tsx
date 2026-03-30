import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    ReactNode,
} from 'react'
import PropTypes from 'prop-types'

interface AuthContextType {
    /** 是否正在加载 */
    loading: boolean
    /** 是否已认证 */
    authenticated: boolean
    /** 用户 ID */
    userId: string | null
    /** 设置加载状态 */
    setLoading: (loading: boolean) => void
    /** 设置认证状态 */
    setAuthenticated: (authenticated: boolean) => void
    /** 设置用户 ID */
    setUserId: (userId: string | null) => void
}

const AuthContext = createContext<AuthContextType>({
    loading: true,
    authenticated: false,
    userId: null,
    setLoading: () => {},
    setAuthenticated: () => {},
    setUserId: () => {},
})

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    const value = useMemo(
        () => ({
            loading,
            authenticated,
            userId,
            setLoading,
            setAuthenticated,
            setUserId,
        }),
        [loading, authenticated, userId],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
}

export const useAuthContext = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider')
    }
    return context
}

export default AuthProvider
