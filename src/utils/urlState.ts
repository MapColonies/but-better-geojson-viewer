export type UrlStateUpdate = {
	map?: string | null;
	geo?: string | null;
};

export const getUrlState = () => {
	const params = new URLSearchParams(window.location.search);
	return {
		map: params.get('map'),
		geo: params.get('geo'),
	};
};

export const setUrlState = (update: UrlStateUpdate) => {
	const url = new URL(window.location.href);
	const params = new URLSearchParams(url.search);
	const currentMap = params.get('map');
	const currentGeo = params.get('geo');
	const mapValue = update.map === undefined ? currentMap : update.map;
	const geoValue = update.geo === undefined ? currentGeo : update.geo;
	const ordered = new URLSearchParams();
	if (mapValue) {
		ordered.set('map', mapValue);
	}
	if (geoValue) {
		ordered.set('geo', geoValue);
	}
	for (const [key, value] of params.entries()) {
		if (key === 'map' || key === 'geo') continue;
		ordered.append(key, value);
	}
	url.search = ordered.toString();
	window.history.replaceState({}, '', url.toString());
};
