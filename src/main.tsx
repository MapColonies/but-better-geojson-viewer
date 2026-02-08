import React from 'react';
import ReactDOM from 'react-dom/client';
import { loader } from '@monaco-editor/react';
import 'ol/ol.css';
import App from './App';
import { loadAppConfig } from './config';
import './styles/base.css';
import './styles/layout.css';
import './styles/panel.css';
import './styles/toolbar.css';

loader.config({
	paths: {
		vs: `${import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/'}monaco/vs`,
	},
});

const root = ReactDOM.createRoot(document.getElementById('root')!);

const startApp = async () => {
	const config = await loadAppConfig();
	root.render(
		<React.StrictMode>
			<App config={config} />
		</React.StrictMode>,
	);
};

startApp();
