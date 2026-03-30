import { useIntl } from 'react-intl'
import { PrimitiveType, FormatXMLElementFn } from 'intl-messageformat'

export interface IFormatMessageOption {
    defaultMessage?: string
    description?: string | object
}

export type IFormatValues = Record<
    string,
    PrimitiveType | FormatXMLElementFn<string, string>
>

export type ILang = (
    id: string,
    option?: IFormatMessageOption,
    values?: IFormatValues,
) => string

export const useFormatMessage = () => {
    const intl = useIntl()
    return (
        id: string,
        option?: IFormatMessageOption,
        values?: IFormatValues,
    ) => intl.formatMessage({ id, ...option }, values)
}
