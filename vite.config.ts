import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.VITE_BASE_PATH ?? process.env.BASE_URL ?? '/';

export default defineConfig({
	plugins: [react()],
	base,
});
