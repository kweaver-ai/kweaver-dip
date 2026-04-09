import { create } from 'zustand'
import type { BknEntry, ChannelConfig, DigitalHumanDetail, DigitalHumanSkill } from '@/apis'

export type DigitalHumanUiMode = 'create' | 'edit' | 'view'

type DigitalHumanDetailForUI = Omit<DigitalHumanDetail, 'skills'> & {
  /** UI 使用技能对象列表（由 `getDigitalHumanSkills` 加载并渲染） */
  skills?: DigitalHumanSkill[]
}

/** 编辑态基础信息（对齐 DigitalHumanDetail 中的 name / description / creature / soul） */
export type DigitalHumanBasic = Pick<DigitalHumanDetail, 'name' | 'creature' | 'soul'>

export type { BknEntry, ChannelConfig } from '@/apis'

export interface DigitalHumanState {
  /** 当前页面编辑状态：新建/编辑/详情 */
  uiMode: DigitalHumanUiMode

  /** 当前正在配置的数字员工 ID（与 API 一致为 string） */
  digitalHumanId?: string

  /** 原始详情快照（UI 侧补齐 `skills` 为对象列表） */
  detail: DigitalHumanDetailForUI | null

  /** 基本信息 */
  basic: DigitalHumanBasic

  /** 知识源列表（对齐 DigitalHumanExtension.bkn） */
  bkn: BknEntry[]

  /** 技能列表（用于渲染与编辑） */
  skills: DigitalHumanSkill[]

  /** 已绑定的渠道凭证（对齐 DigitalHumanExtension.channel，单通道） */
  channel?: ChannelConfig

  /** 标记是否有未发布改动（后续可用于提示） */
  dirty: boolean

  /**
   * 管理员配置页进入「编辑」时快照的名称，用于顶栏/面包屑；表单内改名不更新该字段，保存成功或退出编辑后清除。
   */
  frozenDisplayNameForEdit: string | null

  /** 绑定当前数字员工，并根据详情初始化数据 */
  bindDigitalHuman: (
    digitalHuman: DigitalHumanDetail | null,
    agentSkills?: DigitalHumanSkill[],
  ) => void

  /** 重置 dirty 状态（不改变数据内容） */
  resetDirtyState: () => void

  /** 重置所有数据到原始详情 */
  resetAllToDetail: () => void

  /** 设置当前页面编辑状态 */
  setUiMode: (mode: DigitalHumanUiMode) => void

  /** 更新基础信息 */
  updateBasic: (patch: Partial<DigitalHumanBasic>) => void
  /** 批量覆盖知识源列表 */
  updateBkn: (patches: BknEntry[]) => void
  /** 删除单个知识源（按 url） */
  deleteBkn: (url: string) => void
  /** 更新技能目录名列表（整组替换） */
  updateSkills: (patches: DigitalHumanSkill[]) => void
  /** 删除单个技能（按目录名） */
  deleteSkill: (skillDirectoryName: string) => void
  /** 更新渠道配置 */
  updateChannel: (channel: ChannelConfig) => void
  /** 清除渠道配置 */
  deleteChannel: () => void
  /** 重置当前数据 */
  reset: () => void
}

const defaultBasic: DigitalHumanBasic = {
  name: '',
  creature: '',
  soul: '',
}

const defaultSkills: DigitalHumanSkill[] = []

const defaultBkn: BknEntry[] = []

export const useDigitalHumanStore = create<DigitalHumanState>()((set) => ({
  uiMode: 'create',
  digitalHumanId: undefined,
  basic: defaultBasic,
  bkn: defaultBkn,
  skills: defaultSkills,
  channel: undefined,
  detail: null,
  dirty: false,
  frozenDisplayNameForEdit: null,

  setUiMode: (mode) =>
    set((state) => {
      if (mode === 'edit') {
        const name = state.basic.name.trim()
        return { uiMode: mode, frozenDisplayNameForEdit: name || null }
      }
      return { uiMode: mode, frozenDisplayNameForEdit: null }
    }),

  bindDigitalHuman: (digitalHuman, agentSkills) => {
    if (!digitalHuman) {
      set({
        digitalHumanId: undefined,
        basic: defaultBasic,
        bkn: defaultBkn,
        skills: defaultSkills,
        channel: undefined,
        dirty: false,
        detail: null,
        frozenDisplayNameForEdit: null,
      })
      return
    }

    set((state) => {
      const name = digitalHuman.name?.trim() ?? ''
      const nextSkills = agentSkills ?? defaultSkills
      const next = {
        digitalHumanId: digitalHuman.id,
        basic: {
          name: digitalHuman.name ?? '',
          creature: digitalHuman.creature ?? '',
          soul: digitalHuman.soul ?? '',
        },
        bkn: digitalHuman.bkn ?? defaultBkn,
        skills: nextSkills,
        channel: digitalHuman.channel,
        // detail 快照用于 resetAllToDetail：skills 则应始终是 UI 可用的对象列表
        detail: {
          ...digitalHuman,
          skills: nextSkills,
        } as DigitalHumanDetailForUI,
        dirty: false,
      }
      if (state.uiMode === 'edit' && state.frozenDisplayNameForEdit === null && name) {
        return { ...next, frozenDisplayNameForEdit: name }
      }
      return next
    })
  },

  resetDirtyState: () => {
    set({ dirty: false })
  },

  updateBasic: (patch) =>
    set((state) => ({
      basic: { ...state.basic, ...patch },
      dirty: true,
    })),

  updateBkn: (patches) =>
    set(() => ({
      bkn: patches,
      dirty: true,
    })),

  deleteBkn: (url) =>
    set((state) => ({
      bkn: state.bkn.filter((k) => k.url !== url),
      dirty: true,
    })),

  updateSkills: (patches) =>
    set(() => ({
      skills: patches,
      dirty: true,
    })),

  deleteSkill: (skillName) =>
    set((state) => ({
      skills: state.skills.filter((s) => s.name !== skillName),
      dirty: true,
    })),

  updateChannel: (channel) =>
    set({
      channel,
      dirty: true,
    }),

  deleteChannel: () =>
    set({
      channel: undefined,
      dirty: true,
    }),

  resetAllToDetail: () =>
    set((state) => ({
      basic: {
        name: state.detail?.name ?? '',
        creature: state.detail?.creature ?? '',
        soul: state.detail?.soul ?? '',
      },
      bkn: state.detail?.bkn ?? defaultBkn,
      skills: state.detail?.skills ?? defaultSkills,
      channel: state.detail?.channel ?? undefined,
      dirty: false,
    })),

  reset: () =>
    set(() => ({
      digitalHumanId: undefined,
      basic: defaultBasic,
      bkn: defaultBkn,
      skills: defaultSkills,
      channel: undefined,
      dirty: false,
      detail: null,
      frozenDisplayNameForEdit: null,
    })),
}))
