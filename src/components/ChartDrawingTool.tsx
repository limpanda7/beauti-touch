import React, { useRef, useState } from 'react';

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

interface ChartDrawingToolProps {
  imageUrl: string;
  width?: number;
  height?: number;
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
}

const ChartDrawingTool: React.FC<ChartDrawingToolProps> = ({ imageUrl, width = 400, height = 400, shapes, setShapes }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const idRef = useRef(1);

  // SVG 클릭 시 원 추가
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (editingId !== null) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newId = idRef.current++;
    setShapes(prev => [
      ...prev,
      { id: newId, type: 'circle', x, y }
    ]);
    setEditingId(newId);
    setInputValue('');
  };

  // 원 클릭 시 텍스트 입력 시작
  const handleShapeClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    const shape = shapes.find(s => s.id === id);
    setInputValue(shape?.text || '');
  };

  // 텍스트 입력 완료
  const handleInputBlur = () => {
    if (editingId === null) return;
    setShapes(prev => prev.map(s => s.id === editingId ? { ...s, text: inputValue } : s));
    setEditingId(null);
    setInputValue('');
  };

  // 엔터로 입력 완료
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div style={{ maxWidth: width }}>
      {/* SVG 차트 */}
      <div style={{ position: 'relative', width, height, border: '1px solid #eee', background: 'white' }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ display: 'block', position: 'absolute', top: 0, left: 0 }}
          onClick={handleSvgClick}
        >
          {/* 배경 이미지 */}
          <image href={imageUrl} x={0} y={0} width={width} height={height} style={{ pointerEvents: 'none' }} />
          {/* 원 도형들 */}
          {shapes.map(shape => (
            <g key={shape.id} style={{ cursor: 'pointer' }}>
              {/* 클릭 판정: 원 내부 전체 */}
              <circle
                cx={shape.x}
                cy={shape.y}
                r={SHAPE_SIZE / 2}
                stroke={COLOR}
                strokeWidth={2}
                fill="none"
              />
              <circle
                cx={shape.x}
                cy={shape.y}
                r={SHAPE_SIZE / 2}
                fill="transparent"
                style={{ pointerEvents: 'all' }}
                onClick={e => handleShapeClick(shape.id, e)}
              />
              {shape.text && (
                <text
                  x={shape.x}
                  y={shape.y + SHAPE_SIZE / 2 + 16}
                  fill={COLOR}
                  fontSize={16}
                  textAnchor="middle"
                  style={{ userSelect: 'none', cursor: 'pointer' }}
                  onClick={e => handleShapeClick(shape.id, e)}
                >
                  {shape.text}
                </text>
              )}
            </g>
          ))}
        </svg>
        {/* 텍스트 입력창 (도형 위에 오버레이) */}
        {editingId !== null && (() => {
          const shape = shapes.find(s => s.id === editingId);
          if (!shape) return null;
          return (
            <div style={{ position: 'absolute', left: shape.x - 60, top: shape.y + SHAPE_SIZE / 2 + 4, display: 'flex', alignItems: 'center', zIndex: 10 }}>
              <input
                type="text"
                value={inputValue}
                autoFocus
                onChange={e => setInputValue(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                style={{
                  width: 120,
                  fontSize: 16,
                  border: `1.5px solid ${COLOR}`,
                  borderRadius: 4,
                  padding: '2px 8px',
                  color: COLOR,
                  background: '#fff',
                  marginRight: 4,
                }}
              />
              <button
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); handleInputBlur(); }}
                style={{
                  background: 'white',
                  border: '1.5px solid #ddd',
                  borderRadius: 4,
                  color: '#22c55e',
                  fontWeight: 'bold',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: 1,
                  marginRight: 2,
                }}
                title="입력 완료"
              >
                ✔
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setShapes(prev => prev.filter(s => s.id !== editingId)); setEditingId(null); }}
                style={{
                  background: 'white',
                  border: '1.5px solid #ddd',
                  borderRadius: 4,
                  color: COLOR,
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: 1,
                }}
                title="삭제"
              >
                🗑️
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ChartDrawingTool; 