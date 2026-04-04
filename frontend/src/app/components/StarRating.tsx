import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function StarRating({
  rating,
  interactive = false,
  onChange,
  size = 'sm',
  showCount = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const sizes = { sm: 14, md: 18, lg: 22 };
  const px = sizes[size];

  const display = interactive && hovered > 0 ? hovered : rating;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            width={px}
            height={px}
            className={`transition-colors ${
              interactive ? 'cursor-pointer' : ''
            } ${
              star <= display
                ? 'fill-[#d4a017] text-[#d4a017]'
                : 'fill-none text-[#888]'
            }`}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => {
              if (interactive && onChange) {
                onChange(star === rating ? 0 : star);
              }
            }}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-[11px] text-gray-500 min-h-[16px] flex items-center">{rating > 0 ? `${rating}/5` : '\u00A0'}</span>
      )}
    </div>
  );
}
