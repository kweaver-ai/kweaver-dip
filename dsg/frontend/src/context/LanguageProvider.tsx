import React, {
    ReactNode,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react'
import { noop } from 'lodash'

interface ILanguageContext {
    language: string
    setLanguage: Dispatch<SetStateAction<string>>
}

interface ILanguageProvider {
    initLanguage: string
    children: ReactNode
}

export const LanguageContext = React.createContext<ILanguageContext>({
    language: 'zh-cn',
    setLanguage: noop,
})

export const LanguageProvider: React.FC<ILanguageProvider> = ({
    initLanguage = 'zh-cn',
    children,
}) => {
    const [language, setLanguage] = useState(initLanguage)
    const values = useMemo(
        () => ({ language, setLanguage }),
        [language, setLanguage],
    )

    return (
        <LanguageContext.Provider value={values}>
            {children}
        </LanguageContext.Provider>
    )
}
