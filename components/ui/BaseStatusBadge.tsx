'use client';

import { Badge } from 'flowbite-react';
import React from 'react';

export interface BaseStatusBadgeProps {
  status: 'waiting' | 'uploading' | 'success' | 'error' | 'cancelled' | 'processing' | 'ready' | 'active' | 'inactive';
  children?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const statusColorMap: Record<BaseStatusBadgeProps['status'], string> = {
  waiting: 'gray',
  uploading: 'blue',
  processing: 'blue',
  success: 'green',
  ready: 'green',
  active: 'green',
  error: 'red',
  cancelled: 'gray',
  inactive: 'gray',
};

/**
 * Unified Status Badge component using Flowbite with consistent status colors
 */
export const BaseStatusBadge: React.FC<BaseStatusBadgeProps> = ({
  status,
  children,
  size = 'sm',
  className = '',
}) => {
  const color = statusColorMap[status];
  
  return (
    <Badge 
      color={color} 
      size={size}
      className={className}
    >
      {children || status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
