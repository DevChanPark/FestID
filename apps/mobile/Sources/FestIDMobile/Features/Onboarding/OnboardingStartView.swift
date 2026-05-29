import SwiftUI

struct OnboardingStartView: View {
    @State private var isHomePresented = false

    private enum Copy {
        static let brand = "CamPass"
        static let headline = "\u{C785}\u{C7A5}\u{BD80}\u{D130} \u{D61C}\u{D0DD}\u{AE4C}\u{C9C0},\n\u{CEA0}\u{D37C}\u{C2A4}\u{B97C} \u{D1B5}\u{ACFC}\u{D558}\u{B294} \u{AC00}\u{C7A5} \u{C26C}\u{C6B4} \u{BC29}\u{BC95}"
        static let login = "\u{BAA8}\u{BC14}\u{C77C} \u{C2E0}\u{BD84}\u{C99D}\u{C73C}\u{B85C} \u{B85C}\u{ADF8}\u{C778}"
        static let missingId = "\u{BAA8}\u{BC14}\u{C77C} \u{C2E0}\u{BD84}\u{C99D}\u{C774} \u{C5C6}\u{C5B4}\u{C694}."
    }

    var body: some View {
        NavigationStack {
            GeometryReader { proxy in
                let width = proxy.size.width
                let height = proxy.size.height
                let sx = width / 402
                let sy = height / 874
                let scale = min(sx, sy)

                ZStack {
                    Color(hex: 0xE6E6ED)
                        .ignoresSafeArea()

                    decorativeLayer(width: width, height: height, sx: sx, sy: sy, scale: scale)

                    VStack(alignment: .leading, spacing: 0) {
                        Spacer()
                            .frame(height: 181 * sy)

                        Text(Copy.brand)
                            .font(.system(size: 44.855 * scale, weight: .black, design: .rounded))
                            .italic()
                            .foregroundStyle(Color(hex: 0x0097CE))
                            .shadow(color: Color(hex: 0x0097CE).opacity(0.08), radius: 0, x: 0.8, y: 0)
                            .frame(height: 70 * sy, alignment: .topLeading)

                        Text(Copy.headline)
                            .font(.system(size: 24 * scale, weight: .bold))
                            .tracking(-0.45 * scale)
                            .foregroundStyle(Color(hex: 0x1A1A1A))
                            .lineSpacing(8 * scale)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 16 * sy)

                        Spacer()

                        Button {
                            isHomePresented = true
                        } label: {
                            Text(Copy.login)
                                .font(.system(size: 17 * scale, weight: .medium))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity, minHeight: 48 * sy)
                        }
                        .background(Color(hex: 0x0097CE), in: Capsule())
                        .buttonStyle(.plain)
                        .padding(.bottom, 14 * sy)

                        Button(action: {}) {
                            Text(Copy.missingId)
                                .font(.system(size: 16 * scale, weight: .medium))
                                .foregroundStyle(Color(hex: 0xBFBFBF))
                                .frame(maxWidth: .infinity, minHeight: 24 * sy)
                        }
                        .buttonStyle(.plain)

                        Spacer()
                            .frame(height: 168 * sy)
                    }
                    .padding(.horizontal, 21 * sx)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                }
            }
            .navigationDestination(isPresented: $isHomePresented) {
                CamPassHomeView()
            }
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private func decorativeLayer(width: CGFloat, height: CGFloat, sx: CGFloat, sy: CGFloat, scale: CGFloat) -> some View {
        ZStack {
            GlassOrb(size: 210 * scale, rotation: 32)
                .position(x: 116 * sx, y: -2 * sy)

            GlassOrb(size: 270 * scale, rotation: 32)
                .position(x: 317 * sx, y: 489 * sy)

            GlassOrb(size: 230 * scale, rotation: 32)
                .position(x: 20 * sx, y: 801 * sy)

            Circle()
                .fill(Color(hex: 0x6FAFDF))
                .frame(width: 20 * scale, height: 20 * scale)
                .position(x: 258 * sx, y: 360 * sy)

            Circle()
                .fill(Color(hex: 0x8E89F4))
                .frame(width: 13 * scale, height: 13 * scale)
                .position(x: 185 * sx, y: 520 * sy)

            Circle()
                .fill(Color(hex: 0x9B95F2))
                .frame(width: 23 * scale, height: 23 * scale)
                .position(x: 380 * sx, y: 605 * sy)

            Circle()
                .fill(Color(hex: 0x8E89F4))
                .frame(width: 13 * scale, height: 13 * scale)
                .position(x: 4 * sx, y: 81 * sy)

            Circle()
                .fill(Color(hex: 0x6FAFDF))
                .frame(width: 14 * scale, height: 14 * scale)
                .position(x: 245 * sx, y: 75 * sy)

            Sparkle()
                .fill(Color(hex: 0x3159FF))
                .frame(width: 32 * scale, height: 32 * scale)
                .rotationEffect(.degrees(-13))
                .position(x: 213 * sx, y: 411 * sy)

            Sparkle()
                .fill(Color(hex: 0x3159FF))
                .frame(width: 38 * scale, height: 38 * scale)
                .rotationEffect(.degrees(-22))
                .position(x: 189 * sx, y: 799 * sy)

            Sparkle()
                .fill(Color(hex: 0x9B95F2))
                .frame(width: 24 * scale, height: 24 * scale)
                .rotationEffect(.degrees(12))
                .position(x: 167 * sx, y: 740 * sy)

            Sparkle()
                .fill(Color(hex: 0x3159FF))
                .frame(width: 34 * scale, height: 34 * scale)
                .rotationEffect(.degrees(-20))
                .position(x: 286 * sx, y: 40 * sy)
        }
        .frame(width: width, height: height)
        .allowsHitTesting(false)
    }
}

private struct GlassOrb: View {
    let size: CGFloat
    let rotation: Double

    var body: some View {
        ZStack(alignment: .topLeading) {
            Circle()
                .fill(Color(hex: 0xB9D5EF).opacity(0.62))
                .overlay {
                    Circle()
                        .stroke(Color(hex: 0xA7CBEA).opacity(0.52), lineWidth: max(7, size * 0.035))
                }
                .festGlassCard(in: Circle())

            Ellipse()
                .fill(.white.opacity(0.44))
                .frame(width: size * 0.42, height: size * 0.28)
                .blur(radius: size * 0.018)
                .rotationEffect(.degrees(12))
                .offset(x: size * 0.54, y: size * 0.08)

            Capsule()
                .fill(.white.opacity(0.62))
                .frame(width: size * 0.26, height: size * 0.035)
                .rotationEffect(.degrees(26))
                .offset(x: size * 0.61, y: size * 0.13)
        }
        .frame(width: size, height: size)
        .rotationEffect(.degrees(rotation))
    }
}

private struct Sparkle: Shape {
    func path(in rect: CGRect) -> Path {
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let long = min(rect.width, rect.height) / 2
        let short = long * 0.26

        var path = Path()
        path.move(to: CGPoint(x: center.x, y: center.y - long))
        path.addLine(to: CGPoint(x: center.x + short, y: center.y - short))
        path.addLine(to: CGPoint(x: center.x + long, y: center.y))
        path.addLine(to: CGPoint(x: center.x + short, y: center.y + short))
        path.addLine(to: CGPoint(x: center.x, y: center.y + long))
        path.addLine(to: CGPoint(x: center.x - short, y: center.y + short))
        path.addLine(to: CGPoint(x: center.x - long, y: center.y))
        path.addLine(to: CGPoint(x: center.x - short, y: center.y - short))
        path.closeSubpath()
        return path
    }
}

#Preview {
    OnboardingStartView()
}
