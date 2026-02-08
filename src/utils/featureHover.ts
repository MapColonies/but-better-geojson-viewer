import type Feature from 'ol/Feature';

export const HOVER_KEY_PROP = '__editorHoverKey';

export const normalizeHoverKey = (value: unknown): string | null => {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	return null;
};

export const getFeatureKeyFromGeoJson = (
	feature: Record<string, unknown> | null | undefined,
	index: number,
): string => {
	const fromId = normalizeHoverKey(feature?.id);
	if (fromId) return fromId;
	const fromProps = normalizeHoverKey(
		(feature?.properties as Record<string, unknown> | undefined)?.id,
	);
	if (fromProps) return fromProps;
	return String(index);
};

export const getFeatureKeyFromOl = (feature: Feature, index: number): string => {
	const fromId = normalizeHoverKey(feature.getId());
	if (fromId) return fromId;
	const fromProps = normalizeHoverKey(feature.get('id'));
	if (fromProps) return fromProps;
	return String(index);
};

export const setFeatureHoverKey = (feature: Feature, key: string) => {
	feature.set(HOVER_KEY_PROP, key);
};

export const getFeatureHoverKey = (feature: Feature): string | null => {
	return normalizeHoverKey(feature.get(HOVER_KEY_PROP));
};
