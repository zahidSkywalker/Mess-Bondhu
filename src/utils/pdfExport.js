import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateMonthlySummary, getExpenseBreakdown, getDailyMealSummary } from './calculations';
import db from '../db';
import { formatAmount, formatMonthKey, getDaysInMonth, toBengaliNum } from './formatters';
import { DAYS_SHORT_BN, DAYS_SHORT_EN, MONTHS_BN, MONTHS_EN, EXPENSE_CATEGORIES } from './constants';

function arrayBufferToBase64(buffer) {
  return new Promise(function(resolve, reject) {
    var blob = new Blob([buffer], { type: 'application/octet-stream' });
    var reader = new FileReader();
    reader.onload = function() { resolve(reader.result.split(',')[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function tryFetchFont(urls) {
  for (var i = 0; i < urls.length; i++) {
    try {
      var res = await fetch(urls[i]);
      if (res.ok) {
        var buffer = await res.arrayBuffer();
        if (buffer.byteLength > 5000) return buffer;
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function loadBengaliFonts(doc) {
  try {
    var regularUrls = [
      'https://cdn.jsdelivr.net/gh/notofonts/bengali/fonts/NotoSansBengali/hinted/ttf/NotoSansBengali-Regular.ttf'
    ];
    var boldUrls = [
      'https://cdn.jsdelivr.net/gh/notofonts/bengali/fonts/NotoSansBengali/hinted/ttf/NotoSansBengali-Bold.ttf'
    ];
    var results = await Promise.all([tryFetchFont(regularUrls), tryFetchFont(boldUrls)]);
    var regularBuffer = results[0];
    var boldBuffer = results[1];
    if (!regularBuffer) return false;
    var regularBase64 = await arrayBufferToBase64(regularBuffer);
    doc.addFileToVFS('NotoSansBengali-Regular.ttf', regularBase64);
    doc.addFont('NotoSansBengali-Regular.ttf', 'NotoSansBengali', 'normal');
    if (boldBuffer) {
      var boldBase64 = await arrayBufferToBase64(boldBuffer);
      doc.addFileToVFS('NotoSansBengali-Bold.ttf', boldBase64);
      doc.addFont('NotoSansBengali-Bold.ttf', 'NotoSansBengali', 'bold');
    }
    return true;
  } catch (e) {
    console.warn('Bengali font loading failed:', e);
    return false;
  }
}

export async function generatePDF(messId, year, month, messProfile, lang = 'bn') {
  var serviceChargePercent = 0;
  var mealRateMode = 'standard';
  var customMealRate = 0;
  try {
    var settings = {};
    var keys = ['serviceChargePercent', 'mealRateMode', 'customMealRate'];
    for (var key of keys) {
      var row = await db.settings.where('key').equals(key).first();
      settings[key] = row && row.value ? row.value : (key === 'serviceChargePercent' || key === 'customMealRate' ? 0 : 'standard');
    }
    serviceChargePercent = Number(settings.serviceChargePercent) || 0;
    mealRateMode = settings.mealRateMode || 'standard';
    customMealRate = Number(settings.customMealRate) || 0;
  } catch (err) {
    console.error('Failed to load settings for PDF:', err);
  }

  var summary = await calculateMonthlySummary(messId, year, month, {
    serviceChargePercent: serviceChargePercent,
    mealRateMode: mealRateMode,
    customMealRate: customMealRate,
  });

  var expenseBreakdown = await getExpenseBreakdown(messId, year, month);
  var dailyData = await getDailyMealSummary(messId, year, month);
  var mealDateMap = dailyData.dateMap;
  var activeMembers = dailyData.activeMembers;

  var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  var fontLoaded = await loadBengaliFonts(doc);
  var useBengali = fontLoaded && lang === 'bn';
  var activeFontName = useBengali ? 'NotoSansBengali' : 'helvetica';

  var num = function(n) { return useBengali ? toBengaliNum(n) : String(n); };
  var months = useBengali ? MONTHS_BN : MONTHS_EN;
  var days = useBengali ? DAYS_SHORT_BN : DAYS_SHORT_EN;
  var monthLabel = months[month - 1] + ' ' + num(year);

  var labels = {
    title: useBengali ? '\u09AE\u09BE\u09B8\u09BF\u09BF\u0995 \u09AE\u09C7\u09B8 \u09AE\u09C7\u09B8 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F' : 'Monthly Mess Report',
    period: useBengali ? '\u09B8\u09AE\u09AF\u09BC\u0995\u0995\u09BE\u09B2' : 'Period',
    messName: useBengali ? '\u09AE\u09C7\u09B8\u09C7\u09B0\u09B0 \u09A8\u09BE\u09BE\u09AE' : 'Mess Name',
    messAddress: useBengali ? '\u09A0\u09BF\u0995\u09BE\u09A8\u09BE' : 'Address',
    manager: useBengali ? '\u09AE\u09CD\u09AF\u09BE\u09A8\u09C7\u099C\u09BE\u09B0' : 'Manager',
    preparedOn: useBengali ? '\u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4\u09BF\u099F\u09BF\u09B0\u09BF' : 'Prepared on',
    summary: useBengali ? '\u09B8\u09BE\u09B0\u09B8\u0902\u0999\u0995\u09CD\u09B7\u09C7\u09AA' : 'Summary',
    totalExpense: useBengali ? '\u09AE\u09CB\u099F \u0996\u09B0\u099A\u099A' : 'Total Expense',
    bazarCost: useBengali ? '\u09AC\u09BE\u099C\u09BE\u09B0 \u0996\u09B0\u099A\u099A' : 'Bazar Cost',
    otherExpense: useBengali ? '\u0985\u09A8\u09CD\u09AF\u09BE\u09A8\u09CD\u09AF \u0996\u09B0\u099A\u099A' : 'Other Expenses',
    totalRent: useBengali ? '\u09AE\u09CB\u099F \u09AD\u09BE\u09A1\u09BC\u09BE' : 'Total Rent',
    totalMeals: useBengali ? '\u09AE\u09CB\u099F \u0996\u09BE\u09AC\u09BE\u09B0\u09BE\u09B0' : 'Total Meals',
    mealRate: useBengali ? '\u0996\u09BE\u09AC\u09BE\u09B0\u09C7\u09B0 \u09B0\u09C7\u099F' : 'Meal Rate',
    totalCollected: useBengali ? '\u09AE\u09CB\u099F \u0986\u09A6\u09BE\u09AF\u09BC' : 'Total Collected',
    totalDue: useBengali ? '\u09AE\u09CB\u099F \u09AC\u09BE\u0995\u09BF' : 'Total Due',
    activeMembers: useBengali ? '\u09B8\u0995\u09CD\u0995\u09BF\u09AF\u09BC \u09B8\u09A6\u09A6\u09CD\u09AF' : 'Active Members',
    memberDetails: useBengali ? '\u09B8\u09A6\u09A6\u09CD\u09AF\u09C7\u09B0\u09B0\u09B0 \u09AC\u09BF\u09AC\u09BF\u09B0\u09B0' : 'Member Details',
    sl: useBengali ? '\u0995\u09CD\u09B0\u09AE' : 'SL',
    name: useBengali ? '\u09A8\u09BE\u09BE\u09AE' : 'Name',
    meals: useBengali ? '\u0996\u09BE\u09AC\u09BE\u09B0\u09BE\u09B0' : 'Meals',
    mealCost: useBengali ? '\u0996\u09BE\u09AC\u09BE\u09B0\u09C7\u09B0 \u09A6\u09BE\u09AE' : 'Meal Cost',
    rent: useBengali ? '\u09AD\u09BE\u09A1\u09BC\u09BE' : 'Rent',
    sharedExpense: useBengali ? '\u09AD\u09BE\u0997\u09C7\u09B0\u09C7\u09B0 \u0996\u09B0\u09B0\u09A9\u09A2' : 'Shared Exp.',
    serviceCharge: useBengali ? '\u09B8\u09BE\u09B0\u09AD\u09BF\u09BF\u09B8 \u099A\u09BF\u09BE\u099C \u099A\u09BE\u09B0\u09CD\u099C' : 'S. Charge',
    totalDueCol: useBengali ? '\u09AE\u09CB\u099F \u09AC\u09BE\u0995\u09BF' : 'Total Due',
    paid: useBengali ? '\u09AA\u09B0\u09BF\u09BF\u09B6' : 'Paid',
    balance: useBengali ? '\u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8' : 'Balance',
    grandTotal: useBengali ? '\u09B8\u09B0\u09B0\u09AE\u09CB\u099F' : 'Grand Total',
    expenseDetails: useBengali ? '\u0996\u09B0\u09B0\u099A\u099C\u09B0 \u09AC\u09BF\u09AC\u09BF\u09B0' : 'Expense Details',
    category: useBengali ? '\u0996\u09BE\u09BE\u09A4' : 'Category',
    amount: useBengali ? '\u09AA\u09B0\u09BF\u09BF\u09AE\u09A8\u09BE' : 'Amount',
    count: useBengali ? '\u09B8\u0902\u0996\u09CD\u09AF\u09CD\u09BE' : 'Count',
    mealDetails: useBengali ? '\u0996\u09BE\u09AC\u09BE\u09B0\u09C7\u09B0\u09B0\u09B0 \u09AC\u09BF\u09AC\u09BF\u09B0' : 'Meal Details',
    date: useBengali ? '\u09A4\u09BE\u09B0\u09BF\u0996' : 'Date',
    day: useBengali ? '\u09A6\u09BF\u09A8' : 'Day',
    managerSignature: useBengali ? '\u09AE\u09CD\u09AF\u09BE\u09A8\u09C7\u099C\u09BE\u09B0\u09B0\u09C7\u09B0\u09B8\u09CD\u09AC\u09BE\u0995\u09CB\u09B7\u09B0' : 'Manager Signature',
    page: useBengali ? '\u09AA\u09C3\u09C3\u09C3\u09BE' : 'Page',
  };

  var setFont = function(style) {
    style = style || 'normal';
    if (useBengali) {
      doc.setFont('NotoSansBengali', style);
    } else {
      doc.setFont('helvetica', style);
    }
  };

  var pageWidth = doc.internal.pageSize.getWidth();
  var margin = 15;
  var contentWidth = pageWidth - margin * 2;
  var yPos = margin;

  var fmtCur = function(amount) { return 'Tk ' + formatAmount(amount); };

  var checkPageBreak = function(neededHeight) {
    neededHeight = neededHeight || 30;
    if (yPos + neededHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  var addFooter = function() {
    var pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('NotoSansBengali', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(labels.page + ' ' + num(i) + ' / ' + num(pageCount), pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      doc.setFont('NotoSansBengali', 'normal');
      doc.text('Mess Bondhu Pro', margin, doc.internal.pageSize.getHeight() - 10);
    }
  };

  setFont('NotoSansBengali', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(34, 87, 122);
  doc.text(labels.title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  setFont('NotoSansBengali', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(labels.period + ': ' + monthLabel, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  setFont('NotoSansBengali', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  if (messProfile) {
    doc.text(labels.messName + ': ' + (messProfile.name || '-'), margin, yPos);
    yPos += 5;
    if (messProfile.address) {
      doc.text(labels.messAddress + ': ' + messProfile.address, margin, yPos);
      yPos += 5;
    }
    if (messProfile.managerName) {
      doc.text(labels.manager + ': ' + messProfile.managerName, margin, yPos);
      yPos += 5;
    }
  }
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  doc.text(labels.preparedOn + ': ' + todayStr, margin, yPos);
  yPos += 8;

  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  setFont('NotoSansBengali', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(34, 87, 122);
  doc.text(labels.summary, margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    body: [
      [labels.totalExpense, fmtCur(summary.totalAllExpenses)],
      [labels.bazarCost, fmtCur(summary.totalBazarCost)],
      [labels.otherExpense, fmtCur(summary.totalNonBazarCost)],
      [labels.totalRent, fmtCur(summary.totalRent)],
      [labels.totalMeals, num(summary.totalMeals)],
      [labels.mealRate, 'Tk ' + summary.mealRate],
      [labels.totalCollected, fmtCur(summary.totalCollected)],
      [labels.totalDue, fmtCur(Math.abs(summary.totalBalance))],
      [labels.activeMembers, num(summary.activeMemberCount)],
    ],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [30, 30, 30],
      font: activeFontName,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: contentWidth * 0.5 },
      1: { halign: 'right', cellWidth: contentWidth * 0.5 },
    },
  });

  yPos = doc.lastAutoTable.finalY + 8;
  checkPageBreak(40);

  setFont('NotoSansBengali', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(34, 87, 122);
  doc.text(labels.memberDetails, margin, yPos);
  yPos += 6;

  var memberHeaders = [labels.sl, labels.name, labels.meals, labels.mealCost, labels.rent, labels.sharedExpense, labels.serviceCharge, labels.totalDueCol, labels.paid, labels.balance];

  var memberRows = summary.memberBreakdown.map(function(m, idx) {
    return [num(idx + 1), m.memberName, num(m.totalMeals), fmtCur(m.mealCost), fmtCur(m.rent), fmtCur(m.sharedExpense), fmtCur(m.serviceCharge), fmtCur(m.totalDue), fmtCur(m.totalPaid), fmtCur(m.balance)];
  });

  var grandMealCost = 0;
  var grandRent = 0;
  var grandShared = 0;
  var grandSC = 0;
  var grandDue = 0;
  var grandPaid = 0;
  var grandBalance = 0;
  for (var mi = 0; mi < summary.memberBreakdown.length; mi++) {
    var mb = summary.memberBreakdown[mi];
    grandMealCost += mb.mealCost;
    grandRent += mb.rent;
    grandShared += mb.sharedExpense;
    grandSC += mb.serviceCharge;
    grandDue += mb.totalDue;
    grandPaid += mb.totalPaid;
    grandBalance += mb.balance;
  }

  memberRows.push(['', labels.grandTotal, num(summary.totalMeals), fmtCur(grandMealCost), fmtCur(grandRent), fmtCur(grandShared), fmtCur(grandSC), fmtCur(grandDue), fmtCur(grandPaid), fmtCur(grandBalance)]);

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [memberHeaders],
    body: memberRows,
    theme: 'striped',
    headStyles: {
      fillColor: [34, 87, 122],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 3,
      font: activeFontName,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 30, 30],
      font: activeFontName,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 30, halign: 'right' },
      8: { cellWidth: 28, halign: 'right' },
      9: { cellWidth: 30, halign: 'right' },
    },
    didParseCell: function(data) {
      if (data.row.index === memberRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [235, 245, 255];
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 8;
  checkPageBreak(40);

  setFont('NotoSansBengali', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(34, 87, 122);
  doc.text(labels.expenseDetails, margin, yPos);
  yPos += 6;

  var expHeaders = [labels.sl, labels.category, labels.amount, labels.count];
  var expRows = expenseBreakdown.map(function(e, idx) {
    var catDef = EXPENSE_CATEGORIES.find(function(c) { return c.value === e.category; });
    var catLabel = catDef ? (useBengali ? catDef.labelBn : catDef.labelEn) : e.category;
    return [num(idx + 1), catLabel, fmtCur(e.total), num(e.count)];
  });

  var expTotal = 0;
  var expCount = 0;
  for (var ei = 0; ei < expenseBreakdown.length; ei++) {
    expTotal += expenseBreakdown[ei].total;
    expCount += expenseBreakdown[ei].count;
  }
  expRows.push(['', labels.grandTotal, fmtCur(expTotal), num(expCount)]);

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [expHeaders],
    body: expRows,
    theme: 'striped',
    headStyles: {
      fillColor: [34, 87, 122],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 3,
      font: activeFontName,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [30, 30, 30],
      font: activeFontName,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: contentWidth * 0.45 },
      2: { cellWidth: contentWidth * 0.3, halign: 'right' },
      3: { cellWidth: contentWidth * 0.15, halign: 'center' },
    },
    didParseCell: function(data) {
      if (data.row.index === expRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [235, 245, 255];
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 8;
  checkPageBreak(30);

  setFont('NotoSansBengali', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(34, 87, 122);
  doc.text(labels.mealDetails, margin, yPos);
  yPos += 6;

  var daysInMonth = getDaysInMonth(year, month);
  var mealHeadersArr = [labels.sl, labels.date, labels.day];
  for (var ai = 0; ai < activeMembers.length; ai++) {
    mealHeadersArr.push(activeMembers[ai].name);
  }
  mealHeadersArr.push(labels.totalDueCol);

  var mealRows = [];
  for (var d = 1; d <= daysInMonth; d++) {
    var dd = String(d).padStart(2, '0');
    var mm = String(month).padStart(2, '0');
    var dateStr = year + '-' + mm + '-' + dd;
    var dayOfWeek = new Date(year, month - 1, d).getDay();

    var row = [num(d), dateStr, days[dayOfWeek]];
    var dayTotal = 0;
    for (var di = 0; di < activeMembers.length; di++) {
      var member = activeMembers[di];
      var dayCount = (mealDateMap[dateStr] && mealDateMap[dateStr][member.id]) ? mealDateMap[dateStr][member.id] : 0;
      row.push(num(dayCount));
      dayTotal += dayCount;
    }
    row.push(num(dayTotal));
    mealRows.push(row);
  }

  var mealColumnStyles = {
    0: { cellWidth: 10, halign: 'center' },
    1: { cellWidth: 22 },
    2: { cellWidth: 14, halign: 'center' },
  };
  var memberCount = activeMembers.length;
  var remainingWidth = contentWidth - 46;
  var memberColWidth = Math.max(12, (remainingWidth - 22) / (memberCount + 1));
  for (var ci = 0; ci < memberCount; ci++) {
    mealColumnStyles[3 + ci] = { cellWidth: memberColWidth, halign: 'center' };
  }
  mealColumnStyles[3 + memberCount] = { cellWidth: 22, halign: 'center', fontStyle: 'bold' };

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [mealHeadersArr],
    body: mealRows,
    theme: 'striped',
    headStyles: {
      fillColor: [34, 87, 122],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2,
      font: activeFontName,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 30, 30],
      font: activeFontName,
    },
    columnStyles: mealColumnStyles,
    didParseCell: function(data) {
      if (data.section === 'body') {
        var dStr = data.row.raw[1];
        if (dStr) {
          var dow = new Date(dStr + 'T00:00:00').getDay();
          if (dow === 5) {
            data.cell.styles.fillColor = [255, 251, 235];
          }
        }
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 12;

  checkPageBreak(20);
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);
  yPos += 4;
  setFont('NotoSansBengali', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(labels.managerSignature, pageWidth - margin - 60, yPos);

  addFooter();

  var filename = 'mess-report-' + year + '-' + String(month).padStart(2, '0') + '.pdf';
  doc.save(filename);
}
