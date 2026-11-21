import Dashboard from "@/components/Dashboard";
import { getAIConfiguration } from "@/lib/gemini";
export const dynamic = "force-dynamic";
export default function Home() { return <Dashboard {...getAIConfiguration()} />; }
