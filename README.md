# YouTube Daily Mind Map

하루 YouTube 시청기록을 날짜별로 묶고, 카테고리/시간대/채널 기준 마인드맵으로 보여주는 웹앱.

## 주요 기능

- 오늘/하루 전/이틀 전 빠른 날짜 선택
- 자정 기준 하루치와 선택일 기준 최근 7일치 보기
- 주제별 마인드맵
- 시간대별 마인드맵
- 채널별 마인드맵
- 키워드 기반 자동 분류
- React Flow 기반 인터랙티브 시각화
- YouTube Takeout watch-history.json/html 수동 불러오기
- PWA 기반 홈 화면 설치 지원

## 주의사항

- YouTube 기록만으로 실제 시청 시간을 정확히 알 수 없으므로 "사용시간"이 아니라 "시청 기록 수"를 기준으로 분석한다.
- 기본 화면은 샘플 데이터 기반 프로토타입이다.
- Takeout 파일은 브라우저에서만 읽고 서버로 업로드하지 않는다.
- Google Takeout 자동 가져오기는 다음 단계에서 붙인다.
- 분류는 키워드 기반이라 완벽하지 않다.

## 내 시청 기록 보기

1. Google Takeout에서 YouTube 기록을 내보낸다.
2. 압축을 풀고 `YouTube and YouTube Music/history/watch-history.json` 또는 `watch-history.html` 파일을 찾는다.
3. 앱 좌측의 `시청 기록 불러오기`에서 파일을 선택한다.
4. 오늘, 하루 전, 이틀 전 중 원하는 기준 날짜를 고른다.
5. 필요하면 `최근 7일치`로 전환해 선택한 날짜까지의 일주일 기록을 함께 본다.

## 폰에 설치하기

- Android/Chrome: 배포된 사이트를 연 뒤 앱 안의 `앱 설치` 버튼이나 브라우저 메뉴의 `앱 설치`를 사용한다.
- iPhone/iPad/Safari: 공유 버튼을 누른 뒤 `홈 화면에 추가`를 선택한다.

## Android APK 빌드

GitHub Actions에서 `Build Android APK` 워크플로를 실행하면 디버그 APK가 artifact로 생성된다.

1. GitHub에 변경사항을 push한다.
2. GitHub 저장소의 `Actions` 탭으로 이동한다.
3. `Build Android APK` 실행 결과를 연다.
4. `Artifacts`에서 `youtube-daily-mind-map-debug-apk`를 다운로드한다.

다운로드한 APK는 Android에서 테스트 설치할 수 있다. 설치 시 `알 수 없는 앱 설치` 허용이 필요할 수 있다.

로컬에서 빌드하려면 Java JDK와 Android SDK가 필요하다.

```bash
npm run android:debug
```

생성 위치:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## 개발 실행

```bash
npm install
npm run dev
```

## 테스트

```bash
npm run test
```
