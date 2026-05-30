import SwiftUI

struct TicketsView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    TicketCardView(
                        eventName: "Seoul Wave Festival",
                        venue: "Olympic Park",
                        time: "Sat 19:30",
                        status: "Ready"
                    )

                    TicketCardView(
                        eventName: "Busan Night Stage",
                        venue: "Cinema Center",
                        time: "Sun 20:00",
                        status: "Pending"
                    )
                }
                .padding(FestIDTheme.Spacing.page)
            }
            .background(FestIDTheme.pageBackground)
            .navigationTitle("Tickets")
        }
    }
}

#Preview {
    TicketsView()
}
