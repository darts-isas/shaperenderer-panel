<img src="screenshots/display1.png" alt="Example panel output" width="400" align="right" />

# Shaperenderer Panel Plugin

Shaperenderer is a Grafana panel plugin that lets you compose interactive 2D graphics directly inside your dashboards. Shapes are rendered with p5.js, and every geometric property can be driven either by constants or by live metric data.

## Feature Highlights
- Combine points, lines, rectangles, ellipses, circles, triangles, quadrilaterals, polylines, images, and text in a single canvas.
- Bind any coordinate, size, or color setting to Grafana query results through per-field selectors.
- Control stroke, fill, opacity, layering, and visibility for each shape independently.
- Configure axes, grid, and view limits to frame your drawing area or let the panel auto-scale around incoming data.
- Render even when data frames are empty so you can prototype a layout before connecting real data.

## Development Setup
- `npm install` to install dependencies (requires Node 22 or newer as defined in `package.json`).
- `npm run dev` to start webpack in watch mode while you develop the plugin.
- `npm run build` to produce a production build in the `dist/` folder.
- `npm run lint`, `npm run typecheck`, and `npm run test` to keep the codebase clean.
- `npm run sign` to sign the plugin package before distribution.

## Using the Panel in Grafana
1. Copy the built plugin into Grafana’s plugin directory or use the development mode (`npm run dev`).
2. Add a new **Shaperenderer Panel** to a dashboard.
3. Open the panel options to begin adding shapes and wiring them to your data.

### Sample Output
![Sample rendering 1](screenshots/display1.png)
![Sample rendering 2](screenshots/display2.png)

## Shape Editor Walkthrough

The custom editor is organized around a shape picker, a shape list, dedicated editors for every geometry type, and general axis/view settings. The screenshots below show each section in order.

### 1. Shape Type Picker
<img src="screenshots/menu1_select1.png" alt="Shape type picker" width="250" />
Use the **Add shape…** dropdown to insert a new primitive. Each selection creates a shape with sensible defaults that you can immediately refine.

### 2. Shape Collection
<img src="screenshots/menu2_select2.png" alt="Shape collection" width="250" />
Manage the stack of shapes from the **Shapes** fieldset. Click a button to select a shape, double-click to rename it, or remove it with the trash icon. Shapes are rendered in the order shown.

### 3. Point Properties
<img src="screenshots/menu3_point.png" alt="Point shape editor" width="250" />
Configure a point’s `X`, `Y`, and `Point Size`. Every coordinate can pull from a constant or a query field, so you can place the point dynamically.

### 4. Line Properties
<img src="screenshots/menu4_line.png" alt="Line shape editor" width="250" />
Define the start (`X1`, `Y1`) and end (`X2`, `Y2`) coordinates of a line segment. Stroke color, stroke weight, and opacity come from the common fields at the top of every editor.

### 5. Rectangle Properties
<img src="screenshots/menu5_rectangle.png" alt="Rectangle shape editor" width="250" />
Set the rectangle center (`X`, `Y`), `Width`, `Height`, `Rotation`, and `Fill Color`. Link the geometry to time series to create responsive dashboards.

### 6. Ellipse Properties
<img src="screenshots/menu6_ellipse.png" alt="Ellipse shape editor" width="250" />
Similar to rectangles, ellipses expose `X`, `Y`, `Width`, `Height`, `Rotation`, and `Fill Color`, letting you turn numeric trends into animated ellipses.

### 7. Circle Properties
<img src="screenshots/menu7_circle.png" alt="Circle shape editor" width="250" />
Circles keep the configuration minimal: specify the center (`X`, `Y`) and the `Diameter`, then optionally bind those values to data.

### 8. Triangle Properties
<img src="screenshots/menu8_triangle.png" alt="Triangle shape editor" width="250" />
Triangles describe three vertices (`X1`/`Y1`, `X2`/`Y2`, `X3`/`Y3`). Pair them with fills to highlight dynamic areas of interest.

### 9. Quadrilateral Properties
<img src="screenshots/menu9_%20quadrilateral.png" alt="Quadrilateral shape editor" width="250" />
Quadrilaterals extend the triangle editor to four vertices (`X1`–`Y4`). Use them to plot polygons such as bounding boxes or heat-map cells.

### 10. Polyline Properties
<img src="screenshots/menu10_polyline.png" alt="Polyline shape editor" width="250" />
Provide comma-separated lists (or field-backed arrays) for `X Points` and `Y Points`. Toggle **Close Path** to connect the last and first points, and **Smooth Curve** to interpolate with bezier-like smoothing. Filled polylines become available when the path is closed.

### 11. Image Properties
<img src="screenshots/menu11_image.png" alt="Image shape editor" width="250" />
Render external imagery by choosing a `Source Type` (`url` or `base64`) and binding position, `Width`, `Height`, and `Rotation`. This is useful for placing icons or diagrams behind data-driven overlays.

### 12. Text Properties
<img src="screenshots/menu12_text.png" alt="Text shape editor" width="250" />
Text shapes combine position controls with data-bound content. Adjust `Text Size`, `Text Color`, `X/Y Offset`, and optional formatting (`Format`, `Unit`) to annotate the canvas with live metrics.

### 13. Axes & View Settings
<img src="screenshots/menu13_general.png" alt="General panel settings" width="250" />
The **General** category exposes the `Axes & Grid Settings` and `View Limits` editors. Toggle axes, pick colors, enable grids, and fine-tune the canvas bounds. Disable auto-scale when you want a fixed coordinate system.

## Data Binding Tips
- Every numeric input supports switching between `Const` and `Field`. When using a field, the panel stores the originating frame index so the correct query is referenced even with multiple data sources.
- Combine shapes with Grafana thresholding or alert data to produce interactive overlays.
- Because the panel keeps rendering without data, you can design the layout with constants first, then swap properties to pull from real metrics.

## License
Licensed under the GNU Lesser General Public License v3.0.

© 2025 ISAS/JAXA and [NAKAHIRA, Satoshi](https://orcid.org/0000-0001-9307-046X).

