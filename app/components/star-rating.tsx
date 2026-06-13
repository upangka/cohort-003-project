import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "~/lib/utils";

interface StarRatingProps {
  /** Average rating (decimal, e.g. 4.3). Used in display mode. */
  rating?: number | null;
  /** Number of reviews. Shown as "(N)" next to rating in display mode. */
  count?: number;
  /** Icon size in pixels. Default 16. */
  size?: number;
  /** Show interactive stars. When true, user can click to rate. */
  interactive?: boolean;
  /** Current user's rating (1-5), used to pre-fill interactive mode. */
  userRating?: number | null;
  /** Called when user clicks a star in interactive mode. */
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  count,
  size = 16,
  interactive = false,
  userRating = null,
  onChange,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const displayRating = userRating ?? rating ?? 0;
  const activeStars = hovered ?? Math.round(displayRating);

  if (interactive) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onChange?.(star)}
              className="transition-colors hover:scale-110"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                size={size}
                className={cn(
                  "transition-colors",
                  star <= activeStars
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>
        {userRating != null && (
          <span className="text-xs text-muted-foreground">
            ({userRating}/5)
          </span>
        )}
      </div>
    );
  }

  // Display mode
  const fullStars = Math.floor(displayRating);
  const fractionalPart = displayRating - fullStars;
  const hasHalfStar = fractionalPart >= 0.25;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          // Full star
          if (star <= fullStars) {
            return (
              <Star
                key={star}
                size={size}
                className="fill-yellow-400 text-yellow-400"
              />
            );
          }
          // Partial star (only next star after full ones)
          if (star === fullStars + 1 && hasHalfStar) {
            return (
              <div key={star} className="relative">
                <Star
                  size={size}
                  className="text-muted-foreground/30"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fractionalPart * 100}%` }}
                >
                  <Star
                    size={size}
                    className="fill-yellow-400 text-yellow-400"
                  />
                </div>
              </div>
            );
          }
          // Empty star
          return (
            <Star
              key={star}
              size={size}
              className="fill-none text-muted-foreground/30"
            />
          );
        })}
      </div>
      {rating != null && (
        <span className="text-xs text-muted-foreground">
          {rating.toFixed(1)}
          {count !== undefined && ` (${count})`}
        </span>
      )}
    </div>
  );
}
