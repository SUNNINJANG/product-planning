// 더티클레이_판매량_최종 마스터 파일 기반 kpi-history.json 대량 업데이트
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const historyPath = path.join(ROOT, 'data', 'processed', 'kpi-history.json');
const existing = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));

// 마스터 파일에서 추출한 데이터 (판매량 = units, 매출 = KRW)
const masterData = {
  // 자사몰 매출
  owned: {
    '2026-06-01': { units: 13, revenue: 264500 },
    '2026-06-02': { units: 10, revenue: 573800 },
    '2026-06-03': { units: 5, revenue: 128500 },
    '2026-06-04': { units: 2, revenue: 63000 },
    '2026-06-05': { units: 8, revenue: 154855 },
    '2026-06-06': { units: 1, revenue: 17000 },
    '2026-06-07': { units: 1, revenue: 17000 },
    '2026-06-08': { units: 2, revenue: 35000 },
    '2026-06-09': { units: 5, revenue: 83500 },
    '2026-06-10': { units: 15, revenue: 257000 },
    '2026-06-11': { units: 15, revenue: 317696 },
    '2026-06-12': { units: 8, revenue: 177000 },
    '2026-06-13': { units: 5, revenue: 93000 },
    '2026-06-14': { units: 34, revenue: 677100 },
    '2026-06-15': { units: 21, revenue: 466500 },
    '2026-06-16': { units: 29, revenue: 655641 },
    '2026-06-17': { units: 41, revenue: 785000 },
    '2026-06-18': { units: 29, revenue: 634000 },
    '2026-06-19': { units: 21, revenue: 515000 },
    '2026-06-20': { units: 30, revenue: 667000 },
    '2026-06-21': { units: 40, revenue: 861000 },
    '2026-06-22': { units: 42, revenue: 999000, gonggu: 760200 },
    '2026-06-23': { units: 33, revenue: 837900, gonggu: 755800 },
    '2026-06-24': { units: 13, revenue: 275000, gonggu: 439500 },
    '2026-06-25': { units: 47, revenue: 953700, gonggu: 290500 },
    '2026-06-26': { units: 26, revenue: 667549 },
    '2026-06-27': { units: 21, revenue: 417000 },
    '2026-06-28': { units: 33, revenue: 626000 },
    '2026-06-29': { units: 42, revenue: 1048000 },
    '2026-06-30': { units: 45, revenue: 924000 },
    '2026-07-01': { units: 12, revenue: 293000 },
    '2026-07-02': { units: 12, revenue: 261000 },
    '2026-07-03': { units: 11, revenue: 242000 },
    '2026-07-04': { units: 11, revenue: 308000 },
    '2026-07-05': { units: 13, revenue: 267000 },
    '2026-07-06': { units: 8, revenue: 159000 },
    '2026-07-07': { units: 12, revenue: 285000 },
  },
  // 스마트스토어 매출
  ss: {
    '2026-06-01': { units: 9, revenue: 143100 },
    '2026-06-02': { units: 1, revenue: 14500 },
    '2026-06-03': { units: 7, revenue: 128300 },
    '2026-06-04': { units: 3, revenue: 43500 },
    '2026-06-05': { units: 5, revenue: 72500 },
    '2026-06-06': { units: 2, revenue: 29000 },
    '2026-06-07': { units: 7, revenue: 131600 },
    '2026-06-08': { units: 6, revenue: 43500 },
    '2026-06-09': { units: 4, revenue: 58000 },
    '2026-06-10': { units: 3, revenue: 28500 },
    '2026-06-11': { units: 8, revenue: 139000 },
    '2026-06-12': { units: 8, revenue: 134500 },
    '2026-06-13': { units: 6, revenue: 128500 },
    '2026-06-14': { units: 8, revenue: 143500 },
    '2026-06-15': { units: 13, revenue: 139500 },
    '2026-06-16': { units: 6, revenue: 106000 },
    '2026-06-17': { units: 14, revenue: 225500 },
    '2026-06-18': { units: 9, revenue: 223000 },
    '2026-06-19': { units: 8, revenue: 119500 },
    '2026-06-20': { units: 7, revenue: 80500 },
    '2026-06-21': { units: 14, revenue: 196500 },
    '2026-06-22': { units: 13, revenue: 258500 },
    '2026-06-23': { units: 10, revenue: 145200 },
    '2026-06-24': { units: 16, revenue: 254500 },
    '2026-06-25': { units: 3, revenue: 57000 },
    '2026-06-26': { units: 14, revenue: 169400 },
    '2026-06-27': { units: 1, revenue: 13500 },
    '2026-06-28': { units: 7, revenue: 110500 },
    '2026-06-29': { units: 9, revenue: 178000 },
    '2026-06-30': { units: 7, revenue: 189000 },
    '2026-07-01': { units: 7, revenue: 124000 },
    '2026-07-02': { units: 10, revenue: 185500 },
    '2026-07-03': { units: 1, revenue: 27000 },
    '2026-07-04': { units: 6, revenue: 135000 },
    '2026-07-05': { units: 5, revenue: 83500 },
    '2026-07-06': { units: 9, revenue: 121500 },
    '2026-07-07': { units: 7, revenue: 113000 },
  }
};

// 월별 요약
const monthlySummary = {
  '2025-11': { owned: 46587204, ss: 4244290, owned_units: 2370, ss_units: 169 },
  '2025-12': { owned: 75381303, ss: 7050670, owned_units: 4140, ss_units: 329 },
  '2026-01': { owned: 89391260, ss: 12651010, owned_units: 5106, ss_units: 552 },
  '2026-02': { owned: 95497924, ss: 13281650, owned_units: 5558, ss_units: 674, target: 108000000 },
  '2026-03': { owned: 99723872, ss: 14863140, owned_units: 5458, ss_units: 798, target: 116640000 },
  '2026-04': { owned: 77192696, ss: 16035490, owned_units: 4501, ss_units: 931, target: 125970000 },
  '2026-05': { owned: 36863502, ss: 7798140, owned_units: 1831, ss_units: 431, target: 128050000 },
  '2026-06': { owned: 14191241, ss: 3704100, owned_units: 637, ss_units: 228 },
  '2026-07_partial': { owned: 1815000, ss: 789500, owned_units: 79, ss_units: 45 },
};

// history 업데이트
const historyMap = new Map(existing.map(k => [k.date, k]));

for (const date of Object.keys(masterData.owned)) {
  const owned = masterData.owned[date];
  const ss = masterData.ss[date] || { units: 0, revenue: 0 };
  const existing_kpi = historyMap.get(date) || {};

  // 기존 데이터에서 유지할 필드들 (쿠팡, 오집, GA, 광고비, 플친 등)
  const preserved = {
    revenue_coupang: existing_kpi.revenue_coupang ?? null,
    revenue_ozzip: existing_kpi.revenue_ozzip ?? null,
    orders_coupang: existing_kpi.orders_coupang ?? null,
    orders_ozzip: existing_kpi.orders_ozzip ?? null,
    ad_spend_meta: existing_kpi.ad_spend_meta ?? 0,
    ad_spend_ss_search: existing_kpi.ad_spend_ss_search ?? 25000,
    ad_spend_coupang: existing_kpi.ad_spend_coupang ?? null,
    coupang_roas: existing_kpi.coupang_roas ?? null,
    ss_roas: existing_kpi.ss_roas ?? null,
    meta_roas: existing_kpi.meta_roas ?? null,
    ga_total_revenue: existing_kpi.ga_total_revenue ?? null,
    ga_organic_revenue: existing_kpi.ga_organic_revenue ?? null,
    ga_ad_revenue: existing_kpi.ga_ad_revenue ?? null,
    ga_meta_ad_revenue: existing_kpi.ga_meta_ad_revenue ?? null,
    ga_direct_revenue: existing_kpi.ga_direct_revenue ?? null,
    organic_search_ratio: existing_kpi.organic_search_ratio ?? null,
    kakao_plus_friends: existing_kpi.kakao_plus_friends ?? null,
    kakao_plus_friends_growth: existing_kpi.kakao_plus_friends_growth ?? null,
    email_subscribers: existing_kpi.email_subscribers ?? null,
  };

  const rev_total = owned.revenue + ss.revenue + (preserved.revenue_coupang || 0) + (preserved.revenue_ozzip || 0);
  const total_units = owned.units + ss.units;
  const aov = total_units > 0 ? Math.round((owned.revenue + ss.revenue) / total_units) : null;

  const updated = {
    date,
    revenue_owned: owned.revenue,
    revenue_smartstore: ss.revenue,
    ...preserved,
    revenue_total: rev_total,
    orders_owned: owned.units, // 판매량 = units (proxy)
    orders_smartstore: ss.units,
    aov: aov,
    _units_note: '판매량 = 개수(units), 주문건수 아님',
    _source: 'master file (더티클레이_판매량_최종)',
    _gonggu_revenue: owned.gonggu ?? null,
  };

  historyMap.set(date, updated);
}

const updatedList = [...historyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
fs.writeFileSync(historyPath, JSON.stringify(updatedList, null, 2));

// 월별 요약을 별도 파일로 저장
fs.writeFileSync(
  path.join(ROOT, 'data', 'processed', 'monthly-summary.json'),
  JSON.stringify(monthlySummary, null, 2)
);

console.log(`\n✅ kpi-history.json 업데이트 완료: ${updatedList.length}일치`);
console.log('✅ monthly-summary.json 생성');

// 요약 출력
console.log('\n========== 월별 매출 추이 ==========');
for (const [m, s] of Object.entries(monthlySummary)) {
  const total = s.owned + s.ss;
  const pct = s.target ? ((s.owned / s.target * 100).toFixed(1) + '%') : '-';
  console.log(`  ${m}: 자사몰 ₩${(s.owned/1000000).toFixed(1)}M / SS ₩${(s.ss/1000000).toFixed(1)}M | 목표 대비 ${pct}`);
}

console.log('\n========== 6월 일별 매출 (자사몰) ==========');
const juneOwned = Object.entries(masterData.owned).filter(([d]) => d.startsWith('2026-06'));
for (const [d, v] of juneOwned) {
  console.log(`  ${d}: ${v.units}개 / ₩${v.revenue.toLocaleString()}`);
}

const juneTotal = juneOwned.reduce((s, [_, v]) => s + v.revenue, 0);
console.log(`  6월 자사몰 합계: ₩${juneTotal.toLocaleString()}`);
