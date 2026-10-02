import SwiftUI

// Integration reference, not a complete application. No PhotoKit mutations here.
// Pass the fitted thumbnail, stable metadata and one decision callback.
struct MemoryCard: View {
    enum Decision { case keep, remove }
    let image: Image
    let caption: String
    let date: String
    let onDecision: (Decision) -> Void
    @Environment(\.accessibilityReduceMotion) private var reducedMotion
    @State private var offset: CGFloat = 0
    @State private var committing = false
    private let ink = Color(red: 36/255, green: 42/255, blue: 37/255)
    private let paper = Color(red: 1, green: 254/255, blue: 248/255)
    private let lime = Color(red: 216/255, green: 237/255, blue: 145/255)

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            image.resizable().scaledToFit()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(red: 228/255, green: 233/255, blue: 220/255))
                .clipShape(RoundedRectangle(cornerRadius: 4))
            HStack(alignment: .firstTextBaseline) {
                Text(caption).font(.subheadline)
                Text(date).font(.caption).foregroundStyle(.secondary)
            }.foregroundStyle(ink)
        }
        .padding(10).padding(.bottom, 6)
        .background(paper, in: RoundedRectangle(cornerRadius: 11))
        .shadow(color: .black.opacity(0.12), radius: 18, y: 12)
        .overlay(alignment: .topLeading) {
            Text(offset >= 0 ? "Keep" : "Remove")
                .font(.title2.bold()).foregroundStyle(ink).padding(10)
                .background(offset >= 0 ? lime : Color(red: 241/255, green: 223/255, blue: 213/255))
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .rotationEffect(.degrees(-10)).padding(22)
                .opacity(min(abs(offset) / 90, 1))
                .accessibilityHidden(true)
        }
        .offset(x: offset)
        .rotationEffect(.degrees(reducedMotion ? 0 : max(-12, min(12, Double(offset / 18)))))
        .gesture(DragGesture(minimumDistance: 12)
            .onChanged { value in
                guard !committing, abs(value.translation.width) > abs(value.translation.height) else { return }
                offset = value.translation.width
            }
            .onEnded { value in
                guard !committing else { return }
                let x = value.translation.width
                let projected = value.predictedEndTranslation.width
                let horizontal = abs(x) > abs(value.translation.height)
                if horizontal && (abs(x) >= 85 || abs(projected) >= 120) {
                    commit((abs(x) >= 85 ? x : projected) > 0 ? .keep : .remove)
                } else {
                    withAnimation(reducedMotion ? nil : .spring(response: 0.3, dampingFraction: 0.8)) { offset = 0 }
                }
            })
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(caption), \(date)")
        .accessibilityHint("Use Keep or Remove to review this photo")
        .accessibilityAction(named: Text("Keep")) { commit(.keep) }
        .accessibilityAction(named: Text("Remove")) { commit(.remove) }
        // Caller provides labelled Keep, Remove, Skip and Undo buttons outside card.
    }
    private func commit(_ decision: Decision) {
        guard !committing else { return }
        committing = true
        // Keep callback transactional: persist decision before loading the next asset.
        if reducedMotion {
            onDecision(decision)
        } else {
            withAnimation(.easeOut(duration: 0.24)) { offset = decision == .keep ? 550 : -550 }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.24) { onDecision(decision) }
        }
        // Parent must create a new card identity (.id(asset.localIdentifier)).
    }
}
