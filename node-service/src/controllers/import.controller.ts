import { Request, Response } from 'express';
import { importService } from '../services/import.service';

export class ImportController {
  /**
   * POST /mindmaps/import
   * Import a concept map from JSON export data
   */
  async importConceptMap(req: Request, res: Response) {
    try {
      const data = req.body; // ConceptMapExport JSON

      // Import the concept map
      const importedMap = await importService.importConceptMap(data);

      res.status(201).json({
        success: true,
        map: importedMap,
        message: 'Concept map imported successfully'
      });
    } catch (error: any) {
      console.error('Error importing concept map:', error);
      res.status(400).json({
        error: error.message || 'Failed to import concept map'
      });
    }
  }
}

export const importController = new ImportController();
