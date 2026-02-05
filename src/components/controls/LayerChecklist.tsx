import type { LayerOption } from './types';

type LayerChecklistProps = {
	layers: LayerOption[];
	selectedLayers: string[];
	onToggleLayer: (layerId: string, checked: boolean) => void;
	disabled: boolean;
};

function LayerChecklist({
	layers,
	selectedLayers,
	onToggleLayer,
	disabled,
}: LayerChecklistProps) {
	return (
		<div className='control'>
			<label htmlFor='layer-select'>Layers</label>
			<div
				id='layer-select'
				className='layer-list'
				aria-disabled={disabled}
			>
				{layers.map((layer) => (
					<label key={layer.id} className='layer-option'>
						<input
							type='checkbox'
							checked={selectedLayers.includes(layer.id)}
							onChange={(event) =>
								onToggleLayer(layer.id, event.target.checked)
							}
							disabled={disabled}
						/>
						<span>{layer.title}</span>
					</label>
				))}
			</div>
		</div>
	);
}

export default LayerChecklist;
