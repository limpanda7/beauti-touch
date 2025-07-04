import React from 'react';

const SHAPE_SIZE = 40;
const COLOR = '#FF0000';

// 도형 데이터 타입
interface Shape {
  id: number;
  type: 'circle';
  x: number;
  y: number;
  text?: string;
}

interface ChartDrawingDisplayProps {
  imageUrl: string;
  width?: number;
  height?: number;
  shapes: Shape[];
  title?: string;
}

const ChartDrawingDisplay: React.FC<ChartDrawingDisplayProps> = ({ 
  imageUrl, 
  width = 300, 
  height = 300, 
  shapes, 
  title 
}) => {
  return (
    <div style={{ maxWidth: width, margin: '0 auto' }}>
      {title && (
        <h4 style={{ 
          textAlign: 'center', 
          marginBottom: '0.5rem', 
          fontSize: '1rem', 
          fontWeight: '600',
          color: '#374151'
        }}>
          {title}
        </h4>
      )}
      {/* SVG 차트 */}
      <div style={{ 
        position: 'relative', 
        width, 
        height, 
        border: '1px solid #E5E7EB', 
        background: 'white',
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <svg
          width={width}
          height={height}
          style={{ display: 'block', position: 'absolute', top: 0, left: 0 }}
        >
          {/* 배경 이미지 */}
          <image href={imageUrl} x={0} y={0} width={width} height={height} style={{ pointerEvents: 'none' }} />
          {/* 원 도형들 */}
          {shapes.map(shape => (
            <g key={shape.id}>
              <circle
                cx={shape.x}
                cy={shape.y}
                r={SHAPE_SIZE / 2}
                stroke={COLOR}
                strokeWidth={2}
                fill="none"
              />
              {shape.text && (
                <text
                  x={shape.x}
                  y={shape.y + SHAPE_SIZE / 2 + 16}
                  fill={COLOR}
                  fontSize={14}
                  textAnchor="middle"
                  style={{ userSelect: 'none' }}
                >
                  {shape.text}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default ChartDrawingDisplay; 