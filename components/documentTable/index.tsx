"use client";
import { useState } from "react";
import Image from "next/image";

interface Document {
  name: string;
  size: string;
  type: string;
  date: string;
  status: string;
  uploadedBy: string;
  avatar: string;
}

interface DocumentTableProps {
  documents: Document[];
  onSelect?: (index: number) => void;
}

export default function DocumentTable({
  documents,
  onSelect,
}: DocumentTableProps) {
  const [selected, setSelected] = useState<number>();

  const toggleSelected = (index: number) => {
    setSelected((prev) => (prev === index ? undefined : index));
    if (onSelect) {
      onSelect(index);
    }
  };

  return (
    <div className="overflow-x-auto rounded-t-lg border border-gray-200 shadow-sm dark:border-gray-700">
      <table className="min-w-full text-left text-sm text-gray-700 dark:text-gray-300">
        <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3">
              {/* <input type="checkbox" disabled /> */}
            </th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Uploaded By</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, index) => (
            <tr
              key={index}
              className={`cursor-pointer border-b dark:border-gray-700 ${
                selected === index
                  ? "bg-blue-50 dark:bg-gray-700"
                  : "bg-white dark:bg-gray-900"
              }`}
              onClick={() => toggleSelected(index)}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected === index}
                  onChange={() => toggleSelected(index)}
                />
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900 dark:text-white">
                  {doc.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {doc.size} • {doc.type}
                </div>
              </td>
              <td className="px-4 py-3">{doc.date}</td>
              <td className="px-4 py-3">{doc.status}</td>
              <td className="flex items-center gap-2 px-4 py-3">
                <Image
                  src={doc.avatar}
                  alt={doc.uploadedBy}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full"
                />
                <span>{doc.uploadedBy}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
