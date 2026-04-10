import { createContext, useContext } from 'react'

export type PreviewDrawerGetContainer =
  | HTMLElement
  | (() => HTMLElement | null | undefined)
  | undefined

export const PreviewDrawerContainerContext = createContext<PreviewDrawerGetContainer>(undefined)

export const usePreviewDrawerContainer = () => useContext(PreviewDrawerContainerContext)
