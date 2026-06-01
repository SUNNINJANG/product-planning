# KPI 대시보드

> 자사몰 매출·오가닉 서치 비중·재구매율·AOV·CAC·기여이익·구독자 현황

<div id="kpi-loading" style="text-align:center;padding:40px;color:#8B7B6B;">
  데이터 불러오는 중...
</div>

<div id="kpi-content" style="display:none;">

<!-- 최근 데이터 요약 카드 -->
<div id="kpi-summary-cards"></div>

## 📈 매출

<div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(58,43,32,0.06);margin:1rem 0;">
  <canvas id="chart-revenue" style="max-height:280px;"></canvas>
</div>

## 🌱 오가닉 서치 비중 (목표 15%)

<div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(58,43,32,0.06);margin:1rem 0;">
  <canvas id="chart-organic" style="max-height:280px;"></canvas>
  <div id="organic-pending" style="display:none;text-align:center;padding:30px;color:#8B7B6B;font-size:0.9rem;">
    📡 GA4 또는 아임웹 유입통계 연동 후 활성화됩니다.<br>
    <span style="font-size:0.8rem;">(현재는 데이터 소스 미연결 상태)</span>
  </div>
</div>

## 💰 단가 지표 (AOV · CAC · 기여이익)

<div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(58,43,32,0.06);margin:1rem 0;">
  <canvas id="chart-unit-economics" style="max-height:280px;"></canvas>
</div>

## 🔁 재구매율

<div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(58,43,32,0.06);margin:1rem 0;">
  <canvas id="chart-repurchase" style="max-height:280px;"></canvas>
</div>

## 📬 채널 구독자

<div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(58,43,32,0.06);margin:1rem 0;">
  <canvas id="chart-subscribers" style="max-height:280px;"></canvas>
</div>

## 📅 일별 리포트

<div id="daily-reports-list"></div>

</div>

<div id="kpi-empty" style="display:none;text-align:center;padding:60px 20px;color:#8B7B6B;">
  <div style="font-size:2.5rem;margin-bottom:12px;">📊</div>
  <h3 style="border:none;color:var(--cocao-root);">아직 분석된 데이터가 없습니다</h3>
  <p style="margin-top:8px;">
    <code>data/raw/YYYY-MM-DD/</code> 폴더에 아임웹 주문 export 파일을 넣고<br>
    채팅창에 <strong>"오늘 KPI 분석해줘"</strong>라고 말씀하시면 자동으로 채워집니다.
  </p>
  <p style="margin-top:16px;font-size:0.85rem;">
    자세한 사용법은 <a href="#/data/raw/README">데이터 업로드 가이드</a>를 참고하세요.
  </p>
</div>

<script>
(function(){
  const KRW = (v) => v == null ? '-' : '₩' + Math.round(v).toLocaleString('ko-KR');
  const PCT = (v) => v == null ? '-' : (v * 100).toFixed(1) + '%';
  const N = (v) => v == null ? '-' : Math.round(v).toLocaleString('ko-KR');

  // 하우스보이 컬러 팔레트
  const C = {
    cocao: '#3A2B20',
    cloud: '#C2E9FF',
    cherry: '#EEDAE6',
    matcha: '#F1F1C1',
    morning: '#FFF9CF',
    silk: '#FFFBEA',
    brown: '#6B4C3B',
    redAlert: '#D97757',
    green: '#7BA05B'
  };

  const ASSUMP_URL = '/config/kpi-assumptions.json';
  const HIST_URL = '/data/processed/kpi-history.json';

  Promise.all([
    fetch(HIST_URL).then(r => r.json()).catch(() => []),
    fetch(ASSUMP_URL).then(r => r.json()).catch(() => null)
  ]).then(([history, assump]) => {
    document.getElementById('kpi-loading').style.display = 'none';

    if (!Array.isArray(history) || history.length === 0) {
      document.getElementById('kpi-empty').style.display = 'block';
      return;
    }

    document.getElementById('kpi-content').style.display = 'block';

    // 최신 데이터
    const latest = history[history.length - 1];
    const prev = history.length >= 2 ? history[history.length - 2] : null;

    // 요약 카드
    const trend = (curr, prev, fmt, isLowerBetter = false) => {
      if (curr == null || prev == null || prev === 0) return '';
      const diff = ((curr - prev) / prev * 100).toFixed(1);
      const sign = diff > 0 ? '+' : '';
      const isImproved = isLowerBetter ? diff < 0 : diff > 0;
      const color = isImproved ? C.green : C.redAlert;
      return `<span style="color:${color};font-size:0.78rem;margin-left:6px;">${sign}${diff}%</span>`;
    };

    const cards = [
      { label: '자사몰 매출', value: KRW(latest.revenue_owned), trend: trend(latest.revenue_owned, prev?.revenue_owned) },
      { label: '오가닉 서치 비중', value: latest.organic_search_ratio != null ? PCT(latest.organic_search_ratio) : '셋업 대기', trend: trend(latest.organic_search_ratio, prev?.organic_search_ratio) },
      { label: '재구매율', value: PCT(latest.repurchase_rate), trend: trend(latest.repurchase_rate, prev?.repurchase_rate) },
      { label: 'AOV', value: KRW(latest.aov), trend: trend(latest.aov, prev?.aov) },
      { label: 'CAC', value: KRW(latest.cac), trend: trend(latest.cac, prev?.cac, null, true) },
      { label: '객당 기여이익', value: KRW(latest.contribution_profit_per_order), trend: trend(latest.contribution_profit_per_order, prev?.contribution_profit_per_order) },
      { label: '이메일 구독자', value: N(latest.email_subscribers), trend: trend(latest.email_subscribers, prev?.email_subscribers) },
      { label: '플친', value: N(latest.kakao_plus_friends), trend: trend(latest.kakao_plus_friends, prev?.kakao_plus_friends) }
    ];

    document.getElementById('kpi-summary-cards').innerHTML = `
      <p style="color:#8B7B6B;font-size:0.85rem;margin-bottom:8px;">최근 업데이트: <strong>${latest.date}</strong></p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:20px;">
        ${cards.map(c => `
          <div style="background:#fff;border:1px solid #F0EBE5;border-radius:10px;padding:14px;">
            <div style="font-size:0.75rem;color:#8B7B6B;margin-bottom:6px;">${c.label}</div>
            <div style="font-size:1.15rem;font-weight:600;color:${C.cocao};">
              ${c.value}${c.trend}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // 차트 공통 설정
    Chart.defaults.font.family = "'Noto Sans KR', -apple-system, sans-serif";
    Chart.defaults.color = C.brown;
    Chart.defaults.borderColor = '#F0EBE5';

    const labels = history.map(d => d.date);

    // 1) 채널별 매출 (자사몰 + 스마트스토어 + 쿠팡 + 오집)
    new Chart(document.getElementById('chart-revenue'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: '자사몰', data: history.map(d => d.revenue_owned), backgroundColor: C.cocao, stack: 'rev' },
          { label: '스마트스토어', data: history.map(d => d.revenue_smartstore), backgroundColor: C.cherry, stack: 'rev' },
          { label: '쿠팡', data: history.map(d => d.revenue_coupang), backgroundColor: '#FAE100', stack: 'rev' },
          { label: '오집', data: history.map(d => d.revenue_ozzip), backgroundColor: C.cloud, stack: 'rev' }
        ]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: '채널별 일 매출' } },
        scales: { y: { stacked: true, ticks: { callback: v => '₩' + (v/1000).toFixed(0) + 'k' } }, x: { stacked: true } }
      }
    });

    // 2) 오가닉 서치 비중 (GA4 데이터가 있을 때만 그림)
    const hasOrganicData = history.some(d => d.organic_search_ratio != null);
    if (hasOrganicData) {
      new Chart(document.getElementById('chart-organic'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: '오가닉 서치 비중',
            data: history.map(d => d.organic_search_ratio != null ? d.organic_search_ratio * 100 : null),
            borderColor: C.green,
            backgroundColor: 'rgba(123,160,91,0.1)',
            fill: true,
            tension: 0.3
          }, {
            label: '목표 15%',
            data: history.map(() => 15),
            borderColor: C.brown,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }]
        },
        options: {
          responsive: true,
          plugins: { title: { display: true, text: '오가닉 서치 비중 (%)' } },
          scales: { y: { ticks: { callback: v => v + '%' } } }
        }
      });
    } else {
      document.getElementById('chart-organic').style.display = 'none';
      document.getElementById('organic-pending').style.display = 'block';
    }

    // 3) 단가
    new Chart(document.getElementById('chart-unit-economics'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'AOV', data: history.map(d => d.aov), borderColor: C.cocao, tension: 0.3 },
          { label: 'CAC', data: history.map(d => d.cac), borderColor: C.redAlert, tension: 0.3 },
          { label: '객당 기여이익', data: history.map(d => d.contribution_profit_per_order), borderColor: C.green, tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'AOV · CAC · 객당 기여이익 (₩)' } },
        scales: { y: { ticks: { callback: v => '₩' + (v/1000).toFixed(0) + 'k' } } }
      }
    });

    // 4) 재구매율
    new Chart(document.getElementById('chart-repurchase'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '재구매율',
          data: history.map(d => d.repurchase_rate != null ? d.repurchase_rate * 100 : null),
          borderColor: C.brown,
          backgroundColor: 'rgba(107,76,59,0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: '재구매율 (%)' } },
        scales: { y: { ticks: { callback: v => v + '%' } } }
      }
    });

    // 5) 구독자
    new Chart(document.getElementById('chart-subscribers'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: '이메일 구독자', data: history.map(d => d.email_subscribers), borderColor: C.cocao, tension: 0.3, yAxisID: 'y' },
          { label: '플친 (카카오)', data: history.map(d => d.kakao_plus_friends), borderColor: '#FAE100', backgroundColor: 'rgba(250,225,0,0.1)', tension: 0.3, yAxisID: 'y' }
        ]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: '채널 구독자 추이' } }
      }
    });

    // 일별 리포트 링크
    const reportLinks = history.slice().reverse().slice(0, 30).map(d =>
      `<li style="margin:4px 0;"><a href="#/dashboard/${d.date}">${d.date} 리포트</a> — 매출 ${KRW(d.revenue_owned)}, AOV ${KRW(d.aov)}</li>`
    ).join('');
    document.getElementById('daily-reports-list').innerHTML = `<ul style="list-style:none;padding-left:0;">${reportLinks}</ul>`;
  });
})();
</script>
