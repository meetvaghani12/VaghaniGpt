import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { BackgroundPaths } from "@/components/ui/background-paths"

export default function Home() {
  // This would check if user is authenticated in a real app
  // If authenticated, redirect to /chat
  // const isAuthenticated = false;
  // if (isAuthenticated) redirect("/chat");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Vaghani GPT
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="text-sm">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button className="text-sm">Sign up</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <BackgroundPaths title="Vaghani GPT" />
      </main>
    </div>
  )
}
