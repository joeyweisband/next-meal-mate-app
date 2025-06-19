import React from 'react';

interface MacroProgressProps {
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  target: { calories: number; protein: number; carbs: number; fat: number };
}

const MacroProgress: React.FC<MacroProgressProps> = ({ consumed, target }) => {
  const macros = [
    { label: 'Calories', value: consumed.calories, target: target.calories, color: '#ff9800' },
    { label: 'Protein', value: consumed.protein, target: target.protein, color: '#4caf50' },
    { label: 'Carbs', value: consumed.carbs, target: target.carbs, color: '#2196f3' },
    { label: 'Fat', value: consumed.fat, target: target.fat, color: '#e91e63' },
  ];
  return (
    <div style={{ marginTop: 16 }}>
      {macros.map((macro) => (
        <div key={macro.label} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontWeight: 500 }}>{macro.label}</span>
            <span style={{ color: '#888' }}>
              {macro.value} / {macro.target}
            </span>
          </div>
          <div style={{ background: '#eee', borderRadius: 8, height: 8, width: '100%' }}>
            <div
              style={{
                width: `${Math.min(100, (macro.value / macro.target) * 100)}%`,
                background: macro.color,
                height: 8,
                borderRadius: 8,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MacroProgress;