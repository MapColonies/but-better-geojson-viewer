type ZoomToolbarProps = {
	onZoomIn: () => void;
	onZoomOut: () => void;
};

function ZoomToolbar({ onZoomIn, onZoomOut }: ZoomToolbarProps) {
	return (
		<div className='zoom-toolbar'>
			<button type='button' aria-label='Zoom in' onClick={onZoomIn}>
				+
			</button>
			<button type='button' aria-label='Zoom out' onClick={onZoomOut}>
				-
			</button>
		</div>
	);
}

export default ZoomToolbar;
