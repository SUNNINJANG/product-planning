# GA4 → Google Sheets 자동 연동 가이드

> 오가닉 서치 비중 KPI 측정용 — 한 번 셋업하면 매일 자동 갱신

---

## 📦 무엇을 만드는 건가요?

```
GA4 (트래픽 소스 데이터)
   ↓ (매일 새벽 자동 fetch)
구글 시트 "하우스보이_GA데이터"
   ├─ 일별 매체별 세션·전환·매출 누적
   ↓ (시트 URL 공유)
KPI 분석기가 시트 읽어서 오가닉 비중 자동 계산
   ↓
대시보드 차트 자동 갱신
```

---

## 🛠️ 셋업 단계 (10~15분)

### STEP 1. 새 구글 시트 만들기

1. https://sheets.new 접속
2. 시트 이름: **`하우스보이_GA데이터`** 같은 거로 변경
3. 첫 번째 탭 이름을 **`Raw`**로 변경 (GA가 여기에 데이터를 채울 거예요)

---

### STEP 2. 부가기능 설치 — "GA4 Reports Builder"

1. 시트 메뉴 → **확장 프로그램(Extensions) → 부가기능(Add-ons) → 부가기능 설치(Get add-ons)**
2. 검색창에 **"GA4 Reports Builder"** 입력
3. **공식 Google 부가기능** 설치 (개발자가 "Google LLC")
4. 본인 구글 계정 권한 승인 (시트 편집 + GA4 읽기)

> 💡 만약 "GA4 Reports Builder"가 안 보이면 **"Google Analytics"** 부가기능을 설치하세요. 같은 회사 제품이고 GA4 지원합니다.

---

### STEP 3. 첫 리포트 설정

1. **확장 프로그램 → GA4 Reports Builder → Create new report**
2. 다음 설정 입력:

| 항목 | 값 |
|------|------|
| **Report Name** | `daily-traffic-sources` |
| **GA4 Property** | 하우스보이 GA4 속성 선택 |
| **Start Date** | `30daysAgo` |
| **End Date** | `yesterday` |
| **Dimensions** | `date`, `sessionSource`, `sessionMedium` |
| **Metrics** | `sessions`, `engagedSessions`, `transactions`, `purchaseRevenue`, `newUsers` |

3. **Create Report** 클릭

---

### STEP 4. 리포트 실행

1. **확장 프로그램 → GA4 Reports Builder → Run reports**
2. 잠시 대기 → `Raw` 탭에 데이터 채워짐
3. 컬럼은 대략 이렇게:

| date | sessionSource | sessionMedium | sessions | engagedSessions | transactions | purchaseRevenue | newUsers |
|------|---------------|---------------|----------|-----------------|--------------|-----------------|----------|
| 20260601 | google | organic | 142 | 89 | 3 | 87000 | 78 |
| 20260601 | (direct) | (none) | 56 | 30 | 1 | 14500 | 22 |
| 20260601 | facebook | cpc | 88 | 41 | 2 | 47000 | 65 |
| 20260601 | naver | organic | 31 | 19 | 1 | 17000 | 18 |

> ✅ **`sessionMedium = "organic"`인 행의 매출 합계 ÷ 전체 매출** = 오가닉 서치 비중

---

### STEP 5. 자동 갱신 스케줄 설정

매일 새벽에 자동으로 데이터가 갱신되게:

1. **확장 프로그램 → GA4 Reports Builder → Schedule reports**
2. **Run reports every:** `day`
3. **Run at:** `5 AM` 정도 (전날 데이터 GA 처리 완료 시점)
4. 본인 이메일로 실행 알림 받기 옵션 켜기 (실패 시 통지)

---

### STEP 6. 시트 공유

1. 시트 우측 상단 **공유(Share)** 버튼
2. **링크가 있는 모든 사용자** → **뷰어(Viewer)** 권한
3. URL 복사

---

### STEP 7. 채팅창에 URL 공유

저한테 시트 URL 보내주시면:
- `config/kpi-assumptions.json`에 GA 시트 URL 추가
- 다음 KPI 분석부터 자동으로 시트 읽음
- 대시보드의 "오가닉 서치 비중" 차트 활성화

---

## 🆘 트러블슈팅

<details>
<summary><b>"GA4 Reports Builder"가 검색되지 않아요</b></summary>

대안:
- **"Google Analytics"** 부가기능 설치 (구글 공식, GA4 지원)
- 또는 https://workspace.google.com/marketplace 직접 방문 → 검색

</details>

<details>
<summary><b>GA4 속성이 드롭다운에 안 보여요</b></summary>

GA 계정에 본인이 **편집자 이상** 권한이 있어야 합니다.
- GA → 관리 → 속성 액세스 관리 → 본인 권한 확인

</details>

<details>
<summary><b>매출이 0으로 나와요</b></summary>

아임웹의 GA4 **전자상거래 이벤트**가 설정되어 있어야 `purchaseRevenue`가 들어옵니다.
- 아임웹 관리자 → 분석/통계 → Google Analytics 4 → "전자상거래 이벤트 자동 전송" 켜져있는지 확인
- 안 켜져 있으면 `transactions`(주문 수)만 사용해도 비중 계산 가능

</details>

<details>
<summary><b>매일 자동 실행이 안 돼요</b></summary>

- 구글 시트가 60일 동안 열리지 않으면 스케줄이 정지됩니다
- 본인 시트 활동 빈도가 낮으면 한 달에 한 번이라도 시트를 열어주세요

</details>

---

## 📐 KPI 계산 로직 (참고)

오가닉 서치 비중 = 다음 조건의 매출 합계 ÷ 전체 매출

```
sessionMedium = "organic"
또는 sessionSource ∈ {google, naver, daum, bing, yahoo}
   AND sessionMedium ∈ {organic, (none)}
```

목표: **15%** (KPI 가정값에 저장됨)

---

## ⏭️ 다음 단계 (선택)

이 셋업이 익숙해지면 추가할 만한 GA 리포트:

1. **랜딩 페이지별 전환** — 어느 페이지가 매출 만드는지
2. **디바이스별 전환** — 모바일/PC 비중
3. **신규 vs 재방문** 매출 비교
4. **광고 캠페인별 ROAS** (UTM 태깅 시작 후)

원하실 때 추가 시트 탭으로 늘려나가면 됩니다.
