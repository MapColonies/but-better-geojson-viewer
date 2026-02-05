import { forwardRef } from 'react';

type MapCanvasProps = {
	className?: string;
};

const MapCanvas = forwardRef<HTMLDivElement, MapCanvasProps>(
	({ className }, ref) => {
		return <div className={className} ref={ref} />;
	},
);

MapCanvas.displayName = 'MapCanvas';

export default MapCanvas;
