import React, { useState, useEffect } from 'react';

export function CurrencyInput({
  value,
  onChange,
  className = "",
  placeholder = "",
  required = false,
  max,
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  max?: number;
}) {
  const [displayValue, setDisplayValue] = useState(
    value ? value.toLocaleString('id-ID') : ""
  );

  useEffect(() => {
    if (value === 0) {
      if (displayValue !== "0" && displayValue !== "") {
        // Only clear if it wasn't deliberately typed as 0
        setDisplayValue("");
      }
    } else if (value) {
      setDisplayValue(value.toLocaleString('id-ID'));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawStr = e.target.value.replace(/\D/g, "");
    if (!rawStr) {
      setDisplayValue("");
      onChange(0);
      return;
    }
    let num = parseInt(rawStr, 10);
    if (max !== undefined && num > max) num = max;
    setDisplayValue(num.toLocaleString('id-ID'));
    onChange(num);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      required={required}
    />
  );
}
