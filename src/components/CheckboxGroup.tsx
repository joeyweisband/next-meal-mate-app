import React from 'react';

interface CheckboxGroupProps {
  options: { label: string; value: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  disabled?: boolean;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  value,
  onChange,
  label,
  disabled,
}) => {
  const handleChange = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ marginBottom: 8, fontWeight: 600 }}>
          {label}
        </div>
      )}
      {options.map(option => (
        <label
          key={option.value}
          style={{
            display: 'block',
            marginBottom: 4,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            onChange={() => handleChange(option.value)}
            disabled={disabled}
            style={{ marginRight: 8 }}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
};

export default CheckboxGroup;