import { useEffect, useMemo, useState } from 'react';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';

type LayerOption = {
	id: string;
	title: string;
	matrixSets: string[];
};

type WmtsLayer = {
	Identifier: string;
	Title?: string;
	TileMatrixSetLink?: { TileMatrixSet: string }[];
};

type UseWmtsCapabilitiesResult = {
	capabilities: Record<string, any> | null;
	layers: { id: string; title: string }[];
	selectedLayers: string[];
	setSelectedLayers: (layerIds: string[]) => void;
	selectedLayerTitle: string;
	capabilitiesError: string;
};

const capabilitiesCache = new Map<string, Record<string, any>>();
const capabilitiesPromiseCache = new Map<string, Promise<Record<string, any>>>();

export function useWmtsCapabilities(
	url: string,
	preferredCrs: string,
	apiKey?: string,
	defaultLayerIds?: string[],
): UseWmtsCapabilitiesResult {
	const [capabilities, setCapabilities] = useState<Record<
		string,
		any
	> | null>(null);
	const [layers, setLayers] = useState<LayerOption[]>([]);
	const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
	const [capabilitiesError, setCapabilitiesError] = useState('');

	useEffect(() => {
		let active = true;
		const loadCapabilities = async () => {
			try {
				setCapabilitiesError('');
				const cacheKey = `${url}::${apiKey ?? ''}`;
				let parsed = capabilitiesCache.get(cacheKey);
				if (!parsed) {
					let inFlight = capabilitiesPromiseCache.get(cacheKey);
					if (!inFlight) {
						inFlight = fetch(url, {
							headers: apiKey ? { 'x-api-key': apiKey } : undefined,
						})
							.then((response) => {
								if (!response.ok) {
									throw new Error(`HTTP ${response.status}`);
								}
								return response.text();
							})
							.then((text) => {
								const parser = new WMTSCapabilities();
								return parser.read(text) as Record<string, any>;
							});
						capabilitiesPromiseCache.set(cacheKey, inFlight);
					}
					parsed = await inFlight;
					capabilitiesCache.set(cacheKey, parsed);
				}
				if (!active) return;
				const contents = parsed?.Contents;
				const layerOptions: LayerOption[] = (
					(contents?.Layer ?? []) as WmtsLayer[]
				).map((layer) => ({
					id: layer.Identifier,
					title: layer.Title ?? layer.Identifier,
					matrixSets: (layer.TileMatrixSetLink ?? []).map(
						(link) => link.TileMatrixSet,
					),
				}));
				const validLayers = layerOptions.filter((layer) => layer.id);
				const configuredDefaults = (defaultLayerIds ?? [])
					.map((value) => value.trim())
					.filter(Boolean);
				const resolvedDefaults = configuredDefaults.filter((layerId) =>
					validLayers.some((layer) => layer.id === layerId),
				);
				const defaultLayers =
					resolvedDefaults.length > 0
						? resolvedDefaults
						: validLayers[0]?.id
							? [validLayers[0].id]
							: [];
				setCapabilities(parsed);
				setLayers(validLayers);
				setSelectedLayers(defaultLayers);
			} catch (error) {
				const cacheKey = `${url}::${apiKey ?? ''}`;
				capabilitiesPromiseCache.delete(cacheKey);
				const message =
					error instanceof Error ? error.message : 'Unknown error';
				setCapabilitiesError(
					`Failed to load WMTS capabilities: ${message}`,
				);
			}
		};
		loadCapabilities();
		return () => {
			active = false;
		};
	}, [apiKey, defaultLayerIds, preferredCrs, url]);

	const selectedLayerTitle = useMemo(() => {
		if (selectedLayers.length === 0) return 'WMTS';
		if (selectedLayers.length === 1) {
			return (
				layers.find((layer) => layer.id === selectedLayers[0])?.title ??
				'WMTS'
			);
		}
		return `${selectedLayers.length} layers selected`;
	}, [layers, selectedLayers]);

	return {
		capabilities,
		layers: layers.map((layer) => ({ id: layer.id, title: layer.title })),
		selectedLayers,
		setSelectedLayers,
		selectedLayerTitle,
		capabilitiesError,
	};
}
