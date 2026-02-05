type PanelToggleProps = {
	isOpen: boolean;
	onToggle: () => void;
};

function PanelToggle({ isOpen, onToggle }: PanelToggleProps) {
	return (
		<button
			type='button'
			className='panel-toggle'
			onClick={onToggle}
			aria-expanded={isOpen}
			aria-controls='controls-panel-body'
		>
			<span>Controls</span>
			<span className='panel-toggle-icon'>{isOpen ? '-' : '+'}</span>
		</button>
	);
}

export default PanelToggle;
