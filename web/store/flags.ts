export type Flag = keyof typeof defaultFlags

export type FeatureFlags = typeof defaultFlags

export const defaultFlags = {
  chub: false,
  slots: true,
  parser: false,
  events: false,
  pipeline: false,
  reporting: false,
} satisfies { [key: string]: boolean }
