import SwiftUI

struct StudentVerificationView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var email = ""

    private enum Copy {
        static let navTitle = "\u{D328}\u{C2A4} \u{B4F1}\u{B85D}"
        static let title = "\u{C7AC}\u{D559}\u{C0DD} \u{C778}\u{C99D}"
        static let description = "\u{C7AC}\u{D559}\u{C0DD} \u{D328}\u{C2A4} \u{BC1C}\u{AE09}\u{C744} \u{C704}\u{D574} \u{D559}\u{AD50} \u{C18C}\u{C18D} \u{C815}\u{BCF4}\u{B97C} \u{C81C}\u{CD9C}\u{D574}\u{C8FC}\u{C138}\u{C694}.\n\u{C81C}\u{CD9C}\u{D55C} \u{C815}\u{BCF4}\u{B294} \u{C7AC}\u{D559}\u{C0DD} \u{C5EC}\u{BD80} \u{D655}\u{C778}\u{C5D0}\u{B9CC} \u{C0AC}\u{C6A9}\u{B3FC}\u{C694}."
        static let name = "\u{C774}\u{B984}"
        static let email = "\u{C774}\u{BA54}\u{C77C}"
    }

    var body: some View {
        ZStack {
            Color(hex: 0xE6E6ED)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                verificationToolbar
                    .padding(.top, 62)

                Text(Copy.title)
                    .font(.system(size: 20, weight: .bold))
                    .tracking(-0.45)
                    .foregroundStyle(Color(hex: 0x373742))
                    .padding(.top, 20)

                Text(Copy.description)
                    .font(.system(size: 16, weight: .medium))
                    .lineSpacing(4)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Color(hex: 0x727272))
                    .padding(.top, 8)

                VStack(spacing: 45) {
                    verificationField(title: Copy.name, text: $name)
                    verificationField(title: Copy.email, text: $email)
                }
                .padding(.top, 45)
                .padding(.horizontal, 18)

                Spacer()
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var verificationToolbar: some View {
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

            Text(Copy.navTitle)
                .font(.system(size: 17, weight: .semibold))
                .tracking(-0.43)
                .foregroundStyle(Color(hex: 0x1A1A1A))
        }
        .frame(height: 54)
    }

    private func verificationField(title: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 11) {
            TextField(title, text: text)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(Color(hex: 0x373742))
                .tint(Color(hex: 0x0097CE))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()

            Rectangle()
                .fill(Color(hex: 0xCFCFD4))
                .frame(height: 1)
        }
        .frame(height: 71, alignment: .top)
    }
}

#Preview {
    NavigationStack {
        StudentVerificationView()
    }
}
