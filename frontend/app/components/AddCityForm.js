'use client';

import { useState } from 'react';

export function AddCityForm({ onAdd, isLoading }) {
  const [value, setValue] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  }

  return (
    <form className="add-city-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Add a city, e.g. Leiria"
        aria-label="City name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !value.trim()}>
        {isLoading ? 'Adding…' : 'Add city'}
      </button>
    </form>
  );
}
