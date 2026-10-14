import { registerLocaleBootstrap, startLocaleApplication } from './app/core/i18n/locale-runtime';

registerLocaleBootstrap(async (locale, hydrate) => {
  const { bootstrapLocale } = await import('./bootstrap');
  return bootstrapLocale(locale, hydrate);
});

startLocaleApplication().catch((error) => console.error(error));
