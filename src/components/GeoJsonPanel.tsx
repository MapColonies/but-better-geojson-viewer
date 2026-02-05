import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

type GeoJsonPanelProps = {
	value: string;
	onChange: (value?: string) => void;
	onPaste?: (value: string) => void;
	error: string;
};

function GeoJsonPanel({ value, onChange, onPaste, error }: GeoJsonPanelProps) {
	const disposeRef = useRef<(() => void) | null>(null);
	const pastePendingRef = useRef(false);

	useEffect(() => {
		return () => {
			disposeRef.current?.();
			disposeRef.current = null;
		};
	}, []);

	return (
		<div className='geojson-shell'>
			<div className='geojson-panel'>
				<Editor
					className='geojson-editor'
					height='100%'
					defaultLanguage='json'
					value={value}
					onChange={(nextValue) => {
						if (pastePendingRef.current) {
							pastePendingRef.current = false;
							onPaste?.(nextValue ?? '');
							return;
						}
						onChange(nextValue);
					}}
					onMount={(editor) => {
						disposeRef.current?.();
						const keyDownSubscription = editor.onKeyDown((event) => {
							const isPaste =
								(event.metaKey || event.ctrlKey) &&
								event.browserEvent.key?.toLowerCase() === 'v';
							if (isPaste) {
								pastePendingRef.current = true;
							}
						});
						const pasteSubscription = editor.onDidPaste(() => {
							pastePendingRef.current = true;
						});
						disposeRef.current = () => {
							keyDownSubscription.dispose();
							pasteSubscription.dispose();
						};
					}}
					options={{
						minimap: { enabled: false },
						fontSize: 12,
						lineNumbers: 'on',
						wordWrap: 'on',
						scrollBeyondLastLine: false,
						automaticLayout: true,
					}}
				/>
				{error ? <div className='geojson-error'>{error}</div> : null}
			</div>
		</div>
	);
}

export default GeoJsonPanel;
