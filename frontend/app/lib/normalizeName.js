// Used everywhere two city names get compared for "is this the same city".
// Plain toLowerCase() alone misses accent variants — "Sao Paulo" typed
// without diacritics wouldn't match an already-added "São Paulo" without
// this. The NFD + strip-combining-marks trick decomposes "ã" into "a" plus
// a combining tilde codepoint, then drops that combining mark.
export function normalizeCityName(name) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
