import { useState, useEffect } from "preact/hooks";
import "./app.css";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
];

// API configuration
const API_KEY = 'your-api-key-here'; // Replace with actual API key
const BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

// Fallback rates in case API fails
const fallbackRates: { [key: string]: { [key: string]: number } } = {
  USD: { EUR: 0.85, GBP: 0.73, JPY: 110, CAD: 1.25, AUD: 1.35, CHF: 0.92, CNY: 6.45 },
  EUR: { USD: 1.18, GBP: 0.86, JPY: 129, CAD: 1.47, AUD: 1.59, CHF: 1.08, CNY: 7.59 },
  GBP: { USD: 1.37, EUR: 1.16, JPY: 150, CAD: 1.71, AUD: 1.85, CHF: 1.26, CNY: 8.83 },
};

export function App() {
  const [fromCurrency, setFromCurrency] = useState<Currency>(currencies[0]);
  const [toCurrency, setToCurrency] = useState<Currency>(currencies[1]);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [modalType, setModalType] = useState<'from' | 'to'>('from');
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch exchange rates from API
  const fetchExchangeRates = async (baseCurrency: string) => {
    setIsLoadingRates(true);
    setApiError(null);
    
    try {
      // Using a free API service (you can replace with your preferred service)
      const response = await fetch(`${BASE_URL}/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setExchangeRates(data.rates || {});
      setLastUpdated(new Date());
      setApiError(null);
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      setApiError('Failed to fetch live rates. Using cached rates.');
      
      // Use fallback rates
      const fallbackForBase = fallbackRates[baseCurrency];
      if (fallbackForBase) {
        setExchangeRates(fallbackForBase);
      }
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Fetch rates when component mounts or base currency changes
  useEffect(() => {
    fetchExchangeRates(fromCurrency.code);
  }, [fromCurrency.code]);
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCurrencyModal(false);
      }
    };

    if (showCurrencyModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showCurrencyModal]);

  const calculateExchange = (amount: string, from: string, to: string): string => {
    if (!amount || amount === "0") return "";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "";
    
    if (from === to) return amount;
    
    // If we have rates from API and the base currency matches
    if (exchangeRates && Object.keys(exchangeRates).length > 0) {
      if (from === fromCurrency.code) {
        // Direct conversion from base currency
        const rate = exchangeRates[to];
        if (rate) {
          return (numAmount * rate).toFixed(2);
        }
      } else if (to === fromCurrency.code) {
        // Inverse conversion to base currency
        const rate = exchangeRates[from];
        if (rate) {
          return (numAmount / rate).toFixed(2);
        }
      } else {
        // Cross currency conversion via base currency
        const rateFrom = exchangeRates[from];
        const rateTo = exchangeRates[to];
        if (rateFrom && rateTo) {
          return (numAmount / rateFrom * rateTo).toFixed(2);
        }
      }
    }
    
    // Fallback to hardcoded rates if API rates not available
    const fallbackRate = fallbackRates[from]?.[to] || 1;
    return (numAmount * fallbackRate).toFixed(2);
  };

  useEffect(() => {
    if (fromAmount) {
      const converted = calculateExchange(fromAmount, fromCurrency.code, toCurrency.code);
      setToAmount(converted);
    } else {
      setToAmount("");
    }
  }, [fromAmount, fromCurrency, toCurrency]);

  const handleCurrencySelect = (currency: Currency) => {
    if (modalType === 'from') {
      setFromCurrency(currency);
      // Fetch new rates when base currency changes
      if (currency.code !== fromCurrency.code) {
        fetchExchangeRates(currency.code);
      }
    } else {
      setToCurrency(currency);
    }
    setShowCurrencyModal(false);
  };

  const openCurrencyModal = (type: 'from' | 'to') => {
    setModalType(type);
    setShowCurrencyModal(true);
  };

  const handleSwapCurrencies = () => {
    const tempCurrency = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurrency);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleConfirmSwap = () => {
    if (!fromAmount || !toAmount) {
      alert("Please enter an amount to exchange");
      return;
    }
    alert(`Exchange confirmed: ${fromAmount} ${fromCurrency.code} → ${toAmount} ${toCurrency.code}`);
  };

  return (
    <div class="currency-exchange-container">
      <div class="exchange-card">
        <div class="card-header">
          <h1 class="title">💱 Currency Exchange</h1>
          <p class="subtitle">Convert your money with live exchange rates</p>
        </div>

        <form class="exchange-form" onSubmit={(e) => { e.preventDefault(); handleConfirmSwap(); }}>
          {/* From Currency Section */}
          <div class="currency-section">
            <label class="section-label">From</label>
            <div class="input-group">
              <button 
                type="button"
                class="currency-selector"
                onClick={() => openCurrencyModal('from')}
              >
                <span class="currency-flag">{fromCurrency.flag}</span>
                <span class="currency-code">{fromCurrency.code}</span>
                <span class="dropdown-arrow">▼</span>
              </button>
              <input
                type="number"
                class="amount-input"
                placeholder="0.00"
                value={fromAmount}
                onInput={(e) => setFromAmount((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          {/* Swap Button */}
          <div class="swap-section">
            <button type="button" class="swap-button" onClick={handleSwapCurrencies}>
              ⇅
            </button>
          </div>

          {/* To Currency Section */}
          <div class="currency-section">
            <label class="section-label">To</label>
            <div class="input-group">
              <button 
                type="button"
                class="currency-selector"
                onClick={() => openCurrencyModal('to')}
              >
                <span class="currency-flag">{toCurrency.flag}</span>
                <span class="currency-code">{toCurrency.code}</span>
                <span class="dropdown-arrow">▼</span>
              </button>
              <input
                type="number"
                class="amount-input"
                placeholder="0.00"
                value={toAmount}
                readOnly
              />
            </div>
          </div>

          {/* Exchange Rate Info */}
          {fromAmount && (
            <div class="exchange-rate-info">
              <div class="rate-display">
                <span class="rate-text">
                  1 {fromCurrency.code} = {calculateExchange("1", fromCurrency.code, toCurrency.code)} {toCurrency.code}
                </span>
                <button 
                  type="button" 
                  class="refresh-rates-btn"
                  onClick={() => fetchExchangeRates(fromCurrency.code)}
                  disabled={isLoadingRates}
                >
                  {isLoadingRates ? '⟳' : '🔄'}
                </button>
              </div>
              {lastUpdated && (
                <div class="rate-timestamp">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              {apiError && (
                <div class="rate-error">
                  ⚠️ {apiError}
                </div>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <button type="submit" class="confirm-button">
            <span class="button-icon">✓</span>
            Confirm Exchange
          </button>
        </form>
      </div>

      {/* Currency Selection Modal */}
      {showCurrencyModal && (
        <div class="modal-overlay" onClick={() => setShowCurrencyModal(false)}>
          <div class="modal-content" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3>Select Currency</h3>
              <button 
                type="button" 
                class="modal-close"
                onClick={() => setShowCurrencyModal(false)}
              >
                ✕
              </button>
            </div>
            <div class="currency-grid">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  class={`currency-option ${
                    currency.code === (modalType === 'from' ? fromCurrency.code : toCurrency.code) 
                      ? 'selected' : ''
                  }`}
                  onClick={() => handleCurrencySelect(currency)}
                >
                  <span class="currency-flag">{currency.flag}</span>
                  <div class="currency-details">
                    <span class="currency-code">{currency.code}</span>
                    <span class="currency-name">{currency.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
