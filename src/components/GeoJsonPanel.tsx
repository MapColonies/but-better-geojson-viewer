import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { getFeatureKeyFromGeoJson } from '../utils/featureHover';

type GeoJsonPanelProps = {
	value: string;
	onChange: (value?: string) => void;
	onPaste?: (value: string) => void;
	onHoverFeatureKey?: (value: string | null) => void;
	error: string;
};

type FeatureRange = {
	start: number;
	end: number;
	key: string;
};

const skipWhitespace = (text: string, index: number) => {
	let next = index;
	while (next < text.length && /\s/.test(text[next])) {
		next += 1;
	}
	return next;
};

const readStringToken = (text: string, start: number) => {
	let value = '';
	let escape = false;
	for (let i = start + 1; i < text.length; i += 1) {
		const char = text[i];
		if (escape) {
			escape = false;
			value += char;
			continue;
		}
		if (char === '\\') {
			escape = true;
			continue;
		}
		if (char === '"') {
			return { value, endIndex: i };
		}
		value += char;
	}
	return { value, endIndex: text.length - 1 };
};

const findMatchingBracket = (text: string, startIndex: number) => {
	let depth = 0;
	let inString = false;
	let escape = false;
	for (let i = startIndex; i < text.length; i += 1) {
		const char = text[i];
		if (inString) {
			if (escape) {
				escape = false;
				continue;
			}
			if (char === '\\') {
				escape = true;
				continue;
			}
			if (char === '"') {
				inString = false;
			}
			continue;
		}
		if (char === '"') {
			inString = true;
			continue;
		}
		if (char === '[') {
			depth += 1;
			continue;
		}
		if (char === ']') {
			depth -= 1;
			if (depth === 0) return i;
		}
	}
	return null;
};

const findFeaturesArraySpan = (text: string) => {
	let inString = false;
	let escape = false;
	let braceDepth = 0;
	let bracketDepth = 0;
	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];
		if (inString) {
			if (escape) {
				escape = false;
				continue;
			}
			if (char === '\\') {
				escape = true;
				continue;
			}
			if (char === '"') {
				inString = false;
			}
			continue;
		}
		if (char === '"') {
			const { value, endIndex } = readStringToken(text, i);
			if (value === 'features' && braceDepth === 1 && bracketDepth === 0) {
				let cursor = skipWhitespace(text, endIndex + 1);
				if (text[cursor] !== ':') {
					i = endIndex;
					continue;
				}
				cursor = skipWhitespace(text, cursor + 1);
				if (text[cursor] === '[') {
					const end = findMatchingBracket(text, cursor);
					if (end !== null) return { start: cursor, end };
				}
			}
			i = endIndex;
			continue;
		}
		if (char === '{') {
			braceDepth += 1;
			continue;
		}
		if (char === '}') {
			braceDepth = Math.max(0, braceDepth - 1);
			continue;
		}
		if (char === '[') {
			bracketDepth += 1;
			continue;
		}
		if (char === ']') {
			bracketDepth = Math.max(0, bracketDepth - 1);
			continue;
		}
	}
	return null;
};

const extractObjectRanges = (
	text: string,
	arrayStart: number,
	arrayEnd: number,
): FeatureRange[] => {
	const ranges: FeatureRange[] = [];
	let inString = false;
	let escape = false;
	let bracketDepth = 0;
	let braceDepth = 0;
	let currentStart: number | null = null;
	for (let i = arrayStart; i <= arrayEnd; i += 1) {
		const char = text[i];
		if (inString) {
			if (escape) {
				escape = false;
				continue;
			}
			if (char === '\\') {
				escape = true;
				continue;
			}
			if (char === '"') {
				inString = false;
			}
			continue;
		}
		if (char === '"') {
			inString = true;
			continue;
		}
		if (char === '[') {
			bracketDepth += 1;
			continue;
		}
		if (char === ']') {
			bracketDepth -= 1;
			continue;
		}
		if (char === '{') {
			if (bracketDepth === 1 && braceDepth === 0) {
				currentStart = i;
			}
			braceDepth += 1;
			continue;
		}
		if (char === '}') {
			if (braceDepth > 0) {
				braceDepth -= 1;
			}
			if (bracketDepth === 1 && braceDepth === 0 && currentStart !== null) {
				ranges.push({ start: currentStart, end: i, key: '' });
				currentStart = null;
			}
		}
	}
	return ranges;
};

const buildFeatureRanges = (text: string): FeatureRange[] => {
	if (!text.trim()) return [];
	let parsed: Record<string, unknown> | null = null;
	try {
		parsed = JSON.parse(text);
	} catch (error) {
		return [];
	}
	if (!parsed || parsed.type !== 'FeatureCollection') return [];
	const features = parsed.features as Record<string, unknown>[] | undefined;
	if (!Array.isArray(features) || features.length === 0) return [];
	const keys = features.map((feature, index) =>
		getFeatureKeyFromGeoJson(feature, index),
	);
	const span = findFeaturesArraySpan(text);
	if (!span) return [];
	const ranges = extractObjectRanges(text, span.start, span.end);
	if (!ranges.length) return [];
	const count = Math.min(ranges.length, keys.length);
	return ranges.slice(0, count).map((range, index) => ({
		start: range.start,
		end: range.end,
		key: keys[index],
	}));
};

function GeoJsonPanel({
	value,
	onChange,
	onPaste,
	onHoverFeatureKey,
	error,
}: GeoJsonPanelProps) {
	const disposeRef = useRef<(() => void) | null>(null);
	const pastePendingRef = useRef(false);
	const hoverKeyRef = useRef<string | null>(null);
	const featureRangesRef = useRef<FeatureRange[]>([]);

	useEffect(() => {
		return () => {
			disposeRef.current?.();
			disposeRef.current = null;
		};
	}, []);

	useEffect(() => {
		featureRangesRef.current = buildFeatureRanges(value);
		if (hoverKeyRef.current !== null) {
			hoverKeyRef.current = null;
			onHoverFeatureKey?.(null);
		}
	}, [onHoverFeatureKey, value]);

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
						const mouseMoveSubscription = editor.onMouseMove((event) => {
							if (!event.target.position) return;
							const model = editor.getModel();
							if (!model) return;
							const offset = model.getOffsetAt(event.target.position);
							const ranges = featureRangesRef.current;
							let nextKey: string | null = null;
							for (const range of ranges) {
								if (offset >= range.start && offset <= range.end) {
									nextKey = range.key;
									break;
								}
							}
							if (hoverKeyRef.current !== nextKey) {
								hoverKeyRef.current = nextKey;
								onHoverFeatureKey?.(nextKey);
							}
						});
						const mouseLeaveSubscription = editor.onMouseLeave(() => {
							if (hoverKeyRef.current !== null) {
								hoverKeyRef.current = null;
								onHoverFeatureKey?.(null);
							}
						});
						disposeRef.current = () => {
							keyDownSubscription.dispose();
							pasteSubscription.dispose();
							mouseMoveSubscription.dispose();
							mouseLeaveSubscription.dispose();
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
