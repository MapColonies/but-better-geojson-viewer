import pako from 'pako';

const bytesToBase64Url = (bytes: Uint8Array) => {
	let binary = '';
	const chunkSize = 0x8000;
	for (let index = 0; index < bytes.length; index += chunkSize) {
		const chunk = bytes.subarray(index, index + chunkSize);
		binary += String.fromCharCode(...chunk);
	}
	const encoded = btoa(binary);
	return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64UrlToBytes = (value: string) => {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const paddingLength = (4 - (normalized.length % 4)) % 4;
	const padded = `${normalized}${'='.repeat(paddingLength)}`;
	const binary = atob(padded);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

export const encodeCompressedBase64Url = (value: string) => {
	const bytes = new TextEncoder().encode(value);
	const compressed = pako.deflate(bytes);
	return bytesToBase64Url(compressed);
};

export const decodeCompressedBase64Url = (value: string) => {
	const compressed = base64UrlToBytes(value);
	const decompressed = pako.inflate(compressed);
	return new TextDecoder().decode(decompressed);
};
