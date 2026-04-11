import { useEffect, useMemo, useState } from 'react';

type LayerOption = {
	id: string;
	title: string;
};

type UseCswCatalogResult = {
	layers: LayerOption[];
	selectedLayers: string[];
	setSelectedLayers: (layerIds: string[]) => void;
	selectedLayerTitle: string;
	error: string;
	wmtsMetadataByLayerId: Map<
		string,
		{ capabilitiesUrl: string; wmtsLayerId: string }
	>;
};

type CswRecord = {
	id: string;
	title: string;
	wmtsCapabilitiesUrl: string;
	wmtsLayerId: string;
};

const normalizeUrl = (value: string) =>
	value.trim().replace(/^['"]+|['"]+$/g, '');

const getFirstText = (record: Element, names: string[]) => {
	for (const name of names) {
		const value = record.getElementsByTagName(name)[0]?.textContent?.trim();
		if (value) return value;
	}
	return '';
};

const getElements = (record: Element, names: string[]) => {
	for (const name of names) {
		const nodes = Array.from(record.getElementsByTagName(name));
		if (nodes.length > 0) return nodes;
	}
	return [] as Element[];
};

const buildGetRecordsRequest = (
	startPosition: number,
	maxRecords: number,
) => `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" service="CSW" maxRecords="${maxRecords}" startPosition="${startPosition}" outputSchema="http://schema.mapcolonies.com/raster" version="2.0.2" xmlns:mc="http://schema.mapcolonies.com/raster">
  <csw:Query typeNames="mc:MCRasterRecord">
    <csw:ElementSetName>full</csw:ElementSetName>
    <csw:Constraint version="1.1.0">
      <Filter xmlns="http://www.opengis.net/ogc">
        <PropertyIsEqualTo>
          <PropertyName>mc:type</PropertyName>
          <Literal>RECORD_RASTER</Literal>
        </PropertyIsEqualTo>
      </Filter>
    </csw:Constraint>
  </csw:Query>
</csw:GetRecords>`;

const parseCswRecords = (document: Document): CswRecord[] => {
	const records = Array.from(
		document.getElementsByTagName('mc:MCRasterRecord'),
	);
	const fallbackRecords = Array.from(
		document.getElementsByTagName('MCRasterRecord'),
	);
	const recordNodes = records.length > 0 ? records : fallbackRecords;
	return recordNodes
		.map((record) => {
			const id = getFirstText(record, ['mc:productId', 'productId']);
			if (!id) return null;
			const title =
				getFirstText(record, ['mc:productName', 'productName']) || id;
			const links = getElements(record, ['mc:links', 'links']);
			const resolveLink = (scheme: string) =>
				links.find((link) => link.getAttribute('scheme') === scheme);
			const wmtsLink = resolveLink('WMTS') ?? resolveLink('WMTS_KVP');
			const wmtsCapabilitiesUrl = normalizeUrl(
				(wmtsLink && 'textContent' in wmtsLink && wmtsLink.textContent) || '',
			);
			const wmtsLayerId = wmtsLink?.getAttribute('name') || id;
			if (!wmtsCapabilitiesUrl) return null;
			return { id, title, wmtsCapabilitiesUrl, wmtsLayerId };
		})
		.filter((record): record is CswRecord => Boolean(record));
};

const parseSearchResults = (document: Document) => {
	const searchResults =
		document.getElementsByTagName('csw:SearchResults')[0] ??
		document.getElementsByTagName('SearchResults')[0];
	const matched = Number(
		searchResults?.getAttribute('numberOfRecordsMatched'),
	);
	const returned = Number(
		searchResults?.getAttribute('numberOfRecordsReturned'),
	);
	const nextRecord = Number(searchResults?.getAttribute('nextRecord'));
	return {
		matched: Number.isFinite(matched) ? matched : 0,
		returned: Number.isFinite(returned) ? returned : 0,
		nextRecord: Number.isFinite(nextRecord) ? nextRecord : 0,
	};
};

const resolveDefaultLayers = (
	available: LayerOption[],
	defaults?: string[],
) => {
	const configuredDefaults = (defaults ?? [])
		.map((value) => value.trim())
		.filter(Boolean);
	const validDefaults = configuredDefaults.filter((layerId) =>
		available.some((layer) => layer.id === layerId),
	);
	if (validDefaults.length > 0) return validDefaults;
	return available[0]?.id ? [available[0].id] : [];
};

export function useCswCatalog(
	url: string,
	apiKey?: string,
	defaultLayerIds?: string[],
	enabled = true,
): UseCswCatalogResult {
	const [layers, setLayers] = useState<LayerOption[]>([]);
	const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
	const [error, setError] = useState('');
	const [wmtsMetadataByLayerId, setWmtsMetadataByLayerId] = useState(
		() =>
			new Map<
				string,
				{ capabilitiesUrl: string; wmtsLayerId: string }
			>(),
	);

	useEffect(() => {
		if (!enabled || !url.trim()) {
			setLayers([]);
			setSelectedLayers([]);
			setError('');
			setWmtsMetadataByLayerId(new Map());
			return;
		}
		let active = true;
		const loadCatalog = async () => {
			try {
				setError('');
				const parser = new DOMParser();
				let startPosition = 1;
				const maxRecords = 100;
				const records: CswRecord[] = [];
				let shouldContinue = true;
				while (shouldContinue) {
					const response = await fetch(url, {
						method: 'POST',
						headers: {
							...(apiKey ? { 'x-api-key': apiKey } : {}),
						},
						body: buildGetRecordsRequest(startPosition, maxRecords),
					});
					if (!response.ok) {
						throw new Error(`HTTP ${response.status}`);
					}
					const text = await response.text();
					const document = parser.parseFromString(
						text,
						'application/xml',
					);
					if (document.getElementsByTagName('parsererror').length > 0) {
						throw new Error('Invalid CSW XML response.');
					}
					records.push(...parseCswRecords(document));
					const { matched, returned, nextRecord } =
						parseSearchResults(document);
					if (!matched || !returned || !nextRecord) {
						shouldContinue = false;
					} else if (nextRecord <= matched) {
						startPosition = nextRecord;
					} else {
						shouldContinue = false;
					}
				}
				if (!active) return;
				const uniqueById = new Map<string, CswRecord>();
				records.forEach((record) => {
					if (!uniqueById.has(record.id)) {
						uniqueById.set(record.id, record);
					}
				});
				const sortedRecords = Array.from(uniqueById.values());
				const nextLayers = sortedRecords.map((record) => ({
					id: record.id,
					title: record.title,
				}));
				const nextWmtsMap = new Map(
					sortedRecords.map((record) => [
						record.id,
						{
							capabilitiesUrl: record.wmtsCapabilitiesUrl,
							wmtsLayerId: record.wmtsLayerId,
						},
					]),
				);
				setLayers(nextLayers);
				setWmtsMetadataByLayerId(nextWmtsMap);
				setSelectedLayers(
					resolveDefaultLayers(nextLayers, defaultLayerIds),
				);
			} catch (loadError) {
				const message =
					loadError instanceof Error
						? loadError.message
						: 'Unknown error';
				setError(`Failed to load CSW catalog: ${message}`);
				setLayers([]);
				setSelectedLayers([]);
				setWmtsMetadataByLayerId(new Map());
			}
		};
		loadCatalog();
		return () => {
			active = false;
		};
	}, [apiKey, defaultLayerIds, enabled, url]);

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
		layers,
		selectedLayers,
		setSelectedLayers,
		selectedLayerTitle,
		error,
		wmtsMetadataByLayerId,
	};
}
