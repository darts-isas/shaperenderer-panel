import { PanelPlugin } from '@grafana/data';
import { ShapeRendererOptions } from './types';
import { SimplePanel } from './components/SimplePanel';
import { ShapeEditor } from './components/ShapeEditor';
import { AxisConfigEditor, ViewLimitsEditor } from './components/ConfigEditors';

export const plugin = new PanelPlugin<ShapeRendererOptions>(SimplePanel)
  .setDefaults({
    shapes: [],
    axis: {
      showXAxis: true,
      showYAxis: true,
      xAxisColor: 'rgba(120, 120, 120, 0.9)', // Light gray with high opacity
      yAxisColor: 'rgba(120, 120, 120, 0.9)', // Light gray with high opacity
      showGrid: false, // デフォルトでグリッドを非表示に変更
      gridColor: 'rgba(120, 120, 120, 0.2)', // Light gray with low opacity
      gridSize: 20,
    },
    viewLimits: {
      autoScale: true,
      xMin: -100,
      xMax: 100,
      yMin: -100,
      yMax: 100,
    },
  })
  .setPanelOptions((builder) => {
    return builder
      .addCustomEditor({
        id: 'shapes',
        path: 'shapes',
        name: 'Shapes',
        description: 'Configure shapes to be rendered',
        category: ['Shapes'],
        editor: ShapeEditor,
      })
      .addCustomEditor({
        id: 'axisConfig',
        path: 'axis',
        name: 'Axes & Grid Settings',
        description: 'Configure axes and grid appearance',
        category: ['General'],
        editor: AxisConfigEditor,
      })
      .addCustomEditor({
        id: 'viewLimits',
        path: 'viewLimits',
        name: 'View Limits',
        description: 'Configure the visible area of the plot',
        category: ['General'],
        editor: ViewLimitsEditor,
      });
  });
