import Dashboard from "@/components/Dashboard";
import { getAIConfiguration } from "@/lib/gemini";
export const dynamic = "force-dynamic";
export default async function ProductPage({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params;
  let name = product;
  try { name = decodeURIComponent(product); } catch { /* Keep literal percent signs in product names. */ }
  return <Dashboard {...getAIConfiguration()} product={name} />;
}
