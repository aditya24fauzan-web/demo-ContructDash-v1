import React from 'react';
import { NumericFormat } from 'react-number-format';

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
  return (
    <NumericFormat
      value={value === 0 ? '' : value}
      onValueChange={(values) => {
        let num = values.floatValue || 0;
        if (max !== undefined && num > max) num = max;
        onChange(num);
      }}
      allowNegative={false}
      thousandSeparator="."
      decimalSeparator=","
      className={className}
      placeholder={placeholder}
      required={required}
      isAllowed={(values) => {
        if (max !== undefined && values.floatValue !== undefined) {
          return values.floatValue <= max;
        }
        return true;
      }}
    />
  );
}

