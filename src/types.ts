// Basic field connection configuration
export interface FieldConfig {
  type: 'constant' | 'field';
  constant?: string | number;
  field?: string;
  frameIndex?: number; // どのクエリ結果（データフレーム）からフィールドを取得するかを指定
}

// Shape types
export type ShapeType = 'point' | 'line' | 'rectangle' | 'ellipse' | 'circle' | 'triangle' | 'quad' | 'polyline' | 'image' | 'text';

// Base shape interface
interface BaseShape {
  id: string;
  type: ShapeType;
  name: string; // 形状の名前
  strokeColor: string;
  strokeWeight: number;
  opacity: number;
  visible: boolean;
}

// Point shape
export interface PointShape extends BaseShape {
  type: 'point';
  x: FieldConfig;
  y: FieldConfig;
  pointSize: number;
}

// Line shape
export interface LineShape extends BaseShape {
  type: 'line';
  x1: FieldConfig;
  y1: FieldConfig;
  x2: FieldConfig;
  y2: FieldConfig;
}

// Rectangle shape
export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  x: FieldConfig;
  y: FieldConfig;
  width: FieldConfig;
  height: FieldConfig;
  rotation: FieldConfig;
  fillColor: string;
}

// Ellipse shape
export interface EllipseShape extends BaseShape {
  type: 'ellipse';
  x: FieldConfig;
  y: FieldConfig;
  width: FieldConfig;
  height: FieldConfig;
  rotation: FieldConfig;
  fillColor: string;
}

// Circle shape
export interface CircleShape extends BaseShape {
  type: 'circle';
  x: FieldConfig;
  y: FieldConfig;
  diameter: FieldConfig;
  fillColor: string;
}

// Triangle shape
export interface TriangleShape extends BaseShape {
  type: 'triangle';
  x1: FieldConfig;
  y1: FieldConfig;
  x2: FieldConfig;
  y2: FieldConfig;
  x3: FieldConfig;
  y3: FieldConfig;
  fillColor: string;
}

// Quadrilateral shape
export interface QuadShape extends BaseShape {
  type: 'quad';
  x1: FieldConfig;
  y1: FieldConfig;
  x2: FieldConfig;
  y2: FieldConfig;
  x3: FieldConfig;
  y3: FieldConfig;
  x4: FieldConfig;
  y4: FieldConfig;
  fillColor: string;
}

// Polyline shape
export interface PolylineShape extends BaseShape {
  type: 'polyline';
  xPoints: FieldConfig;
  yPoints: FieldConfig;
  closePath: boolean;
  smoothCurve: boolean;
  fillColor: string;
}

// Image shape
export interface ImageShape extends BaseShape {
  type: 'image';
  source: FieldConfig;
  sourceType: 'url' | 'base64';
  x: FieldConfig;
  y: FieldConfig;
  width: FieldConfig;
  height: FieldConfig;
  rotation: FieldConfig;
}

// Text shape
export interface TextShape extends BaseShape {
  type: 'text';
  x: FieldConfig;
  y: FieldConfig;
  text: FieldConfig;
  textSize: number;
  textColor: string;
  xOffset: number;
  yOffset: number;
  formatString: string; // 数値フォーマット用 (例: "%05d", "%.2f")
  unit: string; // 単位 (例: "ms", "bytes")
}

// Union type of all shapes
export type Shape = 
  | PointShape 
  | LineShape 
  | RectangleShape 
  | EllipseShape 
  | CircleShape 
  | TriangleShape 
  | QuadShape 
  | PolylineShape 
  | ImageShape
  | TextShape;

// Axis and grid settings
export interface AxisConfig {
  showXAxis: boolean;
  showYAxis: boolean;
  xAxisColor: string;
  yAxisColor: string;
  showGrid: boolean;
  gridColor: string;
  gridSize: number;
}

// View limits settings
export interface ViewLimits {
  autoScale: boolean;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

// Main panel options
export interface ShapeRendererOptions {
  shapes: Shape[];
  axis: AxisConfig;
  viewLimits: ViewLimits;
}
