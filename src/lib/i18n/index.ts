import { createInstance } from 'i18next';

import { en } from './en';

export const i18n = createInstance();
i18n.init({
	lng: 'en',
	fallbackLng: 'en',
	resources: { en: { translation: en } },
	interpolation: { escapeValue: false },
	initAsync: false
});

export const t = i18n.t.bind(i18n);
