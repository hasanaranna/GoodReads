import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function StarRating({ rating, interactive = false, onChange, size = 'sm', showCount = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const sizes = { sm: 14, md: 18, lg: 24 };
  const px = sizes[size];
  const display = interactive && hovered > 0 ? hovered : rating;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} width={px} height={px}
            style={{
              transition: 'all 0.15s',
              cursor: interactive ? 'pointer' : 'default',
              fill: star <= display ? 'var(--theme-accent-star)' : 'none',
              color: star <= display ? 'var(--theme-accent-star)' : 'var(--theme-border)',
              transform: interactive && hovered === star ? 'scale(1.15)' : 'scale(1)',
            }}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => { if (interactive && onChange) onChange(star === rating ? 0 : star); }}
          />
        ))}
      </div>
      {showCount && rating > 0 && <span style={{ fontSize: 11, color: 'var(--theme-text-light)' }}>{rating}/5</span>}
    </div>
  );
}
