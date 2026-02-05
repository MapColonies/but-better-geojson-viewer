import { useCallback, useEffect, useRef } from 'react';
import type Map from 'ol/Map';
import { getUrlState, setUrlState } from '../utils/urlState';

const formatNumber = (value: number, decimals = 6) =>
	Number.isFinite(value) ? Number(value.toFixed(decimals)).toString() : '';

const parseMapParam = (value: string) => {
	const [zoomRaw, xRaw, yRaw] = value.split(',');
	const zoom = Number.parseFloat(zoomRaw);
	const x = Number.parseFloat(xRaw);
	const y = Number.parseFloat(yRaw);
	if (!Number.isFinite(zoom) || !Number.isFinite(x) || !Number.isFinite(y)) {
		return null;
	}
	return { zoom, center: [x, y] as [number, number] };
};

export function useMapUrlSync(mapRef: React.RefObject<Map | null>) {
	const skipFirstSyncRef = useRef(false);
	const hasUserMovedRef = useRef(false);
	const markUserMoved = useCallback(() => {
		hasUserMovedRef.current = true;
	}, []);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;
		const { map: mapParam } = getUrlState();
		if (!mapParam) return;
		const parsed = parseMapParam(mapParam);
		if (!parsed) return;
		skipFirstSyncRef.current = true;
		const view = map.getView();
		view.setCenter(parsed.center);
		view.setZoom(parsed.zoom);
	}, [mapRef]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;
		const viewport = map.getViewport();
		const handleWheel = () => {
			markUserMoved();
		};
		const handleDrag = () => {
			markUserMoved();
		};
		viewport.addEventListener('wheel', handleWheel, { passive: true });
		map.on('pointerdrag', handleDrag);
		return () => {
			viewport.removeEventListener('wheel', handleWheel);
			map.un('pointerdrag', handleDrag);
		};
	}, [mapRef, markUserMoved]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;
		const view = map.getView();
		let timeoutId: number | null = null;
		const handleMoveEnd = () => {
			if (skipFirstSyncRef.current) {
				skipFirstSyncRef.current = false;
				return;
			}
			if (!hasUserMovedRef.current) return;
			if (timeoutId) {
				window.clearTimeout(timeoutId);
			}
			timeoutId = window.setTimeout(() => {
				const center = view.getCenter();
				const zoom = view.getZoom();
				if (!center || zoom === undefined || zoom === null) return;
				const mapValue = `${formatNumber(zoom)},${formatNumber(
					center[0],
				)},${formatNumber(center[1])}`;
				setUrlState({ map: mapValue });
			}, 200);
		};
		map.on('moveend', handleMoveEnd);
		return () => {
			map.un('moveend', handleMoveEnd);
			if (timeoutId) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [mapRef]);

	return { markUserMoved };
}
