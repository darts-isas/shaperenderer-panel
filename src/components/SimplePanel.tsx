import * as React from 'react';
import { PanelProps } from '@grafana/data';
import { ShapeRendererOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { P5Canvas } from './P5Canvas';

interface Props extends PanelProps<ShapeRendererOptions> {}

const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans;
      position: relative;
      overflow: hidden;
    `,
    canvas: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    noData: css`
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    `,
  };
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, fieldConfig, id }) => {
  const styles = useStyles2(getStyles);

  if (data.state === 'Error') {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} />;
  }

  // Even if there's no data, we'll still render the panel with empty data
  // so users can add shapes before connecting to a data source

  // Use default options if not provided
  const defaultOptions: ShapeRendererOptions = {
    shapes: [],
    axis: {
      showXAxis: true,
      showYAxis: true,
      xAxisColor: 'var(--color-text)',
      yAxisColor: 'var(--color-text)',
      showGrid: true,
      gridColor: 'rgba(0, 0, 0, 0.1)',
      gridSize: 20,
    },
    viewLimits: {
      autoScale: true,
      xMin: -100,
      xMax: 100,
      yMin: -100,
      yMax: 100,
    },
  };

  const panelOptions = {
    ...defaultOptions,
    ...options,
  };

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <div className={styles.canvas}>
        <P5Canvas
          options={panelOptions}
          data={data}
          width={width}
          height={height}
        />
      </div>
    </div>
  );
};
