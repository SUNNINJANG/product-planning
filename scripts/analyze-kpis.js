// KPI 분석기 — 아임웹 + 스마트스토어 주문 export → 일별 KPI + 누적 history + 마크다운 리포트
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// === 입력 ===
const args = process.argv.slice(2);
const imwebFile = args[0];
const ssFile = args[1];

if (!imwebFile) {
  console.error('Usage: node analyze-kpis.js <imweb.xlsx> [smartstore.xlsx]');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const costLookup = JSON.parse(fs.readFileSync(path.join(__dirname, 'cost-lookup.json'), 'utf-8'));
const assumptions = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'kpi-assumptions.json'), 'utf-8'));
const historyPath = path.join(ROOT, 'data', 'processed', 'kpi-history.json');
const existingHistory = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));

// GA4 시트 데이터 (Claude가 시트 읽어서 갱신)
const ga4Path = path.join(ROOT, 'data', 'processed', 'ga4-history.json');
let ga4Data = null;
try {
  ga4Data = JSON.parse(fs.readFileSync(ga4Path, 'utf-8'));
} catch (e) {
  console.log('⚠ GA4 데이터 없음 — 오가닉 서치 비중 미계산');
}

// 광고비 (사용자 제공)
const META_AD_DAILY = 230000;
const SS_AD_DAILY = 25000;

// === 헬퍼 ===
function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  // "2026-06-01 16:36:39" or "2026/06/01 08:47"
  const s = String(v).replace(/\//g, '-').replace(/T/, ' ');
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
function ymd(d) {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}
function num(v) {
  if (v == null || v === '') return 0;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

// === 제품 매칭 ===
function lookupCost(productName, optionName, channel) {
  const name = (productName || '') + ' ' + (optionName || '');
  for (const prod of costLookup.products) {
    if (!prod.match_patterns.some(p => name.includes(p))) continue;
    // Find bundle
    let bundle = null;
    for (const v of prod.variants) {
      if (v.bundle_keywords && v.bundle_keywords.some(k => name.includes(k))) {
        bundle = v;
        break;
      }
    }
    if (!bundle) bundle = prod.variants.find(v => v.is_default_for_quantity_1) || prod.variants[0];
    if (bundle && bundle.channel_pricing[channel]) {
      return { product: prod.name, bundle: bundle.bundle, ...bundle.channel_pricing[channel] };
    }
  }
  return null;
}

// === 아임웹 파싱 ===
function parseImweb(file) {
  const wb = XLSX.readFile(file, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });

  // 그룹화: 주문번호 단위로 묶기 (한 주문에 여러 line item 가능)
  const orders = new Map(); // 주문번호 → { date, customer, items[], total }

  for (const r of rows) {
    if (!r['주문번호'] || r['주문상태'] === '거래취소') continue;

    const orderId = String(r['주문번호']);
    const date = ymd(parseDate(r['주문일']));
    if (!date) continue;

    if (!orders.has(orderId)) {
      orders.set(orderId, {
        orderId,
        date,
        channel: '자사몰', // 네이버페이-주문형 OR 하우스보이 Houseboy — both are owned site
        customer: r['주문자 번호'] || r['주문자 이메일'] || r['주문자 이름'],
        status: r['주문상태'],
        items: [],
        total: num(r['최종주문금액']),
        shipping: num(r['총 합계 배송비'])
      });
    }
    const order = orders.get(orderId);
    order.items.push({
      productName: r['상품명'],
      option: r['옵션명'],
      qty: num(r['구매수량']),
      itemPrice: num(r['품목실결제가'])
    });
  }
  return Array.from(orders.values());
}

// === 스마트스토어 파싱 ===
function parseSS(file) {
  const wb = XLSX.readFile(file, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });

  const orders = new Map();
  for (const r of rows) {
    if (!r['주문번호']) continue;
    if (r['주문상태'] === '취소' || r['주문상태'] === '반품완료') continue;

    const orderId = String(r['주문번호']);
    const date = ymd(parseDate(r['주문일시']));
    if (!date) continue;

    if (!orders.has(orderId)) {
      orders.set(orderId, {
        orderId,
        date,
        channel: '스마트스토어',
        customer: r['구매자ID'] || r['구매자명'],
        status: r['주문상태'],
        items: [],
        total: 0, // SS export에 결제금액 없음 — 아이템 매칭으로 계산
        shipping: 0
      });
    }
    const order = orders.get(orderId);
    // 스마트스토어 상품번호 12386773931 = 더티클레이 (1개 베이스). 수량 = 구매 단위 수
    // 가격은 채널·번들 룩업에서 추정
    const qty = num(r['수량']);
    order.items.push({
      productName: r['상품명'],
      option: r['옵션정보'],
      qty,
      itemPrice: null // 룩업으로 채움
    });
  }

  // 가격 추정 (스마트스토어 단가 14,500 × qty, 또는 번들 매칭)
  for (const order of orders.values()) {
    for (const item of order.items) {
      const lk = lookupCost(item.productName, item.option, '스마트스토어');
      if (lk) {
        // 수량이 1이고 1개입이 default면 가격은 sell × qty(but qty=1)
        // 수량이 N이고 옵션이 단일이면 sell × qty (각각 1개입 N개 구매)
        item.itemPrice = lk.sell * item.qty;
      } else {
        item.itemPrice = 14500 * item.qty; // fallback
      }
      order.total += item.itemPrice;
    }
  }
  return Array.from(orders.values());
}

// === 채널 수수료 계산 ===
function channelFee(channel, revenue) {
  const ch = assumptions.channels[channel];
  if (!ch) return 0;
  return revenue * (ch.card_fee_ratio + ch.platform_fee_ratio);
}

// === 객당 기여이익 계산 ===
function contributionProfitForOrder(order) {
  let totalMargin = 0;
  for (const item of order.items) {
    const lk = lookupCost(item.productName, item.option, order.channel);
    if (!lk) continue;
    totalMargin += (lk.margin_with_ship || 0) * (item.qty || 1);
  }
  const fees = channelFee(order.channel, order.total);
  return totalMargin - fees;
}

// === 메인 분석 ===
const imwebOrders = parseImweb(imwebFile);
const ssOrders = ssFile ? parseSS(ssFile) : [];
const allOrders = [...imwebOrders, ...ssOrders];

// 모든 날짜 수집
const allDates = [...new Set(allOrders.map(o => o.date))].sort();
console.log(`\n분석 대상 날짜: ${allDates.join(', ')}`);
console.log(`아임웹 주문: ${imwebOrders.length}건, 스마트스토어 주문: ${ssOrders.length}건`);

// 누적 history에서 이미 본 고객 (이전 데이터 기반 재구매 판정)
const seenCustomers = new Set(); // 누적으로 본 고객
// 기존 history의 모든 customer 키를 가져올 수 있으면 좋지만, customer detail이 없으니 이 데이터 안에서만 봄
// "이 데이터 안에서의 재구매" 판정용
const customerFirstSeen = new Map(); // customer → first date

// 1차 패스: customer first seen
for (const o of allOrders.sort((a,b) => a.date.localeCompare(b.date))) {
  if (!o.customer) continue;
  if (!customerFirstSeen.has(o.customer)) {
    customerFirstSeen.set(o.customer, o.date);
  }
}

// 일자별 집계
const dailyKPIs = [];
for (const date of allDates) {
  const dayOrders = allOrders.filter(o => o.date === date);
  const dayImweb = dayOrders.filter(o => o.channel === '자사몰');
  const daySS = dayOrders.filter(o => o.channel === '스마트스토어');

  const revOwned = dayImweb.reduce((s, o) => s + o.total, 0);
  const revSS = daySS.reduce((s, o) => s + o.total, 0);
  const revCoupang = 0;
  const revOzzip = 0;
  const revTotal = revOwned + revSS + revCoupang + revOzzip;

  const ordersOwned = dayImweb.length;
  const ordersSS = daySS.length;
  const ordersTotal = ordersOwned + ordersSS;

  // AOV: 자사몰 기준
  const aov = ordersOwned > 0 ? Math.round(revOwned / ordersOwned) : null;

  // 재구매율 (자사몰만, 이 데이터 안에서 첫 주문이 이전 날짜인 고객 비율)
  const dayCustomers = [...new Set(dayImweb.map(o => o.customer).filter(Boolean))];
  const returning = dayCustomers.filter(c => customerFirstSeen.get(c) < date);
  const repurchaseRate = dayCustomers.length > 0 ? returning.length / dayCustomers.length : null;

  // CAC: 메타광고비 / 자사몰 신규 고객 수 (이 데이터 안에서 첫 주문이 오늘인 고객)
  const newCustomers = dayCustomers.filter(c => customerFirstSeen.get(c) === date);
  const dailyAdSpend = META_AD_DAILY + SS_AD_DAILY;
  // 메타 → 자사몰, SS광고 → SS. 채널 분리 CAC
  const ssCustomers = [...new Set(daySS.map(o => o.customer).filter(Boolean))];
  const newSSCustomers = ssCustomers.filter(c => customerFirstSeen.get(c) === date);
  const cacOwned = newCustomers.length > 0 ? Math.round(META_AD_DAILY / newCustomers.length) : null;
  const cacSS = newSSCustomers.length > 0 ? Math.round(SS_AD_DAILY / newSSCustomers.length) : null;
  const newCustomersTotal = newCustomers.length + newSSCustomers.length;
  const cacBlended = newCustomersTotal > 0 ? Math.round(dailyAdSpend / newCustomersTotal) : null;

  // 객당 기여이익 (광고비 차감 전, 마진 - 수수료 기준)
  const orderProfits = dayOrders.map(o => contributionProfitForOrder(o)).filter(v => v !== null);
  const cpoBeforeAds = orderProfits.length > 0 ? Math.round(orderProfits.reduce((s,v) => s+v, 0) / orderProfits.length) : null;
  // 광고비 차감 후 객당 기여이익 (전체 ad spend / 전체 주문수 만큼 차감)
  const adPerOrder = ordersTotal > 0 ? dailyAdSpend / ordersTotal : 0;
  const cpoAfterAds = cpoBeforeAds !== null ? Math.round(cpoBeforeAds - adPerOrder) : null;

  // 채널별 매출 디테일 (자사몰 = 네이버페이 + 하우스보이 직판)
  const naverPayOrders = dayImweb.filter(o => imwebOrders.find(io => io.orderId === o.orderId));
  // (이미 모두 자사몰로 카운트됨)

  // GA4 기반 오가닉 서치 비중 (해당 날짜)
  let organicSearchRatio = null;
  let gaTotalRevenue = null;
  let gaOrganicRevenue = null;
  if (ga4Data) {
    const dayGA = ga4Data.data.filter(r => r.date === date);
    if (dayGA.length > 0) {
      gaTotalRevenue = dayGA.reduce((s, r) => s + r.transactions * r.avgRevenue, 0);
      gaOrganicRevenue = dayGA.filter(r => r.isOrganic).reduce((s, r) => s + r.transactions * r.avgRevenue, 0);
      organicSearchRatio = gaTotalRevenue > 0 ? gaOrganicRevenue / gaTotalRevenue : 0;
    }
  }

  const kpi = {
    date,
    revenue_owned: revOwned,
    revenue_smartstore: revSS,
    revenue_coupang: revCoupang,
    revenue_ozzip: revOzzip,
    revenue_total: revTotal,
    orders_owned: ordersOwned,
    orders_smartstore: ordersSS,
    orders_total: ordersTotal,
    new_customers_owned: newCustomers.length,
    new_customers_ss: newSSCustomers.length,
    returning_customers_owned: returning.length,
    aov: aov,
    repurchase_rate: repurchaseRate,
    cac: cacBlended,
    cac_owned: cacOwned,
    cac_ss: cacSS,
    contribution_profit_per_order: cpoAfterAds,
    contribution_profit_per_order_before_ads: cpoBeforeAds,
    ad_spend_meta: META_AD_DAILY,
    ad_spend_ss_search: SS_AD_DAILY,
    organic_search_ratio: organicSearchRatio,
    ga_total_revenue: gaTotalRevenue,
    ga_organic_revenue: gaOrganicRevenue,
    email_subscribers: null,
    kakao_plus_friends: null
  };
  dailyKPIs.push(kpi);
}

// === history 업데이트 (날짜 중복 시 덮어쓰기) ===
const updatedHistory = [...existingHistory];
for (const kpi of dailyKPIs) {
  const idx = updatedHistory.findIndex(h => h.date === kpi.date);
  if (idx >= 0) updatedHistory[idx] = kpi;
  else updatedHistory.push(kpi);
}
updatedHistory.sort((a, b) => a.date.localeCompare(b.date));

fs.writeFileSync(historyPath, JSON.stringify(updatedHistory, null, 2));
console.log(`\n✓ kpi-history.json 업데이트: ${updatedHistory.length}일치 누적`);

// === 일별 마크다운 리포트 생성 ===
const KRW = v => v == null ? '-' : '₩' + Math.round(v).toLocaleString('ko-KR');
const PCT = v => v == null ? '-' : (v * 100).toFixed(1) + '%';
const N = v => v == null ? '-' : Math.round(v).toLocaleString('ko-KR');

for (const kpi of dailyKPIs) {
  const dayOrders = allOrders.filter(o => o.date === kpi.date);
  const dayImweb = dayOrders.filter(o => o.channel === '자사몰');
  const daySS = dayOrders.filter(o => o.channel === '스마트스토어');

  // 채널별 매출 디테일: 자사몰 안에서 네이버페이 vs 직판 구분
  const wb = XLSX.readFile(imwebFile);
  const imwebRaw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null, raw: false });
  const dayOrderIds = new Set(dayImweb.map(o => o.orderId));
  const naverPayRevenue = imwebRaw.filter(r => r['판매채널'] === '네이버페이-주문형' && dayOrderIds.has(String(r['주문번호'])))
    .reduce((s, r, _, arr) => {
      const orderId = String(r['주문번호']);
      const isFirst = arr.findIndex(rr => String(rr['주문번호']) === orderId) === arr.indexOf(r);
      return isFirst ? s + num(r['최종주문금액']) : s;
    }, 0);
  const houseboyRevenue = kpi.revenue_owned - naverPayRevenue;

  // 번들 분포 (자사몰)
  const bundleCounts = { 1: 0, 2: 0, 3: 0, 4: 0, addon: 0 };
  for (const o of dayImweb) {
    for (const item of o.items) {
      const name = (item.productName || '') + ' ' + (item.option || '');
      if (name.includes('수세미') && !name.includes('더티클레이')) bundleCounts.addon += item.qty;
      else if (name.includes('1개') || name.includes('1ea')) bundleCounts[1] += item.qty;
      else if (name.includes('2개') || name.includes('2ea')) bundleCounts[2] += item.qty;
      else if (name.includes('3개') || name.includes('3ea')) bundleCounts[3] += item.qty;
      else if (name.includes('4개') || name.includes('4ea')) bundleCounts[4] += item.qty;
    }
  }

  const md = `# KPI 리포트 — ${kpi.date}

> ${new Date(kpi.date).toLocaleDateString('ko-KR', { weekday: 'long' })} · 자사몰(아임웹) + 스마트스토어 통합

---

## 📊 한눈에 보기

| 지표 | 값 | 목표 |
|------|-----|------|
| 자사몰 매출 | **${KRW(kpi.revenue_owned)}** | - |
| 스마트스토어 매출 | ${KRW(kpi.revenue_smartstore)} | - |
| **총 매출** | **${KRW(kpi.revenue_total)}** | - |
| AOV (자사몰) | **${KRW(kpi.aov)}** | ${KRW(assumptions.kpi_targets.aov_krw_target)} |
| CAC (블렌디드) | **${KRW(kpi.cac)}** | ${KRW(assumptions.kpi_targets.cac_krw_target)} |
| 객당 기여이익 (광고비 차감 후) | **${KRW(kpi.contribution_profit_per_order)}** | - |
| 재구매율 | ${PCT(kpi.repurchase_rate)} | ${PCT(assumptions.kpi_targets.repurchase_rate_target)} |

---

## 📈 주문 상세

### 자사몰 (아임웹)
- 주문 건수: **${kpi.orders_owned}건**
  - 네이버페이-주문형 매출: ${KRW(naverPayRevenue)}
  - 하우스보이 직판 매출: ${KRW(houseboyRevenue)}
- 신규 고객: ${kpi.new_customers_owned}명 / 재구매 고객: ${kpi.returning_customers_owned}명

### 스마트스토어
- 주문 건수: **${kpi.orders_smartstore}건**
- 추정 매출: ${KRW(kpi.revenue_smartstore)} *(스마트스토어 export에 결제금액 없어 단가×수량으로 추정)*
- 신규 고객: ${kpi.new_customers_ss}명

---

## 🎯 번들 판매 분포 (자사몰)

| 번들 | 판매 수량 |
|------|----------|
| 1개입 | ${bundleCounts[1]}개 |
| 2개입 | ${bundleCounts[2]}세트 |
| 3개입 | ${bundleCounts[3]}세트 |
| 4개입 | ${bundleCounts[4]}세트 |
| 양면 수세미 (애드온) | ${bundleCounts.addon}개 |

---

## 💰 광고비 & CAC 분해

| 항목 | 금액 |
|------|------|
| 메타 광고비 (일) | ${KRW(META_AD_DAILY)} |
| 스마트스토어 쇼핑검색 (일) | ${KRW(SS_AD_DAILY)} |
| **총 광고비** | **${KRW(META_AD_DAILY + SS_AD_DAILY)}** |
| 자사몰 신규 고객 1명당 CAC (메타 기준) | **${KRW(kpi.cac_owned)}** |
| 스마트스토어 신규 1명당 CAC | **${KRW(kpi.cac_ss)}** |
| 블렌디드 CAC | **${KRW(kpi.cac)}** |

---

## 📉 객당 기여이익 분해

| 항목 | 금액 |
|------|------|
| 평균 객당 마진 (배송포함, 채널·번들 룩업) | ${KRW(kpi.contribution_profit_per_order_before_ads + (kpi.orders_total > 0 ? (META_AD_DAILY + SS_AD_DAILY) / kpi.orders_total : 0))} |
| ÷ 광고비 분배 (객당) | -${KRW(kpi.orders_total > 0 ? (META_AD_DAILY + SS_AD_DAILY) / kpi.orders_total : 0)} |
| **광고비 차감 후 객당 기여이익** | **${KRW(kpi.contribution_profit_per_order)}** |

---

## 📝 메모

- 오가닉 서치 비중: GA4 연동 후 활성화 예정
- 재구매율: 5/29~6/1 4일치 데이터 안에서의 재구매 기준 (이전 주문 이력 미반영) — 데이터 누적 시 정확도 상승
- 스마트스토어 결제금액은 export에 없어 14,500원 × 수량으로 추정 (실제 할인 적용 시 약간의 오차 가능)

---

[← 대시보드로 돌아가기](dashboard/index.md)
`;

  const reportPath = path.join(ROOT, 'dashboard', `${kpi.date}.md`);
  fs.writeFileSync(reportPath, md);
  console.log(`✓ ${reportPath} 생성`);
}

// === 요약 출력 ===
console.log('\n========== 일자별 KPI 요약 ==========');
for (const k of dailyKPIs) {
  console.log(`${k.date} | 매출 ${KRW(k.revenue_total)} (자사몰 ${KRW(k.revenue_owned)} + SS ${KRW(k.revenue_smartstore)}) | 주문 ${k.orders_total}건 | AOV ${KRW(k.aov)} | CAC ${KRW(k.cac)} | CPO ${KRW(k.contribution_profit_per_order)}`);
}
