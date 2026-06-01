# 데이터 업로드 가이드

KPI 분석을 위해 매일 이 폴더에 데이터 파일을 드롭하세요.

## 폴더 구조

```
data/raw/
├── 2026-05-27/
│   ├── imweb-orders.xlsx          (아임웹 주문 export)
│   ├── smartstore-orders.xlsx     (스마트스토어 주문 export, 선택)
│   ├── meta-ads.csv               (메타 광고 리포트, 선택)
│   ├── stibee-subscribers.csv     (스티비 구독자 수, 선택)
│   └── kakao-plus-friends.csv     (카카오 플친 수, 선택)
└── 2026-05-28/
    └── ...
```

## 분석 요청 방법

파일 드롭 후 채팅창에 이렇게 말하면 됩니다:

> "5/27 KPI 분석해줘"

또는:

> "오늘 데이터 분석해서 대시보드 업데이트"

## 각 파일에 필요한 컬럼

### imweb-orders.xlsx (필수)
- 주문번호, 주문일시, 주문자ID(or 이메일/전화), 결제금액, 주문상태
- 가능하면: utm_source, utm_medium (없으면 메타 의존도 계산 불가)

### smartstore-orders.xlsx (선택)
- 주문번호, 결제일시, 결제금액, 주문상태

### meta-ads.csv (선택, 메타 광고 운영 시)
- 일별 광고비, 전환(구매), 매출

### stibee-subscribers.csv / kakao-plus-friends.csv (선택)
- 일별 구독자 수 (누적), 일별 증감

---

## ⚠️ 주의

- 파일명에 한글이 있어도 OK
- 폴더명은 반드시 `YYYY-MM-DD` 형식
- 민감 정보(고객 이름·연락처)는 분석 후 익명화되어 저장됨
