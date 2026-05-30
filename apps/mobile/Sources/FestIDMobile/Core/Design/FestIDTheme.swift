import SwiftUI

enum FestIDTheme {
    enum Colors {
        static let primary = Color(red: 0.00, green: 0.59, blue: 0.81)
        static let accent = Color(red: 0.00, green: 0.68, blue: 0.58)
        static let warning = Color(red: 1.00, green: 0.58, blue: 0.18)
        static let ink = Color(red: 0.08, green: 0.10, blue: 0.14)
        static let mutedInk = Color(red: 0.39, green: 0.43, blue: 0.50)
        static let surface = Color(red: 0.96, green: 0.98, blue: 1.00)
    }

    enum Radius {
        static let card: CGFloat = 28
        static let control: CGFloat = 18
        static let pill: CGFloat = 999
    }

    enum Spacing {
        static let page: CGFloat = 20
        static let section: CGFloat = 24
        static let item: CGFloat = 12
    }

    static var pageBackground: some ShapeStyle {
        LinearGradient(
            colors: [
                Color(red: 0.94, green: 0.98, blue: 1.00),
                Color(red: 0.96, green: 0.96, blue: 1.00),
                Color(red: 1.00, green: 0.98, blue: 0.93)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}
