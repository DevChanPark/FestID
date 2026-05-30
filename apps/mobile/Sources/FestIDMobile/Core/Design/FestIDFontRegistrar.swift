import CoreText
import Foundation

enum FestIDFontRegistrar {
    static func registerFonts() {
        registerFont(named: "Knewave-Regular", fileExtension: "ttf")
    }

    private static func registerFont(named name: String, fileExtension: String) {
        guard let url = Bundle.main.url(forResource: name, withExtension: fileExtension) else {
            return
        }

        CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
    }
}
