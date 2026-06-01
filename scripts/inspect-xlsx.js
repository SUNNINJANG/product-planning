// 엑셀 파일 구조 인스펙터 — 컬럼명·샘플 행 확인용
const XLSX = require('xlsx');
const path = require('path');

const files = process.argv.slice(2);

for (const file of files) {
  console.log('\n========================================');
  console.log('FILE:', file);
  console.log('========================================');
  try {
    const wb = XLSX.readFile(file, { cellDates: true });
    console.log('Sheets:', wb.SheetNames);

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      console.log(`\n--- Sheet: "${sheetName}" — Range: ${ws['!ref']} (rows: ${range.e.r + 1}, cols: ${range.e.c + 1}) ---`);

      // Try parsing with multiple header rows to find the right one
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
      console.log(`Total rows: ${rows.length}`);

      // Print first 5 rows
      console.log('\nFirst 5 rows:');
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const r = rows[i];
        const nonEmpty = r.filter(c => c !== null && c !== '').length;
        console.log(`  [${i}] (${nonEmpty} non-empty): ${JSON.stringify(r.slice(0, 12))}${r.length > 12 ? '...' : ''}`);
      }

      // Try to detect header row
      const headerCandidates = [];
      for (let i = 0; i < Math.min(8, rows.length); i++) {
        const r = rows[i];
        const nonEmpty = r.filter(c => c !== null && c !== '').length;
        const allString = r.every(c => c === null || c === '' || typeof c === 'string');
        if (nonEmpty >= 3 && allString) headerCandidates.push({ idx: i, nonEmpty, headers: r });
      }
      if (headerCandidates.length > 0) {
        const best = headerCandidates[0];
        console.log(`\n→ Likely header row: index ${best.idx}`);
        console.log('  Columns:', best.headers.filter(c => c).slice(0, 20).join(' | '));
      }
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
