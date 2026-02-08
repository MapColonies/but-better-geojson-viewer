import { useCallback, useEffect, useRef, useState } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import { isEmpty as isExtentEmpty } from 'ol/extent';
import type Map from 'ol/Map';
import type Modify from 'ol/interaction/Modify';
import type VectorSource from 'ol/source/Vector';
import {
	getFeatureKeyFromGeoJson,
	getFeatureKeyFromOl,
	HOVER_KEY_PROP,
	setFeatureHoverKey,
} from '../utils/featureHover';
import { getUrlState, setUrlState } from '../utils/urlState';

type UseGeoJsonSyncParams = {
	vectorSource: VectorSource;
	mapRef: React.RefObject<Map | null>;
	modify: Modify | null;
	projection: string;
};

type HandleEditorChangeOptions = {
	fit?: boolean;
};

const buildGeoJsonFeatureKeys = (value: unknown): string[] => {
	if (!value || typeof value !== 'object') return [];
	const asRecord = value as Record<string, unknown>;
	if (asRecord.type !== 'FeatureCollection') return [];
	const features = asRecord.features as Record<string, unknown>[] | undefined;
	if (!Array.isArray(features)) return [];
	return features.map((feature, index) =>
		getFeatureKeyFromGeoJson(feature, index),
	);
};

export function useGeoJsonSync({
	vectorSource,
	mapRef,
	modify,
	projection,
}: UseGeoJsonSyncParams) {
	const formatRef = useRef(new GeoJSON());
	const lastSyncedRef = useRef('');
	const skipFirstUrlSyncRef = useRef(true);
	const [geoJson, setGeoJson] = useState('');
	const [geoJsonError, setGeoJsonError] = useState('');

	const encodeBase64Url = useCallback((value: string) => {
		const bytes = new TextEncoder().encode(value);
		let binary = '';
		bytes.forEach((byte) => {
			binary += String.fromCharCode(byte);
		});
		const encoded = btoa(binary);
		return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
	}, []);

	const decodeBase64Url = useCallback((value: string) => {
		const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
		const paddingLength = (4 - (normalized.length % 4)) % 4;
		const padded = `${normalized}${'='.repeat(paddingLength)}`;
		const binary = atob(padded);
		const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		return new TextDecoder().decode(bytes);
	}, []);

	const updateUrlParam = useCallback((encodedValue: string | null) => {
		setUrlState({ geo: encodedValue });
	}, []);

	const handleEditorChange = useCallback(
		(value?: string, options: HandleEditorChangeOptions = {}) => {
			const { fit = false } = options;
			const nextValue = value ?? '';
			setGeoJson(nextValue);
			if (nextValue === lastSyncedRef.current) {
				return;
			}
			if (!nextValue.trim()) {
				vectorSource.clear();
				setGeoJsonError('');
				return;
			}
			try {
				const parsed = JSON.parse(nextValue);
				const featureKeys = buildGeoJsonFeatureKeys(parsed);
				const features = formatRef.current.readFeatures(parsed, {
					featureProjection: projection,
					dataProjection: 'EPSG:4326',
				});
				if (featureKeys.length === features.length) {
					features.forEach((feature, index) => {
						setFeatureHoverKey(feature, featureKeys[index]);
					});
				} else {
					features.forEach((feature, index) => {
						setFeatureHoverKey(feature, getFeatureKeyFromOl(feature, index));
					});
				}
				vectorSource.clear();
				vectorSource.addFeatures(features);
				if (fit) {
					const extent = vectorSource.getExtent();
					const map = mapRef.current;
					if (map && !isExtentEmpty(extent)) {
						map.getView().fit(extent, {
							padding: [40, 40, 40, 40],
							duration: 300,
						});
					}
				}
				setGeoJsonError('');
			} catch (error) {
				setGeoJsonError('Invalid GeoJSON');
			}
		},
		[mapRef, projection, vectorSource],
	);

	useEffect(() => {
		const updateGeoJson = () => {
			const features = vectorSource.getFeatures();
			features.forEach((feature, index) => {
				setFeatureHoverKey(feature, getFeatureKeyFromOl(feature, index));
			});
			const exportFeatures = features.map((feature) => {
				const clone = feature.clone();
				clone.unset(HOVER_KEY_PROP, true);
				return clone;
			});
			const data = formatRef.current.writeFeaturesObject(exportFeatures, {
				featureProjection: projection,
				dataProjection: 'EPSG:4326',
			});
			const typedData = data as { features?: Array<{ properties?: unknown }> };
			if (Array.isArray(typedData.features)) {
				typedData.features.forEach((feature) => {
					if (feature.properties === null) {
						feature.properties = {};
					}
				});
			}
			const nextJson = JSON.stringify(data, null, 2);
			lastSyncedRef.current = nextJson;
			setGeoJson(nextJson);
			setGeoJsonError('');
		};

		updateGeoJson();
		const handleAdd = () => updateGeoJson();
		const handleRemove = () => updateGeoJson();
		const handleModify = () => updateGeoJson();
		vectorSource.on('addfeature', handleAdd);
		vectorSource.on('removefeature', handleRemove);
		modify?.on('modifyend', handleModify);
		return () => {
			vectorSource.un('addfeature', handleAdd);
			vectorSource.un('removefeature', handleRemove);
			modify?.un('modifyend', handleModify);
		};
	}, [modify, projection, vectorSource]);

	useEffect(() => {
		const { geo, map: mapParam } = getUrlState();
		const encoded = geo;
		if (!encoded) return;
		try {
			const decoded = decodeBase64Url(encoded);
			const parsed = JSON.parse(decoded);
			const formatted = JSON.stringify(parsed, null, 2);
			handleEditorChange(formatted, { fit: !mapParam });
		} catch (error) {
			setGeoJsonError('Invalid GeoJSON in URL');
		}
	}, [decodeBase64Url, handleEditorChange]);

	useEffect(() => {
		if (skipFirstUrlSyncRef.current) {
			skipFirstUrlSyncRef.current = false;
			return;
		}
		if (!geoJson.trim()) {
			updateUrlParam(null);
			return;
		}
		const timeoutId = window.setTimeout(() => {
			try {
				const minified = JSON.stringify(JSON.parse(geoJson));
				const encoded = encodeBase64Url(minified);
				updateUrlParam(encoded);
			} catch (error) {
				return;
			}
		}, 400);
		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [encodeBase64Url, geoJson, updateUrlParam]);

	return { geoJson, geoJsonError, handleEditorChange };
}
