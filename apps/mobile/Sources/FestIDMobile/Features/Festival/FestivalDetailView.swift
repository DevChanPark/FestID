import SwiftUI

struct FestivalDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let festivalTitle: String
    let hasIssuedPass: Bool
    let passKind: FestivalPassKind
    let posterStyle: FestivalPosterStyle?

    @State private var selectedTab = 0
    @State private var showsQRCode = false
    @State private var isQueueSheetPresented = false
    @State private var isQueueSheetExpanded = false
    @State private var selectedQueueTicket = false
    @State private var selectedQueueDate = false

    enum Copy {
        static let title = "\u{AD11}\u{C6B4}\u{B300}\u{D559}\u{AD50} 2025 AINES:\u{C18C}\u{C6D0}"
        static let pass = "\u{D328}\u{C2A4}"
        static let queue = "\u{C6D0}\u{ACA9} \u{C904}\u{C11C}\u{AE30}"
        static let info = "\u{CD95}\u{C81C}\u{C815}\u{BCF4}"
        static let passTitle = "\u{D328}\u{C2A4} \u{D655}\u{C778}"
        static let passHint = "\u{D328}\u{C2A4}\u{B97C} \u{B204}\u{B974}\u{BA74} \u{D050}\u{C54C}\u{C774} \u{BCF4}\u{C5EC}\u{C694}."
        static let day = "DAY 1"
        static let qr = "QR"
        static let close = "\u{B2EB}\u{AE30}"
        static let missingPassTitle = "\u{C557} \u{C544}\u{C9C1} \u{D328}\u{C2A4}\u{AC00} \u{C5C6}\u{B124}\u{C694}!"
        static let missingPassHint = "\u{C544}\u{B798} \u{D50C}\u{B7EC}\u{C2A4} \u{BC84}\u{D2BC}\u{C744} \u{B20C}\u{B7EC} \u{D328}\u{C2A4}\u{B97C} \u{CD94}\u{AC00}\u{D558}\u{C138}\u{C694}."
        static let queueTitle = "\u{D604}\u{C7AC} \u{B300}\u{AE30} \u{D604}\u{D669}"
        static let queueHint = "\u{C785}\u{C7A5}\u{AD8C} \u{C720}\u{D615}\u{BCC4} \u{B300}\u{AE30} \u{D604}\u{D669}\u{C744} \u{D655}\u{C778}\u{D558}\u{C138}\u{C694}."
        static let timetableTitle = "\u{ACF5}\u{C5F0} \u{D0C0}\u{C784}\u{D14C}\u{C774}\u{BE14}"
        static let timetableHint = "\u{C624}\u{B298} \u{C9C4}\u{D589}\u{B418}\u{B294} \u{ACF5}\u{C5F0} \u{C21C}\u{C11C}\u{B97C} \u{D655}\u{C778}\u{D558}\u{C138}\u{C694}."
        static let waiting = "\u{B300}\u{AE30}\u{C911}"
        static let waitingCount = "256\u{BA85}"
        static let waitTime = "\u{C608}\u{C0C1} \u{B300}\u{AE30} \u{C2DC}\u{AC04} \u{C57D} 25\u{BD84}"
        static let queueSheetTitle = "\u{C904}\u{C11C}\u{AE30}"
        static let ticketTypeTitle = "\u{C785}\u{C7A5}\u{AD8C} \u{C720}\u{D615}"
        static let studentTicket = "\u{C7AC}\u{D559}\u{C0DD} \u{C785}\u{C7A5}\u{AD8C}"
        static let ticketCaption = "\u{C120}\u{D0DD}\u{D55C} \u{C785}\u{C7A5}\u{AD8C} \u{C720}\u{D615}\u{C5D0} \u{B530}\u{B77C} \u{B300}\u{AE30}\u{C5F4}\u{C774} \u{B2EC}\u{B77C}\u{C838}\u{C694}."
        static let dateTitle = "\u{B0A0}\u{C9DC} \u{C120}\u{D0DD}"
        static let dayOne = "Day1 (5/26) \u{C624}\u{B298}"
        static let dayCaption = "\u{C624}\u{B298} \u{C9C4}\u{D589}\u{B418}\u{B294} \u{ACF5}\u{C5F0}\u{C758} \u{B300}\u{AE30}\u{C5F4}\u{C5D0} \u{CC38}\u{C5EC}\u{D560} \u{C218} \u{C788}\u{C5B4}\u{C694}."
        static let remoteQueue = "\u{C6D0}\u{ACA9} \u{C904}\u{C11C}\u{AE30}"
        static let passBackgroundPoster = "\u{C11C}\u{C6B8}\u{C2DC}\u{B9BD}\u{B300}\u{D559}\u{AD50} 2026 \u{D56D}\u{D574}"
    }

    init(
        festivalTitle: String = Copy.title,
        hasIssuedPass: Bool = true,
        passKind: FestivalPassKind = .student,
        posterStyle: FestivalPosterStyle? = nil
    ) {
        self.festivalTitle = festivalTitle
        self.hasIssuedPass = hasIssuedPass
        self.passKind = passKind
        self.posterStyle = posterStyle
    }

    var body: some View {
        ZStack {
            Color(hex: 0xE6E6ED)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                topToolbar
                    .padding(.top, 62)

                segmentedControl
                    .padding(.top, 12)
                    .padding(.horizontal, 16)

                if selectedTab == 1 {
                    queueContent
                } else if hasIssuedPass {
                    issuedPassContent
                } else {
                    missingPassContent
                }

                Spacer()
            }

            if hasIssuedPass && showsQRCode {
                PassPopupOverlay(passKind: passKind, posterStyle: passPosterStyle) {
                    withAnimation(.spring(response: 0.28, dampingFraction: 0.88)) {
                        showsQRCode = false
                    }
                }
                .transition(.opacity.combined(with: .scale(scale: 0.98)))
                .zIndex(10)
            }

            if selectedTab == 1 && !isQueueSheetPresented {
                queueCTA
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .zIndex(4)
            }

            if selectedTab == 1 && isQueueSheetPresented {
                queueSheet
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .zIndex(5)
            }
        }
        .ignoresSafeArea(edges: .top)
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
        .toolbar(.hidden, for: .tabBar)
    }

    private var issuedPassContent: some View {
        VStack(spacing: 0) {
            Text(Copy.passTitle)
                .font(.system(size: 20, weight: .bold))
                .tracking(-0.45)
                .foregroundStyle(Color(hex: 0x373742))
                .padding(.top, 47)

            Text(Copy.passHint)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color(hex: 0x727272))
                .padding(.top, 8)

            Button {
                withAnimation(.spring(response: 0.32, dampingFraction: 0.86)) {
                    showsQRCode.toggle()
                }
            } label: {
                PassCard(kind: passKind, posterStyle: passPosterStyle)
                    .frame(width: 301.79, height: 449.35)
            }
            .buttonStyle(.plain)
            .padding(.top, 40)
        }
    }

    private var passPosterStyle: FestivalPosterStyle? {
        let normalizedTitle = Copy.passBackgroundPoster.precomposedStringWithCanonicalMapping
        return FestivalPoster.localPosters.first { poster in
            poster.title == normalizedTitle
        }?.style ?? .image(name: Copy.passBackgroundPoster)
    }

    private var missingPassContent: some View {
        VStack(spacing: 0) {
            Text(Copy.missingPassTitle)
                .font(.system(size: 20, weight: .bold))
                .tracking(-0.45)
                .foregroundStyle(Color(hex: 0x373742))
                .padding(.top, 47)

            Text(Copy.missingPassHint)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color(hex: 0x727272))
                .padding(.top, 12)

            NavigationLink {
                PassRegistrationView()
            } label: {
                RoundedRectangle(cornerRadius: 11.644, style: .continuous)
                    .fill(Color(hex: 0xF5F5F5))
                    .frame(width: 281, height: 418.395)
                    .overlay {
                        Image(systemName: "plus.circle")
                            .font(.system(size: 48, weight: .regular))
                            .foregroundStyle(Color(hex: 0xBFBFBF))
                    }
            }
            .buttonStyle(.plain)
            .padding(.top, 47)
        }
    }

    private var topToolbar: some View {
        ZStack {
            HStack {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 23, weight: .medium))
                        .foregroundStyle(Color(hex: 0x1A1A1A))
                        .frame(width: 44, height: 44)
                        .background(.white.opacity(0.72), in: Circle())
                        .festGlassCard(in: Circle())
                }
                .buttonStyle(.plain)

                Spacer()
            }
            .padding(.horizontal, 16)

            Text(festivalTitle)
                .font(.system(size: 17, weight: .semibold))
                .tracking(-0.43)
                .foregroundStyle(Color(hex: 0x1A1A1A))
                .lineLimit(1)
                .frame(maxWidth: 260)
        }
        .frame(height: 54)
    }

    private var segmentedControl: some View {
        HStack(spacing: 4) {
            segment(title: Copy.pass, index: 0)
            segment(title: Copy.queue, index: 1)
            segment(title: Copy.info, index: 2)
        }
        .padding(2)
        .frame(height: 43)
        .background(Color(hex: 0x767680, alpha: 0.12), in: Capsule())
    }

    private func segment(title: String, index: Int) -> some View {
        Button {
            withAnimation(.spring(response: 0.32, dampingFraction: 0.88)) {
                selectedTab = index
                if index != 1 {
                    isQueueSheetPresented = false
                    isQueueSheetExpanded = false
                }
            }
        } label: {
            Text(title)
                .font(.system(size: 13.333, weight: selectedTab == index ? .semibold : .medium))
                .tracking(-0.08)
                .foregroundStyle(Color(hex: 0x000000))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(selectedTab == index ? Color.white : Color.clear, in: Capsule())
        }
        .buttonStyle(.plain)
    }

    private var queueContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(Copy.queueTitle)
                .font(.system(size: 20, weight: .bold))
                .tracking(-0.45)
                .foregroundStyle(Color(hex: 0x373742))
                .padding(.top, 40)

            Text(Copy.queueHint)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color(hex: 0x727272))
                .padding(.top, 8)

            VStack(spacing: 12) {
                QueueStatusRow(
                    icon: "graduationcap",
                    title: FestivalPassKind.student.cardLabel,
                    count: Copy.waitingCount,
                    suffix: Copy.waiting,
                    caption: Copy.waitTime
                )

                QueueStatusRow(
                    icon: "person",
                    title: FestivalPassKind.guest.cardLabel,
                    count: Copy.waitingCount,
                    suffix: Copy.waiting,
                    caption: Copy.waitTime
                )
            }
            .padding(.top, 18)

            Text(Copy.timetableTitle)
                .font(.system(size: 20, weight: .bold))
                .tracking(-0.45)
                .foregroundStyle(Color(hex: 0x373742))
                .padding(.top, 44)

            Text(Copy.timetableHint)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color(hex: 0x727272))
                .padding(.top, 8)
        }
        .padding(.horizontal, 20)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var queueCTA: some View {
        VStack {
            Spacer()

            Button {
                withAnimation(.spring(response: 0.32, dampingFraction: 0.88)) {
                    isQueueSheetPresented = true
                    isQueueSheetExpanded = false
                }
            } label: {
                Text(Copy.remoteQueue)
                    .font(.system(size: 17, weight: .medium))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 48)
                    .background(Color(hex: 0x0097CE), in: Capsule())
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
            .padding(.bottom, 45)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var queueSheet: some View {
        GeometryReader { proxy in
            let collapsedY = proxy.size.height - 433
            let expandedY: CGFloat = 171
            let isReady = selectedQueueTicket && selectedQueueDate

            ZStack {
                Color.clear
                    .contentShape(Rectangle())
                    .onTapGesture {
                        withAnimation(.spring(response: 0.32, dampingFraction: 0.9)) {
                            isQueueSheetPresented = false
                            isQueueSheetExpanded = false
                        }
                    }

                QueueBottomSheet(
                    isExpanded: isQueueSheetExpanded,
                    isTicketSelected: selectedQueueTicket,
                    isDateSelected: selectedQueueDate,
                    isReady: isReady,
                    onClose: {
                        withAnimation(.spring(response: 0.32, dampingFraction: 0.9)) {
                            isQueueSheetPresented = false
                            isQueueSheetExpanded = false
                        }
                    },
                    onExpand: {
                        withAnimation(.spring(response: 0.32, dampingFraction: 0.88)) {
                            isQueueSheetExpanded = true
                        }
                    },
                    onToggleTicket: {
                        withAnimation(.easeInOut(duration: 0.18)) {
                            selectedQueueTicket.toggle()
                        }
                    },
                    onToggleDate: {
                        withAnimation(.easeInOut(duration: 0.18)) {
                            selectedQueueDate.toggle()
                        }
                    }
                )
                .offset(y: isQueueSheetExpanded ? expandedY : collapsedY)
                .gesture(
                    DragGesture(minimumDistance: 12)
                        .onEnded { value in
                            withAnimation(.spring(response: 0.32, dampingFraction: 0.88)) {
                                if value.translation.height < -40 {
                                    isQueueSheetExpanded = true
                                } else if value.translation.height > 40 {
                                    isQueueSheetExpanded = false
                                }
                            }
                        }
                )
            }
        }
        .ignoresSafeArea(edges: .bottom)
    }
}

private struct QueueStatusRow: View {
    let icon: String
    let title: String
    let count: String
    let suffix: String
    let caption: String

    var body: some View {
        HStack(spacing: 32) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 24, weight: .regular))
                    .frame(width: 24, height: 24)

                Text(title)
                    .font(.system(size: 20, weight: .bold))
            }
            .foregroundStyle(Color(hex: 0x373742))
            .frame(width: 89, alignment: .leading)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 2) {
                    Text(count)
                        .foregroundStyle(Color(hex: 0x0097CE))
                    Text(suffix)
                        .foregroundStyle(Color(hex: 0x373742))
                }
                .font(.system(size: 16, weight: .medium))

                Text(caption)
                    .font(.system(size: 12, weight: .regular, design: .rounded))
                    .foregroundStyle(Color(hex: 0x727272))
            }
            .frame(width: 112, alignment: .leading)
        }
        .frame(maxWidth: .infinity, minHeight: 73)
        .background(Color(hex: 0xF5F5F5), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

private struct QueueBottomSheet: View {
    let isExpanded: Bool
    let isTicketSelected: Bool
    let isDateSelected: Bool
    let isReady: Bool
    let onClose: () -> Void
    let onExpand: () -> Void
    let onToggleTicket: () -> Void
    let onToggleDate: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Capsule()
                .fill(Color(hex: 0xCCCCCC))
                .frame(width: 36, height: 5)
                .padding(.top, 5)
                .padding(.bottom, 11)

            ZStack {
                HStack {
                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .font(.system(size: 23, weight: .medium))
                            .foregroundStyle(Color(hex: 0x727272))
                            .frame(width: 44, height: 44)
                            .background(Color(hex: 0xF0F0F0), in: Circle())
                    }
                    .buttonStyle(.plain)

                    Spacer()

                    Button(action: onExpand) {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 23, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 44, height: 44)
                            .background(Color(hex: 0x0097CE), in: Circle())
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 16)

                Text(FestivalDetailView.Copy.queueSheetTitle)
                    .font(.system(size: 17, weight: .semibold))
                    .tracking(-0.43)
                    .foregroundStyle(Color(hex: 0x1A1A1A))
            }
            .frame(height: 44)

            VStack(spacing: 24) {
                QueueSelectionGroup(
                    title: FestivalDetailView.Copy.ticketTypeTitle,
                    optionTitle: FestivalDetailView.Copy.studentTicket,
                    caption: FestivalDetailView.Copy.ticketCaption,
                    isSelected: isTicketSelected,
                    action: onToggleTicket
                )

                QueueSelectionGroup(
                    title: FestivalDetailView.Copy.dateTitle,
                    optionTitle: FestivalDetailView.Copy.dayOne,
                    caption: FestivalDetailView.Copy.dayCaption,
                    isSelected: isDateSelected,
                    action: onToggleDate
                )

                Button(action: {}) {
                    Text(FestivalDetailView.Copy.remoteQueue)
                        .font(.system(size: 17, weight: .medium))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 48)
                        .background(isReady ? Color(hex: 0x0097CE) : Color(hex: 0xBFBFBF), in: Capsule())
                }
                .buttonStyle(.plain)
                .disabled(!isReady)
                .padding(.top, 14)
            }
            .padding(.horizontal, 20)
            .padding(.top, 29)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.white)
        .clipShape(
            UnevenRoundedRectangle(
                topLeadingRadius: 38,
                bottomLeadingRadius: 0,
                bottomTrailingRadius: 0,
                topTrailingRadius: 38,
                style: .continuous
            )
        )
        .shadow(color: .black.opacity(0.18), radius: 37.5, y: 15)
    }
}

private struct QueueSelectionGroup: View {
    let title: String
    let optionTitle: String
    let caption: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color(hex: 0x373742))

            Button(action: action) {
                HStack(spacing: 0) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(optionTitle)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(Color(hex: 0x373742))

                        Text(caption)
                            .font(.system(size: 12, weight: .regular, design: .rounded))
                            .foregroundStyle(Color(hex: 0x727272))
                    }

                    Spacer()

                    Image(systemName: "chevron.down")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(Color(hex: 0x1A1A1A))
                }
                .padding(.horizontal, 24)
                .frame(height: 73)
                .background(isSelected ? Color(hex: 0xD9EFF8) : Color(hex: 0xF5F5F5), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            }
            .buttonStyle(.plain)
        }
    }
}

enum FestivalPassKind {
    case student
    case guest

    var cardLabel: String {
        switch self {
        case .student:
            return "\u{C7AC}\u{D559}\u{C0DD}"
        case .guest:
            return "\u{C678}\u{BD80}\u{C778}"
        }
    }

    var attendeeType: String {
        switch self {
        case .student:
            return "\u{C7AC}\u{D559}\u{C0DD} / \u{C131}\u{C778}"
        case .guest:
            return "\u{C678}\u{BD80}\u{C778} / \u{C131}\u{C778}"
        }
    }

    var attendeeName: String {
        switch self {
        case .student:
            return "\u{BC15}\u{C608}\u{CC2C}"
        case .guest:
            return "\u{D568}\u{C720}\u{C9C4}"
        }
    }
}

private struct PassCard: View {
    let kind: FestivalPassKind
    let posterStyle: FestivalPosterStyle?
    var showsPassDetails = true
    var bottomFrostHeight: CGFloat?

    var body: some View {
        ZStack {
            passBackground

            if let bottomFrostHeight {
                Rectangle()
                    .fill(.white.opacity(0.10))
                    .frame(height: bottomFrostHeight)
                    .background(.ultraThinMaterial)
                    .clipShape(
                        UnevenRoundedRectangle(
                            topLeadingRadius: 0,
                            bottomLeadingRadius: 12.505,
                            bottomTrailingRadius: 12.505,
                            topTrailingRadius: 0,
                            style: .continuous
                        )
                    )
                    .frame(maxHeight: .infinity, alignment: .bottom)
            }

            if showsPassDetails {
                passDetailsFrost
            }

            VStack(alignment: .leading, spacing: 0) {
                if posterStyle == nil {
                    HStack(alignment: .top) {
                        Text("\u{D558}\n\u{C591}")
                            .font(.system(size: 75, weight: .black))
                            .foregroundStyle(.white)
                            .lineSpacing(-20)
                            .rotationEffect(.degrees(-90))
                            .offset(x: -27, y: 36)

                        Spacer()
                    }
                }

                Spacer()

                if showsPassDetails {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(FestivalDetailView.Copy.day)
                            .font(.system(size: 32.22, weight: .bold))

                        Text(kind.cardLabel)
                            .font(.system(size: 53.699, weight: .bold))
                    }
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color(hex: 0x00454F), Color(hex: 0x001868)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .padding(.horizontal, 17)
            .padding(.top, 20)
            .padding(.bottom, 27)

        }
        .clipShape(RoundedRectangle(cornerRadius: 12.505, style: .continuous))
    }

    @ViewBuilder
    private var passBackground: some View {
        if let posterStyle {
            FestivalPosterCard(style: posterStyle, fillsImage: true)
                .scaleEffect(1.14)
        } else {
            passArtwork
            marblePattern
        }
    }

    private var passDetailsFrost: some View {
        VStack(spacing: 0) {
            Spacer()

            Rectangle()
                .fill(.white.opacity(0.05))
                .background(.ultraThinMaterial)
                .mask(
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.75), .black],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(height: 155)
        }
    }

    private var passArtwork: some View {
        RoundedRectangle(cornerRadius: 12.505, style: .continuous)
            .fill(
                LinearGradient(
                    colors: [
                        Color(hex: 0x0B9BD9),
                        Color(hex: 0x91E5FF),
                        Color(hex: 0x1686C5),
                        Color(hex: 0xD4F3FF)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
    }

    private var marblePattern: some View {
        ZStack {
            ForEach(0..<12, id: \.self) { index in
                Capsule()
                    .stroke(.white.opacity(index.isMultiple(of: 2) ? 0.34 : 0.18), lineWidth: CGFloat(1 + index % 3))
                    .frame(width: CGFloat(120 + index * 24), height: CGFloat(28 + index * 8))
                    .rotationEffect(.degrees(Double(index * 17)))
                    .blur(radius: CGFloat(index % 4))
                    .offset(x: CGFloat((index % 5) * 34 - 72), y: CGFloat((index % 4) * 68 - 128))
            }

            ForEach(0..<34, id: \.self) { index in
                Circle()
                    .fill(.white.opacity(index.isMultiple(of: 5) ? 0.70 : 0.24))
                    .frame(width: CGFloat(2 + index % 5), height: CGFloat(2 + index % 5))
                    .position(
                        x: CGFloat((index * 47) % 302),
                        y: CGFloat((index * 71) % 449)
                    )
            }

            Text("\u{D574}")
                .font(.system(size: 110, weight: .black))
                .foregroundStyle(.white.opacity(0.74))
                .rotationEffect(.degrees(-6))
                .offset(x: 95, y: 96)
        }
    }
}

private struct PassPopupOverlay: View {
    let passKind: FestivalPassKind
    let posterStyle: FestivalPosterStyle?
    let close: () -> Void

    var body: some View {
        ZStack {
            Color(hex: 0x373742)
                .opacity(0.60)
                .ignoresSafeArea()
                .onTapGesture(perform: close)

            VStack(spacing: 16) {
                PassPopupCard(kind: passKind, posterStyle: posterStyle)
                    .frame(width: 321.7, height: 479)
                    .shadow(color: .black.opacity(0.25), radius: 2, x: 0, y: 4)

                Button(action: close) {
                    Text(FestivalDetailView.Copy.close)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(Color(hex: 0xBFBFBF))
                        .frame(width: 80, height: 36)
                }
                .buttonStyle(.plain)
            }
            .padding(.top, 183)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
    }
}

private struct PassPopupCard: View {
    let kind: FestivalPassKind
    let posterStyle: FestivalPosterStyle?

    var body: some View {
        ZStack {
            PassCard(kind: kind, posterStyle: posterStyle, showsPassDetails: false, bottomFrostHeight: nil)
                .blur(radius: 2.4)

            VStack(alignment: .leading, spacing: 0) {
                RoundedRectangle(cornerRadius: 25, style: .continuous)
                    .fill(.white)
                    .frame(width: 245, height: 245)
                    .padding(.top, 37)
                    .frame(maxWidth: .infinity)

                Text(kind.attendeeType)
                    .font(.system(size: 30, weight: .bold))
                    .tracking(0.6439)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color(hex: 0x00454F), Color(hex: 0x01305B)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .padding(.top, 58)
                    .padding(.leading, 20)

                Text(kind.attendeeName)
                    .font(.system(size: 50, weight: .bold))
                    .tracking(0.6439)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color(hex: 0x00454F), Color(hex: 0x001868)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .padding(.top, 6)
                    .padding(.leading, 20)

                Spacer()
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 13.33, style: .continuous))
    }
}

#Preview {
    FestivalDetailView()
}
