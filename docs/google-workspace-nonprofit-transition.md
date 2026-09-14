# Google Workspace → Google Workspace for Nonprofits 전환 안내

## 결론

미국에서 아직 IRS 501(c)(3) 등록을 준비 중인 교회는 지금 일반 Google Workspace를 시작할 수 있다. 다만 Google for Nonprofits 자격은 원칙적으로 IRS 501(c)(3) 면세 등록 또는 501(c)(3) 중앙 단체와의 입증 가능한 group exemption affiliation을 요구한다. 자격 확인 및 Goodstack 검증이 완료된 뒤에는 기존 유료 Google Workspace를 **Google Workspace for Nonprofits**로 전환할 수 있다.

Google의 공식 절차는 유료 계정을 먼저 **Business Starter**로 전환한 뒤 Google Workspace 지원팀에 Nonprofits 전환을 요청하는 방식이다. Google은 지원 요청 후 전환에 약 5일이 걸릴 수 있고, Business Starter 사용 기간에는 사용자 수에 비례해 일할 계산된 표준 요금이 청구된다고 안내한다.

## 권장 순서

1. 지금은 **Google Workspace Business Starter Flexible Plan**으로 `graceway-baptist.org`를 등록한다. 장기 약정을 피하고 501(c)(3) 승인 전 필요한 `info@graceway-baptist.org`를 운영할 수 있다.
2. Google Admin에서 도메인을 확인하고 Google이 제공한 Gmail용 MX, SPF, DKIM 레코드를 Manus DNS 관리 화면에 추가한다. 웹사이트 A 레코드와 www 레코드는 변경하지 않는다.
3. `info@graceway-baptist.org` 사용자와 최소 두 명의 별도 관리자 계정을 만들고 2단계 인증 및 복구 정보를 설정한다.
4. 501(c)(3) 승인 후 [Google for Nonprofits](https://www.google.com/nonprofits/)에 신청한다. Goodstack의 확인 과정은 보통 2–14 영업일이 걸릴 수 있다.
5. 승인되면 필요하면 Business Starter로 조정한 뒤 Google Workspace 지원팀에 같은 조직·도메인의 Nonprofits 전환을 요청한다. 새 도메인이나 새 Workspace를 만들지 않고 기존 계정을 전환하는 것이 메일 주소·사용자·Drive 자료 연속성 측면에서 안전하다.

## 전환 전 확인

계정 플랜을 낮추기 전에는 조직의 현재 저장공간 사용량이 새 한도 안에 들어오는지 Google Admin의 Storage 화면에서 확인한다. 사용량이 한도를 넘으면 기존 자료는 즉시 삭제되지 않지만 Gmail 송수신과 Drive 업로드·생성에 제한이 생길 수 있다. DMARC는 SPF와 DKIM이 정상 인증되는 것을 확인한 뒤 `p=none`으로 시작한다.

## 도메인 소유 인증이 바로 완료되지 않을 때

Google Workspace가 TXT 인증을 처음 거부하더라도, 웹사이트의 A 레코드나 www 레코드를 변경하지 않는다. DNS 관리 화면에서 TXT 레코드의 Name이 `@` 또는 빈 기본값이고, Value가 `google-site-verification=`으로 시작하는 Google 제공 전체 문자열인지 확인한다. 공개 DNS 확인기에서 해당 값이 보이면 레코드는 올바르게 게시된 것이다.

Google은 새 TXT 레코드가 인터넷 전반에서 인식되는 데 최대 72시간이 걸릴 수 있다고 안내한다. 첫 오류는 전파 또는 가입 흐름의 일시적 검사 지연일 수 있으므로, 같은 인증 코드를 유지한 채 Google Workspace 화면에서 다시 시도한다. Google의 별도 실패 안내는 최대 48시간 대기를 우선 권장한다. 48시간이 지난 뒤에도 공개 DNS에 정확한 값이 보이는데 인증이 실패하면 Google Workspace 지원팀에 가입 계정과 도메인을 제시해 검증 재확인을 요청한다.

## 공식 근거

- [Google for Nonprofits 미국 자격 요건](https://support.google.com/nonprofits/answer/3215869?hl=en&co=GENIE.CountryCode%3DUS)
- [유료 Workspace에서 Nonprofits로 전환](https://support.google.com/nonprofits/answer/9755368?hl=en)
- [Google for Nonprofits 시작 절차](https://support.google.com/nonprofits/answer/3367631?hl=en)
- [Nonprofits Workspace 제공 내용과 현재 비영리 요금](https://www.google.com/nonprofits/offerings/workspace/)
- [Business Starter 전환 전 저장공간·데이터 유의사항](https://knowledge.workspace.google.com/admin/billing/switch-to-business-starter-edition)
- [TXT 레코드로 도메인 소유 확인](https://knowledge.workspace.google.com/admin/domains/verify-your-domain-with-a-txt-record)
- [도메인 인증 실패 문제 해결](https://knowledge.workspace.google.com/admin/support/troubleshooting/my-domain-verification-failed)
