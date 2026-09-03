# WWW 도메인 연결 조사 보고서

**대상 도메인:** `graceway-baptist.org` 및 `www.graceway-baptist.org`  
**조사일:** 2026-09-03  
**권장 정규 주소:** `https://graceway-baptist.org`

## 결론

`www`는 DNS와 HTTPS 인증서가 없는 상태가 아닙니다. `graceway-baptist.org`와 `www.graceway-baptist.org`는 모두 현재 같은 공개 IPv4 주소(`104.18.26.246`)로 해석되며, 동일한 와일드카드 TLS 인증서 범위에 포함됩니다. 그러나 `www` 호스트는 호스팅 플랫폼에서 이 프로젝트의 연결 도메인으로 등록되지 않아 HTTPS 요청에 **404 Not Found**를 반환합니다.

따라서 해결해야 할 곳은 일반적인 웹사이트 소스 코드나 새로운 A 레코드가 아니라, **Manus 프로젝트의 도메인 연결 설정**입니다. `www.graceway-baptist.org`를 이 프로젝트에 보조 도메인으로 연결한 뒤, 해당 보조 도메인을 정규 도메인인 `https://graceway-baptist.org`로 301 리디렉션하도록 구성하는 방식이 안전합니다.

| 점검 항목 | `graceway-baptist.org` | `www.graceway-baptist.org` | 해석 |
|---|---|---|---|
| DNS A 응답 | `104.18.26.246` | `104.18.26.246` | 두 호스트가 동일한 프록시·호스팅 진입점으로 연결됨 |
| HTTPS 응답 | `200 OK` | `404 Not Found` | `www`의 DNS 문제가 아니라 호스트 매핑 누락 |
| TLS 인증서 | apex 및 `*.graceway-baptist.org` 포함 | 동일 인증서 적용 | 인증서 재발급이 우선 원인은 아님 |
| 연결된 Manus 프로젝트 도메인 | `graceway-baptist.org` | 현재 미연결 | `www`를 프로젝트 도메인에 추가해야 함 |

## 현재 관리 주체

공개 RDAP 레코드상 등록기관은 **Global Domain Group LLC**이며, 권한 있는 네임서버는 다음과 같습니다.

| 역할 | 현재 값 | 변경 시 유의점 |
|---|---|---|
| 등록기관 | Global Domain Group LLC | 도메인 소유·등록 갱신을 관리하는 계정 |
| DNS 위임 | `ns1.globaldomaingroup.com`, `ns2.globaldomaingroup.com` | 외부 DNS가 아니라 Manus 관리 DNS를 사용 중일 가능성이 높음 |
| 정규 호스트 | `graceway-baptist.org` | 현재 정상 동작하므로 삭제·교체 금지 |
| 보조 호스트 | `www.graceway-baptist.org` | 현재 404; 보조 도메인 연결 및 리디렉션 대상 |

## 변경 위치와 순서

### 1. Manus 프로젝트에서 `www`를 먼저 연결합니다

1. Graceway Baptist Church 프로젝트의 **Management UI**를 엽니다.
2. 오른쪽 패널의 **Settings → Domains**로 이동합니다.
3. 현재 정상인 `graceway-baptist.org`는 그대로 유지합니다.
4. **Add / Connect domain**을 선택하고 `www.graceway-baptist.org`를 입력합니다.
5. 화면에 제공되는 도메인 검증·DNS 안내를 확인합니다. 기존 도메인을 외부에서 연결할 때 Manus는 해당 도메인에 맞는 A 또는 CNAME 레코드를 제시합니다.[1] [2]
6. UI에 **Set up both** 또는 apex·www를 함께 설정하는 선택지가 보이면 선택합니다. Manus 도움말은 `www`를 별도 레코드로 연결하고, 필요한 경우 두 호스트를 함께 설정하도록 안내합니다.[1]
7. `www` 상태가 **Live / Connected**가 될 때까지 기다립니다. HTTPS 인증서는 연결 완료 뒤 Manus가 자동으로 구성합니다.[2]

### 2. DNS는 Manus가 제시하는 값만 사용합니다

현재 `www`는 이미 같은 플랫폼 주소에 연결되어 있으므로, Global Domain Group의 DNS 화면에서 임의의 IP 주소를 새로 넣지 마십시오. Manus의 연결 UI가 별도 CNAME 또는 A 레코드 변경을 요구할 때에만 **화면에 표시된 정확한 값**으로 기존 `www` 레코드를 교체합니다.[1] [2]

> **중요:** `@`(apex)의 현재 A 레코드와 `graceway-baptist.org` 연결은 정상입니다. 이 레코드를 변경하거나 삭제하지 마십시오. 작업 대상은 `www` 호스트 하나입니다.

Manus의 연결 UI가 DNS 수정 위치를 자체 관리 DNS로 안내한다면 다음 경로를 사용합니다.

1. Manus 계정의 **Settings → Data controls → Manage**로 이동합니다.
2. `graceway-baptist.org` 도메인을 찾은 뒤 **Manage**를 선택합니다.
3. `www`의 기존 A 레코드가 있고 Manus가 다른 CNAME/A 값을 제시한 경우에만 기존 `www` A 레코드를 제거합니다.
4. **Add record**에서 Manus가 지정한 `Type`, `Name`, `Value`, `TTL`을 그대로 입력합니다.[1]

### 3. `www`를 정규 주소로 리디렉션합니다

`www`가 Manus 프로젝트에 Live로 연결된 뒤, Domains 설정에서 **Primary / Canonical domain**은 `graceway-baptist.org`로 유지합니다. UI에서 리디렉션 옵션을 제공하면 다음 규칙을 사용합니다.

```text
https://www.graceway-baptist.org/*
→ 301 Permanent Redirect
→ https://graceway-baptist.org/$1
```

Domains 화면에 보조 도메인 리디렉션 옵션이 없다면, `www`를 프로젝트에 연결한 후 프로젝트의 호스트 정규화 규칙으로 301을 처리해야 합니다. 이 단계는 실제 Domains UI에서 제공되는 옵션을 먼저 확인한 뒤 적용해야 하며, 연결되기 전에는 웹 애플리케이션 코드만으로 404를 해결할 수 없습니다.

## 적용 순서와 검증 기준

| 순서 | 변경·확인 | 성공 기준 | 실패 시 조치 |
|---|---|---|---|
| 1 | `www`를 Manus Domains에 추가 | 상태가 Connected/Live | DNS 안내 값 확인, 기존 apex는 보존 |
| 2 | 필요 시 `www` DNS만 Manus 제시 값으로 교체 | `www`의 TLS 연결 성공 | TTL 전파 대기 후 재확인 |
| 3 | `www` → apex 301 설정 | 최종 URL이 apex, 상태 301→200 | Canonical/redirect 설정 검토 |
| 4 | 네 가지 주소 점검 | 모두 HTTPS, 최종 주소는 apex | 브라우저 캐시를 비우고 재검증 |

다음 네 주소가 모두 같은 최종 주소로 수렴해야 합니다.

```text
http://graceway-baptist.org            → https://graceway-baptist.org
https://graceway-baptist.org           → https://graceway-baptist.org
http://www.graceway-baptist.org        → https://graceway-baptist.org
https://www.graceway-baptist.org       → https://graceway-baptist.org
```

## 현재 단계에서 하지 말아야 할 작업

`@` 레코드 삭제, 네임서버 변경, 임의의 외부 IP 추가, 또는 `www` 레코드의 선제 삭제는 현재 정상인 apex 사이트를 중단시킬 수 있으므로 피해야 합니다. `www` 연결 상태가 Live가 되기 전에는 정규화 리디렉션을 적용하지 않는 편이 안전합니다.

## 다음 확인이 필요한 사항

이 조사로 등록기관·네임서버·호스팅 플랫폼과 404 원인은 확인했습니다. 실제 리디렉션 적용 전에는 사용자가 Manus **Settings → Domains**에서 `www.graceway-baptist.org`를 추가할 때 어떤 DNS 값을 제시하는지 한 번 확인해야 합니다. 해당 화면의 안내를 보내 주시면, apex를 건드리지 않는 정확한 레코드 변경 여부와 최종 301 검증까지 이어서 확인할 수 있습니다.

## 참고 자료

[1] [Manus Help Center — 외부 도메인 연결 및 DNS 레코드 관리](https://help.manus.im/en/articles/11711203-how-can-i-connect-the-website-created-by-manus-to-my-custom-domain)

[2] [Manus Documentation — Custom Domains](https://manus.im/docs/website-builder/custom-domains)

[3] [Public Interest Registry RDAP — graceway-baptist.org](https://rdap.org/domain/graceway-baptist.org)
