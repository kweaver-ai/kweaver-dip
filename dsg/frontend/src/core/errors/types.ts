interface IMessageBase {
    [key: number]: string
}

export interface IErrorCodeMessage extends IMessageBase {}

export interface IHttpStatusMessage extends IMessageBase {}

interface IErrorBase {
    error: any
}

export interface IFormatError extends IErrorBase {}

export interface IGetErrorMessage extends IErrorBase {}
