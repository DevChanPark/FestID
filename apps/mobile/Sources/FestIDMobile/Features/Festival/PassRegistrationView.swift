import SwiftUI

struct PassRegistrationView: View {
    @Environment(\.dismiss) private var dismiss

    private enum Copy {
        static let title = "\u{D328}\u{C2A4} \u{B4F1}\u{B85D}"
        static let prompt = "\u{CD95}\u{C81C}\u{C5D0}\u{C11C} \u{C0AC}\u{C6A9}\u{D560} \u{C785}\u{C7A5}\u{AD8C} \u{C720}\u{D615}\u{C744}\n\u{C120}\u{D0DD}\u{D574}\u{C8FC}\u{C138}\u{C694}."
        static let student = "\u{C7AC}\u{D559}\u{C0DD}"
        static let studentTitle = "\u{C11C}\u{B958} \u{D655}\u{C778} \u{D6C4} \u{C7AC}\u{D559}\u{C0DD} \u{D328}\u{C2A4} \u{BC1C}\u{AE09}"
        static let studentCaption = "\u{C774}\u{B984}, \u{D559}\u{BC88}, \u{D559}\u{AD50} \u{C774}\u{BA54}\u{C77C}, \u{C7AC}\u{D559}\u{C99D}\u{BA85}\u{C11C} \u{C81C}\u{CD9C}"
        static let guest = "\u{C678}\u{BD80}\u{C778}"
        static let guestTitle = "\u{BC14}\u{B85C} \u{C678}\u{BD80}\u{C778} \u{D328}\u{C2A4} \u{BC1C}\u{AE09}"
        static let guestCaption = "\u{BCC4}\u{B3C4} \u{C11C}\u{B958} \u{C81C}\u{CD9C} \u{C5C6}\u{C774} \u{C785}\u{C7A5} \u{D328}\u{C2A4} \u{C0DD}\u{C131}"
    }

    var body: some View {
        ZStack {
            Color(hex: 0xE6E6ED)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                registrationToolbar
                    .padding(.top, 62)

                Text(Copy.prompt)
                    .font(.system(size: 20, weight: .bold))
                    .tracking(-0.45)
                    .lineSpacing(6)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Color(hex: 0x373742))
                    .padding(.top, 106)

                VStack(spacing: 12) {
                    NavigationLink {
                        StudentVerificationView()
                    } label: {
                        PassTypeRow(
                            icon: "graduationcap",
                            title: Copy.student,
                            detail: Copy.studentTitle,
                            caption: Copy.studentCaption
                        )
                    }
                    .buttonStyle(.plain)

                    NavigationLink {
                        FestivalDetailView(hasIssuedPass: true, passKind: .guest)
                    } label: {
                        PassTypeRow(
                            icon: "person",
                            title: Copy.guest,
                            detail: Copy.guestTitle,
                            caption: Copy.guestCaption
                        )
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 60)
                .padding(.horizontal, 20)

                Spacer()
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var registrationToolbar: some View {
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

            Text(Copy.title)
                .font(.system(size: 17, weight: .semibold))
                .tracking(-0.43)
                .foregroundStyle(Color(hex: 0x1A1A1A))
        }
        .frame(height: 54)
    }
}

private struct PassTypeRow: View {
    let icon: String
    let title: String
    let detail: String
    let caption: String

    var body: some View {
        HStack(spacing: 0) {
            Image(systemName: icon)
                .font(.system(size: 24, weight: .regular))
                .foregroundStyle(Color(hex: 0x1A1A1A))
                .frame(width: 24, height: 24)
                .padding(.leading, 27)

            Text(title)
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(Color(hex: 0x373742))
                .frame(width: 76, alignment: .leading)
                .padding(.leading, 8)

            VStack(alignment: .leading, spacing: 4) {
                Text(detail)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(Color(hex: 0x373742))
                    .lineLimit(1)

                Text(caption)
                    .font(.system(size: 12, weight: .regular, design: .rounded))
                    .foregroundStyle(Color(hex: 0x727272))
                    .lineLimit(1)
            }

            Spacer(minLength: 0)
        }
        .frame(height: 73)
        .background(Color(hex: 0xF5F5F5), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

#Preview {
    NavigationStack {
        PassRegistrationView()
    }
}
