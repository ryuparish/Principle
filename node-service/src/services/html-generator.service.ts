import * as fs from 'fs/promises';
import * as path from 'path';
import { ConceptMapExport } from './share.service';

export class HtmlGeneratorService {
  private templatePath = path.join(__dirname, '../../templates/viewer.html');
  private templateCache: string | null = null;

  /**
   * Generate standalone HTML file with embedded data
   */
  async generateHTML(data: ConceptMapExport): Promise<string> {
    try {
      // Cache template in memory after first read
      if (!this.templateCache) {
        this.templateCache = await fs.readFile(this.templatePath, 'utf-8');
      }
      const template = this.templateCache;

      // Replace meta tag placeholders
      let html = template
        .replace(/\{\{MAP_NAME\}\}/g, this.escapeHtml(data.map.name))
        .replace(/\{\{MAP_DESCRIPTION\}\}/g, this.escapeHtml(data.map.description || 'Interactive concept map'));

      // Inject data as JavaScript
      const dataScript = `window.CONCEPT_MAP_DATA = ${JSON.stringify(data, null, 0)};`;
      html = html.replace(
        '// DATA_INJECTION_POINT\n    window.CONCEPT_MAP_DATA = null;',
        dataScript
      );

      return html;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(
          'HTML viewer template not found. Run "npm run build:viewer-template" in client/ to generate it.'
        );
      }
      throw error;
    }
  }

  /**
   * Escape HTML special characters for meta tags
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Check if template exists (for health checks)
   * Returns true if template is cached or exists on disk
   */
  async isTemplateAvailable(): Promise<boolean> {
    if (this.templateCache !== null) {
      return true;
    }
    try {
      await fs.access(this.templatePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const htmlGeneratorService = new HtmlGeneratorService();
