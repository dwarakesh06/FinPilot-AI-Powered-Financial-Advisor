const PDFDocument = require('pdfkit');

/**
 * Service to generate beautiful printable PDF financial reports
 */
const generateMonthlyPDFReport = (res, data) => {
  const { user, month, transactions, budgets, insights } = data;

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
  });

  // Pipe to response
  doc.pipe(res);

  // Layout Colors
  const primaryColor = '#1e1b4b'; // Deep Indigo
  const secondaryColor = '#0891b2'; // Cyan Accent
  const darkTextColor = '#1e293b'; // Slate 800
  const lightTextColor = '#64748b'; // Slate 500
  const bgLight = '#f8fafc'; // Slate 50
  const dividerColor = '#cbd5e1'; // Slate 300
  const greenColor = '#10b981'; // Emerald 500
  const redColor = '#ef4444'; // Rose 500

  // ---------------- HEADER SECTION ----------------
  // Draw top aesthetic colored bar
  doc.rect(0, 0, doc.page.width, 24).fill(primaryColor);

  // Draw title & logo
  doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text('AI EXPENSE TRACKER', 40, 50);
  doc.fillColor(secondaryColor).fontSize(10).font('Helvetica-Bold').text('FINANCIAL ADVISOR STATEMENT', 40, 72);

  // Draw report metadata
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica-Bold').text(`Statement Month:`, 420, 50, { align: 'right' });
  doc.font('Helvetica').text(`${month}`, 420, 62, { align: 'right' });
  doc.font('Helvetica-Bold').text(`Client Name:`, 420, 78, { align: 'right' });
  doc.font('Helvetica').text(`${user.name}`, 420, 90, { align: 'right' });

  // Divider
  doc.moveTo(40, 115).lineTo(555, 115).strokeColor(dividerColor).lineWidth(1).stroke();

  // ---------------- 1. EXECUTIVE SUMMARY & HEALTH SCORE ----------------
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('1. Executive Financial Summary', 40, 130);

  // Health Score Box (Left)
  const healthScore = insights ? insights.healthScore : 70;
  let scoreColor = greenColor;
  let scoreText = 'Excellent';
  if (healthScore < 50) {
    scoreColor = redColor;
    scoreText = 'Critical';
  } else if (healthScore < 75) {
    scoreColor = '#f59e0b'; // Amber
    scoreText = 'Fair';
  }

  doc.rect(40, 155, 160, 95).fill(bgLight);
  doc.fillColor(darkTextColor).fontSize(9).font('Helvetica-Bold').text('FINANCIAL HEALTH SCORE', 50, 165);
  doc.fillColor(scoreColor).fontSize(36).font('Helvetica-Bold').text(`${healthScore}`, 50, 180);
  doc.fontSize(12).font('Helvetica-Bold').text(`/ 100`, 115, 200);
  doc.fillColor(scoreColor).fontSize(9).font('Helvetica-Bold').text(`Status: ${scoreText}`, 50, 230);

  // Key Statistics Box (Right)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = insights ? insights.savingsRate : (totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0);

  doc.rect(220, 155, 335, 95).fill(bgLight);
  
  doc.fillColor(lightTextColor).fontSize(9).font('Helvetica-Bold').text('TOTAL INCOME', 235, 165);
  doc.fillColor(greenColor).fontSize(14).font('Helvetica-Bold').text(`$${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 235, 178);

  doc.fillColor(lightTextColor).fontSize(9).font('Helvetica-Bold').text('TOTAL EXPENSES', 395, 165);
  doc.fillColor(redColor).fontSize(14).font('Helvetica-Bold').text(`$${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 395, 178);

  doc.fillColor(lightTextColor).fontSize(9).font('Helvetica-Bold').text('NET MONTHLY SAVINGS', 235, 205);
  doc.fillColor(netSavings >= 0 ? greenColor : redColor).fontSize(14).font('Helvetica-Bold').text(`$${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 235, 218);

  doc.fillColor(lightTextColor).fontSize(9).font('Helvetica-Bold').text('SAVINGS RATE', 395, 205);
  doc.fillColor(savingsRate >= 20 ? greenColor : '#f59e0b').fontSize(14).font('Helvetica-Bold').text(`${savingsRate.toFixed(1)}%`, 395, 218);

  // AI Advisor Insights Section
  if (insights && insights.summary) {
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('AI Advisor Assessment:', 40, 270);
    doc.fillColor(darkTextColor).fontSize(9).font('Helvetica').text(insights.summary, 40, 285, { width: 515, align: 'justify', lineGap: 3 });
  }

  // Divider
  doc.moveTo(40, 340).lineTo(555, 340).strokeColor(dividerColor).stroke();

  // ---------------- 2. BUDGET VS SPENDING ----------------
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('2. Budget Allocation Performance', 40, 355);

  // Draw Budget Table Header
  doc.rect(40, 375, 515, 18).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('Category', 50, 380);
  doc.text('Monthly Budget', 180, 380, { width: 90, align: 'right' });
  doc.text('Actual Spending', 290, 380, { width: 90, align: 'right' });
  doc.text('Variance / Status', 420, 380, { width: 120, align: 'right' });

  let budgetY = 398;
  const categoriesWithSpend = new Set([...budgets.map(b => b.category), ...transactions.filter(t => t.type === 'expense').map(t => t.category)]);

  Array.from(categoriesWithSpend).slice(0, 7).forEach((cat) => {
    const budgetObj = budgets.find(b => b.category === cat);
    const limit = budgetObj ? budgetObj.amount : 0;
    
    const actual = transactions
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);

    const variance = limit > 0 ? limit - actual : 0;
    const isExceeded = actual > limit && limit > 0;

    // Alternating rows
    if ((budgetY / 18) % 2 === 0) {
      doc.rect(40, budgetY - 3, 515, 16).fill('#f1f5f9');
    }

    doc.fillColor(darkTextColor).fontSize(8).font('Helvetica');
    doc.text(cat, 50, budgetY);
    doc.text(limit > 0 ? `$${limit.toFixed(2)}` : 'N/A (No Budget)', 180, budgetY, { width: 90, align: 'right' });
    doc.text(`$${actual.toFixed(2)}`, 290, budgetY, { width: 90, align: 'right' });

    let statusText = '';
    let statusColor = darkTextColor;

    if (limit > 0) {
      if (isExceeded) {
        statusText = `Over by $${Math.abs(variance).toFixed(2)}`;
        statusColor = redColor;
      } else {
        statusText = `Remaining: $${variance.toFixed(2)}`;
        statusColor = greenColor;
      }
    } else {
      statusText = 'No Budget Cap';
      statusColor = lightTextColor;
    }

    doc.fillColor(statusColor).font('Helvetica-Bold').text(statusText, 420, budgetY, { width: 120, align: 'right' });
    budgetY += 16;
  });

  // Check for next page
  doc.addPage();

  // Draw Header for Page 2
  doc.rect(0, 0, doc.page.width, 15).fill(primaryColor);
  
  // ---------------- 3. RECENT TRANSACTIONS LEDGER ----------------
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('3. Detailed Transaction Ledger', 40, 40);

  // Table Headers
  doc.rect(40, 60, 515, 18).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('Date', 50, 65);
  doc.text('Description / Payee', 120, 65);
  doc.text('Category', 280, 65);
  doc.text('Type', 390, 65);
  doc.text('Amount', 460, 65, { width: 85, align: 'right' });

  let ledgerY = 83;
  const sortedTxs = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Limit to first 25 transactions on page 2 to avoid overflow
  sortedTxs.slice(0, 26).forEach((tx) => {
    // Alternating rows
    if ((ledgerY / 18) % 2 === 0) {
      doc.rect(40, ledgerY - 3, 515, 16).fill('#f1f5f9');
    }

    const txDate = new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });

    doc.fillColor(darkTextColor).fontSize(8).font('Helvetica');
    doc.text(txDate, 50, ledgerY);
    doc.text(tx.title.substring(0, 32), 120, ledgerY);
    doc.text(tx.category, 280, ledgerY);
    
    const typeLabel = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
    doc.fillColor(tx.type === 'income' ? greenColor : redColor).font('Helvetica-Bold').text(typeLabel, 390, ledgerY);

    const amtStr = `${tx.type === 'income' ? '+' : '-'}$${tx.amount.toFixed(2)}`;
    doc.text(amtStr, 460, ledgerY, { width: 85, align: 'right' });

    ledgerY += 16;
  });

  // Footer page number marking
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(lightTextColor).fontSize(7).font('Helvetica');
    doc.text(`Page ${i + 1} of ${range.count}`, 40, doc.page.height - 30, { align: 'center' });
    doc.text('Report synthesized by AI Expense Tracker & Financial Advisor. Confidential.', 40, doc.page.height - 40, { align: 'left' });
    doc.text(`Run Date: ${new Date().toLocaleDateString()}`, 40, doc.page.height - 40, { align: 'right' });
  }

  // End stream
  doc.end();
};

module.exports = {
  generateMonthlyPDFReport,
};
