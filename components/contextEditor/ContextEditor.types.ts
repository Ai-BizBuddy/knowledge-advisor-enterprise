export interface ContextEditorProps {
  knowledgeBaseId: string;
  initialContext?: string;
  onSave?: (context: string) => void;
}
