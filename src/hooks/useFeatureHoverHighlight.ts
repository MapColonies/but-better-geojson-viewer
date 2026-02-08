import { useEffect, useMemo, useRef } from 'react';
import type Feature from 'ol/Feature';
import type Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';
import { getFeatureHoverKey } from '../utils/featureHover';

type UseFeatureHoverHighlightParams = {
	mapRef: React.RefObject<Map | null>;
	vectorSource: VectorSource;
	hoveredKey: string | null;
};

const cloneFeature = (feature: Feature) => feature.clone();

export function useFeatureHoverHighlight({
	mapRef,
	vectorSource,
	hoveredKey,
}: UseFeatureHoverHighlightParams) {
	const highlightSourceRef = useRef(new VectorSource({ wrapX: false }));
	const highlightLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
	const highlightStyle = useMemo(
		() =>
			new Style({
				stroke: new Stroke({ color: '#ffb347', width: 3 }),
				fill: new Fill({ color: 'rgba(255, 179, 71, 0.25)' }),
				image: new CircleStyle({
					radius: 6,
					stroke: new Stroke({ color: '#ffb347', width: 2 }),
					fill: new Fill({ color: '#ffffff' }),
				}),
			}),
		[],
	);

	useEffect(() => {
		const map = mapRef.current;
		if (!map || highlightLayerRef.current) return;
		const highlightLayer = new VectorLayer({
			source: highlightSourceRef.current,
			style: highlightStyle,
			zIndex: 20,
		});
		map.addLayer(highlightLayer);
		highlightLayerRef.current = highlightLayer;
		return () => {
			map.removeLayer(highlightLayer);
			highlightLayerRef.current = null;
			highlightSourceRef.current.clear();
		};
	}, [highlightStyle, mapRef]);

	useEffect(() => {
		const highlightSource = highlightSourceRef.current;
		highlightSource.clear();
		if (!hoveredKey) return;
		const match = vectorSource
			.getFeatures()
			.find((feature) => getFeatureHoverKey(feature) === hoveredKey);
		if (!match) return;
		highlightSource.addFeature(cloneFeature(match));
	}, [hoveredKey, vectorSource]);
}
