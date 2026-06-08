// 6개월 재구매 분석 — 휴대폰번호 기준
const X = require('xlsx');
const wb = X.readFile(process.argv[2]);
const rows = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval:null, raw:false});

// 휴대폰번호 정규화 (하이픈 제거)
const normPhone = p => p ? String(p).replace(/[^\d]/g, '') : null;

// 더티클레이 제품 매칭
const isDirty = (name) => name && (
  name.includes('더티클레이') ||
  name.includes('찌든때 클리너')
);

// 주문 단위로 그룹화 (1주문 = 1결제, 여러 라인 아이템 가능)
const orders = new Map();
for (const r of rows) {
  if (r['주문상태'] === '거래취소') continue;
  const id = r['주문번호'];
  if (!id) continue;
  const phone = normPhone(r['주문자 번호']) || normPhone(r['수령자 전화번호']);
  if (!phone) continue;
  const date = r['주문일']?.slice(0,10);
  if (!date) continue;
  if (!orders.has(id)) {
    orders.set(id, {
      id, phone, date,
      buyer: r['주문자 이름'],
      total: parseFloat(r['최종주문금액']) || 0,
      items: [],
      hasDirty: false,
      hasOnlyDirty: true,
      hasTowel: false
    });
  }
  const o = orders.get(id);
  o.items.push({ name: r['상품명'], qty: parseFloat(r['구매수량']) || 1, price: parseFloat(r['품목실결제가']) || 0 });
  const name = r['상품명'] || '';
  if (isDirty(name)) o.hasDirty = true;
  else o.hasOnlyDirty = false;
  if (name.includes('수건') || name.includes('타월')) o.hasTowel = true;
}

console.log(`\n총 유효 주문: ${orders.size}건`);
console.log(`기간: 2025-12-01 ~ 2026-05-30 (6개월)`);

// 휴대폰별 그룹화
const byPhone = new Map();
for (const o of orders.values()) {
  if (!byPhone.has(o.phone)) byPhone.set(o.phone, []);
  byPhone.get(o.phone).push(o);
}
// 시간순 정렬
for (const arr of byPhone.values()) {
  arr.sort((a, b) => a.date.localeCompare(b.date));
}

const totalUniqueCustomers = byPhone.size;
console.log(`\n총 고유 고객 (휴대폰 기준): ${totalUniqueCustomers.toLocaleString()}명`);

// === 전체 재구매 분석 ===
console.log('\n========== 전체 (모든 제품) ==========');
let multiOrderCustomers = 0;
let totalRepeatOrders = 0;
const intervals = [];
for (const arr of byPhone.values()) {
  if (arr.length >= 2) {
    multiOrderCustomers++;
    totalRepeatOrders += arr.length - 1;
    for (let i = 1; i < arr.length; i++) {
      const d1 = new Date(arr[i-1].date);
      const d2 = new Date(arr[i].date);
      intervals.push((d2 - d1) / (1000 * 60 * 60 * 24));
    }
  }
}
const overallRepurchaseRate = multiOrderCustomers / totalUniqueCustomers;
console.log(`재구매 고객: ${multiOrderCustomers.toLocaleString()}명 (전체 ${totalUniqueCustomers.toLocaleString()}명 중 ${(overallRepurchaseRate*100).toFixed(2)}%)`);
console.log(`재구매 총 건수: ${totalRepeatOrders.toLocaleString()}건`);
if (intervals.length > 0) {
  intervals.sort((a,b)=>a-b);
  const avg = intervals.reduce((s,v)=>s+v,0)/intervals.length;
  const median = intervals[Math.floor(intervals.length/2)];
  console.log(`평균 재구매 주기: ${avg.toFixed(1)}일`);
  console.log(`중앙값 재구매 주기: ${median.toFixed(1)}일`);
  console.log(`최소/최대: ${intervals[0].toFixed(1)}일 / ${intervals[intervals.length-1].toFixed(1)}일`);
}

// === 더티클레이 한정 재구매 분석 ===
console.log('\n========== 더티클레이 한정 ==========');
const dirtyByPhone = new Map();
for (const [phone, arr] of byPhone) {
  const dirtyOrders = arr.filter(o => o.hasDirty);
  if (dirtyOrders.length > 0) {
    dirtyByPhone.set(phone, dirtyOrders);
  }
}
const totalDirtyCustomers = dirtyByPhone.size;
console.log(`더티클레이 구매 고객: ${totalDirtyCustomers.toLocaleString()}명`);

let dirtyRepeatCustomers = 0;
let dirtyTotalRepeats = 0;
const dirtyIntervals = [];
for (const arr of dirtyByPhone.values()) {
  if (arr.length >= 2) {
    dirtyRepeatCustomers++;
    dirtyTotalRepeats += arr.length - 1;
    for (let i = 1; i < arr.length; i++) {
      const d1 = new Date(arr[i-1].date);
      const d2 = new Date(arr[i].date);
      dirtyIntervals.push((d2 - d1) / (1000 * 60 * 60 * 24));
    }
  }
}
const dirtyRepurchaseRate = dirtyRepeatCustomers / totalDirtyCustomers;
console.log(`더티클레이 재구매 고객: ${dirtyRepeatCustomers.toLocaleString()}명 (${(dirtyRepurchaseRate*100).toFixed(2)}%)`);
console.log(`더티클레이 재구매 총 건수: ${dirtyTotalRepeats.toLocaleString()}건`);
if (dirtyIntervals.length > 0) {
  dirtyIntervals.sort((a,b)=>a-b);
  const avg = dirtyIntervals.reduce((s,v)=>s+v,0)/dirtyIntervals.length;
  const median = dirtyIntervals[Math.floor(dirtyIntervals.length/2)];
  const p25 = dirtyIntervals[Math.floor(dirtyIntervals.length*0.25)];
  const p75 = dirtyIntervals[Math.floor(dirtyIntervals.length*0.75)];
  console.log(`평균 재구매 주기: ${avg.toFixed(1)}일`);
  console.log(`중앙값: ${median.toFixed(1)}일 / Q1: ${p25.toFixed(1)}일 / Q3: ${p75.toFixed(1)}일`);
  console.log(`최소/최대: ${dirtyIntervals[0].toFixed(1)}일 / ${dirtyIntervals[dirtyIntervals.length-1].toFixed(1)}일`);

  // 분포
  const bins = {'~7일':0,'8~30일':0,'31~60일':0,'61~90일':0,'91~120일':0,'121일+':0};
  for (const i of dirtyIntervals) {
    if (i <= 7) bins['~7일']++;
    else if (i <= 30) bins['8~30일']++;
    else if (i <= 60) bins['31~60일']++;
    else if (i <= 90) bins['61~90일']++;
    else if (i <= 120) bins['91~120일']++;
    else bins['121일+']++;
  }
  console.log('\n재구매 주기 분포:');
  for (const [k,v] of Object.entries(bins)) {
    const pct = (v/dirtyIntervals.length*100).toFixed(1);
    console.log(`  ${k}: ${v}건 (${pct}%)`);
  }
}

// === 구매 횟수 분포 ===
console.log('\n========== 구매 횟수 분포 (더티클레이만) ==========');
const countDist = {};
for (const arr of dirtyByPhone.values()) {
  const c = arr.length;
  countDist[c] = (countDist[c] || 0) + 1;
}
const sortedCounts = Object.keys(countDist).sort((a,b)=>+a-+b);
for (const c of sortedCounts) {
  const pct = (countDist[c]/totalDirtyCustomers*100).toFixed(2);
  console.log(`  ${c}회 구매: ${countDist[c]}명 (${pct}%)`);
}

// === 월별 신규 vs 재구매 ===
console.log('\n========== 월별 더티클레이 주문 (신규 vs 재구매) ==========');
// 각 더티클레이 주문이 그 고객의 첫 구매인지 재구매인지 판정
const monthlyStat = {};
for (const [phone, arr] of dirtyByPhone) {
  for (let i = 0; i < arr.length; i++) {
    const month = arr[i].date.slice(0,7);
    if (!monthlyStat[month]) monthlyStat[month] = { new: 0, repeat: 0 };
    if (i === 0) monthlyStat[month].new++;
    else monthlyStat[month].repeat++;
  }
}
console.log('월 | 신규고객 | 재구매 | 재구매비중');
for (const m of Object.keys(monthlyStat).sort()) {
  const s = monthlyStat[m];
  const total = s.new + s.repeat;
  const pct = total > 0 ? (s.repeat/total*100).toFixed(1) : 0;
  console.log(`  ${m} | 신규 ${s.new} | 재구매 ${s.repeat} | ${pct}%`);
}
