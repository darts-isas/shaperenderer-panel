import * as React from 'react';
import { ColorPicker, InlineField, InlineFieldRow, InlineSwitch, Input } from '@grafana/ui';
import { AxisConfig, ViewLimits } from '../types';

interface AxisConfigEditorProps {
  value: AxisConfig;
  onChange: (value: AxisConfig) => void;
}

interface ViewLimitsEditorProps {
  value: ViewLimits;
  onChange: (value: ViewLimits) => void;
}

export const AxisConfigEditor: React.FC<AxisConfigEditorProps> = ({ value, onChange }) => {
  const { showXAxis, showYAxis, xAxisColor, yAxisColor, showGrid, gridColor, gridSize } = value;
  
  return (
    <>
      <InlineFieldRow>
        <InlineField label="Show X Axis" labelWidth={16}>
          <InlineSwitch
            value={showXAxis}
            onChange={e => onChange({ ...value, showXAxis: e.currentTarget.checked })}
          />
        </InlineField>
      </InlineFieldRow>
      
      <InlineFieldRow>
        <InlineField label="X Axis Color" labelWidth={16}>
          <ColorPicker
            color={xAxisColor}
            onChange={color => onChange({ ...value, xAxisColor: color })}
          />
        </InlineField>
      </InlineFieldRow>
      
      <InlineFieldRow>
        <InlineField label="Show Y Axis" labelWidth={16}>
          <InlineSwitch
            value={showYAxis}
            onChange={e => onChange({ ...value, showYAxis: e.currentTarget.checked })}
          />
        </InlineField>
      </InlineFieldRow>
      
      <InlineFieldRow>
        <InlineField label="Y Axis Color" labelWidth={16}>
          <ColorPicker
            color={yAxisColor}
            onChange={color => onChange({ ...value, yAxisColor: color })}
          />
        </InlineField>
      </InlineFieldRow>
      
      <InlineFieldRow>
        <InlineField label="Show Grid" labelWidth={16}>
          <InlineSwitch
            value={showGrid}
            onChange={e => onChange({ ...value, showGrid: e.currentTarget.checked })}
          />
        </InlineField>
      </InlineFieldRow>
      
      <InlineFieldRow>
        <InlineField label="Grid Color" labelWidth={16}>
          <ColorPicker
            color={gridColor}
            onChange={color => onChange({ ...value, gridColor: color })}
          />
        </InlineField>
      </InlineFieldRow>
      
      <InlineFieldRow>
        <InlineField label="Grid Size" labelWidth={16}>
          <Input
            type="number"
            value={gridSize}
            onChange={e => {
              const val = parseFloat(e.currentTarget.value);
              onChange({ ...value, gridSize: val });
            }}
            min={1}
            width={20}
          />
        </InlineField>
      </InlineFieldRow>
    </>
  );
};

export const ViewLimitsEditor: React.FC<ViewLimitsEditorProps> = ({ value, onChange }) => {
  const { autoScale, xMin, xMax, yMin, yMax } = value;
  
  return (
    <>
      <InlineFieldRow>
        <InlineField label="Auto Scale" labelWidth={16} tooltip="Automatically scale the view to fit all shapes">
          <InlineSwitch
            value={autoScale}
            onChange={e => onChange({ ...value, autoScale: e.currentTarget.checked })}
          />
        </InlineField>
      </InlineFieldRow>
      
      {!autoScale && (
        <>
          <InlineFieldRow>
            <InlineField label="X Min" labelWidth={16}>
              <Input
                type="number"
                value={xMin}
                onChange={e => {
                  const val = parseFloat(e.currentTarget.value);
                  onChange({ ...value, xMin: val });
                }}
                width={20}
              />
            </InlineField>
          </InlineFieldRow>
          
          <InlineFieldRow>
            <InlineField label="X Max" labelWidth={16}>
              <Input
                type="number"
                value={xMax}
                onChange={e => {
                  const val = parseFloat(e.currentTarget.value);
                  onChange({ ...value, xMax: val });
                }}
                width={20}
              />
            </InlineField>
          </InlineFieldRow>
          
          <InlineFieldRow>
            <InlineField label="Y Min" labelWidth={16}>
              <Input
                type="number"
                value={yMin}
                onChange={e => {
                  const val = parseFloat(e.currentTarget.value);
                  onChange({ ...value, yMin: val });
                }}
                width={20}
              />
            </InlineField>
          </InlineFieldRow>
          
          <InlineFieldRow>
            <InlineField label="Y Max" labelWidth={16}>
              <Input
                type="number"
                value={yMax}
                onChange={e => {
                  const val = parseFloat(e.currentTarget.value);
                  onChange({ ...value, yMax: val });
                }}
                width={20}
              />
            </InlineField>
          </InlineFieldRow>
        </>
      )}
    </>
  );
};
