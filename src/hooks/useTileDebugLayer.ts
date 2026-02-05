import { useEffect, useRef } from 'react';
import TileLayer from 'ol/layer/Tile';
import TileDebug from 'ol/source/TileDebug';
import WMTS from 'ol/source/WMTS';
import type Map from 'ol/Map';

type UseTileDebugLayerParams = {
	mapRef: React.RefObject<Map | null>;
	enabled: boolean;
	projection: string;
	selectedLayerIds: string[];
};

export function useTileDebugLayer({
	mapRef,
	enabled,
	projection,
	selectedLayerIds,
}: UseTileDebugLayerParams) {
	const layerRef = useRef<TileLayer<TileDebug> | null>(null);
	const projectionRef = useRef('');

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		if (!enabled) {
			if (layerRef.current) {
				map.removeLayer(layerRef.current);
				layerRef.current = null;
			}
			projectionRef.current = '';
			return;
		}

		const needsRefresh =
			!layerRef.current || projectionRef.current !== projection;
		if (needsRefresh) {
			if (layerRef.current) {
				map.removeLayer(layerRef.current);
			}
			const wmtsSource = map
				.getLayers()
				.getArray()
				.slice()
				.reverse()
				.map((layer) =>
					layer instanceof TileLayer ? layer.getSource() : null,
				)
				.find((source) => source instanceof WMTS) as WMTS | undefined;
			const source = new TileDebug({
				projection,
				source: wmtsSource,
				template: 'z:{z} x:{x} y:{y} -y:{-y}',
				color: 'rgba(29, 27, 22, 0.7)',
			});
			const layer = new TileLayer({ source });
			layer.setZIndex(1000);
			layerRef.current = layer;
			projectionRef.current = projection;
			map.addLayer(layer);
		}

		return () => {
			if (layerRef.current) {
				map.removeLayer(layerRef.current);
				layerRef.current = null;
			}
			projectionRef.current = '';
		};
	}, [enabled, mapRef, projection, selectedLayerIds]);
}
