import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { unlockSite } from "@/lib/gate.functions";
import logoAsset from "@/assets/belmoch-logo.jpg.asset.json";


export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = new FormData(e.currentTarget).get("password") as string;
    const { ok } = await unlock({ data: { password } });
    if (ok) {
      await router.navigate({ to: "/dashboard" });
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <img src={logoAsset.url} alt="Belmoch Garage" className="mx-auto h-24 w-24 rounded-lg" />
        <h1 className="mt-4 text-center text-2xl font-semibold text-card-foreground">Belmoch Garage</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Digite a senha de acesso para continuar.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-sm text-destructive">Senha incorreta.</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
