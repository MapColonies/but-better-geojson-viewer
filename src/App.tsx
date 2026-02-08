import { useCallback, useMemo, useRef, useState } from 'react';
import VectorSource from 'ol/source/Vector';
import shp from 'shpjs';
import ControlsPanel from './components/ControlsPanel';
import DrawToolbar from './components/DrawToolbar';
import GeoJsonPanel from './components/GeoJsonPanel';
import MapCanvas from './components/MapCanvas';
import ZoomToolbar from './components/ZoomToolbar';
import { getPreferredCrs } from './config';
import type { AppConfig } from './config';
import type { DrawMode } from './types/map';
import { useDrawInteractions } from './hooks/useDrawInteractions';
import { useFeatureHoverHighlight } from './hooks/useFeatureHoverHighlight';
import { useGeoJsonSync } from './hooks/useGeoJsonSync';
import { useMapUrlSync } from './hooks/useMapUrlSync';
import { useMapInstance } from './hooks/useMapInstance';
import { useTileDebugLayer } from './hooks/useTileDebugLayer';
import { useWmtsCapabilities } from './hooks/useWmtsCapabilities';
import { useWmtsLayer } from './hooks/useWmtsLayer';

const MAX_VIEW_ZOOM = 20;

type AppProps = {
	config: AppConfig;
};

type GeoJsonObject = {
	type?: string;
	features?: unknown;
	geometry?: unknown;
};

const normalizeToFeatureCollection = (input: unknown) => {
	if (!input || typeof input !== 'object') return null;
	const value = input as GeoJsonObject;
	if (value.type === 'FeatureCollection' && Array.isArray(value.features)) {
		return value;
	}
	if (value.type === 'Feature') {
		return { type: 'FeatureCollection', features: [value] };
	}
	if (value.type && value.geometry === undefined && 'coordinates' in value) {
		return {
			type: 'FeatureCollection',
			features: [{ type: 'Feature', properties: {}, geometry: value }],
		};
	}
	return null;
};

const mergeFeatureCollections = (input: unknown) => {
	const collections = Array.isArray(input)
		? input.map((item) => normalizeToFeatureCollection(item)).filter(Boolean)
		: [normalizeToFeatureCollection(input)].filter(Boolean);
	if (collections.length === 0) return null;
	const features = collections.flatMap((collection) =>
		Array.isArray(collection?.features) ? collection.features : [],
	);
	if (features.length === 0) return null;
	return { type: 'FeatureCollection', features };
};

function App({ config }: AppProps) {
	const mapRef = useRef<HTMLDivElement | null>(null);
	const vectorSource = useMemo(() => new VectorSource({ wrapX: false }), []);
	const [drawType, setDrawType] = useState<DrawMode>('None');
	const [isTileDebugEnabled, setIsTileDebugEnabled] = useState(false);
	const [hoveredFeatureKey, setHoveredFeatureKey] = useState<string | null>(
		null,
	);
	const [uploadError, setUploadError] = useState('');
	const preferredCrs = useMemo(
		() => getPreferredCrs(config.mapProjection),
		[config.mapProjection],
	);

	const {
		capabilities,
		layers,
		selectedLayers,
		setSelectedLayers,
		selectedLayerTitle,
		capabilitiesError,
	} = useWmtsCapabilities(
		config.wmtsCapabilitiesUrl,
		preferredCrs,
		config.wmtsApiKey,
		config.defaultWmtsLayers,
	);

	const { mapRef: mapInstanceRef, modify } = useMapInstance({
		mapRef,
		vectorSource,
		projection: config.mapProjection,
		maxZoom: MAX_VIEW_ZOOM,
	});

	const { markUserMoved } = useMapUrlSync(mapInstanceRef);

	useWmtsLayer({
		mapRef: mapInstanceRef,
		capabilities,
		selectedLayers,
		apiKey: config.wmtsApiKey,
	});

	useTileDebugLayer({
		mapRef: mapInstanceRef,
		enabled: isTileDebugEnabled,
		projection: config.mapProjection,
		selectedLayerIds: selectedLayers,
	});

	const handleDrawEnd = useCallback(() => {
		setDrawType('None');
	}, []);

	useDrawInteractions({
		mapRef: mapInstanceRef,
		vectorSource,
		drawMode: drawType,
		onDrawEnd: handleDrawEnd,
	});

	const { geoJson, geoJsonError, handleEditorChange } = useGeoJsonSync({
		vectorSource,
		mapRef: mapInstanceRef,
		modify,
		projection: config.mapProjection,
	});

	const handleEditorChangeWithClear = useCallback(
		(value?: string, options?: { fit?: boolean }) => {
			if (uploadError) {
				setUploadError('');
			}
			handleEditorChange(value, options);
		},
		[handleEditorChange, uploadError],
	);

	useFeatureHoverHighlight({
		mapRef: mapInstanceRef,
		vectorSource,
		hoveredKey: hoveredFeatureKey,
	});

	const handleGeoJsonUpload = useCallback(
		async (file: File | null) => {
			if (!file) return;
			try {
				setUploadError('');
				const isZip =
					file.name.toLowerCase().endsWith('.zip') ||
					file.type === 'application/zip' ||
					file.type === 'application/x-zip-compressed';
				if (isZip) {
					const buffer = await file.arrayBuffer();
					const parsed = await shp(buffer);
					const normalized = mergeFeatureCollections(parsed);
					if (!normalized) {
						setUploadError('No features found in shapefile.');
						return;
					}
					const json = JSON.stringify(normalized, null, 2);
					handleEditorChangeWithClear(json, { fit: true });
					return;
				}
				const content = await file.text();
				handleEditorChangeWithClear(content, { fit: true });
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Unknown error';
				setUploadError(`Failed to read file: ${message}`);
			}
		},
		[handleEditorChangeWithClear],
	);

	const handleGeoJsonPaste = useCallback(
		(value: string) => {
			handleEditorChangeWithClear(value, { fit: true });
		},
		[handleEditorChangeWithClear],
	);

	const handleZoom = (delta: number) => {
		const map = mapInstanceRef.current;
		if (!map) return;
		markUserMoved();
		const view = map.getView();
		const currentZoom = view.getZoom() ?? 0;
		const minZoom = view.getMinZoom() ?? 0;
		const maxZoom = view.getMaxZoom() ?? MAX_VIEW_ZOOM;
		const nextZoom = Math.min(
			maxZoom,
			Math.max(minZoom, currentZoom + delta),
		);
		view.animate({ zoom: nextZoom, duration: 200 });
	};

	return (
		<div className='app'>
			<MapCanvas className='map' ref={mapRef} />
			<ControlsPanel
				capabilitiesError={capabilitiesError}
				selectedLayerTitle={selectedLayerTitle}
				layers={layers}
				selectedLayers={selectedLayers}
				onLayerChange={setSelectedLayers}
				onGeoJsonUpload={handleGeoJsonUpload}
				isTileDebugEnabled={isTileDebugEnabled}
				onToggleTileDebug={() =>
					setIsTileDebugEnabled((enabled) => !enabled)
				}
			/>
			<ZoomToolbar
				onZoomIn={() => handleZoom(1)}
				onZoomOut={() => handleZoom(-1)}
			/>
			<DrawToolbar drawMode={drawType} onChange={setDrawType} />
			<GeoJsonPanel
				value={geoJson}
				onChange={handleEditorChangeWithClear}
				onPaste={handleGeoJsonPaste}
				onHoverFeatureKey={setHoveredFeatureKey}
				error={uploadError || geoJsonError}
			/>
		</div>
	);
}

export default App;
