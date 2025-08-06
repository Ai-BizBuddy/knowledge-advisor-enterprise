"use client";
import { UploadDocument } from "@/components";
import { useLoading } from "@/contexts/LoadingContext";
import { useEffect, useState } from "react";


export default function DocumentsPage() {
    const { setLoading } = useLoading();
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        setLoading(false);
    }, []);

    return (
        <div>
            <div className="flex items-center justify-between mb-6 gap-4 sm:gap-0">
                <div className="flex flex-col">
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
                    <p className="text-xs sm:text-base text-gray-500 dark:text-gray-400">Search and manage your enterprise documents with AI-powered semantic search</p>
                </div>
                <div>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md" onClick={() => setOpenModal(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">
                            Add Document
                        </span>
                    </button>
                </div>
            </div>

            <div>

            </div>

            <div>

            </div>
            <UploadDocument isOpen={openModal} onClose={() => setOpenModal(false)} />
        </div>
    );
}