interface IKnowledgeBase {
    title: string
    updatedAt: string
    summary?: string
}

interface IRecentKnowledgeBasesCardProps {
    items: IKnowledgeBase[]
}

export type { IKnowledgeBase, IRecentKnowledgeBasesCardProps };