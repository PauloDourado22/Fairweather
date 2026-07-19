// Turns a week of daily max/min temps into two SVG polyline point strings,
// scaled to a fixed 0-40-high viewBox. No charting library needed for
// something this small — recharts was overkill for a 7-point line and
// dropped a real dependency for what's now a ~20-line function.
const VIEW_WIDTH = 200;
const VIEW_HEIGHT = 40;
const PAD = 4;

function toPoints(values, lo, span) {
  return values
    .map((v, i) => {
      const x = values.length > 1 ? (i / (values.length - 1)) * VIEW_WIDTH : 0;
      const y = VIEW_HEIGHT - PAD - ((v - lo) / span) * (VIEW_HEIGHT - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function buildSparkline(daily) {
  if (!daily || daily.length < 2) return null;
  const maxes = daily.map((d) => d.maxTempC);
  const mins = daily.map((d) => d.minTempC);
  const all = [...maxes, ...mins];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo || 1;
  return {
    max: toPoints(maxes, lo, span),
    min: toPoints(mins, lo, span),
  };
}
