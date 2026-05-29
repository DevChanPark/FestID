import SwiftUI

struct TicketCardView: View {
    let eventName: String
    let venue: String
    let time: String
    let status: String

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(eventName)
                        .font(.title3.bold())
                        .foregroundStyle(FestIDTheme.Colors.ink)

                    Text(venue)
                        .font(.subheadline)
                        .foregroundStyle(FestIDTheme.Colors.mutedInk)
                }

                Spacer()

                Text(status)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(FestIDTheme.Colors.accent, in: Capsule())
            }

            HStack(spacing: 16) {
                qrPlaceholder

                VStack(alignment: .leading, spacing: 8) {
                    Label(time, systemImage: "clock.fill")
                    Label("Gate B · Row 12", systemImage: "location.fill")
                    Label("Verified ID", systemImage: "checkmark.seal.fill")
                }
                .font(.caption.weight(.medium))
                .foregroundStyle(FestIDTheme.Colors.ink)
            }
        }
        .padding(20)
        .festGlassCard()
    }

    private var qrPlaceholder: some View {
        RoundedRectangle(cornerRadius: 16, style: .continuous)
            .fill(.white.opacity(0.86))
            .frame(width: 104, height: 104)
            .overlay {
                Image(systemName: "qrcode")
                    .font(.system(size: 58, weight: .regular))
                    .foregroundStyle(FestIDTheme.Colors.ink)
            }
    }
}

#Preview {
    TicketCardView(
        eventName: "Seoul Wave Festival",
        venue: "Olympic Park",
        time: "Sat 19:30",
        status: "Ready"
    )
    .padding()
    .background(FestIDTheme.pageBackground)
}
