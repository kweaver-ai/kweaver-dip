import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { ResourceType } from './const'

type IResourcesCatlogContext = {
    mountResourceData: any
    setMountResourceData: (item: any) => void
    firstDepartmentInfo: any
    setFirstDepartmentInfo: (item: any) => void
    mapFieldsData: any
    setMapFieldsData: (item: any) => void
    emptyCatalogFields: any
    setEmptyCatalogFields: (item: any) => void
    emptyCatalogMapFields: any
    setEmptyCatalogMapFields: (item: any) => void
    [key: string]: any
}

const ResourcesCatlogContext = createContext<IResourcesCatlogContext>({
    mountResourceData: [],
    setMountResourceData: () => {},
    firstDepartmentInfo: [],
    setFirstDepartmentInfo: () => {},
    labelList: [],
    setLabelList: () => {},
    mapFieldsData: [],
    setMapFieldsData: () => {},
    columnData: [],
    setColumnData: () => {},
    dataViewFields: [],
    setDataViewFields: () => {},
    emptyCatalogMapFields: [],
    setEmptyCatalogMapFields: () => {},
    emptyCatalogFields: [],
    setEmptyCatalogFields: () => {},
    showUpdateAlert: false,
    setShowUpdateAlert: () => {},
    isFileRescType: false,
    setIsFileRescType: () => {},
})

export const useResourcesCatlogContext = () =>
    useContext<IResourcesCatlogContext>(ResourcesCatlogContext)

export const ResourcesCatlogProvider = ({
    children,
}: {
    children: ReactNode
}) => {
    const [labelList, setLabelList] = useState<any>([])
    const [mountResourceData, setMountResourceData] = useState<any>([])
    const [firstDepartmentInfo, setFirstDepartmentInfo] = useState<any>([])
    const [mapFieldsData, setMapFieldsData] = useState<any>([])
    const [emptyCatalogFields, setEmptyCatalogFields] = useState<any>([])
    const [emptyCatalogMapFields, setEmptyCatalogMapFields] = useState<any>([])
    const [columnData, setColumnData] = useState<any>([])
    const [dataViewFields, setDataViewFields] = useState<any>([])
    const [showUpdateAlert, setShowUpdateAlert] = useState<boolean>(true)
    const [isFileRescType, setIsFileRescType] = useState<boolean>(false)

    useEffect(() => {
        setIsFileRescType(
            mountResourceData?.length > 0 &&
                mountResourceData.every(
                    (o) => o.resource_type === ResourceType.File,
                ),
        )
    }, [mountResourceData])

    const values = useMemo(
        () => ({
            mountResourceData,
            setMountResourceData,
            firstDepartmentInfo,
            setFirstDepartmentInfo,
            mapFieldsData,
            setMapFieldsData,
            emptyCatalogFields,
            setEmptyCatalogFields,
            emptyCatalogMapFields,
            setEmptyCatalogMapFields,
            showUpdateAlert,
            setShowUpdateAlert,
            labelList,
            setLabelList,
            isFileRescType,
            setIsFileRescType,
            columnData,
            setColumnData,
            dataViewFields,
            setDataViewFields,
        }),
        [
            mountResourceData,
            setMountResourceData,
            firstDepartmentInfo,
            setFirstDepartmentInfo,
            mapFieldsData,
            setMapFieldsData,
            emptyCatalogFields,
            setEmptyCatalogFields,
            emptyCatalogMapFields,
            setEmptyCatalogMapFields,
            showUpdateAlert,
            setShowUpdateAlert,
            labelList,
            setLabelList,
            isFileRescType,
            setIsFileRescType,
            columnData,
            setColumnData,
            dataViewFields,
            setDataViewFields,
        ],
    )

    return (
        <ResourcesCatlogContext.Provider value={values}>
            {children}
        </ResourcesCatlogContext.Provider>
    )
}
