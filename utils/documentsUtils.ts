import { Document } from "@/data/documentsData";

export const getFileIcon = (type: string): string => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes("pdf")) return "📄";
    if (normalizedType.includes("doc") || normalizedType.includes("word")) return "📝";
    if (normalizedType.includes("xlsx") || normalizedType.includes("xls") || normalizedType.includes("excel")) return "📊";
    if (normalizedType.includes("txt") || normalizedType.includes("text")) return "📄";
    if (normalizedType.includes("md") || normalizedType.includes("markdown")) return "📄";
    if (normalizedType.includes("ppt") || normalizedType.includes("powerpoint")) return "📊";
    if (normalizedType.includes("png") || normalizedType.includes("jpg") || normalizedType.includes("jpeg")) return "�️";
    return "📄";
};

export const sortDocuments = (
    docs: Document[],
    sortBy: string,
    sortOrder: "asc" | "desc"
): Document[] => {
    return [...docs].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortBy) {
            case "Name":
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case "Date":
                aValue = new Date(a.date).getTime();
                bValue = new Date(b.date).getTime();
                break;
            case "Size":
                // Convert size to bytes for comparison
                aValue =
                    parseFloat(a.size) *
                    (a.size.includes("MB")
                        ? 1024 * 1024
                        : a.size.includes("KB")
                            ? 1024
                            : 1);
                bValue =
                    parseFloat(b.size) *
                    (b.size.includes("MB")
                        ? 1024 * 1024
                        : b.size.includes("KB")
                            ? 1024
                            : 1);
                break;
            case "Type":
                aValue = a.type.toLowerCase();
                bValue = b.type.toLowerCase();
                break;
            case "Uploaded By":
                aValue = a.uploadedBy.toLowerCase();
                bValue = b.uploadedBy.toLowerCase();
                break;
            default:
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
        }

        if (aValue < bValue) {
            return sortOrder === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortOrder === "asc" ? 1 : -1;
        }
        return 0;
    });
};

export const getTabCounts = (documents: Document[]) => {
    const counts = {
        All: documents.length,
        Processed: documents.filter((doc) => doc.source.toLowerCase() === "processed").length,
        Processing: documents.filter((doc) => doc.source.toLowerCase() === "processing").length,
        Failed: documents.filter((doc) => doc.source.toLowerCase() === "failed").length,
    };
    return counts;
};

export const filterDocuments = (
    documents: Document[],
    searchTerm: string,
    activeTab: string
): Document[] => {
    return documents.filter((doc) => {
        const matchesSearch =
            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab =
            activeTab === "All" ||
            doc.source.toLowerCase() === activeTab.toLowerCase();
        return matchesSearch && matchesTab;
    });
};
