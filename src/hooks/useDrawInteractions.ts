import { useEffect, useRef } from 'react';
import Draw, { createBox } from 'ol/interaction/Draw';
import type Map from 'ol/Map';
import type VectorSource from 'ol/source/Vector';
import type { DrawMode } from '../types/map';

type UseDrawInteractionsParams = {
	mapRef: React.RefObject<Map | null>;
	vectorSource: VectorSource;
	drawMode: DrawMode;
	onDrawEnd: () => void;
};

export function useDrawInteractions({
	mapRef,
	vectorSource,
	drawMode,
	onDrawEnd,
}: UseDrawInteractionsParams) {
	const drawRef = useRef<Draw | null>(null);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;
		if (drawRef.current) {
			map.removeInteraction(drawRef.current);
			drawRef.current = null;
		}
		if (drawMode === 'None') return;
		const draw = new Draw({
			source: vectorSource,
			type: drawMode === 'Box' ? 'Circle' : drawMode,
			geometryFunction: drawMode === 'Box' ? createBox() : undefined,
		});
		draw.on('drawend', onDrawEnd);
		map.addInteraction(draw);
		drawRef.current = draw;
		return () => {
			if (!drawRef.current) return;
			map.removeInteraction(drawRef.current);
			drawRef.current = null;
		};
	}, [drawMode, mapRef, onDrawEnd, vectorSource]);
}
