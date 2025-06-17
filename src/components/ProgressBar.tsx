import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  fillColor?: string;
  showPercentage?: boolean;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  fillColor = '#4caf50',
  showPercentage = false,
  label,
}) => {
  return (
    <div style={{ width: '100%', marginBottom: 8 }}>
      {label && <div style={{ marginBottom: 2, fontWeight: 500 }}>{label}</div>}
      <div style={{ background: '#eee', borderRadius: height, height, width: '100%' }}>
        <div
          style={{
            width: `${Math.min(100, progress * 100)}%`,
            background: fillColor,
            height,
            borderRadius: height,
            transition: 'width 0.3s',
          }}
        />
      </div>
      {showPercentage && (
        <div style={{ textAlign: 'right', fontSize: 12, color: '#888' }}>{Math.round(progress * 100)}%</div>
      )}
    </div>
  );
};

export default ProgressBar;