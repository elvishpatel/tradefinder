import { ScannerEngine, Candle } from '../scanner-engine';

export interface SectorData {
  name: string;
  symbols: string[];
  historicalData: Record<string, Candle[]>; // Symbol -> Candles
}

export class SectorEngine {
  /**
   * Calculates the overall health and momentum score of a sector
   * based on its constituent stocks.
   */
  static analyzeSector(sector: SectorData) {
    let totalScore = 0;
    let uptrendCount = 0;
    
    for (const symbol of sector.symbols) {
      const candles = sector.historicalData[symbol];
      if (!candles || candles.length === 0) continue;

      const scanResult = ScannerEngine.runSwingScanner(symbol, candles);
      totalScore += scanResult.score;
      
      if (scanResult.isUptrend) {
        uptrendCount++;
      }
    }

    const averageScore = sector.symbols.length > 0 ? totalScore / sector.symbols.length : 0;
    const breadthPercentage = sector.symbols.length > 0 ? (uptrendCount / sector.symbols.length) * 100 : 0;

    return {
      sectorName: sector.name,
      averageMomentumScore: averageScore,
      breadthPercentage, // % of stocks in uptrend
      isImproving: breadthPercentage > 50 && averageScore > 40,
    };
  }

  /**
   * Run rotation analysis across multiple sectors to rank them
   */
  static rankSectors(sectors: SectorData[]) {
    const analyzed = sectors.map(s => this.analyzeSector(s));
    
    // Sort by momentum score descending
    return analyzed.sort((a, b) => b.averageMomentumScore - a.averageMomentumScore);
  }
}
