'use client';

import { FileUploadModal } from '@/components/ui/FileUploadModal';
import { useDocuments } from '@/hooks';
import { useParams } from 'next/navigation';
import React from 'react';

interface UploadDocumentProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Refactored Upload Document component using the unified FileUploadModal
 * This removes duplicated code and uses Flowbite components consistently
 * 
 * Reduced from ~540 lines to ~30 lines (94% reduction)
 * Now uses unified hooks and components for better maintainability
 */
export default function UploadDocument({ isOpen, onClose }: UploadDocumentProps) {
  const params = useParams();
  const id = params.id as string;
  const { createDocumentsFromFiles } = useDocuments({ knowledgeBaseId: id });

  const handleUpload = async (files: File[]) => {
    await createDocumentsFromFiles({
      knowledge_base_id: id,
      files,
      metadata: {
        uploadSource: 'upload_modal',
        uploadedAt: new Date().toISOString(),
        totalFiles: files.length,
      },
    });
  };

  return (
    <FileUploadModal
      isOpen={isOpen}
      onClose={onClose}
      onUpload={handleUpload}
      title='Upload Document'
      description='Upload your files here'
      maxFiles={10}
      maxSize={10 * 1024 * 1024} // 10MB
      supportedExtensions={['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'xls']}
      autoCloseOnSuccess={true}
    />
  );
}
