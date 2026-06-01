# YouTube Daily Mind Map

하루 YouTube 시청기록을 날짜별로 묶고, 카테고리/시간대/채널 기준 마인드맵으로 보여주는 웹앱.

## 주요 기능

- 오늘/하루 전/이틀 전 빠른 날짜 선택
- 자정 기준 하루치와 선택일 기준 최근 7일치 보기
- 오늘 회고 화면과 기기 내 메모 저장
- 선택일 기준 최근 7일 주간 리포트
- 주제별 마인드맵
- 시간대별 마인드맵
- 채널별 마인드맵
- 키워드 기반 자동 분류
- React Flow 기반 인터랙티브 시각화
- YouTube Takeout ZIP/json/html 불러오기
- 가져온 기록의 로컬 누적 저장과 중복 제거
- Google Picker 기반 Drive Takeout ZIP 선택과 가져오기 진행 상태 표시
- 가져오기 성공 후 Drive 원본 ZIP 휴지통 이동
- PWA 기반 홈 화면 설치 지원

## 주의사항

- YouTube 기록만으로 실제 시청 시간을 정확히 알 수 없으므로 "사용시간"이 아니라 "시청 기록 수"를 기준으로 분석한다.
- 기본 화면은 샘플 데이터 기반 프로토타입이다.
- Takeout 파일은 브라우저에서만 읽고 서버로 업로드하지 않는다.
- 가져온 기록은 IndexedDB를 사용해 현재 기기에 저장한다.
- Google 계정 직접 연동은 Data Portability API 검증 이후 붙인다.
- 분류는 키워드 기반이라 완벽하지 않다.

## 내 시청 기록 보기

1. 앱의 `YouTube Takeout 만들기` 버튼으로 Takeout을 연다.
2. Google 화면에서 YouTube 및 YouTube Music 기록 내보내기를 생성한다.
3. 다운로드한 `.zip` 파일을 앱의 `ZIP/파일 선택`에서 고르거나, Drive에 저장된 파일을 `Drive ZIP 선택`으로 고른다.
4. 앱이 ZIP 안의 `watch-history.json` 또는 `watch-history.html`을 찾아 시청 기록을 불러온다.
5. 이미 저장된 기록과 비교해 새 기록만 추가하고 중복은 건너뛴다.
6. Drive에서 가져온 경우 성공 후 원본 ZIP을 휴지통으로 이동할 수 있다.
7. 오늘, 하루 전, 이틀 전 중 원하는 기준 날짜를 고른다.
8. 필요하면 `최근 7일치`로 전환해 선택한 날짜까지의 일주일 기록을 함께 본다.

압축을 미리 풀었다면 `watch-history.json`, `watch-history.html`, `watch-history.htm` 파일을 직접 선택해도 된다.

## Google Drive Picker 설정

Drive에서 Takeout ZIP을 선택하려면 Google Cloud에서 Drive API와 Picker API를 활성화하고 OAuth Client ID/API Key를 만든 뒤 환경변수를 설정한다.

```bash
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=
NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID=
```

- `NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID`: 웹 OAuth Client ID
- `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY`: Google Picker용 API Key
- `NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID`: Google Cloud 프로젝트 번호

OAuth 동의 화면에는 Drive 전체 권한 대신 `https://www.googleapis.com/auth/drive.file`만 사용한다. 앱은 사용자가 Google Picker에서 선택한 파일 하나만 다운로드하고, 가져오기가 끝난 뒤 사용자가 동의하면 그 Drive 원본 파일을 휴지통으로 이동한다.

Drive 가져오기 흐름:

1. `Drive로 Takeout 만들기`를 눌러 Google Takeout 화면을 연다.
2. Google 화면에서 내보내기를 생성하고 Drive 저장을 확인한다.
3. 완료 후 앱으로 돌아와 `Drive ZIP 선택`을 누른다.
4. Google Picker에서 Takeout ZIP을 선택한다.
5. 앱이 다운로드 진행률, ZIP 내부 탐색, 파싱 결과를 표시한다.
6. 가져오기가 성공하면 새 기록만 저장하고, 중복 기록은 건너뛴다.
7. 필요하면 앱에서 선택한 Drive 원본 ZIP을 휴지통으로 이동한다.

앱은 Drive 전체를 자동 검색하지 않는다. 사용자가 Picker에서 고른 파일 하나만 접근하므로 권한 범위와 사용자 신뢰를 좁게 유지한다.

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

이 PC에서는 Android Studio 내장 JDK와 Android SDK를 사용한다.

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME='C:\Users\IML4\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

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
