// Open-Meteo's hourly/current timestamps (with timezone=auto) are naive
// local-time strings like "2026-07-19T14:00" — already expressed in the
// city's own timezone, no UTC offset attached. Extracting the "HH:mm"
// substring directly avoids ever parsing them through `Date`, which would
// silently reinterpret them in the browser's timezone instead of the
// city's — the same class of bug already hit once in this app (the
// header's "today" date mismatching between server and client locale).
export function formatHourLabel(isoLocal) {
  return isoLocal.slice(11, 16);
}
