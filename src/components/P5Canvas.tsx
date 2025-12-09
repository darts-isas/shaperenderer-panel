import * as React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import p5 from 'p5';
import { PanelData } from '@grafana/data';
import { 
  ShapeRendererOptions,
  FieldConfig,
  PointShape,
  LineShape,
  RectangleShape,
  EllipseShape,
  CircleShape,
  TriangleShape,
  QuadShape,
  PolylineShape,
  ImageShape,
  TextShape
} from '../types';

interface P5CanvasProps {
  options: ShapeRendererOptions;
  data: PanelData;
  width: number;
  height: number;
}

export const P5Canvas: React.FC<P5CanvasProps> = ({ options, data, width, height }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<p5>();
  const [hasError, setHasError] = useState(false);
  
  // Reset error state when props change
  useEffect(() => {
    setHasError(false);
  }, [options, data, width, height]);

  // Helper function to get value from field config
  const getValueFromConfig = useCallback((config: FieldConfig, frame: any): number | string => {
    try {
      if (config.type === 'constant') {
        return config.constant !== undefined ? config.constant : 0;
      } else if (config.type === 'field' && config.field) {
        // 指定されたframeIndexがある場合はそのフレームを使用、なければデフォルトで最初のフレーム
        const frameIndex = config.frameIndex !== undefined ? config.frameIndex : 0;
        // 対応するフレーム（クエリ結果）が存在するか確認
        const targetFrame = data.series[frameIndex] || frame;

        if (targetFrame && targetFrame.fields) {
          const field = targetFrame.fields.find((f: any) => f.name === config.field);
          if (field && field.values && field.values.length > 0) {
            const value = field.values[field.values.length - 1];
            // Ensure we return a valid number or string
            return (value !== null && value !== undefined) ? value : 0;
          }
        }
      }
      return 0;
    } catch (error) {
      console.error('Error in getValueFromConfig:', error);
      return 0; // Return default value on error
    }
  }, [data.series]);

  // Helper to get array values from a string or field
  const getArrayFromConfig = useCallback((config: FieldConfig, frame: any): number[] => {
    try {
      if (config.type === 'constant' && typeof config.constant === 'string') {
        // Handle empty string case
        if (!config.constant.trim()) {
          return [];
        }
        // Parse numbers safely
        return config.constant.split(',')
          .map(val => {
            const num = parseFloat(val.trim());
            return isNaN(num) ? 0 : num;
          });
      } else if (config.type === 'field' && config.field) {
        // 指定されたframeIndexがある場合はそのフレームを使用、なければデフォルトで最初のフレーム
        const frameIndex = config.frameIndex !== undefined ? config.frameIndex : 0;
        // 対応するフレーム（クエリ結果）が存在するか確認
        const targetFrame = data.series[frameIndex] || frame;

        if (targetFrame && targetFrame.fields) {
          const field = targetFrame.fields.find((f: any) => f.name === config.field);
          if (field && field.values && field.values.length > 0) {
            // ケース1: 最後の値が配列の場合（単一の配列値）
            const lastValue = field.values[field.values.length - 1];
            if (Array.isArray(lastValue)) {
              return lastValue.map(val => typeof val === 'number' ? val : parseFloat(val));
            }
            
            // ケース2: フィールド自体が配列値のコレクションの場合（各行が配列）
            // このケースは一般的なデータフレーム構造で、フィールド値がすべて数値の場合
            const numValues = Array.from(field.values).filter(v => v !== null && v !== undefined);
            if (numValues.length > 0 && typeof numValues[0] === 'number') {
              return numValues as number[];
            }
            
            // ケース3: 単一の値に複数の数値がカンマ区切りで含まれている場合
            if (typeof lastValue === 'string' && lastValue.includes(',')) {
              return lastValue.split(',').map(v => {
                const num = parseFloat(v.trim());
                return isNaN(num) ? 0 : num;
              });
            }
          }
        }
      }
      return [];
    } catch (error) {
      console.error('Error in getArrayFromConfig:', error);
      return []; // Return empty array on error
    }
  }, [data.series]);

  // Calculate and maintain aspect ratio for view limits
  const calculateAspectRatio = useCallback((
    minX: number, 
    maxX: number, 
    minY: number, 
    maxY: number, 
    canvasWidth: number, 
    canvasHeight: number, 
    isAuto: boolean
  ): { minX: number; maxX: number; minY: number; maxY: number } => {
    // Calculate current aspect ratios
    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;
    const dataAspectRatio = dataWidth / dataHeight;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    
    // Default - return original bounds
    let newMinX = minX;
    let newMaxX = maxX;
    let newMinY = minY;
    let newMaxY = maxY;

    // Always maintain the aspect ratio to match the panel dimensions
    if (dataAspectRatio > canvasAspectRatio) {
      // Data is wider than canvas - adjust Y to match canvas ratio
      const targetHeight = dataWidth / canvasAspectRatio;
      const diff = targetHeight - dataHeight;
      newMinY = minY - diff / 2;
      newMaxY = maxY + diff / 2;
    } else {
      // Data is taller than canvas - adjust X to match canvas ratio
      const targetWidth = dataHeight * canvasAspectRatio;
      const diff = targetWidth - dataWidth;
      newMinX = minX - diff / 2;
      newMaxX = maxX + diff / 2;
    }
    
    return {
      minX: newMinX,
      maxX: newMaxX,
      minY: newMinY,
      maxY: newMaxY,
    };
  }, []);

  // Draw empty canvas with just axes and grid
  const drawEmptyCanvas = useCallback((p: p5, width: number, height: number, options: ShapeRendererOptions) => {
    const { viewLimits, axis } = options;
    let minX = viewLimits.xMin;
    let maxX = viewLimits.xMax;
    let minY = viewLimits.yMin;
    let maxY = viewLimits.yMax;
    
    // Apply aspect ratio to empty canvas as well
    const adjustedLimits = calculateAspectRatio(
      minX, maxX, minY, maxY, width, height, viewLimits.autoScale
    );
    minX = adjustedLimits.minX;
    maxX = adjustedLimits.maxX;
    minY = adjustedLimits.minY;
    maxY = adjustedLimits.maxY;

    // Set up scaling function to map data coordinates to screen coordinates
    const mapX = (x: number) => p.map(x, minX, maxX, 0, width);
    const mapY = (y: number) => p.map(y, minY, maxY, height, 0); // Invert Y axis

    // Draw grid if enabled
    if (axis.showGrid) {
      p.stroke(axis.gridColor);
      p.strokeWeight(0.5);
      
      const gridSize = axis.gridSize;
      const xStart = Math.floor(minX / gridSize) * gridSize;
      const yStart = Math.floor(minY / gridSize) * gridSize;
      
      // Draw vertical grid lines
      for (let x = xStart; x <= maxX; x += gridSize) {
        p.line(mapX(x), 0, mapX(x), height);
      }
      
      // Draw horizontal grid lines
      for (let y = yStart; y <= maxY; y += gridSize) {
        p.line(0, mapY(y), width, mapY(y));
      }
    }

    // Draw axes if enabled
    if (axis.showXAxis) {
      p.stroke(axis.xAxisColor);
      p.strokeWeight(2);
      const yZero = mapY(0);
      if (yZero >= 0 && yZero <= height) {
        p.line(0, yZero, width, yZero);
      }
    }
    
    if (axis.showYAxis) {
      p.stroke(axis.yAxisColor);
      p.strokeWeight(2);
      const xZero = mapX(0);
      if (xZero >= 0 && xZero <= width) {
        p.line(xZero, 0, xZero, height);
      }
    }
  }, [calculateAspectRatio]);

  // Helper function to load images (defined inline where needed)

  useEffect(() => {
    if (!canvasRef.current || hasError) { return () => {}; } // return empty cleanup function

    // Clear existing sketch if any
    if (sketchRef.current) {
      try {
        sketchRef.current.remove();
      } catch (err) {
        console.error('Error removing previous sketch:', err);
      }
    }

    // Create the sketch with a slight delay to ensure clean setup
    const timeoutId = setTimeout(() => {
      try {
        // Create a new sketch
        const sketch = new p5((p: p5) => {
          // Load images before setup
          const images: Record<string, p5.Image> = {};

          p.setup = () => {
            try {
              p.createCanvas(width, height);
              p.angleMode(p.DEGREES);
              
              // Load images synchronously to avoid fetch errors
              if (data.series.length > 0) {
                const frame = data.series[0];
                
                // Process image shapes but defer loading until later
                // This prevents the "Failed to fetch" error from sketch_verifier.js
                const imagesToLoad: Array<{id: string, path: string}> = [];
                
                for (const shape of options.shapes) {
                  if (shape.type === 'image') {
                    const imgShape = shape as ImageShape;
                    let imgPath: string | undefined;
                    if (imgShape.source.type === 'constant') {
                      imgPath = imgShape.source.constant?.toString();
                    } else if (imgShape.source.type === 'field') {
                      const field = frame.fields.find((f: any) => f.name === imgShape.source.field);
                      if (field && field.values && field.values.length > 0) {
                        imgPath = field.values[field.values.length - 1]?.toString();
                      }
                    }
                    if (imgPath) {
                      imagesToLoad.push({id: shape.id, path: imgPath});
                    }
                  }
                }
                
                // Load images synchronously if needed
                if (imagesToLoad.length > 0) {
                  imagesToLoad.forEach(img => {
                    p.loadImage(
                      img.path, 
                      // Success callback
                      (loadedImg) => {
                        images[img.id] = loadedImg;
                      },
                      // Error callback
                      (err) => {
                        console.warn(`Failed to load image ${img.path}:`, err);
                      }
                    );
                  });
                }
              }
            } catch (err) {
              console.error('Error in setup:', err);
              setHasError(true);
            }
          };

          // Fix for resizing issues - ensure canvas is updated properly
          p.windowResized = () => {
            p.resizeCanvas(width, height);
          };
          
          p.draw = () => {
            try {
              p.clear();
              p.background(255, 255, 255, 0); // Transparent background
              
              // Make sure canvas size is correct
              if (p.width !== width || p.height !== height) {
                p.resizeCanvas(width, height);
              }

              if (data.series.length === 0 || options.shapes.length === 0) {
                // Draw empty canvas with grid if there's no data or shapes
                drawEmptyCanvas(p, width, height, options);
                return;
              }

              const frame = data.series[0];
              const { viewLimits, axis } = options;

              // Calculate view bounds
              let minX = viewLimits.autoScale ? Number.MAX_VALUE : viewLimits.xMin;
              let maxX = viewLimits.autoScale ? Number.MIN_VALUE : viewLimits.xMax;
              let minY = viewLimits.autoScale ? Number.MAX_VALUE : viewLimits.yMin;
              let maxY = viewLimits.autoScale ? Number.MIN_VALUE : viewLimits.yMax;

              // If autoscaling, find min/max values from all shapes
              if (viewLimits.autoScale) {
                // If there are no shapes or no visible shapes, use default view limits
                let hasVisibleShapes = false;
                
                options.shapes.forEach(shape => {
                  if (!shape.visible) { return; }
                  hasVisibleShapes = true;

                  switch (shape.type) {
                    case 'point': {
                      const x = getValueFromConfig((shape as PointShape).x, frame) as number;
                      const y = getValueFromConfig((shape as PointShape).y, frame) as number;
                      minX = Math.min(minX, x);
                      maxX = Math.max(maxX, x);
                      minY = Math.min(minY, y);
                      maxY = Math.max(maxY, y);
                      break;
                    }
                    case 'line': {
                      const s = shape as LineShape;
                      const x1 = getValueFromConfig(s.x1, frame) as number;
                      const y1 = getValueFromConfig(s.y1, frame) as number;
                      const x2 = getValueFromConfig(s.x2, frame) as number;
                      const y2 = getValueFromConfig(s.y2, frame) as number;
                      minX = Math.min(minX, x1, x2);
                      maxX = Math.max(maxX, x1, x2);
                      minY = Math.min(minY, y1, y2);
                      maxY = Math.max(maxY, y1, y2);
                      break;
                    }
                    case 'rectangle':
                    case 'ellipse': {
                      const s = shape as RectangleShape | EllipseShape;
                      const x = getValueFromConfig(s.x, frame) as number;
                      const y = getValueFromConfig(s.y, frame) as number;
                      const w = getValueFromConfig(s.width, frame) as number;
                      const h = getValueFromConfig(s.height, frame) as number;
                      minX = Math.min(minX, x - w / 2);
                      maxX = Math.max(maxX, x + w / 2);
                      minY = Math.min(minY, y - h / 2);
                      maxY = Math.max(maxY, y + h / 2);
                      break;
                    }
                    case 'circle': {
                      const s = shape as CircleShape;
                      const x = getValueFromConfig(s.x, frame) as number;
                      const y = getValueFromConfig(s.y, frame) as number;
                      const d = getValueFromConfig(s.diameter, frame) as number;
                      minX = Math.min(minX, x - d / 2);
                      maxX = Math.max(maxX, x + d / 2);
                      minY = Math.min(minY, y - d / 2);
                      maxY = Math.max(maxY, y + d / 2);
                      break;
                    }
                    case 'triangle': {
                      const s = shape as TriangleShape;
                      const x1 = getValueFromConfig(s.x1, frame) as number;
                      const y1 = getValueFromConfig(s.y1, frame) as number;
                      const x2 = getValueFromConfig(s.x2, frame) as number;
                      const y2 = getValueFromConfig(s.y2, frame) as number;
                      const x3 = getValueFromConfig(s.x3, frame) as number;
                      const y3 = getValueFromConfig(s.y3, frame) as number;
                      minX = Math.min(minX, x1, x2, x3);
                      maxX = Math.max(maxX, x1, x2, x3);
                      minY = Math.min(minY, y1, y2, y3);
                      maxY = Math.max(maxY, y1, y2, y3);
                      break;
                    }
                    case 'quad': {
                      const s = shape as QuadShape;
                      const x1 = getValueFromConfig(s.x1, frame) as number;
                      const y1 = getValueFromConfig(s.y1, frame) as number;
                      const x2 = getValueFromConfig(s.x2, frame) as number;
                      const y2 = getValueFromConfig(s.y2, frame) as number;
                      const x3 = getValueFromConfig(s.x3, frame) as number;
                      const y3 = getValueFromConfig(s.y3, frame) as number;
                      const x4 = getValueFromConfig(s.x4, frame) as number;
                      const y4 = getValueFromConfig(s.y4, frame) as number;
                      minX = Math.min(minX, x1, x2, x3, x4);
                      maxX = Math.max(maxX, x1, x2, x3, x4);
                      minY = Math.min(minY, y1, y2, y3, y4);
                      maxY = Math.max(maxY, y1, y2, y3, y4);
                      break;
                    }
                    case 'polyline': {
                      const s = shape as PolylineShape;
                      const xPoints = getArrayFromConfig(s.xPoints, frame);
                      const yPoints = getArrayFromConfig(s.yPoints, frame);
                      
                      // 座標の個数は少ない方に合わせる
                      const pointCount = Math.min(xPoints.length, yPoints.length);
                      
                      for (let i = 0; i < pointCount; i++) {
                        minX = Math.min(minX, xPoints[i]);
                        maxX = Math.max(maxX, xPoints[i]);
                        minY = Math.min(minY, yPoints[i]);
                        maxY = Math.max(maxY, yPoints[i]);
                      }
                      break;
                    }
                    case 'image': {
                      const s = shape as ImageShape;
                      const x = getValueFromConfig(s.x, frame) as number;
                      const y = getValueFromConfig(s.y, frame) as number;
                      const w = getValueFromConfig(s.width, frame) as number;
                      const h = getValueFromConfig(s.height, frame) as number;
                      minX = Math.min(minX, x - w / 2);
                      maxX = Math.max(maxX, x + w / 2);
                      minY = Math.min(minY, y - h / 2);
                      maxY = Math.max(maxY, y + h / 2);
                      break;
                    }
                    case 'text': {
                      const s = shape as TextShape;
                      const x = getValueFromConfig(s.x, frame) as number;
                      const y = getValueFromConfig(s.y, frame) as number;
                      // テキストはポイントとして扱い、座標を考慮する
                      minX = Math.min(minX, x);
                      maxX = Math.max(maxX, x);
                      minY = Math.min(minY, y);
                      maxY = Math.max(maxY, y);
                      break;
                    }
                  }
                });

                // If no visible shapes were found, use default limits
                if (!hasVisibleShapes) {
                  minX = viewLimits.xMin;
                  maxX = viewLimits.xMax;
                  minY = viewLimits.yMin;
                  maxY = viewLimits.yMax;
                } else {
                  // Add some padding
                  const paddingX = (maxX - minX) * 0.05;
                  const paddingY = (maxY - minY) * 0.05;
                  minX -= paddingX;
                  maxX += paddingX;
                  minY -= paddingY;
                  maxY += paddingY;
                }
              }

              // Fix bounds if min equals max
              if (minX === maxX) { minX -= 10; maxX += 10; }
              if (minY === maxY) { minY -= 10; maxY += 10; }

              // Maintain aspect ratio
              const { minX: adjustedMinX, maxX: adjustedMaxX, minY: adjustedMinY, maxY: adjustedMaxY } = 
                calculateAspectRatio(minX, maxX, minY, maxY, width, height, viewLimits.autoScale);
              minX = adjustedMinX;
              maxX = adjustedMaxX;
              minY = adjustedMinY;
              maxY = adjustedMaxY;

              // Set up scaling function to map data coordinates to screen coordinates
              const mapX = (x: number) => p.map(x, minX, maxX, 0, width);
              const mapY = (y: number) => p.map(y, minY, maxY, height, 0); // Invert Y axis

              // Draw grid if enabled
              if (axis.showGrid) {
                p.stroke(axis.gridColor);
                p.strokeWeight(0.5);
                
                const gridSize = axis.gridSize;
                const xStart = Math.floor(minX / gridSize) * gridSize;
                const yStart = Math.floor(minY / gridSize) * gridSize;
                
                // Draw vertical grid lines
                for (let x = xStart; x <= maxX; x += gridSize) {
                  p.line(mapX(x), 0, mapX(x), height);
                }
                
                // Draw horizontal grid lines
                for (let y = yStart; y <= maxY; y += gridSize) {
                  p.line(0, mapY(y), width, mapY(y));
                }
              }

              // Draw axes if enabled
              if (axis.showXAxis) {
                p.stroke(axis.xAxisColor);
                p.strokeWeight(2);
                const yZero = mapY(0);
                if (yZero >= 0 && yZero <= height) {
                  p.line(0, yZero, width, yZero);
                }
              }
              
              if (axis.showYAxis) {
                p.stroke(axis.yAxisColor);
                p.strokeWeight(2);
                const xZero = mapX(0);
                if (xZero >= 0 && xZero <= width) {
                  p.line(xZero, 0, xZero, height);
                }
              }

              // Draw each shape
              options.shapes.forEach(shape => {
                if (!shape.visible) { return; }

                // Common style settings
                p.stroke(shape.strokeColor);
                p.strokeWeight(shape.strokeWeight);
                p.fill(255, 255, 255, 0); // Default transparent fill

                // Set opacity
                const alpha = shape.opacity * 255;

                switch (shape.type) {
                  case 'point': {
                    const s = shape as PointShape;
                    const x = getValueFromConfig(s.x, frame) as number;
                    const y = getValueFromConfig(s.y, frame) as number;
                    
                    p.strokeWeight(s.pointSize);
                    p.point(mapX(x), mapY(y));
                    break;
                  }
                  case 'line': {
                    const s = shape as LineShape;
                    const x1 = getValueFromConfig(s.x1, frame) as number;
                    const y1 = getValueFromConfig(s.y1, frame) as number;
                    const x2 = getValueFromConfig(s.x2, frame) as number;
                    const y2 = getValueFromConfig(s.y2, frame) as number;
                    
                    p.line(mapX(x1), mapY(y1), mapX(x2), mapY(y2));
                    break;
                  }
                  case 'rectangle': {
                    const s = shape as RectangleShape;
                    const x = getValueFromConfig(s.x, frame) as number;
                    const y = getValueFromConfig(s.y, frame) as number;
                    const w = getValueFromConfig(s.width, frame) as number;
                    const h = getValueFromConfig(s.height, frame) as number;
                    const rotation = getValueFromConfig(s.rotation, frame) as number;
                    
                    if (s.fillColor) {
                      const fillColor = p.color(s.fillColor);
                      fillColor.setAlpha(alpha);
                      p.fill(fillColor);
                    }
                    
                    // Calculate width and height in screen coordinates
                    const screenWidth = Math.abs(mapX(x + w/2) - mapX(x - w/2));
                    const screenHeight = Math.abs(mapY(y + h/2) - mapY(y - h/2));
                    
                    p.push();
                    p.translate(mapX(x), mapY(y));
                    p.rotate(rotation);
                    p.rectMode(p.CENTER);
                    p.rect(0, 0, screenWidth, screenHeight);
                    p.pop();
                    break;
                  }
                  case 'ellipse': {
                    const s = shape as EllipseShape;
                    const x = getValueFromConfig(s.x, frame) as number;
                    const y = getValueFromConfig(s.y, frame) as number;
                    const w = getValueFromConfig(s.width, frame) as number;
                    const h = getValueFromConfig(s.height, frame) as number;
                    const rotation = getValueFromConfig(s.rotation, frame) as number;
                    
                    if (s.fillColor) {
                      const fillColor = p.color(s.fillColor);
                      fillColor.setAlpha(alpha);
                      p.fill(fillColor);
                    }
                    
                    // Calculate width and height in screen coordinates
                    const screenWidth = Math.abs(mapX(x + w/2) - mapX(x - w/2));
                    const screenHeight = Math.abs(mapY(y + h/2) - mapY(y - h/2));
                    
                    p.push();
                    p.translate(mapX(x), mapY(y));
                    p.rotate(rotation);
                    p.ellipseMode(p.CENTER);
                    p.ellipse(0, 0, screenWidth, screenHeight);
                    p.pop();
                    break;
                  }
                  case 'circle': {
                    const s = shape as CircleShape;
                    const x = getValueFromConfig(s.x, frame) as number;
                    const y = getValueFromConfig(s.y, frame) as number;
                    const diameter = getValueFromConfig(s.diameter, frame) as number;
                    
                    if (s.fillColor) {
                      const fillColor = p.color(s.fillColor);
                      fillColor.setAlpha(alpha);
                      p.fill(fillColor);
                    }
                    
                    p.ellipseMode(p.CENTER);
                    // Calculate diameter in screen coordinates
                    const screenDiameter = Math.abs(mapX(x + diameter/2) - mapX(x - diameter/2));
                    p.circle(mapX(x), mapY(y), screenDiameter);
                    break;
                  }
                  case 'triangle': {
                    const s = shape as TriangleShape;
                    const x1 = getValueFromConfig(s.x1, frame) as number;
                    const y1 = getValueFromConfig(s.y1, frame) as number;
                    const x2 = getValueFromConfig(s.x2, frame) as number;
                    const y2 = getValueFromConfig(s.y2, frame) as number;
                    const x3 = getValueFromConfig(s.x3, frame) as number;
                    const y3 = getValueFromConfig(s.y3, frame) as number;
                    
                    if (s.fillColor) {
                      const fillColor = p.color(s.fillColor);
                      fillColor.setAlpha(alpha);
                      p.fill(fillColor);
                    }
                    
                    p.triangle(
                      mapX(x1), mapY(y1),
                      mapX(x2), mapY(y2),
                      mapX(x3), mapY(y3)
                    );
                    break;
                  }
                  case 'quad': {
                    const s = shape as QuadShape;
                    const x1 = getValueFromConfig(s.x1, frame) as number;
                    const y1 = getValueFromConfig(s.y1, frame) as number;
                    const x2 = getValueFromConfig(s.x2, frame) as number;
                    const y2 = getValueFromConfig(s.y2, frame) as number;
                    const x3 = getValueFromConfig(s.x3, frame) as number;
                    const y3 = getValueFromConfig(s.y3, frame) as number;
                    const x4 = getValueFromConfig(s.x4, frame) as number;
                    const y4 = getValueFromConfig(s.y4, frame) as number;
                    
                    if (s.fillColor) {
                      const fillColor = p.color(s.fillColor);
                      fillColor.setAlpha(alpha);
                      p.fill(fillColor);
                    }
                    
                    p.quad(
                      mapX(x1), mapY(y1),
                      mapX(x2), mapY(y2),
                      mapX(x3), mapY(y3),
                      mapX(x4), mapY(y4)
                    );
                    break;
                  }
                  case 'polyline': {
                    const s = shape as PolylineShape;
                    const xPoints = getArrayFromConfig(s.xPoints, frame);
                    const yPoints = getArrayFromConfig(s.yPoints, frame);
                    
                    // 座標の個数は少ない方に合わせる
                    const pointCount = Math.min(xPoints.length, yPoints.length);
                    
                    if (pointCount < 2) { break; } // 少なくとも2点必要
                    
                    if (s.fillColor && s.closePath) {
                      const fillColor = p.color(s.fillColor);
                      fillColor.setAlpha(alpha);
                      p.fill(fillColor);
                    }
                    
                    p.beginShape();
                    
                    if (s.smoothCurve) {
                      // Need at least 3 points for a proper smooth curve
                      if (pointCount < 3) {
                        // Fall back to regular vertices for 2 points
                        for (let i = 0; i < pointCount; i++) {
                          p.vertex(mapX(xPoints[i]), mapY(yPoints[i]));
                        }
                      } else if (s.closePath) {
                        if (pointCount === 3) {
                          // Special case for exactly 3 points in a closed curve
                          // We need to repeat points in the right order for proper curve
                          p.curveVertex(mapX(xPoints[2]), mapY(yPoints[2])); // Last point as first control
                          
                          // Add all points
                          for (let i = 0; i < pointCount; i++) {
                            p.curveVertex(mapX(xPoints[i]), mapY(yPoints[i]));
                          }
                          
                          // Repeat first points to complete the curve
                          p.curveVertex(mapX(xPoints[0]), mapY(yPoints[0]));
                          p.curveVertex(mapX(xPoints[1]), mapY(yPoints[1]));
                        } else {
                          // For closed curves with 4+ points, we need to wrap around points for smooth connection
                          // Add the second-to-last point at the beginning for control
                          p.curveVertex(mapX(xPoints[pointCount-2]), mapY(yPoints[pointCount-2]));
                          
                          // Add all points
                          for (let i = 0; i < pointCount; i++) {
                            p.curveVertex(mapX(xPoints[i]), mapY(yPoints[i]));
                          }
                          
                          // Repeat first two points at the end to complete the smooth curve
                          p.curveVertex(mapX(xPoints[0]), mapY(yPoints[0]));
                          p.curveVertex(mapX(xPoints[1]), mapY(yPoints[1]));
                        }
                      } else {
                        // For open curves, duplicate first and last points as control points
                        // First point repeated as control point
                        p.curveVertex(mapX(xPoints[0]), mapY(yPoints[0]));
                        
                        // Add all points
                        for (let i = 0; i < pointCount; i++) {
                          p.curveVertex(mapX(xPoints[i]), mapY(yPoints[i]));
                        }
                        
                        // Last point repeated as control point
                        p.curveVertex(mapX(xPoints[pointCount-1]), mapY(yPoints[pointCount-1]));
                      }
                    } else {
                      // Regular non-smooth polyline
                      for (let i = 0; i < pointCount; i++) {
                        p.vertex(mapX(xPoints[i]), mapY(yPoints[i]));
                      }
                    }
                    
                    if (s.closePath) {
                      p.endShape(p.CLOSE);
                    } else {
                      p.endShape();
                    }
                    break;
                  }
                  case 'image': {
                    const s = shape as ImageShape;
                    const x = getValueFromConfig(s.x, frame) as number;
                    const y = getValueFromConfig(s.y, frame) as number;
                    const w = getValueFromConfig(s.width, frame) as number;
                    const h = getValueFromConfig(s.height, frame) as number;
                    const rotation = getValueFromConfig(s.rotation, frame) as number;
                    
                    const img = images[s.id];
                    if (img) {
                      p.push();
                      p.translate(mapX(x), mapY(y));
                      p.rotate(rotation);
                      p.imageMode(p.CENTER);
                      
                      // Calculate width and height in screen coordinates
                      const screenWidth = Math.abs(mapX(x + w/2) - mapX(x - w/2));
                      const screenHeight = Math.abs(mapY(y + h/2) - mapY(y - h/2));
                      
                      // Apply opacity
                      p.tint(255, alpha);
                      p.image(img, 0, 0, screenWidth, screenHeight);
                      p.noTint();
                      p.pop();
                    }
                    break;
                  }
                  case 'text': {
                    const s = shape as TextShape;
                    const x = getValueFromConfig(s.x, frame) as number;
                    const y = getValueFromConfig(s.y, frame) as number;
                    let textContent = getValueFromConfig(s.text, frame);
                    
                    // Apply numeric formatting
                    if (typeof textContent === 'number' && s.formatString) {
                      try {
                        // Basic format processing
                        if (s.formatString.includes('%d')) {
                          // Integer format
                          textContent = s.formatString.replace('%d', Math.round(textContent).toString());
                        } else if (s.formatString.includes('%.')) {
                          // Decimal format (e.g.: %.2f)
                          const match = s.formatString.match(/%.(\d+)f/);
                          if (match && match[1]) {
                            const precision = parseInt(match[1], 10);
                            textContent = s.formatString.replace(/%.(\d+)f/, textContent.toFixed(precision));
                          }
                        } else if (s.formatString.includes('%')) {
                          // Other simple formatting
                          textContent = s.formatString.replace(/%[a-z\d.]+/, textContent.toString());
                        }
                      } catch (e) {
                        console.error('Text format error:', e);
                      }
                    }
                    
                    // Add unit
                    if (s.unit && textContent !== undefined) {
                      textContent = `${textContent}${s.unit}`;
                    }
                    
                    p.push();
                    p.fill(s.textColor);
                    p.textSize(s.textSize);
                    p.textAlign(p.CENTER, p.CENTER);
                    
                    // テキストの描画（オフセット付き）
                    p.text(
                      textContent, 
                      mapX(x) + s.xOffset, 
                      mapY(y) + s.yOffset
                    );
                    
                    p.pop();
                    break;
                  }
                }
              });
            } catch (err) {
              console.error('Error in draw:', err);
              setHasError(true);
              p.noLoop(); // Stop the drawing loop if we have an error
            }
          };
        }, canvasRef.current as HTMLElement);

        sketchRef.current = sketch;
      } catch (err) {
        console.error('Error creating sketch:', err);
        setHasError(true);
      }
    }, 50); // Small delay to ensure cleanup is complete

    // Return cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (sketchRef.current) {
        try {
          sketchRef.current.remove();
        } catch (err) {
          console.error('Error removing sketch during cleanup:', err);
        }
      }
    };
  }, [options, data, width, height, drawEmptyCanvas, getArrayFromConfig, getValueFromConfig, calculateAspectRatio, hasError]);

  if (hasError) {
    return (
      <div style={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: 'rgba(255, 0, 0, 0.1)', 
        color: '#f00', 
        border: '1px solid #f00',
        borderRadius: '4px',
        padding: '10px',
        flexDirection: 'column'
      }}>
        <div>Error rendering canvas</div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>Check console for details</div>
      </div>
    );
  }

  return <div ref={canvasRef} style={{ width, height }} />;
};
