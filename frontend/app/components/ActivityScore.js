function scoreColor(score) {
  if (score >= 60) return 'var(--good)';
  if (score >= 40) return 'var(--moderate)';
  if (score >= 20) return 'var(--poor)';
  return 'var(--bad)';
}

const CIRCUMFERENCE = 2 * Math.PI * 17;

export function ActivityScore({ activityScore }) {
  if (!activityScore) return null;
  const color = scoreColor(activityScore.score);
  const gradientId = `score-gradient-${activityScore.score}`;

  return (
    <div className="score-ring">
      <svg width="44" height="44" viewBox="0 0 40 40">
        <defs>
          {/* A subtle gradient reads as more "designed" than a flat stroke,
              and keeps the ring legible against every status color. */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE - (activityScore.score / 100) * CIRCUMFERENCE}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dashoffset 0.8s var(--ease)' }}
        />
      </svg>
      <div>
        <div className="score-number" style={{ color }}>
          {activityScore.score}
        </div>
        <div className="city-sub">{activityScore.label}</div>
      </div>
    </div>
  );
}
