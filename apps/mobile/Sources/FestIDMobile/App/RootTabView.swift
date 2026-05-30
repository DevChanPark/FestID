import SwiftUI

struct RootTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }

            TicketsView()
                .tabItem {
                    Label("Tickets", systemImage: "ticket.fill")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.crop.circle.fill")
                }
        }
        .tint(FestIDTheme.Colors.primary)
    }
}

#Preview {
    RootTabView()
}
