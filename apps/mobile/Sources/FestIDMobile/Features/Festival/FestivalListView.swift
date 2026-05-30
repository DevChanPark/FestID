import SwiftUI

struct FestivalListView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedStatus = 1

    enum Copy {
        static let brand = "CamPass"
        static let title = "\u{C5B4}\u{B5A4} \u{CD95}\u{C81C}\u{C5D0} \u{AC08}\u{AE4C}\u{C694}?"
        static let subtitle = "\u{C9C4}\u{D589} \u{C911}\u{C774}\u{AC70}\u{B098} \u{ACE7} \u{C2DC}\u{C791}\u{B420} \u{CD95}\u{C81C}\u{B97C} \u{D55C}\u{B208}\u{C5D0} \u{D655}\u{C778}\u{D558}\u{C138}\u{C694}."
        static let active = "\u{C9C4}\u{D589} \u{C911}"
        static let upcoming = "\u{C9C4}\u{D589} \u{C608}\u{C815}"
        static let done = "\u{C9C4}\u{D589} \u{C644}\u{B8CC}"
        static let festivalTitle = "2026 AINE : \u{C870}\u{AC01}"
        static let venue = "\u{AD11}\u{C6B4}\u{B300}\u{D559}\u{AD50}"
        static let date = "May 26 - May 29"
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color(hex: 0xE6E6ED)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                Text(Copy.brand)
                    .font(.system(size: 29.243, weight: .black, design: .rounded))
                    .italic()
                    .foregroundStyle(Color(hex: 0x0097CE))
                    .padding(.top, 62)
                    .padding(.leading, 20)

                Text(Copy.title)
                    .font(.system(size: 20, weight: .bold))
                    .tracking(-0.45)
                    .foregroundStyle(Color(hex: 0x373742))
                    .frame(maxWidth: .infinity)
                    .padding(.top, 40)

                Text(Copy.subtitle)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(Color(hex: 0x727272))
                    .frame(maxWidth: .infinity)
                    .padding(.top, 12)

                statusControl
                    .padding(.top, 31)
                    .padding(.horizontal, 20)

                LazyVGrid(
                    columns: [
                        GridItem(.fixed(172.865), spacing: 16.27),
                        GridItem(.fixed(172.865), spacing: 0)
                    ],
                    alignment: .leading,
                    spacing: 16
                ) {
                    NavigationLink {
                        FestivalDetailView()
                    } label: {
                        FestivalListCard(style: .ainesLarge)
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        FestivalDetailView(hasIssuedPass: false)
                    } label: {
                        FestivalListCard(style: .violetLarge)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 36)
                .padding(.horizontal, 20)

                Spacer()
            }

            CamPassTabBar(selectedTab: .festival) { tab in
                if tab == .home {
                    dismiss()
                }
            }
            .padding(.bottom, 34)
        }
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var statusControl: some View {
        HStack(spacing: 4) {
            statusSegment(title: Copy.active, index: 0)
            statusSegment(title: Copy.upcoming, index: 1)
            statusSegment(title: Copy.done, index: 2)
        }
        .padding(2)
        .frame(height: 43)
        .background(Color(hex: 0x767680, alpha: 0.12), in: Capsule())
    }

    private func statusSegment(title: String, index: Int) -> some View {
        Button {
            selectedStatus = index
        } label: {
            Text(title)
                .font(.system(size: 13.333, weight: selectedStatus == index ? .semibold : .medium))
                .tracking(-0.08)
                .foregroundStyle(Color(hex: 0x000000))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(selectedStatus == index ? Color.white : Color.clear, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct FestivalListCard: View {
    let style: FestivalPosterStyle

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            FestivalPosterCard(style: style)
                .frame(width: 172.865, height: 230.225)

            VStack(alignment: .leading, spacing: 3) {
                Text(FestivalListView.Copy.festivalTitle)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(1)

                HStack(spacing: 3) {
                    Image(systemName: "mappin")
                        .font(.system(size: 10, weight: .medium))
                    Text(FestivalListView.Copy.venue)
                        .font(.system(size: 12, weight: .medium))
                }
                .foregroundStyle(.white)

                Text(FestivalListView.Copy.date)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(Color(hex: 0xBFBFBF))
            }
            .padding(.leading, 12)
            .padding(.bottom, 11)
            .frame(width: 173, height: 83, alignment: .leading)
            .background(.black.opacity(0.05))
            .background(.ultraThinMaterial)
            .clipShape(
                UnevenRoundedRectangle(
                    topLeadingRadius: 0,
                    bottomLeadingRadius: 11.786,
                    bottomTrailingRadius: 11.786,
                    topTrailingRadius: 0,
                    style: .continuous
                )
            )
        }
        .frame(width: 172.865, height: 230.225)
        .clipShape(RoundedRectangle(cornerRadius: 11.786, style: .continuous))
    }
}

#Preview {
    NavigationStack {
        FestivalListView()
    }
}
