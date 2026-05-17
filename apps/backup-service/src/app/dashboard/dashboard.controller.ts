import { Controller, Get, Res } from '@nestjs/common';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Response } from 'express';

@Controller()
export class DashboardController {
  @Get()
  redirectToDashboard(@Res() response: Response) {
    response.redirect('/dashboard');
  }

  @Get('dashboard')
  async renderDashboard(@Res() response: Response) {
    const html = await this.readAsset('index.html');
    response.type('html').send(html);
  }

  @Get('dashboard/styles.css')
  async renderStyles(@Res() response: Response) {
    const css = await this.readAsset('styles.css');
    response.type('text/css').send(css);
  }

  @Get('dashboard/app.js')
  async renderScript(@Res() response: Response) {
    const script = await this.readAsset('app.js');
    response.type('application/javascript').send(script);
  }

  private async readAsset(fileName: string) {
    const candidateRoots = [
      join(process.cwd(), 'static/dashboard'),
      join(process.cwd(), 'assets/dashboard'),
      join(process.cwd(), 'apps/backup-service/src/static/dashboard'),
      join(process.cwd(), 'apps/backup-service/src/assets/dashboard'),
      join(process.cwd(), 'dist/apps/backup-service/static/dashboard'),
      join(process.cwd(), 'dist/apps/backup-service/assets/dashboard'),
      join(process.cwd(), 'dist/apps/backup-service/src/assets/dashboard'),
    ];

    for (const root of candidateRoots) {
      const fullPath = join(root, fileName);
      if (existsSync(fullPath)) {
        return readFile(fullPath, 'utf8');
      }
    }

    throw new Error(`Dashboard asset not found: ${fileName}`);
  }
}
