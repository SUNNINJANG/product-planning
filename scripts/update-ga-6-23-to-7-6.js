// GA4 데이터 6/23~7/6 반영
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const gaPath = path.join(ROOT, 'data', 'processed', 'ga4-history.json');
const historyPath = path.join(ROOT, 'data', 'processed', 'kpi-history.json');

const ga = JSON.parse(fs.readFileSync(gaPath, 'utf-8'));
const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));

// GA 시트에서 파싱한 데이터 (6/23~7/6, 상위 소스만)
// isOrganic 정의: sessionMedium=='organic' OR sessionSource=='m.search.naver.com'
const newGaData = [
  // 6/23
  {date:"2026-06-23",source:"ig",medium:"paid",sessions:193,transactions:21,avgRevenue:23690.48,isOrganic:false},
  {date:"2026-06-23",source:"(direct)",medium:"(none)",sessions:125,transactions:12,avgRevenue:27641.67,isOrganic:false},
  {date:"2026-06-23",source:"link.inpock.co.kr",medium:"referral",sessions:32,transactions:9,avgRevenue:26355.56,isOrganic:false,_note:"인스타 바이오링크"},
  {date:"2026-06-23",source:"m.search.naver.com",medium:"referral",sessions:28,transactions:1,avgRevenue:18499.99,isOrganic:true},
  {date:"2026-06-23",source:"l.instagram.com",medium:"referral",sessions:27,transactions:2,avgRevenue:32749.99,isOrganic:false},

  // 6/24
  {date:"2026-06-24",source:"ig",medium:"paid",sessions:167,transactions:11,avgRevenue:21572.73,isOrganic:false},
  {date:"2026-06-24",source:"(direct)",medium:"(none)",sessions:92,transactions:8,avgRevenue:27850.00,isOrganic:false},
  {date:"2026-06-24",source:"m.search.naver.com",medium:"referral",sessions:29,transactions:0,avgRevenue:0,isOrganic:true},
  {date:"2026-06-24",source:"th",medium:"paid",sessions:20,transactions:0,avgRevenue:0,isOrganic:false},
  {date:"2026-06-24",source:"l.instagram.com",medium:"referral",sessions:19,transactions:3,avgRevenue:32833.33,isOrganic:false},
  {date:"2026-06-24",source:"link.inpock.co.kr",medium:"referral",sessions:14,transactions:1,avgRevenue:25800.00,isOrganic:false,_note:"인스타 바이오링크"},

  // 6/25
  {date:"2026-06-25",source:"ig",medium:"paid",sessions:279,transactions:25,avgRevenue:19739.99,isOrganic:false},
  {date:"2026-06-25",source:"(direct)",medium:"(none)",sessions:123,transactions:10,avgRevenue:23859.99,isOrganic:false},
  {date:"2026-06-25",source:"m.search.naver.com",medium:"referral",sessions:26,transactions:1,avgRevenue:18500.00,isOrganic:true},
  {date:"2026-06-25",source:"link.inpock.co.kr",medium:"referral",sessions:21,transactions:4,avgRevenue:28650.00,isOrganic:false,_note:"인스타 바이오링크"},
  {date:"2026-06-25",source:"orders.pay.naver.com",medium:"referral",sessions:7,transactions:1,avgRevenue:18500.00,isOrganic:false},
  {date:"2026-06-25",source:"google",medium:"organic",sessions:6,transactions:0,avgRevenue:0,isOrganic:true},

  // 6/26
  {date:"2026-06-26",source:"ig",medium:"paid",sessions:218,transactions:14,avgRevenue:21142.86,isOrganic:false},
  {date:"2026-06-26",source:"m.search.naver.com",medium:"referral",sessions:30,transactions:2,avgRevenue:54774.50,isOrganic:true},
  {date:"2026-06-26",source:"(direct)",medium:"(none)",sessions:24,transactions:3,avgRevenue:24333.33,isOrganic:false},

  // 6/27
  {date:"2026-06-27",source:"ig",medium:"paid",sessions:207,transactions:11,avgRevenue:20499.99,isOrganic:false},
  {date:"2026-06-27",source:"m.search.naver.com",medium:"referral",sessions:21,transactions:1,avgRevenue:15999.99,isOrganic:true},
  {date:"2026-06-27",source:"(direct)",medium:"(none)",sessions:18,transactions:4,avgRevenue:18999.99,isOrganic:false},

  // 6/28
  {date:"2026-06-28",source:"ig",medium:"paid",sessions:374,transactions:21,avgRevenue:18999.99,isOrganic:false},
  {date:"2026-06-28",source:"m.search.naver.com",medium:"referral",sessions:28,transactions:1,avgRevenue:34000.00,isOrganic:true},
  {date:"2026-06-28",source:"(direct)",medium:"(none)",sessions:23,transactions:1,avgRevenue:28999.99,isOrganic:false},
  {date:"2026-06-28",source:"google",medium:"organic",sessions:7,transactions:0,avgRevenue:0,isOrganic:true},

  // 6/29
  {date:"2026-06-29",source:"ig",medium:"paid",sessions:299,transactions:25,avgRevenue:21680.00,isOrganic:false},
  {date:"2026-06-29",source:"(direct)",medium:"(none)",sessions:31,transactions:5,avgRevenue:38200.00,isOrganic:false},
  {date:"2026-06-29",source:"m.search.naver.com",medium:"referral",sessions:30,transactions:1,avgRevenue:18500.00,isOrganic:true},

  // 6/30
  {date:"2026-06-30",source:"ig",medium:"paid",sessions:247,transactions:20,avgRevenue:17224.99,isOrganic:false},
  {date:"2026-06-30",source:"(direct)",medium:"(none)",sessions:34,transactions:6,avgRevenue:22833.33,isOrganic:false},
  {date:"2026-06-30",source:"m.search.naver.com",medium:"referral",sessions:27,transactions:1,avgRevenue:15999.99,isOrganic:true},
  {date:"2026-06-30",source:"orders.pay.naver.com",medium:"referral",sessions:12,transactions:1,avgRevenue:28999.99,isOrganic:false},
  {date:"2026-06-30",source:"google",medium:"organic",sessions:9,transactions:0,avgRevenue:0,isOrganic:true},

  // 7/1
  {date:"2026-07-01",source:"ig",medium:"paid",sessions:277,transactions:24,avgRevenue:22374.99,isOrganic:false},
  {date:"2026-07-01",source:"(direct)",medium:"(none)",sessions:34,transactions:3,avgRevenue:24000.00,isOrganic:false},
  {date:"2026-07-01",source:"m.search.naver.com",medium:"referral",sessions:24,transactions:1,avgRevenue:29000.00,isOrganic:true},
  {date:"2026-07-01",source:"google",medium:"organic",sessions:10,transactions:0,avgRevenue:0,isOrganic:true},

  // 7/2
  {date:"2026-07-02",source:"ig",medium:"paid",sessions:282,transactions:29,avgRevenue:20206.90,isOrganic:false},
  {date:"2026-07-02",source:"m.search.naver.com",medium:"referral",sessions:34,transactions:1,avgRevenue:29000.00,isOrganic:true},
  {date:"2026-07-02",source:"(direct)",medium:"(none)",sessions:25,transactions:4,avgRevenue:22249.99,isOrganic:false},
  {date:"2026-07-02",source:"naver",medium:"organic",sessions:7,transactions:0,avgRevenue:0,isOrganic:true},

  // 7/3
  {date:"2026-07-03",source:"ig",medium:"paid",sessions:309,transactions:28,avgRevenue:20910.71,isOrganic:false},
  {date:"2026-07-03",source:"(direct)",medium:"(none)",sessions:43,transactions:3,avgRevenue:16000.00,isOrganic:false},
  {date:"2026-07-03",source:"m.search.naver.com",medium:"referral",sessions:22,transactions:2,avgRevenue:23750.00,isOrganic:true},
  {date:"2026-07-03",source:"google",medium:"organic",sessions:10,transactions:0,avgRevenue:0,isOrganic:true},
  {date:"2026-07-03",source:"orders.pay.naver.com",medium:"referral",sessions:6,transactions:1,avgRevenue:52000.00,isOrganic:false},

  // 7/4
  {date:"2026-07-04",source:"ig",medium:"paid",sessions:337,transactions:35,avgRevenue:21271.43,isOrganic:false},
  {date:"2026-07-04",source:"(direct)",medium:"(none)",sessions:36,transactions:5,avgRevenue:25999.99,isOrganic:false},
  {date:"2026-07-04",source:"m.search.naver.com",medium:"referral",sessions:23,transactions:2,avgRevenue:22499.99,isOrganic:true},

  // 7/5
  {date:"2026-07-05",source:"ig",medium:"paid",sessions:399,transactions:39,avgRevenue:20051.28,isOrganic:false},
  {date:"2026-07-05",source:"m.search.naver.com",medium:"referral",sessions:39,transactions:4,avgRevenue:16625.00,isOrganic:true},
  {date:"2026-07-05",source:"(direct)",medium:"(none)",sessions:22,transactions:1,avgRevenue:28000.00,isOrganic:false},

  // 7/6
  {date:"2026-07-06",source:"ig",medium:"paid",sessions:256,transactions:24,avgRevenue:20416.66,isOrganic:false},
  {date:"2026-07-06",source:"(direct)",medium:"(none)",sessions:44,transactions:7,avgRevenue:18214.28,isOrganic:false},
  {date:"2026-07-06",source:"m.search.naver.com",medium:"referral",sessions:27,transactions:1,avgRevenue:18500.00,isOrganic:true},
  {date:"2026-07-06",source:"google",medium:"organic",sessions:17,transactions:0,avgRevenue:0,isOrganic:true},
];

// ga4-history 업데이트 (기존 데이터에 새 데이터 추가, 같은 날짜+소스는 덮어씀)
const existingKey = (r) => `${r.date}|${r.source}|${r.medium}`;
const gaMap = new Map(ga.data.map(r => [existingKey(r), r]));
for (const r of newGaData) gaMap.set(existingKey(r), r);
ga.data = [...gaMap.values()].sort((a,b) => (a.date + a.source).localeCompare(b.date + b.source));
ga._lastSynced = "2026-07-08";
fs.writeFileSync(gaPath, JSON.stringify(ga, null, 2));

// kpi-history에 GA 파생 필드 반영
const META = ['ig','instagram','fb','facebook','m.facebook.com','facebook.com','instagram.com','l.instagram.com','l.facebook.com'];
const PAID = ['paid','display','cpc'];

const historyMap = new Map(history.map(h => [h.date, h]));
const dates = [...new Set(newGaData.map(r => r.date))].sort();

for (const date of dates) {
  const day = newGaData.filter(r => r.date === date);
  const ga_total_revenue = day.reduce((s,r) => s + r.transactions * r.avgRevenue, 0);
  const ga_organic_revenue = day.filter(r => r.isOrganic).reduce((s,r) => s + r.transactions * r.avgRevenue, 0);
  const ga_ad_revenue = day.filter(r => PAID.includes(r.medium)).reduce((s,r) => s + r.transactions * r.avgRevenue, 0);
  const ga_meta_ad_revenue = day.filter(r => META.includes(r.source) && PAID.includes(r.medium)).reduce((s,r) => s + r.transactions * r.avgRevenue, 0);
  const ga_direct_revenue = day.filter(r => r.source === '(direct)').reduce((s,r) => s + r.transactions * r.avgRevenue, 0);

  const existing = historyMap.get(date) || { date };
  existing.ga_total_revenue = Math.round(ga_total_revenue);
  existing.ga_organic_revenue = Math.round(ga_organic_revenue);
  existing.ga_ad_revenue = Math.round(ga_ad_revenue);
  existing.ga_meta_ad_revenue = Math.round(ga_meta_ad_revenue);
  existing.ga_direct_revenue = Math.round(ga_direct_revenue);
  existing.organic_search_ratio = ga_total_revenue > 0 ? +(ga_organic_revenue / ga_total_revenue).toFixed(4) : 0;
  historyMap.set(date, existing);
}

const updated = [...historyMap.values()].sort((a,b) => a.date.localeCompare(b.date));
fs.writeFileSync(historyPath, JSON.stringify(updated, null, 2));

// 요약 출력
console.log(`\n✅ ga4-history.json: ${ga.data.length}개 소스 데이터`);
console.log(`✅ kpi-history.json: 14일간 GA 필드 반영\n`);
console.log('==== 6/23~7/6 GA 매출 요약 ====');
for (const date of dates) {
  const k = historyMap.get(date);
  console.log(`${date} | GA 총매출 ₩${k.ga_total_revenue.toLocaleString()} | 광고 ₩${k.ga_ad_revenue.toLocaleString()} | 오가닉 ₩${k.ga_organic_revenue.toLocaleString()} | 직접 ₩${k.ga_direct_revenue.toLocaleString()} | 오가닉비중 ${(k.organic_search_ratio*100).toFixed(1)}%`);
}
