"use client";
import { useState } from "react";
import {
  DocumentSearchResult,
  DeepSearchData,
} from "@/interfaces/DeepSearchTypes";
import { DocumentCard } from "../DocumentCard";
import { MiniDocumentPreview } from "../MiniDocumentPreview";
import { DocumentPreview } from "../DocumentPreview";

interface DocumentCardWithPreviewProps {
  document: DocumentSearchResult;
  onClick?: (document: DocumentSearchResult) => void;
  className?: string;
}

export const DocumentCardWithPreview = ({
  document,
  onClick,
  className = "",
}: DocumentCardWithPreviewProps) => {
  const [showMiniPreview, setShowMiniPreview] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Convert DocumentSearchResult to DeepSearchData for preview
  const convertToDeepSearchData = (
    doc: DocumentSearchResult,
  ): DeepSearchData => ({
    id: doc.id,
    name: doc.title,
    content: doc.content,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    uploadDate: doc.uploadDate,
    knowledgeName: doc.knowledgeName || "",
    fileUrl: doc.fileUrl,
  });

  // Check if file type is supported for preview
  const isSupportedFileType = (fileType: string): boolean => {
    const supportedTypes = ["pdf", "doc", "docx", "txt", "md", "xlsx", "xls"];
    return supportedTypes.includes(fileType.toLowerCase());
  };

  const handlePreview = () => {
    if (document.fileUrl && isSupportedFileType(document.fileType)) {
      setShowMiniPreview(true);
    }
  };

  const handleExpandToFullScale = () => {
    setShowMiniPreview(false);
    setShowFullPreview(true);
  };

  const handleCloseMiniPreview = () => {
    setShowMiniPreview(false);
  };

  const handleCloseFullPreview = () => {
    setShowFullPreview(false);
  };

  const handleToggleFullScale = () => {
    setShowFullPreview(!showFullPreview);
    setShowMiniPreview(showFullPreview);
  };

  return (
    <>
      <DocumentCard
        {...document}
        onPreview={handlePreview}
        onClick={onClick}
        className={className}
      />

      {/* Mini Preview Modal */}
      {showMiniPreview &&
        document.fileUrl &&
        isSupportedFileType(document.fileType) && (
          <MiniDocumentPreview
            document={convertToDeepSearchData(document)}
            isOpen={showMiniPreview}
            onClose={handleCloseMiniPreview}
            onExpandToFullScale={handleExpandToFullScale}
          />
        )}

      {/* Full Scale Preview Modal */}
      {showFullPreview &&
        document.fileUrl &&
        isSupportedFileType(document.fileType) && (
          <DocumentPreview
            document={convertToDeepSearchData(document)}
            isOpen={showFullPreview}
            onClose={handleCloseFullPreview}
            isFullScale={true}
            onToggleFullScale={handleToggleFullScale}
          />
        )}
    </>
  );
};

export default DocumentCardWithPreview;
