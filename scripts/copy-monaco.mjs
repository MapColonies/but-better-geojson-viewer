import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('node_modules/monaco-editor/min/vs');
const target = path.resolve('public/monaco/vs');

const ensureSourceExists = async () => {
	try {
		await stat(source);
	} catch (error) {
		throw new Error(
			'Could not find monaco-editor assets. Run `npm install` before copying.',
		);
	}
};

const copyMonacoAssets = async () => {
	await ensureSourceExists();
	await mkdir(path.dirname(target), { recursive: true });
	await cp(source, target, { recursive: true });
};

await copyMonacoAssets();
