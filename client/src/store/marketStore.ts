import { create } from 'zustand';
import api from '../services/api';
import { DashboardData, SectorAnalysis, StockScannedOpportunity } from '../types';

interface MarketState {
  dashboardData: DashboardData | null;
  sectorsList: SectorAnalysis[];
  longScannerResults: StockScannedOpportunity[];
  shortScannerResults: StockScannedOpportunity[];
  selectedSectorDetails: { sector: SectorAnalysis; stocks: StockScannedOpportunity[] } | null;
  loading: boolean;
  sectorLoading: boolean;

  setDashboardData: (data: DashboardData) => void;
  setSectorsList: (list: SectorAnalysis[]) => void;
  setLongScannerResults: (results: StockScannedOpportunity[]) => void;
  setShortScannerResults: (results: StockScannedOpportunity[]) => void;
  
  fetchInitialData: () => Promise<void>;
  fetchSectorDetails: (sectorName: string) => Promise<void>;
  clearSectorDetails: () => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  dashboardData: null,
  sectorsList: [],
  longScannerResults: [],
  shortScannerResults: [],
  selectedSectorDetails: null,
  loading: false,
  sectorLoading: false,

  setDashboardData: (dashboardData) => set({ dashboardData }),
  setSectorsList: (sectorsList) => set({ sectorsList }),
  setLongScannerResults: (longScannerResults) => set({ longScannerResults }),
  setShortScannerResults: (shortScannerResults) => set({ shortScannerResults }),

  fetchInitialData: async () => {
    set({ loading: true });
    try {
      const [dashRes, sectorsRes, longRes, shortRes] = await Promise.all([
        api.get('/market/dashboard'),
        api.get('/market/sectors'),
        api.get('/market/scanner/long'),
        api.get('/market/scanner/short'),
      ]);

      set({
        dashboardData: dashRes.data,
        sectorsList: sectorsRes.data,
        longScannerResults: longRes.data,
        shortScannerResults: shortRes.data,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to fetch initial market data:', err);
      set({ loading: false });
    }
  },

  fetchSectorDetails: async (sectorName) => {
    set({ sectorLoading: true });
    try {
      const res = await api.get(`/market/sectors/${sectorName}`);
      set({ selectedSectorDetails: res.data, sectorLoading: false });
    } catch (err) {
      console.error(`Failed to fetch sector details for ${sectorName}:`, err);
      set({ sectorLoading: false });
    }
  },

  clearSectorDetails: () => set({ selectedSectorDetails: null }),
}));

export default useMarketStore;
