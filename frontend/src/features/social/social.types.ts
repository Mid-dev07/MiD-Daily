export type SocialProvider = 'INSTAGRAM'

export interface SocialMetricPoint {
  metric: string
  value: number
  recordedAt: string
}

export interface SocialAccountSummary {
  provider: SocialProvider
  accountId: string
  username?: string
  followers?: number
  reach?: number
  impressions?: number
  profileViews?: number
  engagementRate?: number
  updatedAt: string
}

export interface SocialMediaSummary {
  id: string
  provider: SocialProvider
  permalink?: string
  caption?: string
  mediaType?: string
  publishedAt?: string
  likes?: number
  comments?: number
  saves?: number
  shares?: number
  reach?: number
  views?: number
}
