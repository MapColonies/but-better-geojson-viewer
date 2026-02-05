type LayerSearchControlProps = {
	value: string;
	onChange: (value: string) => void;
	disabled: boolean;
};

function LayerSearchControl({
	value,
	onChange,
	disabled,
}: LayerSearchControlProps) {
	return (
		<div className='control'>
			<label htmlFor='layer-search'>Search layers</label>
			<input
				id='layer-search'
				type='search'
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder='Type to filter'
				disabled={disabled}
			/>
		</div>
	);
}

export default LayerSearchControl;
