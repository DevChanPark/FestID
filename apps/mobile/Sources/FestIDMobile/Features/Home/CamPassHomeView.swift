import SwiftUI

struct CamPassHomeView: View {
    @State private var isFestivalTabPresented = false

    enum Copy {
        static let brand = "CamPass"
        static let popular = "\u{C9C0}\u{AE08} \u{C778}\u{AE30}"
        static let festivalName = "\u{AD11}\u{C6B4}\u{B300}\u{D559}\u{AD50} \u{B300}\u{B3D9}\u{C81C}"
        static let myFestival = "\u{B098}\u{C758} \u{CD95}\u{C81C}"
        static let myFestivalCaption = "\u{C785}\u{C7A5}\u{AD8C}\u{BD80}\u{D130} \u{AD7F}\u{C988} \u{AD50}\u{D658}\u{AD8C}\u{AE4C}\u{C9C0} \u{D55C} \u{BC88}\u{C5D0} \u{D655}\u{C778}\u{D574}\u{BCF4}\u{C138}\u{C694}."
        static let nearby = "\u{ADFC}\u{CC98} \u{CD95}\u{C81C} \u{BAA8}\u{C74C}"
        static let nearbyCaption = "\u{AC00}\u{AE4C}\u{C6B4} \u{AC70}\u{B9AC} \u{C21C}\u{C73C}\u{B85C} \u{CD94}\u{CC9C}\u{D574}\u{B4DC}\u{B824}\u{C694}."
        static let home = "\u{D648}"
        static let festival = "\u{CD95}\u{C81C}"
        static let user = "\u{C720}\u{C800}"
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color(hex: 0xE6E6ED)
                .ignoresSafeArea()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(Copy.brand)
                        .font(.system(size: 29.243, weight: .black, design: .rounded))
                        .italic()
                        .foregroundStyle(Color(hex: 0x0097CE))
                        .padding(.top, 62)

                    sectionTitle(Copy.popular)
                        .padding(.top, 25)

                    HStack(alignment: .top, spacing: 16) {
                        NavigationLink {
                            FestivalDetailView()
                        } label: {
                            posterColumn(title: Copy.festivalName, poster: .ainesLarge)
                        }
                        .buttonStyle(.plain)

                        NavigationLink {
                            FestivalDetailView(hasIssuedPass: false)
                        } label: {
                            posterColumn(title: Copy.festivalName, poster: .violetLarge)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, 8)

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
                            FestivalPosterCard(style: .orangeWide)
                                .frame(width: 246, height: 104)
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

                    HStack(alignment: .top, spacing: 16) {
                        NavigationLink {
                            FestivalDetailView()
                        } label: {
                            FestivalPosterCard(style: .ainesLarge)
                                .frame(width: 220, height: 216)
                        }
                        .buttonStyle(.plain)

                        NavigationLink {
                            FestivalDetailView(hasIssuedPass: false)
                        } label: {
                            FestivalPosterCard(style: .violetLarge)
                                .frame(width: 220, height: 216)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, 8)
                    .padding(.bottom, 138)
                }
                .padding(.horizontal, 20)
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            CamPassTabBar(selectedTab: .home) { tab in
                if tab == .festival {
                    isFestivalTabPresented = true
                }
            }
                .padding(.bottom, 34)
        }
        .navigationDestination(isPresented: $isFestivalTabPresented) {
            FestivalListView()
        }
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

    private func posterColumn(title: String, poster: FestivalPosterStyle) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color(hex: 0x727272))
                .lineLimit(1)

            FestivalPosterCard(style: poster)
                .frame(width: 220, height: 293)
        }
        .frame(width: 220, alignment: .leading)
    }
}

enum CamPassTab {
    case home
    case festival
    case user
}

struct CamPassTabBar: View {
    let selectedTab: CamPassTab
    let onSelect: (CamPassTab) -> Void

    var body: some View {
        HStack(spacing: 16) {
            HStack(spacing: 25) {
                Button {
                    onSelect(.home)
                } label: {
                    tabItem(title: CamPassHomeView.Copy.home, systemImage: "house.fill", isSelected: selectedTab == .home)
                        .frame(width: selectedTab == .home ? 106 : 64, height: 54)
                        .background(selectedTab == .home ? Color(hex: 0xE4E4E4) : Color.clear, in: Capsule())
                }
                .buttonStyle(.plain)

                Button {
                    onSelect(.festival)
                } label: {
                    tabItem(title: CamPassHomeView.Copy.festival, systemImage: "building.columns.fill", isSelected: selectedTab == .festival)
                        .frame(width: selectedTab == .festival ? 106 : 64, height: 54)
                        .background(selectedTab == .festival ? Color(hex: 0xE4E4E4) : Color.clear, in: Capsule())
                }
                .buttonStyle(.plain)

                Button {
                    onSelect(.user)
                } label: {
                    tabItem(title: CamPassHomeView.Copy.user, systemImage: "person", isSelected: selectedTab == .user)
                        .frame(width: selectedTab == .user ? 106 : 64, height: 54)
                        .background(selectedTab == .user ? Color(hex: 0xE4E4E4) : Color.clear, in: Capsule())
                }
                .buttonStyle(.plain)
            }
            .frame(width: 290, height: 62)
            .background(.white.opacity(0.72), in: Capsule())
            .festGlassCard(in: Capsule())

            Button(action: {}) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 27, weight: .medium))
                    .foregroundStyle(Color(hex: 0x1A1A1A))
                    .frame(width: 62, height: 62)
            }
            .buttonStyle(.plain)
            .background(.white.opacity(0.72), in: Circle())
            .festGlassCard(in: Circle())
        }
        .frame(maxWidth: .infinity)
    }

    private func tabItem(title: String, systemImage: String, isSelected: Bool) -> some View {
        VStack(spacing: 2) {
            Image(systemName: systemImage)
                .font(.system(size: 21, weight: .semibold))
                .frame(height: 26)

            Text(title)
                .font(.system(size: 10, weight: .semibold))
                .frame(height: 12)
        }
        .foregroundStyle(isSelected ? Color(hex: 0x0088FF) : Color(hex: 0x1A1A1A))
    }
}

struct FestivalPosterCard: View {
    let style: FestivalPosterStyle

    var body: some View {
        ZStack {
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
        .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
    }
}

enum FestivalPosterStyle {
    case ainesLarge
    case violetLarge
    case greenWide
    case orangeWide

    var isWide: Bool {
        switch self {
        case .greenWide, .orangeWide:
            return true
        case .ainesLarge, .violetLarge:
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
        }
    }

    var titleRotation: Double {
        switch self {
        case .ainesLarge:
            return -13
        default:
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
        }
    }
}

#Preview {
    CamPassHomeView()
}
