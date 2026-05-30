# FestID Mobile

Windows에서 Swift 코드를 작성하고, Mac/Xcode 환경에서 프로젝트를 생성해 실행하는 모바일 앱 작업 공간입니다.

## Windows에서 작업

1. `apps/mobile`을 VS Code 또는 Cursor로 엽니다.
2. Swift 파일은 `Sources/FestIDMobile` 아래에서 작성합니다.
3. Figma 디자인 토큰은 `Sources/FestIDMobile/Core/Design/FestIDTheme.swift`에 먼저 반영합니다.
4. Liquid Glass 공통 처리는 `Sources/FestIDMobile/Core/Design/FestGlass.swift`에 모읍니다.

Windows에서는 iOS SDK와 SwiftUI 런타임을 사용할 수 없어서 앱 실행과 정확한 컴파일 검증은 제외합니다. 대신 코드 작성, 구조 설계, 리뷰, YAML 편집은 그대로 진행할 수 있습니다.

## Mac/Xcode에서 실행

Mac에서 한 번만 Xcode 프로젝트를 생성합니다.

```bash
cd apps/mobile
brew install xcodegen
xcodegen generate
open FestIDMobile.xcodeproj
```

Xcode에서 Signing Team을 설정한 뒤 iOS 시뮬레이터로 실행합니다. Liquid Glass API를 실제로 빌드하려면 iOS 26 SDK가 포함된 Xcode가 필요합니다.

## 구조

- `project.yml`: XcodeGen 프로젝트 정의
- `Sources/FestIDMobile/App`: 앱 엔트리와 탭 루트
- `Sources/FestIDMobile/Core/Design`: Figma 토큰, Liquid Glass 공통 컴포넌트
- `Sources/FestIDMobile/Features`: 화면 단위 SwiftUI 뷰
- `Resources`: 앱 아이콘과 리소스

## Liquid Glass 기준

SwiftUI의 `glassEffect(_:in:)`와 `GlassEffectContainer`를 기준으로 구현합니다. iOS 26 미만에서는 `Material` 기반 fallback을 사용합니다.

참고:

- https://developer.apple.com/documentation/swiftui/view/glasseffect%28_%3Ain%3A%29
- https://developer.apple.com/documentation/swiftui/glasseffectcontainer
