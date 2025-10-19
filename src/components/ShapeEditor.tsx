import * as React from 'react';
import { useState } from 'react';
import { Button, ColorPicker, FieldSet, HorizontalGroup, InlineField, InlineFieldRow, InlineSwitch, Input, Select, VerticalGroup } from '@grafana/ui';
import { FieldType, PanelData, SelectableValue, StandardEditorProps, DataFrame } from '@grafana/data';
import { 
  Shape, 
  ShapeType, 
  PointShape, 
  LineShape, 
  RectangleShape, 
  EllipseShape, 
  CircleShape, 
  TriangleShape, 
  QuadShape, 
  PolylineShape, 
  ImageShape,
  TextShape,
  FieldConfig
} from '../types';
import { generateUniqueId } from '../utils';

// For use as a panel options editor
interface ShapeEditorProps extends StandardEditorProps<Shape[]> {}

// Get available fields from data
const getFieldOptions = (data: PanelData | any): Array<SelectableValue<string>> => {
  // Handle the case where data is an array of DataFrames (as in the panel editor)
  // or PanelData object (as in the panel component)
  const series = Array.isArray(data) ? data : (data?.series || []);
  
  if (!series.length) {
    return [];
  }

  // フィールドオプションを格納する配列
  const fieldsMap = new Map<string, SelectableValue<string>>();

  // すべてのデータフレーム（クエリ結果）からフィールドを収集
  series.forEach((frame: DataFrame, frameIndex: number) => {
    if (frame && frame.fields) {
      frame.fields.forEach((f: any) => {
        // クエリインデックスをラベルに含めることでどのクエリからのフィールドかを識別
        const queryLabel = series.length > 1 ? `[Query ${String.fromCharCode(65 + frameIndex)}] ` : '';
        const fieldOption = {
          label: `${queryLabel}${f.name}`,
          value: f.name,
          description: f.type === FieldType.number ? 'Numeric' : 'String',
          // フレームのインデックスを保存して、どのクエリ結果からのフィールドかを識別できるようにする
          meta: { frame: frameIndex },
        };

        // 重複を避けるためにキーを作成（クエリインデックスとフィールド名の組み合わせ）
        const key = `${frameIndex}:${f.name}`;
        fieldsMap.set(key, fieldOption);
      });
    }
  });

  return [
    { label: 'Select field', value: '', description: 'Choose a field' },
    ...Array.from(fieldsMap.values()),
  ];
};

const ShapeTypeOptions: Array<SelectableValue<ShapeType>> = [
  { label: 'Point', value: 'point', description: 'A single point' },
  { label: 'Line', value: 'line', description: 'A line between two points' },
  { label: 'Rectangle', value: 'rectangle', description: 'A rectangle' },
  { label: 'Ellipse', value: 'ellipse', description: 'An ellipse' },
  { label: 'Circle', value: 'circle', description: 'A circle' },
  { label: 'Triangle', value: 'triangle', description: 'A triangle' },
  { label: 'Quadrilateral', value: 'quad', description: 'A quadrilateral' },
  { label: 'Polyline', value: 'polyline', description: 'A series of connected lines' },
  { label: 'Image', value: 'image', description: 'An image (PNG, SVG)' },
  { label: 'Text', value: 'text', description: 'A text element' },
];

const FieldTypeOptions: Array<SelectableValue<'constant' | 'field'>> = [
  { label: 'Const', value: 'constant', description: 'Use a constant value' },
  { label: 'Field', value: 'field', description: 'Use a field from data source' },
];

// Generic Field Configuration component
const FieldConfigEditor: React.FC<{
  label: string;
  config: FieldConfig;
  fieldOptions: Array<SelectableValue<string>>;
  onChange: (config: FieldConfig) => void;
  numeric?: boolean;
}> = ({ label, config, fieldOptions, onChange, numeric = true }) => {
  return (
    <InlineFieldRow>
      <InlineField label={label} labelWidth={8}>
        <HorizontalGroup>
          <Select
            width={11}
            options={FieldTypeOptions}
            value={config.type}
            onChange={v => onChange({ ...config, type: v.value || 'constant' })}
          />
          {config.type === 'constant' ? (
            <Input
              type={numeric ? 'number' : 'text'}
              value={config.constant !== undefined ? config.constant : ''}
              onChange={e => {
                if (numeric) {
                  // 数値入力フィールドの場合は数値に変換して保存
                  const val = parseFloat(e.currentTarget.value);
                  onChange({ ...config, constant: isNaN(val) ? 0 : val });
                } else {
                  // テキストの場合はそのまま
                  onChange({ ...config, constant: e.currentTarget.value });
                }
              }}
              width={20}
            />
          ) : (
            <Select
              width={20}
              options={fieldOptions}
              value={config.field}
              onChange={v => {
                // フィールド選択時に、関連するframeIndexも一緒に保存
                const frameIndex = v.meta?.frame !== undefined ? v.meta.frame : 0;
                onChange({ 
                  ...config, 
                  field: v.value || '', 
                  frameIndex: frameIndex
                });
              }}
            />
          )}
        </HorizontalGroup>
      </InlineField>
    </InlineFieldRow>
  );
};

// Create default shape based on type
const createDefaultShape = (type: ShapeType): Shape => {
  const baseShape = {
    id: generateUniqueId(),
    type,
    name: `${type} shape`, // デフォルトの名前を設定
    strokeColor: 'rgba(255, 0, 0, 1)', // 黒から赤に変更
    strokeWeight: 1,
    opacity: 1,
    visible: true,
  };
  
  const defaultFieldConfig = { type: 'constant' as const, constant: 0 };
  
  switch (type) {
    case 'point':
      return {
        ...baseShape,
        x: defaultFieldConfig,
        y: defaultFieldConfig,
        pointSize: 5,
      } as PointShape;
      
    case 'line':
      return {
        ...baseShape,
        x1: defaultFieldConfig,
        y1: defaultFieldConfig,
        x2: { ...defaultFieldConfig, constant: 100 },
        y2: { ...defaultFieldConfig, constant: 100 },
      } as LineShape;
      
    case 'rectangle':
      return {
        ...baseShape,
        x: defaultFieldConfig,
        y: defaultFieldConfig,
        width: { ...defaultFieldConfig, constant: 100 },
        height: { ...defaultFieldConfig, constant: 50 },
        rotation: { ...defaultFieldConfig, constant: 0 },
        fillColor: 'rgba(255, 255, 255, 0.5)',
      } as RectangleShape;
      
    case 'ellipse':
      return {
        ...baseShape,
        x: defaultFieldConfig,
        y: defaultFieldConfig,
        width: { ...defaultFieldConfig, constant: 100 },
        height: { ...defaultFieldConfig, constant: 50 },
        rotation: { ...defaultFieldConfig, constant: 0 },
        fillColor: 'rgba(255, 255, 255, 0.5)',
      } as EllipseShape;
      
    case 'circle':
      return {
        ...baseShape,
        x: defaultFieldConfig,
        y: defaultFieldConfig,
        diameter: { ...defaultFieldConfig, constant: 50 },
        fillColor: 'rgba(255, 255, 255, 0.5)',
      } as CircleShape;
      
    case 'triangle':
      return {
        ...baseShape,
        x1: defaultFieldConfig,
        y1: { ...defaultFieldConfig, constant: 100 },
        x2: { ...defaultFieldConfig, constant: 50 },
        y2: defaultFieldConfig,
        x3: { ...defaultFieldConfig, constant: 100 },
        y3: defaultFieldConfig,
        fillColor: 'rgba(255, 255, 255, 0.5)',
      } as TriangleShape;
      
    case 'quad':
      return {
        ...baseShape,
        x1: defaultFieldConfig,
        y1: defaultFieldConfig,
        x2: { ...defaultFieldConfig, constant: 100 },
        y2: defaultFieldConfig,
        x3: { ...defaultFieldConfig, constant: 100 },
        y3: { ...defaultFieldConfig, constant: 100 },
        x4: defaultFieldConfig,
        y4: { ...defaultFieldConfig, constant: 100 },
        fillColor: 'rgba(255, 255, 255, 0.5)',
      } as QuadShape;
      
    case 'polyline':
      return {
        ...baseShape,
        xPoints: { type: 'constant', constant: '0,50,100,150' },
        yPoints: { type: 'constant', constant: '0,50,0,50' },
        closePath: false,
        smoothCurve: false,
        fillColor: 'rgba(255, 255, 255, 0.5)',
      } as PolylineShape;
      
    case 'image':
      return {
        ...baseShape,
        source: { type: 'constant', constant: '' },
        sourceType: 'url',
        x: defaultFieldConfig,
        y: defaultFieldConfig,
        width: { ...defaultFieldConfig, constant: 100 },
        height: { ...defaultFieldConfig, constant: 100 },
        rotation: { ...defaultFieldConfig, constant: 0 },
      } as ImageShape;
      
    case 'text':
      return {
        ...baseShape,
        x: defaultFieldConfig,
        y: defaultFieldConfig,
        text: { type: 'constant', constant: 'テキスト' },
        textSize: 20,
        textColor: 'rgba(255, 255, 255, 1)',
        xOffset: 0,
        yOffset: 0,
        formatString: '',
        unit: '',
      } as TextShape;
  }
};

export const ShapeEditor: React.FC<ShapeEditorProps> = ({ value = [], onChange, context }) => {
  // Access the shapes from the value prop
  const shapes = value;
  // Access the panel data from context
  const data = context.data;
  
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(shapes.length ? 0 : null);
  const [editingShapeIndex, setEditingShapeIndex] = useState<number | null>(null);
  
  // Get field options, handling both PanelData and DataFrame[] formats
  const fieldOptions = getFieldOptions(data);
  
  const handleAddShape = (type: ShapeType) => {
    const newShape = createDefaultShape(type);
    const newShapes = [...shapes, newShape];
    onChange(newShapes);
    setSelectedShapeIndex(newShapes.length - 1);
  };
  
  const handleDeleteShape = (index: number) => {
    const newShapes = [...shapes];
    newShapes.splice(index, 1);
    onChange(newShapes);
    
    if (selectedShapeIndex === index) {
      setSelectedShapeIndex(newShapes.length ? 0 : null);
    } else if (selectedShapeIndex !== null && selectedShapeIndex > index) {
      setSelectedShapeIndex(selectedShapeIndex - 1);
    }
  };
  
  const handleShapeChange = (index: number, shape: Shape) => {
    const newShapes = [...shapes];
    newShapes[index] = shape;
    onChange(newShapes);
  };
  
  // Render specific shape editor based on shape type
  const renderShapeEditor = () => {
    if (selectedShapeIndex === null || !shapes[selectedShapeIndex]) {
      return <div>Select a shape to edit its properties</div>;
    }
    
    const shape = shapes[selectedShapeIndex];
    
    // Common fields for all shapes
    const commonFields = (
      <>
        <InlineFieldRow>
          <InlineField label="Name" labelWidth={12}>
            <Input
              type="text"
              value={shape.name}
              onChange={e => {
                handleShapeChange(selectedShapeIndex, { ...shape, name: e.currentTarget.value });
              }}
              width={20}
            />
          </InlineField>
        </InlineFieldRow>
        
        <InlineFieldRow>
          <InlineField label="Stroke" labelWidth={12}>
            <HorizontalGroup spacing="xs">
              <ColorPicker
                color={shape.strokeColor}
                onChange={color => {
                  handleShapeChange(selectedShapeIndex, { ...shape, strokeColor: color });
                }}
              />
              <Input
                type="number"
                value={shape.strokeWeight}
                onChange={e => {
                  const val = parseFloat(e.currentTarget.value);
                  handleShapeChange(selectedShapeIndex, { ...shape, strokeWeight: val });
                }}
                width={10}
              />
            </HorizontalGroup>
          </InlineField>
        </InlineFieldRow>
        
        <InlineFieldRow>
          <InlineField label="Opacity" labelWidth={8} grow={false}>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={shape.opacity}
              onChange={e => {
                const val = parseFloat(e.currentTarget.value);
                handleShapeChange(selectedShapeIndex, { ...shape, opacity: val });
              }}
              width={10}
            />
          </InlineField>
        </InlineFieldRow>
      </>
    );
    
    // Fill color for shapes that can be filled
    const fillColorField = (
      <InlineFieldRow>
        <InlineField label="Fill Color" labelWidth={12}>
          <ColorPicker
            color={(shape as any).fillColor || 'rgba(255, 255, 255, 0.5)'}
            onChange={color => {
              // Type-safe way to update fillColor based on shape type
              const updatedShape = { ...shape };
              if ('fillColor' in updatedShape) {
                (updatedShape as any).fillColor = color;
                handleShapeChange(selectedShapeIndex, updatedShape);
              }
            }}
          />
        </InlineField>
      </InlineFieldRow>
    );
    
    // Shape-specific settings
    switch (shape.type) {
      case 'point': {
        const s = shape as PointShape;
        return (
          <VerticalGroup>
            {commonFields}
            <FieldConfigEditor 
              label="X" 
              config={s.x} 
              fieldOptions={fieldOptions}
              onChange={x => handleShapeChange(selectedShapeIndex, { ...s, x })}
            />
            <FieldConfigEditor 
              label="Y" 
              config={s.y} 
              fieldOptions={fieldOptions}
              onChange={y => handleShapeChange(selectedShapeIndex, { ...s, y })}
            />
            <InlineFieldRow>
              <InlineField label="Point Size" labelWidth={12}>
                <Input
                  type="number"
                  value={s.pointSize}
                  onChange={e => {
                    const val = parseFloat(e.currentTarget.value);
                    handleShapeChange(selectedShapeIndex, { ...s, pointSize: val });
                  }}
                  width={20}
                />
              </InlineField>
            </InlineFieldRow>
          </VerticalGroup>
        );
      }
      
      case 'line': {
        const s = shape as LineShape;
        return (
          <VerticalGroup>
            {commonFields}
            <FieldConfigEditor 
              label="X1" 
              config={s.x1} 
              fieldOptions={fieldOptions}
              onChange={x1 => handleShapeChange(selectedShapeIndex, { ...s, x1 })}
            />
            <FieldConfigEditor 
              label="Y1" 
              config={s.y1} 
              fieldOptions={fieldOptions}
              onChange={y1 => handleShapeChange(selectedShapeIndex, { ...s, y1 })}
            />
            <FieldConfigEditor 
              label="X2" 
              config={s.x2} 
              fieldOptions={fieldOptions}
              onChange={x2 => handleShapeChange(selectedShapeIndex, { ...s, x2 })}
            />
            <FieldConfigEditor 
              label="Y2" 
              config={s.y2} 
              fieldOptions={fieldOptions}
              onChange={y2 => handleShapeChange(selectedShapeIndex, { ...s, y2 })}
            />
          </VerticalGroup>
        );
      }
      
      case 'rectangle': {
        const s = shape as RectangleShape;
        return (
          <VerticalGroup>
            {commonFields}
            {fillColorField}
            <FieldConfigEditor 
              label="X" 
              config={s.x} 
              fieldOptions={fieldOptions}
              onChange={x => handleShapeChange(selectedShapeIndex, { ...s, x })}
            />
            <FieldConfigEditor 
              label="Y" 
              config={s.y} 
              fieldOptions={fieldOptions}
              onChange={y => handleShapeChange(selectedShapeIndex, { ...s, y })}
            />
            <FieldConfigEditor 
              label="Width" 
              config={s.width} 
              fieldOptions={fieldOptions}
              onChange={width => handleShapeChange(selectedShapeIndex, { ...s, width })}
            />
            <FieldConfigEditor 
              label="Height" 
              config={s.height} 
              fieldOptions={fieldOptions}
              onChange={height => handleShapeChange(selectedShapeIndex, { ...s, height })}
            />
            <FieldConfigEditor 
              label="Rotation" 
              config={s.rotation} 
              fieldOptions={fieldOptions}
              onChange={rotation => handleShapeChange(selectedShapeIndex, { ...s, rotation })}
            />
          </VerticalGroup>
        );
      }
      
      case 'ellipse': {
        const s = shape as EllipseShape;
        return (
          <VerticalGroup>
            {commonFields}
            {fillColorField}
            <FieldConfigEditor 
              label="X" 
              config={s.x} 
              fieldOptions={fieldOptions}
              onChange={x => handleShapeChange(selectedShapeIndex, { ...s, x })}
            />
            <FieldConfigEditor 
              label="Y" 
              config={s.y} 
              fieldOptions={fieldOptions}
              onChange={y => handleShapeChange(selectedShapeIndex, { ...s, y })}
            />
            <FieldConfigEditor 
              label="Width" 
              config={s.width} 
              fieldOptions={fieldOptions}
              onChange={width => handleShapeChange(selectedShapeIndex, { ...s, width })}
            />
            <FieldConfigEditor 
              label="Height" 
              config={s.height} 
              fieldOptions={fieldOptions}
              onChange={height => handleShapeChange(selectedShapeIndex, { ...s, height })}
            />
            <FieldConfigEditor 
              label="Rotation" 
              config={s.rotation} 
              fieldOptions={fieldOptions}
              onChange={rotation => handleShapeChange(selectedShapeIndex, { ...s, rotation })}
            />
          </VerticalGroup>
        );
      }
      
      case 'circle': {
        const s = shape as CircleShape;
        return (
          <VerticalGroup>
            {commonFields}
            {fillColorField}
            <FieldConfigEditor 
              label="X" 
              config={s.x} 
              fieldOptions={fieldOptions}
              onChange={x => handleShapeChange(selectedShapeIndex, { ...s, x })}
            />
            <FieldConfigEditor 
              label="Y" 
              config={s.y} 
              fieldOptions={fieldOptions}
              onChange={y => handleShapeChange(selectedShapeIndex, { ...s, y })}
            />
            <FieldConfigEditor 
              label="Diameter" 
              config={s.diameter} 
              fieldOptions={fieldOptions}
              onChange={diameter => handleShapeChange(selectedShapeIndex, { ...s, diameter })}
            />
          </VerticalGroup>
        );
      }
      
      case 'triangle': {
        const s = shape as TriangleShape;
        return (
          <VerticalGroup>
            {commonFields}
            {fillColorField}
            <FieldConfigEditor 
              label="X1" 
              config={s.x1} 
              fieldOptions={fieldOptions}
              onChange={x1 => handleShapeChange(selectedShapeIndex, { ...s, x1 })}
            />
            <FieldConfigEditor 
              label="Y1" 
              config={s.y1} 
              fieldOptions={fieldOptions}
              onChange={y1 => handleShapeChange(selectedShapeIndex, { ...s, y1 })}
            />
            <FieldConfigEditor 
              label="X2" 
              config={s.x2} 
              fieldOptions={fieldOptions}
              onChange={x2 => handleShapeChange(selectedShapeIndex, { ...s, x2 })}
            />
            <FieldConfigEditor 
              label="Y2" 
              config={s.y2} 
              fieldOptions={fieldOptions}
              onChange={y2 => handleShapeChange(selectedShapeIndex, { ...s, y2 })}
            />
            <FieldConfigEditor 
              label="X3" 
              config={s.x3} 
              fieldOptions={fieldOptions}
              onChange={x3 => handleShapeChange(selectedShapeIndex, { ...s, x3 })}
            />
            <FieldConfigEditor 
              label="Y3" 
              config={s.y3} 
              fieldOptions={fieldOptions}
              onChange={y3 => handleShapeChange(selectedShapeIndex, { ...s, y3 })}
            />
          </VerticalGroup>
        );
      }
      
      case 'quad': {
        const s = shape as QuadShape;
        return (
          <VerticalGroup>
            {commonFields}
            {fillColorField}
            <FieldConfigEditor 
              label="X1" 
              config={s.x1} 
              fieldOptions={fieldOptions}
              onChange={x1 => handleShapeChange(selectedShapeIndex, { ...s, x1 })}
            />
            <FieldConfigEditor 
              label="Y1" 
              config={s.y1} 
              fieldOptions={fieldOptions}
              onChange={y1 => handleShapeChange(selectedShapeIndex, { ...s, y1 })}
            />
            <FieldConfigEditor 
              label="X2" 
              config={s.x2} 
              fieldOptions={fieldOptions}
              onChange={x2 => handleShapeChange(selectedShapeIndex, { ...s, x2 })}
            />
            <FieldConfigEditor 
              label="Y2" 
              config={s.y2} 
              fieldOptions={fieldOptions}
              onChange={y2 => handleShapeChange(selectedShapeIndex, { ...s, y2 })}
            />
            <FieldConfigEditor 
              label="X3" 
              config={s.x3} 
              fieldOptions={fieldOptions}
              onChange={x3 => handleShapeChange(selectedShapeIndex, { ...s, x3 })}
            />
            <FieldConfigEditor 
              label="Y3" 
              config={s.y3} 
              fieldOptions={fieldOptions}
              onChange={y3 => handleShapeChange(selectedShapeIndex, { ...s, y3 })}
            />
            <FieldConfigEditor 
              label="X4" 
              config={s.x4} 
              fieldOptions={fieldOptions}
              onChange={x4 => handleShapeChange(selectedShapeIndex, { ...s, x4 })}
            />
            <FieldConfigEditor 
              label="Y4" 
              config={s.y4} 
              fieldOptions={fieldOptions}
              onChange={y4 => handleShapeChange(selectedShapeIndex, { ...s, y4 })}
            />
          </VerticalGroup>
        );
      }
      
      case 'polyline': {
        const s = shape as PolylineShape;
        return (
          <VerticalGroup>
            {commonFields}
            <FieldConfigEditor 
              label="X Points" 
              config={s.xPoints} 
              fieldOptions={fieldOptions}
              onChange={xPoints => handleShapeChange(selectedShapeIndex, { ...s, xPoints })}
              numeric={false}
            />
            <FieldConfigEditor 
              label="Y Points" 
              config={s.yPoints} 
              fieldOptions={fieldOptions}
              onChange={yPoints => handleShapeChange(selectedShapeIndex, { ...s, yPoints })}
              numeric={false}
            />
            <InlineFieldRow>
              <InlineField label="Close Path" labelWidth={12}>
                <InlineSwitch
                  value={s.closePath}
                  onChange={e => {
                    handleShapeChange(selectedShapeIndex, { ...s, closePath: e.currentTarget.checked });
                  }}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Smooth Curve" labelWidth={12}>
                <InlineSwitch
                  value={s.smoothCurve}
                  onChange={e => {
                    handleShapeChange(selectedShapeIndex, { ...s, smoothCurve: e.currentTarget.checked });
                  }}
                />
              </InlineField>
            </InlineFieldRow>
            {s.closePath && fillColorField}
          </VerticalGroup>
        );
      }
      
      case 'image': {
        const s = shape as ImageShape;
        return (
          <VerticalGroup>
            {commonFields}
            <InlineFieldRow>
              <InlineField label="Source Type" labelWidth={12}>
                <Select
                  options={[
                    { label: 'URL', value: 'url' },
                    { label: 'Base64', value: 'base64' },
                  ]}
                  value={s.sourceType}
                  onChange={v => {
                    handleShapeChange(selectedShapeIndex, { ...s, sourceType: v.value as 'url' | 'base64' });
                  }}
                  width={20}
                />
              </InlineField>
            </InlineFieldRow>
            <FieldConfigEditor 
              label="Source" 
              config={s.source} 
              fieldOptions={fieldOptions}
              onChange={source => handleShapeChange(selectedShapeIndex, { ...s, source })}
              numeric={false}
            />
            <FieldConfigEditor 
              label="X" 
              config={s.x} 
              fieldOptions={fieldOptions}
              onChange={x => handleShapeChange(selectedShapeIndex, { ...s, x })}
            />
            <FieldConfigEditor 
              label="Y" 
              config={s.y} 
              fieldOptions={fieldOptions}
              onChange={y => handleShapeChange(selectedShapeIndex, { ...s, y })}
            />
            <FieldConfigEditor 
              label="Width" 
              config={s.width} 
              fieldOptions={fieldOptions}
              onChange={width => handleShapeChange(selectedShapeIndex, { ...s, width })}
            />
            <FieldConfigEditor 
              label="Height" 
              config={s.height} 
              fieldOptions={fieldOptions}
              onChange={height => handleShapeChange(selectedShapeIndex, { ...s, height })}
            />
            <FieldConfigEditor 
              label="Rotation" 
              config={s.rotation} 
              fieldOptions={fieldOptions}
              onChange={rotation => handleShapeChange(selectedShapeIndex, { ...s, rotation })}
            />
          </VerticalGroup>
        );
      }
      
      case 'text': {
        const s = shape as TextShape;
        return (
          <VerticalGroup>
            {commonFields}
            <FieldConfigEditor 
              label="X" 
              config={s.x} 
              fieldOptions={fieldOptions}
              onChange={x => handleShapeChange(selectedShapeIndex, { ...s, x })}
            />
            <FieldConfigEditor 
              label="Y" 
              config={s.y} 
              fieldOptions={fieldOptions}
              onChange={y => handleShapeChange(selectedShapeIndex, { ...s, y })}
            />
            <FieldConfigEditor 
              label="Text" 
              config={s.text} 
              fieldOptions={fieldOptions}
              onChange={text => handleShapeChange(selectedShapeIndex, { ...s, text })}
              numeric={false}
            />
            <InlineFieldRow>
              <InlineField label="Text Size" labelWidth={16}>
                <Input
                  type="number"
                  value={s.textSize}
                  onChange={e => {
                    const val = parseFloat(e.currentTarget.value);
                    handleShapeChange(selectedShapeIndex, { ...s, textSize: val });
                  }}
                  min={1}
                  width={20}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Text Color" labelWidth={16}>
                <ColorPicker
                  color={s.textColor}
                  onChange={color => handleShapeChange(selectedShapeIndex, { ...s, textColor: color })}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="X Offset" labelWidth={16}>
                <Input
                  type="number"
                  value={s.xOffset}
                  onChange={e => {
                    const val = parseFloat(e.currentTarget.value);
                    handleShapeChange(selectedShapeIndex, { ...s, xOffset: val });
                  }}
                  width={20}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField label="Y Offset" labelWidth={16}>
                <Input
                  type="number"
                  value={s.yOffset}
                  onChange={e => {
                    const val = parseFloat(e.currentTarget.value);
                    handleShapeChange(selectedShapeIndex, { ...s, yOffset: val });
                  }}
                  width={20}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField 
                label="Format" 
                labelWidth={16}
                tooltip="Format to display numeric values (e.g., %05d, %.2f)"
              >
                <Input
                  type="text"
                  value={s.formatString}
                  onChange={e => {
                    handleShapeChange(selectedShapeIndex, { ...s, formatString: e.currentTarget.value });
                  }}
                  placeholder="%05d, %.2f etc."
                  width={20}
                />
              </InlineField>
            </InlineFieldRow>
            <InlineFieldRow>
              <InlineField 
                label="Unit" 
                labelWidth={16}
                tooltip="Unit to display after the value (e.g., ms, bytes)"
              >
                <Input
                  type="text"
                  value={s.unit}
                  onChange={e => {
                    handleShapeChange(selectedShapeIndex, { ...s, unit: e.currentTarget.value });
                  }}
                  placeholder="ms, bytes etc."
                  width={20}
                />
              </InlineField>
            </InlineFieldRow>
          </VerticalGroup>
        );
      }
    }
  };
  
  return (
    <div>
      <HorizontalGroup>
        <Select
          options={ShapeTypeOptions}
          onChange={v => {
            if (v.value) {
              handleAddShape(v.value);
            }
          }}
          placeholder="Add shape..."
          width={20}
        />
      </HorizontalGroup>
      
      {shapes.length > 0 && (
        <VerticalGroup spacing="md" style={{ marginTop: '16px' }}>
          <div>
            <FieldSet label="Shapes">
              {shapes.map((shape, i) => (
                <div key={shape.id} style={{ marginBottom: '8px' }}>
                  <HorizontalGroup>
                    {editingShapeIndex === i ? (
                      <Input
                        type="text"
                        defaultValue={shape.name}
                        onBlur={e => {
                          handleShapeChange(i, { ...shape, name: e.currentTarget.value });
                          setEditingShapeIndex(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleShapeChange(i, { ...shape, name: e.currentTarget.value });
                            setEditingShapeIndex(null);
                          } else if (e.key === 'Escape') {
                            setEditingShapeIndex(null);
                          }
                        }}
                        autoFocus
                        width={20}
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant={selectedShapeIndex === i ? 'primary' : 'secondary'}
                        onClick={() => setSelectedShapeIndex(i)}
                        onDoubleClick={() => setEditingShapeIndex(i)}
                        style={{ width: '200px', justifyContent: 'flex-start' }}
                      >
                        {shape.name}
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" icon="trash-alt" onClick={() => handleDeleteShape(i)} />
                  </HorizontalGroup>
                </div>
              ))}
            </FieldSet>
          </div>
          
          {selectedShapeIndex !== null && (
            <div>
              <FieldSet label="Shape Properties">
                {renderShapeEditor()}
              </FieldSet>
            </div>
          )}
        </VerticalGroup>
      )}
    </div>
  );
};
