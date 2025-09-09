'use client';

import { Button, type ButtonProps } from 'flowbite-react';

export interface BaseButtonProps extends Omit<ButtonProps, 'color' | 'size'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gray' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const colorMap: Record<
  NonNullable<BaseButtonProps['variant']>,
  ButtonProps['color']
> = {
  primary: 'blue',
  secondary: 'light',
  danger: 'failure',
  ghost: 'gray',
  gray: 'gray',
  success: 'success',
};

export const BaseButton = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: BaseButtonProps) => {
  return (
    <Button
      color={colorMap[variant]}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
};

export default BaseButton;
