export type AppConfig = {
	wmtsCapabilitiesUrl: string;
	mapProjection: string;
	wmtsApiKey?: string;
	defaultWmtsLayers?: string[];
};

type RawAppConfig = Partial<AppConfig> & {
	wmtsApiKey?: string | null;
	defaultWmtsLayers?: Array<string | null> | null;
};

const normalize = (value?: string | null) => value?.trim() ?? '';
const sanitizeLayers = (layers?: Array<string | null> | null) =>
	(layers ?? [])
		.map((value) => value?.trim())
		.filter((value): value is string => Boolean(value));

const configs = import.meta.glob('../config/*.json', {
	eager: true,
	import: 'default',
}) as Record<string, RawAppConfig>;
const defaultConfig = configs['../config/default.json'] ?? {};
const localConfig = configs['../config/local.json'] ?? {};
const baseConfig = {
	...defaultConfig,
	...localConfig,
};

const resolveString = (override?: string | null, fallback?: string | null) => {
	const normalizedOverride = normalize(override ?? '');
	if (normalizedOverride) return normalizedOverride;
	return normalize(fallback ?? '');
};

const resolveLayers = (
	override?: Array<string | null> | null,
	fallback?: Array<string | null> | null,
) => {
	if (override === undefined || override === null) {
		return sanitizeLayers(fallback);
	}
	return sanitizeLayers(override);
};

const toAppConfig = (base: RawAppConfig, override?: RawAppConfig): AppConfig => ({
	wmtsCapabilitiesUrl: resolveString(
		override?.wmtsCapabilitiesUrl,
		base.wmtsCapabilitiesUrl,
	),
	mapProjection: resolveString(
		override?.mapProjection,
		base.mapProjection,
	),
	wmtsApiKey: resolveString(override?.wmtsApiKey, base.wmtsApiKey),
	defaultWmtsLayers: resolveLayers(
		override?.defaultWmtsLayers,
		base.defaultWmtsLayers,
	),
});

export const loadAppConfig = async (): Promise<AppConfig> => {
	let runtimeConfig: RawAppConfig | undefined;
	try {
		const basePath = import.meta.env.BASE_URL.endsWith('/')
			? import.meta.env.BASE_URL
			: `${import.meta.env.BASE_URL}/`;
		const baseUrl = `${window.location.origin}${basePath}`;
		const defaultUrl = new URL('config/default.json', baseUrl).toString();
		const localUrl = new URL('config/local.json', baseUrl).toString();
		const [defaultResponse, localResponse] = await Promise.all([
			fetch(defaultUrl, { cache: 'no-store' }),
			fetch(localUrl, { cache: 'no-store' }),
		]);
		const runtimeDefault = defaultResponse.ok
			? ((await defaultResponse.json()) as RawAppConfig)
			: undefined;
		const runtimeLocal = localResponse.ok
			? ((await localResponse.json()) as RawAppConfig)
			: undefined;
		if (!defaultResponse.ok) {
			console.warn(
				`Runtime config default.json not loaded (HTTP ${defaultResponse.status}). Using defaults.`,
			);
		}
		if (!localResponse.ok) {
			console.warn(
				`Runtime config local.json not loaded (HTTP ${localResponse.status}). Using defaults.`,
			);
		}
		runtimeConfig = {
			...(runtimeDefault ?? {}),
			...(runtimeLocal ?? {}),
		};
	} catch (error) {
		console.warn('Runtime config not loaded. Using defaults.', error);
	}

	return toAppConfig(baseConfig, runtimeConfig);
};

export const getPreferredCrs = (mapProjection: string) =>
	mapProjection.includes(':')
		? mapProjection.split(':').pop() ?? mapProjection
		: mapProjection;
