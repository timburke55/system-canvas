import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <main className="mx-auto max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Visual systems thinking
          <br />
          <span className="text-zinc-500 dark:text-zinc-400">made simple</span>
        </h1>

        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Draw causal loop diagrams, explore feedback loops, and run qualitative
          simulations — all in a clean, modern interface designed to get out of
          your way.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <Button size="lg" type="submit">
              Get started
            </Button>
          </form>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 text-left sm:grid-cols-3">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Causal Loop Diagrams
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Map variables and their relationships with positive and negative
              causal links. See the feedback structure of any system.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Qualitative Simulation
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Press play and watch your system come alive. Nudge variables and
              see how changes ripple through feedback loops.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Share &amp; Collaborate
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Generate a read-only link to share your diagrams with anyone — no
              sign-in required for viewers.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
