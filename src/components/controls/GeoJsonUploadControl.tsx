type GeoJsonUploadControlProps = {
	onUpload: (file: File | null) => void;
};

function GeoJsonUploadControl({ onUpload }: GeoJsonUploadControlProps) {
	return (
		<div className='control'>
			<label htmlFor='geojson-upload'>Upload GeoJSON or Shapefile (zip)</label>
			<input
				id='geojson-upload'
				type='file'
				accept='.geojson,.json,.zip,application/geo+json,application/json,application/zip'
				onChange={(event) => {
					const file = event.target.files?.[0] ?? null;
					onUpload(file);
					event.target.value = '';
				}}
			/>
		</div>
	);
}

export default GeoJsonUploadControl;
