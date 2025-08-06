"use client"
import { useState } from "react";

interface Props {
    options: string[];
    onChange: (selected: string[]) => void;
}

export default function KnowledgeSelect({ options, onChange }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);

    const toggleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value];

        setSelected(newSelected);
        onChange(newSelected);
    };

    const toggleAll = () => {
        const newSelected = selected.length === options.length ? [] : options;
        setSelected(newSelected);
        onChange(newSelected);
    };

    return (
        <div className="relative w-full max-w-xs">
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-left rounded-md text-gray-900 dark:text-gray-100"
            >
                {selected.length === options.length
                    ? "ทั้งหมด"
                    : `${selected.length} รายการ`}
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-700 rounded-md shadow-md max-h-60 overflow-y-auto">
                    <label className="flex items-center text-gray-900 dark:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <input
                            type="checkbox"
                            checked={selected.length === options.length}
                            onChange={toggleAll}
                            className="mr-2"
                        />
                        เลือกทั้งหมด
                    </label>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* default is not checked */}
                    {options.map((option) => (
                        <label
                            key={option}
                            className="flex items-center text-gray-900 dark:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(option)}
                                // onClick={() => toggleSelect(option)}
                                onChange={() => toggleSelect(option)}
                                className="mr-2"
                            />
                            {option}
                        </label>
                    ))}


                </div>
            )}
        </div>
    );
}
