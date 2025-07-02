export interface UPIApp {
  id: string;
  name: string;
  shortName?: string;
  icon?: string;
  category: 'public' | 'private' | 'payment' | 'small-finance' | 'foreign' | 'regional-rural';
  description: string;
  available: boolean; // Whether the app is available for analysis
  bankCode?: string; // Added for bank identification
}

export const UPI_APPS: UPIApp[] = [
  // Public Sector Banks
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    description: 'India\'s largest public sector bank',
    category: 'public',
    available: true,
    bankCode: 'SBI'
  },
  {
    id: 'bob',
    name: 'Bank of Baroda',
    shortName: 'BOB',
    description: 'Leading public sector bank',
    category: 'public',
    available: false,
    bankCode: 'BARB'
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank',
    shortName: 'PNB',
    description: 'One of India\'s oldest public sector banks',
    category: 'public',
    available: false,
    bankCode: 'PUNB'
  },
  {
    id: 'canara',
    name: 'Canara Bank',
    shortName: 'CANARA',
    description: 'Major public sector bank',
    category: 'public',
    available: true,
    bankCode: 'CNRB'
  },

  // Private Sector Banks
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    description: 'India\'s largest private sector bank',
    category: 'private',
    available: false,
    bankCode: 'HDFC'
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    description: 'Leading private sector bank',
    category: 'private',
    available: false,
    bankCode: 'ICIC'
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    description: 'Major private sector bank',
    category: 'private',
    available: false,
    bankCode: 'UTIB'
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortName: 'Kotak',
    description: 'Private sector banking and financial services',
    category: 'private',
    available: true,
    bankCode: 'KKBK'
  },

  // Payment Banks
  {
    id: 'paytm',
    name: 'Paytm Payments Bank',
    shortName: 'Paytm',
    description: 'Digital payments and banking services',
    category: 'payment',
    available: false,
    bankCode: 'PYTM'
  },
  {
    id: 'airtel',
    name: 'Airtel Payments Bank',
    shortName: 'Airtel',
    description: 'Digital banking services',
    category: 'payment',
    available: false,
    bankCode: 'AIRP'
  },
  {
    id: 'jio',
    name: 'Jio Payments Bank',
    shortName: 'Jio',
    description: 'Digital banking platform',
    category: 'payment',
    available: false,
    bankCode: 'JIOP'
  },

  // Small Finance Banks
  {
    id: 'ausfb',
    name: 'AU Small Finance Bank',
    shortName: 'AU Bank',
    description: 'Small finance banking services',
    category: 'small-finance',
    available: false,
    bankCode: 'AUBL'
  },
  {
    id: 'equitas',
    name: 'Equitas Small Finance Bank',
    shortName: 'Equitas',
    description: 'Small finance banking services',
    category: 'small-finance',
    available: false,
    bankCode: 'ESFB'
  },

  // Foreign Banks
  {
    id: 'citi',
    name: 'Citibank',
    description: 'International banking services',
    category: 'foreign',
    available: false,
    bankCode: 'CITI'
  },
  {
    id: 'hsbc',
    name: 'HSBC Bank',
    description: 'Global banking and financial services',
    category: 'foreign',
    available: false,
    bankCode: 'HSBC'
  },

  // Additional Payment Apps
  {
    id: 'phonepe',
    name: 'PhonePe',
    description: 'Digital payments platform',
    category: 'payment',
    available: true
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    description: 'Google\'s payment service',
    category: 'payment',
    available: false
  },
  {
    id: 'bhim',
    name: 'BHIM',
    description: 'Government\'s UPI payment app',
    category: 'payment',
    available: false
  },
  {
    id: 'adityabirla',
    name: 'Aditya Birla Capital Digital',
    description: 'Digital financial solutions',
    category: 'payment',
    available: false
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    description: 'Digital payment service by Amazon',
    category: 'payment',
    available: false
  },
  {
    id: 'bajajfinserv',
    name: 'Bajaj Finserv',
    description: 'Financial services company',
    category: 'payment',
    available: false
  },
  {
    id: 'bharatpe',
    name: 'BharatPe',
    description: 'QR code-based payment app',
    category: 'payment',
    available: false
  },
  {
    id: 'changejar',
    name: 'ChangeJar',
    description: 'Digital savings and investment app',
    category: 'payment',
    available: false
  },
  {
    id: 'cred',
    name: 'CRED',
    description: 'Credit card bill payment platform',
    category: 'payment',
    available: false
  },
  {
    id: 'curiemoney',
    name: 'Curie Money',
    description: 'Financial services app',
    category: 'payment',
    available: false
  },
  {
    id: 'famapp',
    name: 'FamApp by Trio',
    description: 'Family-oriented payment app',
    category: 'payment',
    available: false
  },
  {
    id: 'fimoney',
    name: 'Fi Money',
    description: 'Neobanking and money management app',
    category: 'payment',
    available: false
  },
  {
    id: 'flipkartupi',
    name: 'Flipkart UPI',
    description: 'UPI service by Flipkart',
    category: 'payment',
    available: false
  },
  {
    id: 'freo',
    name: 'Freo',
    description: 'Credit and financial wellness app',
    category: 'payment',
    available: false
  },
  {
    id: 'groww',
    name: 'Groww',
    description: 'Investment and trading platform',
    category: 'payment',
    available: false
  },
  {
    id: 'indmoney',
    name: 'IND Money',
    description: 'Wealth management and investment app',
    category: 'payment',
    available: false
  },
  {
    id: 'jupitermoney',
    name: 'Jupiter Money',
    description: 'Digital banking and money management app',
    category: 'payment',
    available: false
  },
  {
    id: 'kiwi',
    name: 'Kiwi',
    description: 'Credit on UPI app',
    category: 'payment',
    available: false
  },
  {
    id: 'kreditpe',
    name: 'Kredit.Pe',
    description: 'Digital credit platform',
    category: 'payment',
    available: false
  },
  {
    id: 'mobikwik',
    name: 'MobiKwik',
    description: 'Digital wallet and payment app',
    category: 'payment',
    available: false
  },
  {
    id: 'moneyview',
    name: 'Money View',
    description: 'Personal finance management app',
    category: 'payment',
    available: false
  },
  {
    id: 'navi',
    name: 'Navi',
    description: 'Personal loans and financial products',
    category: 'payment',
    available: false
  },
  {
    id: 'niyoglobal',
    name: 'Niyo Global',
    description: 'Digital banking for international travelers',
    category: 'payment',
    available: false
  },
  {
    id: 'onecard',
    name: 'One Card',
    description: 'Credit card and rewards platform',
    category: 'payment',
    available: false
  },
  {
    id: 'popclub',
    name: 'POPclub',
    description: 'Shopping and rewards app',
    category: 'payment',
    available: false
  },
  {
    id: 'riomoney',
    name: 'Rio Money',
    description: 'Financial services app',
    category: 'payment',
    available: false
  },
  {
    id: 'samsungpay',
    name: 'Samsung Pay',
    description: 'Mobile payment and digital wallet',
    category: 'payment',
    available: false
  },
  {
    id: 'salaryse',
    name: 'salaryse',
    description: 'Financial wellness and credit app',
    category: 'payment',
    available: false
  },
  {
    id: 'shriramone',
    name: 'Shriram One',
    description: 'Financial services and investment app',
    category: 'payment',
    available: false
  },
  {
    id: 'supermoney',
    name: 'super.money',
    description: 'Financial services app',
    category: 'payment',
    available: false
  },
  {
    id: 'tataneu',
    name: 'Tata Neu',
    description: 'Super-app for shopping and payments',
    category: 'payment',
    available: false
  },
  {
    id: 'timepay',
    name: 'TimePay',
    description: 'Digital payment solutions',
    category: 'payment',
    available: false
  },
  {
    id: 'twallet',
    name: 'T Wallet',
    description: 'Official digital wallet of Telangana',
    category: 'payment',
    available: false
  },
  {
    id: 'twidpay',
    name: 'Twid Pay',
    description: 'Rewards-based payment network',
    category: 'payment',
    available: false
  },
  {
    id: 'ultracash',
    name: 'Ultracash',
    description: 'Mobile payment and financial services',
    category: 'payment',
    available: false
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Messaging app with payment features',
    category: 'payment',
    available: false
  }
];

export const getAppsByCategory = (category?: UPIApp['category']) => {
  let apps = UPI_APPS;

  if (category) {
    return apps.filter(app => app.category === category);
  }

  return apps;
};

export const findAppById = (id: string) => {
  return UPI_APPS.find(app => app.id === id);
};

export const findAppByName = (name: string): UPIApp | undefined => {
  return UPI_APPS.find(app =>
    app.name.toLowerCase() === name.toLowerCase() ||
    app.shortName?.toLowerCase() === name.toLowerCase()
  );
};

export const searchApps = (query: string): UPIApp[] => {
  if (!query.trim()) return UPI_APPS;
  const searchTerms = query.toLowerCase().trim().split(/\s+/);

  // Simple Levenshtein distance for typo tolerance
  function levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[a.length][b.length];
  }

  return UPI_APPS.filter(app => {
    // Build a rich searchable text for each app
    const keywords = [
      app.name,
      app.shortName,
      app.description,
      app.bankCode,
      app.category,
      'upi', 'bank', 'payments', 'digital', 'wallet', 'finance', 'mobile', 'transfer', 'app',
      ...(app.name ? app.name.split(/\s+/) : []),
      ...(app.shortName ? [app.shortName] : []),
      ...(app.bankCode ? [app.bankCode] : []),
    ].filter(Boolean).map(s => s!.toLowerCase());

    // For each search term, match if:
    // - It is a substring of any keyword
    // - Levenshtein distance <= 2 (typo tolerance)
    return searchTerms.some(term =>
      keywords.some(keyword =>
        keyword.includes(term) ||
        levenshtein(keyword, term) <= 2
      )
    );
  });
};

// Helper function to get search suggestions
export const getSearchSuggestions = (query: string): string[] => {
  if (!query.trim()) return [];

  const results = searchApps(query);
  const suggestions: string[] = [];

  results.forEach(app => {
    suggestions.push(app.name);
    if (app.shortName) suggestions.push(app.shortName);

    // Add bank-specific suggestions
    if (['public', 'private', 'small-finance', 'regional-rural'].includes(app.category)) {
      suggestions.push(`${app.name} UPI`);
      suggestions.push(`${app.name} Mobile Banking`);
      if (app.bankCode) suggestions.push(app.bankCode);
    }
  });

  // Remove duplicates and sort
  return [...new Set(suggestions)]
    .sort((a, b) => a.length - b.length)
    .slice(0, 10); // Limit to top 10 suggestions
};

export const CATEGORY_TITLES = {
  public: 'Public Sector Banks',
  private: 'Private Sector Banks',
  payment: 'Payment Banks',
  'small-finance': 'Small Finance Banks',
  foreign: 'Foreign Banks',
  'regional-rural': 'Regional Rural Banks'
}; 