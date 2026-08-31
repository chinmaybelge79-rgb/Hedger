import { useState } from 'react';
import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
}

export function Avatar({ className, src, alt, fallback, size = 'default', shape = 'circle', ...props }: AvatarProps) {
  const sizeStyles = {
    xs: 'w-[24px] h-[24px] text-[10px]',
    sm: 'w-[32px] h-[32px] text-[12px]',
    default: 'w-[40px] h-[40px] text-[14px]',
    lg: 'w-[48px] h-[48px] text-[16px]',
    xl: 'w-[56px] h-[56px] text-[18px]',
  };

  const shapeStyles = {
    circle: 'rounded-full',
    square: 'rounded-card',
  };

  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center overflow-hidden bg-fog font-medium text-graphite',
        sizeStyles[size],
        shapeStyles[shape],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || ''}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{fallback || alt?.charAt(0).toUpperCase() || '?'}</span>
      )}
    </div>
  );
}