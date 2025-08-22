"use client";
import React, { useState, useRef, JSX, useEffect } from "react";

interface UploadDocumentProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadDocument({
  isOpen,
  onClose,
}: UploadDocumentProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];
  const maxFiles = 10;
  const maxSize = 10 * 1024 * 1024; // 10MB

  // svg icons for file types .pdf, .doc, .docx, .txt, .md, .xlsx, .xls
  const iconsFileType: Record<
    "pdf" | "doc" | "docx" | "txt" | "md" | "xlsx" | "xls",
    JSX.Element
  > = {
    pdf: (
      <svg
        className="h-6 w-6 text-red-500"
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
    ),
    doc: (
      <svg
        className="h-6 w-6 text-blue-500"
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
    ),
    docx: (
      <svg
        className="h-6 w-6 text-blue-500"
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
    ),
    txt: (
      <svg
        className="h-6 w-6 text-gray-500"
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
    ),
    md: (
      <svg
        className="h-6 w-6 text-green-500"
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
    ),
    xlsx: (
      <svg
        className="h-6 w-6 text-green-400"
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
    ),
    xls: (
      <svg
        className="h-6 w-6 text-green-400"
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
    ),
    // Add more icons as needed
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    if (arr.length + selectedFiles.length > maxFiles) {
      setError(`You can upload up to ${maxFiles} files.`);
      return;
    }
    for (const file of arr) {
      if (
        !supportedTypes.includes(file.type) &&
        !/\.(pdf|doc|docx|txt|md|xlsx|xls)$/i.test(file.name)
      ) {
        setError("Unsupported file type: " + file.name);
        return;
      }
      if (file.size > maxSize) {
        setError(`File ${file.name} exceeds 10MB limit.`);
        return;
      }
    }
    setSelectedFiles((prev) => [...prev, ...arr]);
    setError("");
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onBrowse = () => {
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  useEffect(() => {
    setTimeout(() => {
      setError("");
    }, 3000);
  }, [error]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl rounded-xl border border-gray-200 bg-white text-gray-900 shadow-2xl shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white">
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {" "}
              Upload Document{" "}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add documents to Document Library
            </p>
          </div>
          <div className="p-6">
            <button
              className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-white"
              onClick={() => {
                onClose();
                setSelectedFiles([]); // Clear selected files on close
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Upload Document File area */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {selectedFiles.length > 0 ? (
            <>
              <div className="mt-4 flex flex-col gap-2 text-left">
                <p className="mb-2 font-semibold">
                  Selected files: ({selectedFiles.length})
                </p>
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      {/* icon file type */}
                      {(() => {
                        const ext = file.name
                          .split(".")
                          .pop()
                          ?.toLowerCase() as
                          | keyof typeof iconsFileType
                          | undefined;
                        return ext && iconsFileType[ext]
                          ? iconsFileType[ext]
                          : null;
                      })()}

                      <div>
                        <p className="max-w-xs truncate text-sm font-medium text-gray-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>

                    <button
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      onClick={() =>
                        setSelectedFiles((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>
                  </div>
                  // <li key={idx}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                ))}
                {/* check max file and max file size */}
                {selectedFiles.length < maxFiles && (
                  <div
                    className="relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-600 p-8 text-center transition-all duration-300 hover:border-gray-500"
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={onBrowse}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls"
                      className="hidden"
                      onChange={onFileChange}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-medium text-blue-400 hover:text-blue-300">
                      + Add more files
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              className="relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-600 p-8 text-center transition-all duration-300 hover:border-gray-500 hover:bg-blue-50 dark:hover:bg-gray-800"
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={onBrowse}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls"
                className="hidden"
                onChange={onFileChange}
              />
              <div className="space-y-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                  <svg
                    className="h-8 w-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                  Upload Documents
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supported formats: PDF, DOC, DOCX, TXT, MD, XLSX, XLS
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Max 10 files, 10MB each
                </p>
              </div>
            </div>
          )}
        </div>
        {selectedFiles.length > 0 && (
          <div className="flex items-start justify-between border-t border-gray-200 p-6 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedFiles.length} of {maxFiles} files selected
            </span>
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              onClick={() => {
                // Handle file upload logic here
                onClose();
              }}
            >
              Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
