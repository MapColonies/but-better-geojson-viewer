import { useCallback, useMemo, useState } from 'react';
import GeoJsonExportControl from './controls/GeoJsonExportControl';
import GeoJsonUploadControl from './controls/GeoJsonUploadControl';
import LayerChecklist from './controls/LayerChecklist';
import LayerSearchControl from './controls/LayerSearchControl';
import PanelToggle from './controls/PanelToggle';
import type { LayerOption } from './controls/types';
import DebugTileLayer from './controls/DebugTileLayer';

type ControlsPanelProps = {
	capabilitiesError: string;
	selectedLayerTitle: string;
	layers: LayerOption[];
	selectedLayers: string[];
	onLayerChange: (layerIds: string[]) => void;
	onGeoJsonUpload: (file: File | null) => void;
	onGeoJsonExport: () => void | Promise<void>;
	onShapefileExport: () => void | Promise<void>;
	geoJsonExportDisabled: boolean;
	geoJsonExportError?: string;
	isTileDebugEnabled: boolean;
	onToggleTileDebug: () => void;
};

function ControlsPanel({
	capabilitiesError,
	selectedLayerTitle,
	layers,
	selectedLayers,
	onLayerChange,
	onGeoJsonUpload,
	onGeoJsonExport,
	onShapefileExport,
	geoJsonExportDisabled,
	geoJsonExportError,
	isTileDebugEnabled,
	onToggleTileDebug,
}: ControlsPanelProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [layerQuery, setLayerQuery] = useState('');
	const handleToggle = useCallback(() => {
		setIsOpen((open) => !open);
	}, []);
	const handleSearchChange = useCallback((value: string) => {
		setLayerQuery(value);
	}, []);
	const handleToggleLayer = useCallback(
		(layerId: string, checked: boolean) => {
			const nextSelection = checked
				? [...selectedLayers, layerId]
				: selectedLayers.filter((entry) => entry !== layerId);
			onLayerChange(nextSelection);
		},
		[onLayerChange, selectedLayers],
	);
	const filteredLayers = useMemo(() => {
		const query = layerQuery.trim().toLowerCase();
		if (!query) return layers;
		return layers.filter((layer) =>
			layer.title.toLowerCase().includes(query),
		);
	}, [layerQuery, layers]);
	const isLayerListDisabled = layers.length === 0;

	return (
		<div className={`panel ${isOpen ? 'is-open' : 'is-collapsed'}`}>
			<PanelToggle isOpen={isOpen} onToggle={handleToggle} />
			<div
				id='controls-panel-body'
				className='panel-body'
				hidden={!isOpen}
			>
				<div className='panel-meta'>
					{capabilitiesError || selectedLayerTitle}
				</div>
				<div className='panel-section'>
					<LayerSearchControl
						value={layerQuery}
						onChange={handleSearchChange}
						disabled={isLayerListDisabled}
					/>
					<LayerChecklist
						layers={filteredLayers}
						selectedLayers={selectedLayers}
						onToggleLayer={handleToggleLayer}
						disabled={isLayerListDisabled}
					/>
					<GeoJsonUploadControl onUpload={onGeoJsonUpload} />
					<GeoJsonExportControl
						onExportGeoJson={onGeoJsonExport}
						onExportShapefile={onShapefileExport}
						disabled={geoJsonExportDisabled}
						error={geoJsonExportError}
					/>
					<DebugTileLayer
						isTileDebugEnabled={isTileDebugEnabled}
						onToggleTileDebug={onToggleTileDebug}
					/>
				</div>
			</div>
		</div>
	);
}

export default ControlsPanel;
