import { scoreTier } from '../lib/scoreTiers';
import { buildSparkline } from '../lib/sparkline';
import { formatHourLabel } from '../lib/time';

// One color-block "poster panel" per city — the 2a/"Fairweather" direction
// from Design Directions.dc.html. Color is data-driven (scoreTier), not a
// fixed accent: the panel IS the score, not a card that happens to report one.
export function CityCard({ data, isBest, onRemove }) {
  const { location, weather, airQuality, daylight, activityScore, bestWindow } = data;
  const current = weather?.current;
  const tier = scoreTier(activityScore?.score);
  const spark = buildSparkline(weather?.daily);

  // daylight.sunset is a true absolute UTC instant (sunrise-sunset.org, formatted=0),
  // unlike the naive local-time strings from Open-Meteo's hourly data. So parsing it
  // through Date() is correct here -- but it must be rendered with an explicit
  // timeZone, otherwise toLocaleTimeString silently falls back to the viewer's own
  // browser timezone instead of the city's.
  const sunsetLabel =
    daylight && !daylight.error
      ? new Date(daylight.sunset).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: location?.timezone,
        })
      : '—';
  const aqiLabel = airQuality && !airQuality.error ? airQuality.usAqi : '—';
  const windLabel = current ? `${Math.round(current.windKph)} km/h` : '—';

  return (
    <div className="panel" style={{ '--panel-bg': tier.bg, '--panel-ink': tier.ink }}>
      {isBest && <div className="panel-ribbon">Fairest today</div>}

      <div className="panel-head">
        <div>
          <p className="panel-name">{location.name}</p>
          <p className="panel-cond">{current ? current.conditionLabel : 'Weather unavailable'}</p>
        </div>
        <button className="panel-remove" onClick={onRemove} aria-label={`Remove ${location.name}`}>
          ×
        </button>
      </div>

      <div className="panel-temp-row">
        <span className="panel-temp">{current ? Math.round(current.temperatureC) : '—'}°</span>
        {current && <span className="panel-feels">feels {Math.round(current.feelsLikeC)}°</span>}
      </div>

      <div className="panel-stats">
        <div className="panel-stat-row">
          <span>Air</span>
          <span>AQI {aqiLabel}</span>
        </div>
        <div className="panel-stat-row">
          <span>Wind</span>
          <span>{windLabel}</span>
        </div>
        <div className="panel-stat-row">
          <span>Sunset</span>
          <span>{sunsetLabel}</span>
        </div>
      </div>

      {bestWindow && (
        <div className="panel-best-window">
          <span className="panel-best-window-label">Best window</span>
          <span className="panel-best-window-time">
            {formatHourLabel(bestWindow.start)}–{formatHourLabel(bestWindow.end)}
          </span>
        </div>
      )}

      {spark && (
        <div className="panel-forecast">
          <p className="panel-forecast-label">Next 7 days</p>
          <svg viewBox="0 0 200 40" className="panel-sparkline">
            <polyline points={spark.max} fill="none" stroke={tier.ink} strokeWidth="2" strokeLinecap="round" />
            <polyline points={spark.min} fill="none" stroke={tier.ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
          </svg>
        </div>
      )}

      <div className="panel-score">
        <div className="panel-score-number">{activityScore ? activityScore.score : '—'}</div>
        <div className="panel-score-label">{activityScore ? tier.label : 'No score yet'}</div>
      </div>
    </div>
  );
}
