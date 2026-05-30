import SwiftUI

struct HomeView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: FestIDTheme.Spacing.section) {
                    header
                    activePass
                    quickActions
                    upcomingSection
                }
                .padding(FestIDTheme.Spacing.page)
            }
            .background(FestIDTheme.pageBackground)
            .navigationTitle("FestID")
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("오늘의 입장 준비")
                .font(.title.bold())
                .foregroundStyle(FestIDTheme.Colors.ink)

            Text("티켓, 신분 확인, 현장 알림을 한 화면에서 관리합니다.")
                .font(.subheadline)
                .foregroundStyle(FestIDTheme.Colors.mutedInk)
        }
    }

    private var activePass: some View {
        TicketCardView(
            eventName: "Seoul Wave Festival",
            venue: "Olympic Park",
            time: "Sat 19:30",
            status: "Ready"
        )
    }

    @ViewBuilder
    private var quickActions: some View {
        if #available(iOS 26.0, *) {
            GlassEffectContainer(spacing: 12) {
                actionRow
            }
        } else {
            actionRow
        }
    }

    private var actionRow: some View {
        HStack(spacing: 12) {
            GlassPillButton(title: "Scan", systemImage: "qrcode.viewfinder") {}
            GlassPillButton(title: "Share", systemImage: "square.and.arrow.up") {}
            GlassPillButton(title: "Help", systemImage: "questionmark.circle") {}
        }
    }

    private var upcomingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Upcoming")
                .font(.headline)
                .foregroundStyle(FestIDTheme.Colors.ink)

            VStack(spacing: 10) {
                eventRow(title: "Busan Night Stage", subtitle: "May 31 · 20:00")
                eventRow(title: "Indie Garden", subtitle: "Jun 8 · 18:30")
            }
        }
    }

    private func eventRow(title: String, subtitle: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "music.mic")
                .font(.headline)
                .foregroundStyle(.white)
                .frame(width: 42, height: 42)
                .background(FestIDTheme.Colors.primary, in: Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(FestIDTheme.Colors.ink)

                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(FestIDTheme.Colors.mutedInk)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption.weight(.bold))
                .foregroundStyle(FestIDTheme.Colors.mutedInk)
        }
        .padding(14)
        .festGlassCard(in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

#Preview {
    HomeView()
}
