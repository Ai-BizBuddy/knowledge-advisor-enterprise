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

  const handlePreview = () => {
    if (document.fileUrl) {
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
      {showMiniPreview && document.fileUrl && (
        <MiniDocumentPreview
          document={convertToDeepSearchData(document)}
          isOpen={showMiniPreview}
          onClose={handleCloseMiniPreview}
          onExpandToFullScale={handleExpandToFullScale}
        />
      )}

      {/* Full Scale Preview Modal */}
      {showFullPreview && document.fileUrl && (
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
