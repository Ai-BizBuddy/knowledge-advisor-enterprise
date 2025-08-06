"use client";

import { useState } from "react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description: string; status: string }) => void;
}

export default function CreateKnowledgeBaseModal({ isOpen, onClose, onSubmit }: Props) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Draft (Not yet active)");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl shadow-lg w-full max-w-md p-6 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-lg font-bold">Create Knowledge Base</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Set up a new knowledge repository</p>
                    </div>
                    <button
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit({ name, description, status });
                        onClose();
                    }}
                    className="space-y-4"
                >
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">Knowledge Base Name *</label>
                        <input
                            required
                            className="w-full rounded-md px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Customer Support Knowledge Base"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Description Field */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">Description *</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full rounded-md px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Describe what this knowledge base will contain and its purpose..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Status Field */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">Initial Status</label>
                        <select
                            className="w-full rounded-md px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option>Draft (Not yet active)</option>
                            <option>Active</option>
                            <option>Paused</option>
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            You can change this status later from the knowledge base settings.
                        </p>
                    </div>

                    {/* Footer buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
