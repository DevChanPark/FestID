import SwiftUI

struct CamPassRootView: View {
    @State private var selectedTab: CamPassTab = .home

    var body: some View {
        TabView(selection: $selectedTab) {
            Tab(CamPassHomeView.Copy.home, systemImage: "house.fill", value: CamPassTab.home) {
                NavigationStack {
                    CamPassHomeView()
                }
            }

            Tab(CamPassHomeView.Copy.festival, systemImage: "building.columns.fill", value: CamPassTab.festival) {
                NavigationStack {
                    FestivalListView()
                }
            }

            Tab(CamPassHomeView.Copy.user, systemImage: "person", value: CamPassTab.user) {
                NavigationStack {
                    CamPassUserView()
                }
            }

            Tab("검색", systemImage: "magnifyingglass", value: CamPassTab.search, role: .search) {
                NavigationStack {
                    CamPassSearchView()
                }
            }
        }
        .tint(Color(hex: 0x0088FF))
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
    }
}

struct CamPassHomeView: View {
    private static let posterWidth: CGFloat = 220
    private static let posterHeight: CGFloat = 293

    private let posters = FestivalPoster.localPosters

    enum Copy {
        static let brand = "CamPass"
        static let popular = "\u{C9C0}\u{AE08} \u{C778}\u{AE30}"
        static let myFestival = "\u{B098}\u{C758} \u{CD95}\u{C81C}"
        static let myFestivalCaption = "\u{C785}\u{C7A5}\u{AD8C}\u{BD80}\u{D130} \u{AD7F}\u{C988} \u{AD50}\u{D658}\u{AD8C}\u{AE4C}\u{C9C0} \u{D55C} \u{BC88}\u{C5D0} \u{D655}\u{C778}\u{D574}\u{BCF4}\u{C138}\u{C694}."
        static let nearby = "\u{ADFC}\u{CC98} \u{CD95}\u{C81C} \u{BAA8}\u{C74C}"
        static let nearbyCaption = "\u{AC00}\u{AE4C}\u{C6B4} \u{AC70}\u{B9AC} \u{C21C}\u{C73C}\u{B85C} \u{CD94}\u{CC9C}\u{D574}\u{B4DC}\u{B824}\u{C694}."
        static let home = "\u{D648}"
        static let festival = "\u{CD95}\u{C81C}"
        static let user = "\u{C720}\u{C800}"
    }

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .bottom) {
                Color(hex: 0xE6E6ED)
                    .ignoresSafeArea()

                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text(Copy.brand)
                            .font(.custom(FestIDTheme.Fonts.brand, size: 29.243))
                            .foregroundStyle(Color(hex: 0x0097CE))
                            .padding(.top, 62)

                        sectionTitle(Copy.popular)
                            .padding(.top, 25)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(alignment: .top, spacing: 16) {
                                ForEach(Array(posters.enumerated()), id: \.offset) { index, poster in
                                    NavigationLink {
                                        festivalDetailView(for: poster, index: index)
                                    } label: {
                                        posterColumn(title: poster.title, poster: poster.style, fillsPoster: true)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                        .padding(.top, 8)
                        .contentMargins(.horizontal, 20, for: .scrollContent)
                        .scrollClipDisabled()
                        .padding(.horizontal, -20)

                        HStack(spacing: 4) {
                            sectionTitle(Copy.myFestival)
                            Image(systemName: "chevron.right")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(Color(hex: 0x727272))
                        }
                        .padding(.top, 39)

                        Text(Copy.myFestivalCaption)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(Color(hex: 0x727272))
                            .lineLimit(1)
                            .padding(.top, 8)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                FestivalPosterCard(style: .greenWide)
                                    .frame(width: 246, height: 104)
                                    .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
                                FestivalPosterCard(style: .orangeWide)
                                    .frame(width: 246, height: 104)
                                    .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
                            }
                        }
                        .padding(.top, 8)

                        HStack(spacing: 4) {
                            sectionTitle(Copy.nearby)
                            Image(systemName: "chevron.right")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(Color(hex: 0x727272))
                        }
                        .padding(.top, 39)

                        Text(Copy.nearbyCaption)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(Color(hex: 0x727272))
                            .lineLimit(1)
                            .padding(.top, 8)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(alignment: .top, spacing: 16) {
                                ForEach(Array(posters.enumerated()), id: \.offset) { index, poster in
                                    NavigationLink {
                                        festivalDetailView(for: poster, index: index)
                                    } label: {
                                        FestivalPosterCard(style: poster.style, fillsImage: true)
                                            .frame(width: Self.posterWidth, height: Self.posterHeight)
                                            .fixedSize()
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                        .padding(.top, 8)
                        .contentMargins(.horizontal, 20, for: .scrollContent)
                        .scrollClipDisabled()
                        .padding(.horizontal, -20)
                        .padding(.bottom, 138)
                    }
                    .padding(.horizontal, 20)
                    .frame(width: proxy.size.width, alignment: .leading)
                }
            }
        }
        .ignoresSafeArea(edges: .top)
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
    }

    private func sectionTitle(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 20, weight: .bold))
            .tracking(-0.45)
            .foregroundStyle(Color(hex: 0x373742))
            .frame(height: 25, alignment: .leading)
    }

    private func posterColumn(title: String, poster: FestivalPosterStyle, fillsPoster: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color(hex: 0x727272))
                .lineLimit(1)

            FestivalPosterCard(style: poster, fillsImage: fillsPoster)
                .frame(width: Self.posterWidth, height: Self.posterHeight)
                .fixedSize()
        }
        .frame(width: Self.posterWidth, alignment: .leading)
        .fixedSize(horizontal: true, vertical: false)
    }

    private func festivalDetailView(for poster: FestivalPoster, index: Int) -> FestivalDetailView {
        FestivalDetailView(festivalTitle: poster.title, hasIssuedPass: index == 1 ? false : true, posterStyle: poster.style)
    }
}

enum CamPassTab: Hashable {
    case home
    case festival
    case user
    case search
}

private struct CamPassUserView: View {
    var body: some View {
        Color(hex: 0xE6E6ED)
            .ignoresSafeArea()
    }
}

private struct CamPassSearchView: View {
    var body: some View {
        Color(hex: 0xE6E6ED)
            .ignoresSafeArea()
    }
}

struct FestivalPosterCard: View {
    let style: FestivalPosterStyle
    var fillsImage = false

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                if let posterImage {
                    if !fillsImage {
                        Color(hex: 0xF4F4F6)
                    }

                    Image(uiImage: posterImage)
                        .resizable()
                        .aspectRatio(contentMode: fillsImage ? .fill : .fit)
                        .frame(width: proxy.size.width, height: proxy.size.height)
                } else {
                    RoundedRectangle(cornerRadius: 15, style: .continuous)
                        .fill(style.background)

                    style.accent

                    VStack(alignment: .leading) {
                        Text(style.date)
                            .font(.system(size: style.isWide ? 10 : 17, weight: .bold, design: .rounded))
                            .foregroundStyle(.white.opacity(0.88))
                            .lineSpacing(-2)

                        Spacer()

                        Text(style.title)
                            .font(.system(size: style.isWide ? 24 : 42, weight: .black, design: .rounded))
                            .foregroundStyle(.white.opacity(0.86))
                            .rotationEffect(.degrees(style.titleRotation))
                            .shadow(color: .black.opacity(0.18), radius: 4, x: 0, y: 2)

                        Text(style.subtitle)
                            .font(.system(size: style.isWide ? 9 : 12, weight: .bold))
                            .foregroundStyle(.white.opacity(0.78))
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
        .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
        .contentShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
    }

    private var posterImage: UIImage? {
        guard let imageName = style.imageName else {
            return nil
        }

        if let image = UIImage(named: imageName) {
            return image
        }

        if let image = imageFromBundle(named: imageName) {
            return image
        }

        return imageFromBundle(named: imageName, subdirectory: "images")
    }

    private func imageFromBundle(named imageName: String, subdirectory: String? = nil) -> UIImage? {
        guard let url = Bundle.main.url(
            forResource: imageName,
            withExtension: "jpg",
            subdirectory: subdirectory
        ) else {
            return nil
        }

        return UIImage(contentsOfFile: url.path)
    }
}

struct FestivalPoster: Identifiable {
    let title: String
    let style: FestivalPosterStyle

    var id: String {
        title
    }

    static var localPosters: [FestivalPoster] {
        let urls = resourceURLs(in: nil) + resourceURLs(in: "images")
        let uniqueURLs = Dictionary(grouping: urls, by: \.lastPathComponent)
            .compactMap { $0.value.first }

        let posters: [FestivalPoster] = uniqueURLs.map { url in
            let imageName = url.deletingPathExtension().lastPathComponent
            let title = imageName.precomposedStringWithCanonicalMapping
            return FestivalPoster(title: title, style: .image(name: imageName))
        }
        .sorted { (lhs: FestivalPoster, rhs: FestivalPoster) -> Bool in
            lhs.title.localizedStandardCompare(rhs.title) == .orderedAscending
        }

        if posters.isEmpty {
            return (1...7).map { index in
                let title = "image\(index)"
                return FestivalPoster(title: title, style: .image(name: title))
            }
        }

        return posters
    }

    private static func resourceURLs(in subdirectory: String?) -> [URL] {
        Bundle.main.urls(forResourcesWithExtension: "jpg", subdirectory: subdirectory) ?? []
    }
}

enum FestivalPosterStyle {
    case ainesLarge
    case violetLarge
    case greenWide
    case orangeWide
    case image(name: String)

    var imageName: String? {
        if case let .image(name) = self {
            return name
        }

        return nil
    }

    var isWide: Bool {
        switch self {
        case .greenWide, .orangeWide:
            return true
        case .ainesLarge, .violetLarge, .image:
            return false
        }
    }

    var date: String {
        switch self {
        case .ainesLarge, .greenWide:
            return "05\n21\n-\n05\n23"
        case .violetLarge:
            return "Sep 25-26"
        case .orangeWide:
            return "2025"
        case .image:
            return ""
        }
    }

    var title: String {
        switch self {
        case .ainesLarge:
            return "AINES"
        case .violetLarge:
            return "Etern"
        case .greenWide:
            return "Festival"
        case .orangeWide:
            return "Stage"
        case .image:
            return ""
        }
    }

    var subtitle: String {
        switch self {
        case .ainesLarge:
            return "2025 K.W. FESTIVAL"
        case .violetLarge:
            return "Dreams Chic Violet"
        case .greenWide:
            return "MY PASS"
        case .orangeWide:
            return "LINE UP"
        case .image:
            return ""
        }
    }

    var titleRotation: Double {
        switch self {
        case .ainesLarge:
            return -13
        case .violetLarge, .greenWide, .orangeWide, .image:
            return 0
        }
    }

    var background: LinearGradient {
        switch self {
        case .ainesLarge:
            return LinearGradient(
                colors: [Color(hex: 0x233C18), Color(hex: 0x7EA337), Color(hex: 0x2A461E)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .violetLarge:
            return LinearGradient(
                colors: [Color(hex: 0xD8C8FF), Color(hex: 0x9179D8), Color(hex: 0xEFE9FF)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .greenWide:
            return LinearGradient(
                colors: [Color(hex: 0xCFEA26), Color(hex: 0x16A34A), Color(hex: 0xE5FF56)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .orangeWide:
            return LinearGradient(
                colors: [Color(hex: 0xF6B27A), Color(hex: 0xF7D2B8), Color(hex: 0xFFF4E8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .image:
            return LinearGradient(
                colors: [Color(hex: 0xD9D9E1), Color(hex: 0xEFEFF4)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    @ViewBuilder
    var accent: some View {
        switch self {
        case .ainesLarge, .greenWide:
            Circle()
                .fill(.white.opacity(0.18))
                .frame(width: isWide ? 160 : 210, height: isWide ? 160 : 210)
                .blur(radius: 8)
                .offset(x: isWide ? 80 : 48, y: isWide ? -18 : -35)

            ForEach(0..<18, id: \.self) { index in
                Circle()
                    .fill(.white.opacity(index.isMultiple(of: 3) ? 0.42 : 0.16))
                    .frame(width: CGFloat(3 + (index % 4)), height: CGFloat(3 + (index % 4)))
                    .position(
                        x: CGFloat((index * 37) % 220),
                        y: CGFloat((index * 53) % (isWide ? 104 : 293))
                    )
            }
        case .violetLarge:
            Circle()
                .fill(.white.opacity(0.40))
                .frame(width: 190, height: 190)
                .blur(radius: 6)
                .offset(x: 42, y: -44)

            Circle()
                .stroke(.white.opacity(0.55), lineWidth: 2)
                .frame(width: 160, height: 160)
                .rotationEffect(.degrees(26))
                .offset(x: 22, y: -20)

            Circle()
                .fill(Color(hex: 0x836AD5).opacity(0.55))
                .frame(width: 42, height: 42)
                .offset(x: -58, y: -38)
        case .orangeWide:
            Circle()
                .stroke(.white.opacity(0.55), lineWidth: 2)
                .frame(width: 158, height: 158)
                .offset(x: 90, y: -60)

            Circle()
                .fill(.white.opacity(0.28))
                .frame(width: 110, height: 110)
                .blur(radius: 4)
                .offset(x: -54, y: 34)
        case .image:
            EmptyView()
        }
    }
}

#Preview {
    CamPassHomeView()
}
