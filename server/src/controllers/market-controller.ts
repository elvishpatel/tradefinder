import { Request, Response } from 'express';
import marketEngine from '../engines/market-engine';
import logger from '../utils/logger';

export class MarketController {
  getDashboard(req: Request, res: Response) {
    try {
      const data = marketEngine.getDashboardData();
      return res.json(data);
    } catch (err: any) {
      logger.error(`Error in getDashboard: ${err.message}`);
      return res.status(500).json({ error: { message: 'Failed to fetch dashboard data' } });
    }
  }

  getSectors(req: Request, res: Response) {
    try {
      const data = marketEngine.getSectorAnalysisList();
      return res.json(data);
    } catch (err: any) {
      logger.error(`Error in getSectors: ${err.message}`);
      return res.status(500).json({ error: { message: 'Failed to fetch sectors performance data' } });
    }
  }

  getSectorDetails(req: Request, res: Response) {
    const { name } = req.params;
    try {
      const data = marketEngine.getSectorDetails(name);
      if (!data) {
        return res.status(404).json({ error: { message: `Sector ${name} not found` } });
      }
      return res.json(data);
    } catch (err: any) {
      logger.error(`Error in getSectorDetails for ${name}: ${err.message}`);
      return res.status(500).json({ error: { message: 'Failed to fetch sector details' } });
    }
  }

  getScannerResults(req: Request, res: Response) {
    const { type } = req.params; // LONG or SHORT
    const scannerType = type?.toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG';
    try {
      const data = marketEngine.getScannerResults(scannerType);
      return res.json(data);
    } catch (err: any) {
      logger.error(`Error in getScannerResults for ${scannerType}: ${err.message}`);
      return res.status(500).json({ error: { message: 'Failed to fetch scanner results' } });
    }
  }
}

export default new MarketController();
