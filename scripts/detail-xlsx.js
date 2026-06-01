// 더 자세한 인스펙션 — 채널 분포, 날짜 범위, 컬럼 전체, 샘플 데이터
const XLSX = require('xlsx');

const files = process.argv.slice(2);

for (const file of files) {
  console.log('\n========================================');
  console.log('FILE:', file);
  console.log('========================================');
  const wb = XLSX.readFile(file, { cellDates: true });

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });
    console.log(`\nSheet "${sheetName}": ${rows.length} rows`);

    if (rows.length === 0) continue;

    // All columns
    console.log('\nAll columns:');
    Object.keys(rows[0]).forEach((c, i) => console.log(`  ${i}: ${c}`));

    // For each column, show distinct values (if few) or value range
    console.log('\nColumn analysis:');
    for (const col of Object.keys(rows[0])) {
      const vals = rows.map(r => r[col]).filter(v => v !== null && v !== '');
      const unique = [...new Set(vals)];
      if (unique.length <= 5) {
        console.log(`  ${col}: ${unique.length} unique — ${JSON.stringify(unique)}`);
      } else if (typeof vals[0] === 'string' && vals[0].match(/^\d{4}/)) {
        console.log(`  ${col}: ${unique.length} unique values (date-like). Range: ${unique[0]} ... ${unique[unique.length-1]}`);
      } else {
        console.log(`  ${col}: ${unique.length} unique values. Sample: ${JSON.stringify(unique.slice(0, 3))}`);
      }
    }

    // Show first 3 full rows
    console.log('\nFirst 3 rows (full):');
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      console.log(`\n--- Row ${i} ---`);
      for (const [k, v] of Object.entries(rows[i])) {
        if (v !== null && v !== '') console.log(`  ${k}: ${v}`);
      }
    }
  }
}
