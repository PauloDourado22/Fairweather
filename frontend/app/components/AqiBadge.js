const CATEGORY_META = {
  good: { label: 'Good', color: '#34d399', soft: 'rgba(52, 211, 153, 0.14)' },
  moderate: { label: 'Moderate', color: '#fbbf24', soft: 'rgba(251, 191, 36, 0.14)' },
  'unhealthy-for-sensitive-groups': { label: 'Sensitive groups', color: '#fb923c', soft: 'rgba(251, 146, 60, 0.14)' },
  unhealthy: { label: 'Unhealthy', color: '#f87171', soft: 'rgba(248, 113, 113, 0.14)' },
  'very-unhealthy': { label: 'Very unhealthy', color: '#e879b9', soft: 'rgba(232, 121, 185, 0.14)' },
  hazardous: { label: 'Hazardous', color: '#c084fc', soft: 'rgba(192, 132, 252, 0.14)' },
  unknown: { label: 'Unknown', color: '#8d94a6', soft: 'rgba(141, 148, 166, 0.14)' },
};

export function AqiBadge({ airQuality }) {
  if (!airQuality || airQuality.error) {
    return <span className="badge">AQI unavailable</span>;
  }
  const meta = CATEGORY_META[airQuality.category] ?? CATEGORY_META.unknown;
  return (
    <span
      className="badge"
      style={{ color: meta.color, background: meta.soft, borderColor: 'transparent' }}
    >
      <span className="badge-dot" style={{ background: meta.color }} />
      AQI {airQuality.usAqi} · {meta.label}
    </span>
  );
}
