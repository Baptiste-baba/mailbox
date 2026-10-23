import type { ServerResponse } from 'node:http';
import { join, sep } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

const ONE_YEAR_IN_SECONDS = 31_536_000;

/** Serves the built web app, and its index.html for every page the browser navigates to. */
export function serveWebApp(app: NestExpressApplication, directory: string): void {
  const hashedAssetsDirectory = join(directory, 'assets') + sep;
  app.useStaticAssets(directory, {
    index: false,
    setHeaders: (response: ServerResponse, path: string) => {
      // Vite names these files after their content, so a new version never reuses a name.
      const isHashedAsset = path.startsWith(hashedAssetsDirectory);
      response.setHeader(
        'Cache-Control',
        isHashedAsset ? `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable` : 'no-cache',
      );
    },
  });

  const indexPath = join(directory, 'index.html');
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (!isPageNavigation(request)) {
      next();
      return;
    }
    response.setHeader('Cache-Control', 'no-cache');
    response.sendFile(indexPath);
  });
}

// Browsers ask for text/html only when navigating, never for a script, an image or an API call.
function isPageNavigation(request: Request): boolean {
  const isRead = request.method === 'GET' || request.method === 'HEAD';
  const isApi =
    request.path === '/health' || request.path === '/api' || request.path.startsWith('/api/');
  return isRead && !isApi && (request.headers.accept ?? '').includes('text/html');
}
