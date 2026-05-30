import SwiftUI

@main
struct FestIDApp: App {
    init() {
        FestIDFontRegistrar.registerFonts()
    }

    var body: some Scene {
        WindowGroup {
            OnboardingStartView()
        }
    }
}
