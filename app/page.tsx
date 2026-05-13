import { redirect } from "next/navigation";

// The Insight Engine dashboard is the portal's landing page. The
// previous theme-verification scratch page has been retired; any wordmark
// or "go home" affordance that points at `/` lands on the dashboard.
export default function RootPage() {
  redirect("/v2/insight-engine");
}
