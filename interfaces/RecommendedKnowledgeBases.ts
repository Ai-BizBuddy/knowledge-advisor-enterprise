interface IRecommendation {
    title: string
    summary: string
    confidenceScore?: number // optional: AI confidence %
}

interface IProps {
    items: IRecommendation[]
}

export type { IRecommendation, IProps }