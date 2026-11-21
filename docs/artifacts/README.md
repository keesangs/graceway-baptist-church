# 산출물 inventory와 복원

이번 인수인계는 사용 가능한 프로젝트 자료를 검토해 **Git에 포함할 것**, **외부 저장소에서 복원할 것**, **private/재설치 가능한 자료로 제외할 것**을 구분했습니다. [inventory.json](inventory.json)에 파일별 SHA256·크기·문서 색인·정적 storage 참조·제외 사유를 기록합니다. 원시 대화나 플랫폼 내부 skill 전체를 공개 저장소에 복사한 것이 아닙니다.

## Git에 직접 보관

새 Claude Code 진입점·프로젝트 컨텍스트·개발/복원/Discord/환경변수 문서, 프로젝트 전용 maintenance skill, CPU benchmark **1.7B/0.6B 실제 결과**, optional 재실행 스크립트, 최종 genuine-style 및 이전 outline 이메일 아이콘 **6개**와 생성 스크립트, 사용자 제공 이전 설계·API 참고 자료를 보관합니다. 기존 두 교회 로고와 brand/nav manifests, 기존 docs, 전체 앱 코드·migration·테스트·lockfile·Git history도 유지합니다.

icon 파일의 `genuine` 이름은 기존 생성 artifact 이름이며 공식 배포된 브랜드 원본이라는 주장으로 해석하지 마세요. 이들은 Pillow로 제작된 recognizable raster marks입니다. 플랫폼/제3자 상표·콘텐츠의 권리는 각각의 소유자에게 있습니다.

## 외부 보관한 대용량 원본

[branding-source-archive.json](branding-source-archive.json)에 ZIP 전체와 내부 **14개** 파일의 크기·SHA256·원본명/상대경로를 기록합니다. ZIP에는 기존 63.5×38.7인치 배너 SVG container 및 150DPI PNG 두 iteration, YouTube channel banner/icon의 기존 생성본·수정본, 제공된 배너 artwork/로고가 포함됩니다. 개인 사진, 원시 캡처, 메일, credentials는 포함되지 않습니다.

원본은 기존 sandbox에만 남아 새 채팅에서 놓칠 수 있던 것들을 추가 보관한 것입니다. Git에서 큰 배너를 제외하라는 기존 방침과 deployment 성능을 유지합니다. 이 ZIP은 실제 운영 media URL이나 artwork를 변경하지 않습니다. 사용자가 원하는 별도 private/offline 백업에도 내려받아 보관할 수 있습니다.

```bash
python3 scripts/artifacts/restore_public_assets.py --list
python3 scripts/artifacts/restore_public_assets.py --id branding-source-archive --output ../graceway-restored-assets
# 스크립트는 다운로드/checksum만 확인하며 ZIP을 자동 추출하지 않습니다.
```

파일을 받은 뒤 ZIP `CONTENTS.json`으로 개별 원본 checksum을 비교하세요. 실행 전에 약 59MB archive와 추출 공간을 확인하고 큰 파일을 Git 또는 client source에 되돌려 넣지 마세요. 현재 `/manus-storage/` proxy에 의존하므로 외부 서비스의 영구 보존까지 Git이 보증하는 것은 아닙니다.

## 작은 아이콘 재생성

Python 가상환경에 Pillow를 준비한 후, 출력 폴더를 저장소 밖으로 지정하세요. 원래 geometry는 보존하고 sandbox 고정 출력 경로만 portable하게 변경했습니다.

```bash
GRACEWAY_ARTIFACT_OUTPUT=../graceway-restored-assets/newsletter-brand-icons python3 scripts/artifacts/create_brand_newsletter_icons.py
GRACEWAY_ARTIFACT_OUTPUT=../graceway-restored-assets/newsletter-outline-icons python3 scripts/artifacts/create_newsletter_icons_legacy.py
```

실제 이메일에서는 `server/weeklyNewsletterDelivery.ts`의 공개 HTTPS storage 참조를 사용합니다. 새 PNG를 만들었다고 실제 발송 template이나 사이트가 자동으로 변경되지는 않습니다. 원본 geometry 검증 시 Pillow 버전에 따른 PNG encoding 차이는 있을 수 있으므로 필요하면 pixel 비교도 하세요.

## CPU 실험 보존

[1.7B 결과](../benchmarks/qwen-cpu-1.7b.json)와 [0.6B 결과](../benchmarks/qwen-cpu-0.6b.json)는 **2026-11-17, 6-thread sandbox CPU**에서 측정했습니다. short warm synthesis는 각각 14.821초, 13.547초이며 당시 real-time factor가 약7.13/4.98로 실시간보다 느렸습니다. 현재 Reserved 운영의 latency가 아니고 새 모델·GPU·환경의 예측치도 아닙니다. 현재 운영 provider는 DeepInfra Inworld이며 이 실험이 기본 모델을 바꾸지 않습니다.

재실행 스크립트는 `torch`, `psutil`, `qwen-tts` 및 model weights가 필요하고 큰 다운로드/긴 CPU 작업을 수행합니다. 일반 테스트·앱 startup에서는 실행하지 않으며 필요한 경우 별도 환경에서 명시적으로 실행하세요. 모델/cache·virtualenv는 재설치 가능하므로 Git에 넣지 않았습니다.

## inventory를 갱신하고 검사하기

```bash
python3 scripts/artifacts/build_artifact_inventory.py
python3 scripts/artifacts/audit_handoff.py
```

첫 스크립트는 체크섬/정적 공개 참조/문서 색인을 갱신하고, 두 번째는 링크·파일·checksum·금지 tracked files를 오프라인 확인합니다. 전용 secret scanner로 staged diff도 검사하세요. 실제 사용자 DB·동적 비공개 storage key·서비스 설정은 export하지 않습니다. 제외 항목과 사유를 inventory에 명시해 '모든 파일을 public Git에 넣었다'고 오해하지 않도록 합니다.
