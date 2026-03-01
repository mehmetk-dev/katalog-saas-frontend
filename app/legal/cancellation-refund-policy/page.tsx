import { redirect } from "next/navigation"

// This duplicate page has been consolidated into /legal/cancellation-policy
// to avoid duplicate content (SEO risk) and reduce maintenance overhead.
export default function CancellationRefundPolicyRedirect() {
    redirect("/legal/cancellation-policy")
}
