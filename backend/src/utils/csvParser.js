/**
 * CSV Parser and Auto-Categorization Heuristics
 */

const parseCSVTransactions = (csvString) => {
  const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or lacks data rows');
  }

  const parseRow = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase());
  
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('payee') || h.includes('title') || h.includes('memo'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('value'));
  const typeIdx = headers.findIndex(h => h.includes('type'));

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    throw new Error('Invalid CSV format. Missing required column headers: Date, Description/Payee, and Amount.');
  }

  // Advanced Merchant Dictionary with Regex Rules
  const merchantDictionary = [
    { regex: /mcdonald|starbucks|subway|burger|pizza|dunkin|restaurant|eats|grill|cafe|pub|bar|dining|doordash|grubhub/i, category: 'Food & Dining', name: 'Food & Dining' },
    { regex: /walmart|target|kroger|safeway|costco|grocer|aldi|whole foods|supermarket|trader joe/i, category: 'Groceries', name: 'Supermarket' },
    { regex: /uber|lyft|taxi|gas|chevron|shell|exxon|bp|speedway|metro|transit|rail|airline|delta|united/i, category: 'Transportation', name: 'Transport' },
    { regex: /rent|mortgage|landlord|hoa|electric|power|water|comcast|verizon|t-mobile|at&t|internet|utilities|waste/i, category: 'Housing & Utilities', name: 'Housing & Utilities' },
    { regex: /netflix|spotify|hulu|disney|steam|epic|nintendo|playstation|gym|fitness|cinema|theater|concert|ticket|prime/i, category: 'Entertainment & Subscriptions', name: 'Entertainment' },
    { regex: /amazon|ebay|best buy|clothing|nordstrom|macys|zara|h&m|mall|shopping|store/i, category: 'Shopping', name: 'Retail Store' },
    { regex: /cvs|walgreens|pharmacy|medical|doctor|hospital|clinic|dentist|health|insurance/i, category: 'Healthcare', name: 'Healthcare' },
    { regex: /salary|payroll|direct deposit|employer|refund|dividend|interest|venmo|cashapp|deposit|zelle/i, category: 'Salary', name: 'Income' }
  ];

  const autoCategorizeAndClean = (rawDesc) => {
    let cleanName = rawDesc;
    let category = 'Miscellaneous';

    // Find the first matching rule in the dictionary
    for (const rule of merchantDictionary) {
      if (rule.regex.test(rawDesc)) {
        category = rule.category;
        
        // Extract a clean merchant name if we match known brands
        const match = rawDesc.match(rule.regex);
        if (match && match[0]) {
          // Capitalize first letter of matched word for a cleaner title
          cleanName = match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
        }
        break;
      }
    }

    return { category, cleanName };
  };

  const parsedTransactions = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.length < 3 || row.every(val => val === '')) continue;

    const dateVal = row[dateIdx];
    const rawDescVal = row[descIdx] || 'Imported Transaction';
    const amountVal = parseFloat(row[amountIdx].replace(/[$,\s]/g, ''));

    if (isNaN(amountVal)) continue;

    let type = 'expense';
    let cleanAmount = Math.abs(amountVal);

    if (typeIdx !== -1 && row[typeIdx]) {
      const explicitType = row[typeIdx].toLowerCase().trim();
      if (explicitType === 'income' || explicitType === 'credit') {
        type = 'income';
      }
    } else {
      if (amountVal > 0) {
        type = 'income';
      }
    }

    let date = new Date();
    try {
      const parsedDate = Date.parse(dateVal);
      if (!isNaN(parsedDate)) {
        date = new Date(parsedDate);
      }
    } catch (e) {
      // Keep today's date if parsing fails
    }

    const { category, cleanName } = autoCategorizeAndClean(rawDescVal);

    parsedTransactions.push({
      // Provide a clean title, but append a bit of raw description if it's too short to be useful
      title: cleanName.length < rawDescVal.length ? `${cleanName} (${rawDescVal.substring(0, 15)}...)` : rawDescVal,
      amount: cleanAmount,
      type,
      category,
      date,
      description: `Raw Import: ${rawDescVal}`,
      imported: true,
    });
  }

  return parsedTransactions;
};

module.exports = {
  parseCSVTransactions,
};
