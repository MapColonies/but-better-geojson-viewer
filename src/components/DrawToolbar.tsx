import handIcon from '../../assets/hand.svg';
import lineStringIcon from '../../assets/linestring.svg';
import polygonIcon from '../../assets/polygon.svg';
import bboxIcon from '../../assets/bbox.svg';
import locationIcon from '../../assets/location.svg';
import type { DrawMode } from '../types/map';

type DrawToolbarProps = {
	drawMode: DrawMode;
	onChange: (mode: DrawMode) => void;
};

function DrawToolbar({ drawMode, onChange }: DrawToolbarProps) {
	return (
		<div className='draw-toolbar'>
			<button
				type='button'
				className={drawMode === 'None' ? 'active' : ''}
				aria-pressed={drawMode === 'None'}
				aria-label='Move'
				onClick={() => onChange('None')}
			>
				<img
					src={handIcon}
					alt=''
					aria-hidden='true'
					className='draw-icon'
				/>
			</button>
			<button
				type='button'
				className={drawMode === 'Point' ? 'active' : ''}
				aria-pressed={drawMode === 'Point'}
				aria-label='Point'
				onClick={() => onChange('Point')}
			>
				<img
					src={locationIcon}
					alt=''
					aria-hidden='true'
					className='draw-icon'
				/>
			</button>
			<button
				type='button'
				className={drawMode === 'LineString' ? 'active' : ''}
				aria-pressed={drawMode === 'LineString'}
				aria-label='Line'
				onClick={() => onChange('LineString')}
			>
				<img
					src={lineStringIcon}
					alt=''
					aria-hidden='true'
					className='draw-icon'
				/>
			</button>
			<button
				type='button'
				className={drawMode === 'Box' ? 'active' : ''}
				aria-pressed={drawMode === 'Box'}
				aria-label='Rectangle'
				onClick={() => onChange('Box')}
			>
				<img
					src={bboxIcon}
					alt=''
					aria-hidden='true'
					className='draw-icon'
				/>
			</button>
			<button
				type='button'
				className={drawMode === 'Polygon' ? 'active' : ''}
				aria-pressed={drawMode === 'Polygon'}
				aria-label='Polygon'
				onClick={() => onChange('Polygon')}
			>
				<img
					src={polygonIcon}
					alt=''
					aria-hidden='true'
					className='draw-icon'
				/>
			</button>
		</div>
	);
}

export default DrawToolbar;
