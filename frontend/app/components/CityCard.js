import { AqiBadge } from './AqiBadge';
import { ActivityScore } from './ActivityScore';
import { ForecastChart } from './ForecastChart';

export function CityCard({ data, onRemove }) {
  const { location, weather, airQuality, daylight, activityScore } = data;
  const current = weather?.current;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="city-name">{location.name}</p>
          <p className="city-sub">
            {[location.admin1, location.country].filter(Boolean).join(', ')}
          </p>
        </div>
        <button className="remove-btn" onClick={onRemove} aria-label={`Remove ${location.name}`}>
          Remove
        </button>
      </div>

      {current ? (
        <>
          <div className="temp-row">
            <span className="temp-value">{Math.round(current.temperatureC)}°C</span>
            <span className="condition-label">{current.conditionLabel}</span>
          </div>
          <div className="stat-row">
            <span>Feels like <strong>{Math.round(current.feelsLikeC)}°C</strong></span>
            <span>Wind <strong>{Math.round(current.windKph)} km/h</strong></span>
          </div>
        </>
      ) : (
        <p className="error-text">Weather unavailable</p>
      )}

      <div className="stat-row" style={{ marginTop: 10 }}>
        <AqiBadge airQuality={airQuality} />
        {daylight && !daylight.error && (
          <span>
            Sunset <strong>{new Date(daylight.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
          </span>
        )}
      </div>

      <ForecastChart daily={weather?.daily} />
      <ActivityScore activityScore={activityScore} />
    </div>
  );
}
