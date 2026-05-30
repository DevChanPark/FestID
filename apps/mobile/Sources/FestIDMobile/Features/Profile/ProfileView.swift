import SwiftUI

struct ProfileView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 18) {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 78))
                    .foregroundStyle(FestIDTheme.Colors.primary)

                VStack(spacing: 6) {
                    Text("Guest Profile")
                        .font(.title3.bold())
                        .foregroundStyle(FestIDTheme.Colors.ink)

                    Text("Identity and notification settings")
                        .font(.subheadline)
                        .foregroundStyle(FestIDTheme.Colors.mutedInk)
                }

                VStack(spacing: 10) {
                    settingsRow(title: "Identity", icon: "checkmark.seal.fill")
                    settingsRow(title: "Notifications", icon: "bell.fill")
                    settingsRow(title: "Privacy", icon: "lock.fill")
                }
            }
            .padding(FestIDTheme.Spacing.page)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .background(FestIDTheme.pageBackground)
            .navigationTitle("Profile")
        }
    }

    private func settingsRow(title: String, icon: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(FestIDTheme.Colors.primary)
                .frame(width: 28)

            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(FestIDTheme.Colors.ink)

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption.weight(.bold))
                .foregroundStyle(FestIDTheme.Colors.mutedInk)
        }
        .padding(16)
        .festGlassCard(in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

#Preview {
    ProfileView()
}
