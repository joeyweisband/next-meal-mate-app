import React from 'react';

interface RadioGroupProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  label,
  disabled,
}) => {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ marginBottom: 8, fontWeight: 600 }}>{label}</div>
      )}
      {options.map((option) => (
        <label
          key={option.value}
          style={{
            display: 'block',
            marginBottom: 4,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <input
            type="radio"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            disabled={disabled}
            style={{ marginRight: 8 }}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
};

export default RadioGroup;