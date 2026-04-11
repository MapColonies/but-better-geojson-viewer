import { useEffect, useRef } from 'react';
import type { LayerOption } from '../components/controls/types';
import {
	decodeCompressedBase64Url,
	encodeCompressedBase64Url,
} from '../utils/urlCompression';
import { getUrlState, setUrlState } from '../utils/urlState';

type UseLayersUrlSyncParams = {
	layers: LayerOption[];
	selectedLayers: string[];
	setSelectedLayers: (layerIds: string[]) => void;
};

const parseLayersParam = (value: string) => {
	const decoded = decodeCompressedBase64Url(value);
	const parsed = JSON.parse(decoded);
	if (!Array.isArray(parsed)) return null;
	return parsed.filter((entry): entry is string =>
		typeof entry === 'string' && entry.trim().length > 0,
	);
};

export function useLayersUrlSync({
	layers,
	selectedLayers,
	setSelectedLayers,
}: UseLayersUrlSyncParams) {
	const pendingLayerIdsRef = useRef<string[] | null>(null);
	const hasAppliedRef = useRef(false);
	const skipUrlSyncRef = useRef(true);

	useEffect(() => {
		const { layers: layersParam } = getUrlState();
		if (!layersParam) return;
		try {
			const parsed = parseLayersParam(layersParam);
			if (parsed) {
				pendingLayerIdsRef.current = parsed;
				hasAppliedRef.current = false;
			}
		} catch (error) {
			return;
		}
	}, []);

	useEffect(() => {
		if (hasAppliedRef.current) return;
		const pending = pendingLayerIdsRef.current;
		if (!pending) return;
		if (layers.length === 0) return;
		const availableIds = new Set(layers.map((layer) => layer.id));
		const filtered = pending.filter((layerId) => availableIds.has(layerId));
		pendingLayerIdsRef.current = null;
		hasAppliedRef.current = true;
		skipUrlSyncRef.current = true;
		setSelectedLayers(filtered);
	}, [layers, setSelectedLayers]);

	useEffect(() => {
		if (skipUrlSyncRef.current) {
			skipUrlSyncRef.current = false;
			return;
		}
		if (selectedLayers.length === 0) {
			setUrlState({ layers: null });
			return;
		}
		const encoded = encodeCompressedBase64Url(
			JSON.stringify(selectedLayers),
		);
		setUrlState({ layers: encoded });
	}, [selectedLayers]);
}
