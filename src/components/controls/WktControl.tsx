type WktControlProps = {
	value: string;
	onChange: (value: string) => void;
	error?: string;
};

function WktControl({ value, onChange, error }: WktControlProps) {
	return (
		<div className='control'>
			<label>WKT</label>
			<textarea
				className='wkt-textarea'
				rows={2}
				placeholder='Paste WKT to load or copy from the map'
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
			{error ? <div className='control-error'>{error}</div> : null}
		</div>
	);
}

export default WktControl;
