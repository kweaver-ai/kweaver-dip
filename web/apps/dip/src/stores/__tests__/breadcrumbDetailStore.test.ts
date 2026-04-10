import { describe, expect, it } from 'vitest'

import { useBreadcrumbDetailStore } from '../breadcrumbDetailStore'

describe('breadcrumbDetailStore', () => {
  it('setDetailBreadcrumb 写入与清空', () => {
    useBreadcrumbDetailStore.setState({ detail: null })

    useBreadcrumbDetailStore.getState().setDetailBreadcrumb({
      routeKey: 'r1',
      title: '标题',
      replaceAncestorRoutes: [{ key: 'a', name: '父级' }],
    })
    expect(useBreadcrumbDetailStore.getState().detail?.title).toBe('标题')
    expect(useBreadcrumbDetailStore.getState().detail?.replaceAncestorRoutes).toHaveLength(1)

    useBreadcrumbDetailStore.getState().setDetailBreadcrumb(null)
    expect(useBreadcrumbDetailStore.getState().detail).toBeNull()
  })
})
