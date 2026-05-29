import SwiftUI

struct FestGlassCard<S: InsettableShape>: ViewModifier {
    let shape: S

    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content
                .glassEffect(.regular, in: shape)
        } else {
            content
                .background(.ultraThinMaterial, in: shape)
                .overlay {
                    shape
                        .strokeBorder(.white.opacity(0.35), lineWidth: 1)
                }
                .shadow(color: .black.opacity(0.08), radius: 22, y: 12)
        }
    }
}

extension View {
    func festGlassCard<S: InsettableShape>(
        in shape: S = RoundedRectangle(cornerRadius: FestIDTheme.Radius.card, style: .continuous)
    ) -> some View {
        modifier(FestGlassCard(shape: shape))
    }
}

struct GlassPillButton: View {
    let title: String
    let systemImage: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(FestIDTheme.Colors.ink)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .frame(minHeight: 44)
        }
        .buttonStyle(.plain)
        .festGlassCard(in: Capsule())
        .contentShape(Capsule())
    }
}
