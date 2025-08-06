import { IStatusCardProps } from "@/interfaces/StatusCard";
import { THEME_CONSTANTS } from "@/constants";

/**
 * Knowledge icon component
 */
const KnowledgeIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 4H8a2 2 0 00-2 2v14l6-3 6 3V6a2 2 0 00-2-2z"
        />
    </svg>
);

/**
 * Documents icon component
 */
const DocumentsIcon = () => (
    <svg
        className="w-6 h-6 text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            fillRule="evenodd"
            d="M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7Z"
            clipRule="evenodd"
        />
    </svg>
);

/**
 * Queries icon component
 */
const QueriesIcon = () => (
    <svg
        className="w-6 h-6 text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            fillRule="evenodd"
            d="M12 2a7 7 0 0 0-7 7 3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1V9a5 5 0 1 1 10 0v7.083A2.919 2.919 0 0 1 14.083 19H14a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h1a2 2 0 0 0 1.732-1h.351a4.917 4.917 0 0 0 4.83-4H19a3 3 0 0 0 3-3v-2a3 3 0 0 0-3-3 7 7 0 0 0-7-7Zm1.45 3.275a4 4 0 0 0-4.352.976 1 1 0 0 0 1.452 1.376 2.001 2.001 0 0 1 2.836-.067 1 1 0 1 0 1.386-1.442 4 4 0 0 0-1.321-.843Z"
            clipRule="evenodd"
        />
    </svg>
);

/**
 * Response Time icon component
 */
const ResponseTimeIcon = () => (
    <svg
        className="w-6 h-6 text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            fillRule="evenodd"
            d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
            clipRule="evenodd"
        />
    </svg>
);

/**
 * Dashboard status cards configuration
 */
export const getStatusCards = (): IStatusCardProps[] => [
    {
        name: "Knowledge",
        value: "6",
        icon: <KnowledgeIcon />,
        color: THEME_CONSTANTS.COLORS.PRIMARY
    },
    {
        name: "Documents",
        value: "3",
        icon: <DocumentsIcon />,
        color: "bg-indigo-600"
    },
    {
        name: "Queries",
        value: "2",
        icon: <QueriesIcon />,
        color: "bg-amber-600"
    },
    {
        name: "Response Time",
        value: "1.2s",
        icon: <ResponseTimeIcon />,
        color: "bg-green-600"
    }
];
