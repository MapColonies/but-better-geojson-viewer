type GeoJsonExportControlProps = {
	onExportGeoJson: () => void | Promise<void>;
	onExportShapefile: () => void | Promise<void>;
	disabled: boolean;
	error?: string;
};

function GeoJsonExportControl({
	onExportGeoJson,
	onExportShapefile,
	disabled,
	error,
}: GeoJsonExportControlProps) {
	return (
		<div className='control'>
			<label>Export</label>
			<div className='export-actions'>
				<button
					type='button'
					className='control-button'
					onClick={onExportGeoJson}
					disabled={disabled}
				>
					Export GeoJSON
				</button>
				<button
					type='button'
					className='control-button'
					onClick={onExportShapefile}
					disabled={disabled}
				>
					Export Shapefile
				</button>
			</div>
			{error ? <div className='control-error'>{error}</div> : null}
		</div>
	);
}

export default GeoJsonExportControl;
