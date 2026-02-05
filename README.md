# GeoJson Viewer

React + Vite + TypeScript map viewer built on OpenLayers. It loads WMTS capabilities, lets you toggle layers, and edit GeoJSON directly in the UI.

## Features

- WMTS capabilities loading with layer selection
- Optional `x-api-key` header for WMTS requests
- GeoJSON editor with draw tools
- OpenLayers map with zoom controls

## Getting started

```bash
npm install
npm run dev
```

## Configuration

Configuration is loaded in this order (later values override earlier ones):

1. `config/default.json`
2. `config/local.json`
3. `public/config/default.json` (runtime)
4. `public/config/local.json` (runtime)

### Runtime config

`public/config/default.json` and `public/config/local.json` are fetched on app boot, so you can change WMTS settings after deploy without rebuilding. Local overrides default.

### Config files

`config/default.json` provides the baseline configuration. You can add overrides in `config/local.json` (ignored by version control).

Example `public/config/local.json`:

```json
{
	"wmtsCapabilitiesUrl": "https://example.com/wmts?SERVICE=WMTS&REQUEST=GetCapabilities",
	"mapProjection": "EPSG:4326",
	"wmtsApiKey": "your-api-key",
	"defaultWmtsLayers": ["example-layer-id", "secondary-layer-id"]
}
```

## GeoJSON in URL

The app syncs GeoJSON to the URL using URL-safe base64 in the `geo` query param. The payload is minified JSON (no spaces/newlines). Pasting a URL with `?geo=...` loads the GeoJSON into the editor and map.

The current map view is stored in the `map` query param as `zoom,x,y` using `config.mapProjection` coordinates. The URL is ordered as `?map=...&geo=...` when both are present. The `map` param is only written after you drag or zoom the map. If `map` is not present, loading `geo` fits the view to the GeoJSON bbox.

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Assets / Icons

Some SVG icons are from [SVG Repo](https://www.svgrepo.com/)  
Licensed under the MIT License.
