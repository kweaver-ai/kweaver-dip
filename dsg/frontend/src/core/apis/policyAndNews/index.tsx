import Cookies from 'js-cookie'
import requests from '@/utils/request'
import { INewsOrPolicItemQuery, INewsOrPolicListQuery } from './index.d'
import { formatError } from '@/core/errors'
// 新闻动态&政策依据
const { get, post, put, delete: del } = requests

export const getNewsOrPolicList = (params: INewsOrPolicListQuery) => {
    return get(`/api/configuration-center/v1/news-policy`, params)
}

export const delNewsOrPolic = (data: { id: string; type: number }) => {
    const { id, type } = data
    return del(`/api/configuration-center/v1/news-policy/${id}`, { type })
}

export const updateNewsOrPolic = (data) => {
    const { id, formData } = data
    return put(`/api/configuration-center/v1/news-policy/${id}`, formData)
}

export const createNewsOrPolicy = (data: FormData) => {
    return post(`/api/configuration-center/v1/news-policy`, data)
}

export const getNewsOrPolicDetail = (params: {
    id: string
    type: string
    status: string
}) => {
    return get(`/api/configuration-center/v1/news-policy/detail`, params)
}

export const getOssUrl = async (id: string) => {
    try {
        const response = await fetch(
            `/api/configuration-center/v1/news-policy/oss/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${
                        Cookies.get('af.oauth2_token') || ''
                    }`,
                },
            },
        )
        const blob = await response.blob()
        return URL.createObjectURL(blob)
    } catch (error) {
        formatError(error)
        return ''
    }
}

export const updateNewsOrPolicState = (data) => {
    const { id, status, type } = data
    return put(
        `/api/configuration-center/v1/news-policy/state?id=${id}&status=${status}&type=${type}`,
        data,
    )
}
