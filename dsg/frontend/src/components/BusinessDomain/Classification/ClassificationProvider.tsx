import { createContext, useContext, useMemo } from 'react'

interface ClassificationContextProps {
    selectedAttribute: any
    setSelectedAttribute: (attribute: any) => void
    isEmpty: boolean
    updateEmptyStatus: (status: boolean) => void
}

const ClassificationContext = createContext<ClassificationContextProps>({
    selectedAttribute: {},
    setSelectedAttribute: () => {},
    isEmpty: false,
    updateEmptyStatus: () => {},
})

const useClassificationContext = () => {
    return useContext(ClassificationContext)
}

const ClassificationContextProvider = ClassificationContext.Provider

export { useClassificationContext, ClassificationContextProvider }
