import '../styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CatalogPage } from './catalog-page.tsx';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('design.html has no #root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <CatalogPage />
  </StrictMode>,
);
