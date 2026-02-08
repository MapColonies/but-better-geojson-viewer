import { useCallback, useMemo, useState, type FormEvent } from 'react';

export type TileJumpMode = 'xyz' | 'tms';

export type TileJumpRequest = {
	z: number;
	x: number;
	y: number;
	mode: TileJumpMode;
};

type TileJumpControlProps = {
	onJumpToTile: (request: TileJumpRequest) => string | null;
};

const parseTileValue = (value: string) => {
	if (!value.trim()) return null;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return null;
	return parsed;
};

function TileJumpControl({ onJumpToTile }: TileJumpControlProps) {
	const [zValue, setZValue] = useState('');
	const [xValue, setXValue] = useState('');
	const [yValue, setYValue] = useState('');
	const [mode, setMode] = useState<TileJumpMode>('xyz');
	const [error, setError] = useState('');

	const handleSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const z = parseTileValue(zValue);
			const x = parseTileValue(xValue);
			const y = parseTileValue(yValue);
			if (z === null || x === null || y === null) {
				setError('Enter integer values for z, x, and y.');
				return;
			}
			const nextError = onJumpToTile({ z, x, y, mode });
			setError(nextError ?? '');
		},
		[mode, onJumpToTile, xValue, yValue, zValue],
	);

	const modeOptions = useMemo(
		() => [
			{ value: 'xyz', label: 'y (XYZ)' },
			{ value: 'tms', label: '-y (TMS)' },
		],
		[],
	);

	return (
		<form className='control' onSubmit={handleSubmit}>
			<label>Jump to tile</label>
			<div className='tile-jump-grid'>
				<input
					type='number'
					inputMode='numeric'
					placeholder='z'
					aria-label='Zoom'
					value={zValue}
					onChange={(event) => setZValue(event.target.value)}
				/>
				<input
					type='number'
					inputMode='numeric'
					placeholder='x'
					aria-label='Tile x'
					value={xValue}
					onChange={(event) => setXValue(event.target.value)}
				/>
				<input
					type='number'
					inputMode='numeric'
					placeholder='y'
					aria-label='Tile y'
					value={yValue}
					onChange={(event) => setYValue(event.target.value)}
				/>
			</div>
			<div className='tile-jump-actions'>
				<select
					value={mode}
					onChange={(event) => setMode(event.target.value as TileJumpMode)}
				>
					{modeOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<button type='submit' className='control-button'>
					Jump
				</button>
			</div>
			{error ? <div className='control-error'>{error}</div> : null}
		</form>
	);
}

export default TileJumpControl;
