import { useCallback, useMemo, useRef, useState } from 'react';
import VectorSource from 'ol/source/Vector';
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

function App({ config }: AppProps) {
	const mapRef = useRef<HTMLDivElement | null>(null);
	const vectorSource = useMemo(() => new VectorSource({ wrapX: false }), []);
	const [drawType, setDrawType] = useState<DrawMode>('None');
	const [isTileDebugEnabled, setIsTileDebugEnabled] = useState(false);
	const [hoveredFeatureKey, setHoveredFeatureKey] = useState<string | null>(
		null,
	);
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

	useFeatureHoverHighlight({
		mapRef: mapInstanceRef,
		vectorSource,
		hoveredKey: hoveredFeatureKey,
	});

	const handleGeoJsonUpload = useCallback(
		async (file: File | null) => {
			if (!file) return;
			try {
				const content = await file.text();
				handleEditorChange(content, { fit: true });
			} catch (error) {
				console.error('Failed to read GeoJSON file', error);
			}
		},
		[handleEditorChange],
	);

	const handleGeoJsonPaste = useCallback(
		(value: string) => {
			handleEditorChange(value, { fit: true });
		},
		[handleEditorChange],
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
				onChange={handleEditorChange}
				onPaste={handleGeoJsonPaste}
				onHoverFeatureKey={setHoveredFeatureKey}
				error={geoJsonError}
			/>
		</div>
	);
}

export default App;
