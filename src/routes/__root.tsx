import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { checkUnlocked, lockSite } from "@/lib/gate.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Oficina Mecânica" },
      { name: "description", content: "Sistema de gestão para oficina mecânica" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Oficina Mecânica" },
      { property: "og:description", content: "Sistema de gestão para oficina mecânica" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}

function AppShell() {
  const check = useServerFn(checkUnlocked);
  const logout = useServerFn(lockSite);
  const router = useRouter();
  const { data: session } = useQuery({
    queryKey: ["gate"],
    queryFn: () => check(),
  });

  const isLoggedIn = session?.unlocked ?? false;

  async function handleLogout() {
    await logout();
    await router.navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      {isLoggedIn && (
        <header className="border-b bg-card px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <nav className="flex items-center gap-6">
              <Link to="/dashboard" className="font-semibold text-foreground">
                Oficina
              </Link>
              <div className="hidden items-center gap-4 text-sm sm:flex">
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
                <Link to="/orders" className="text-muted-foreground hover:text-foreground">
                  Ordens
                </Link>
                <Link to="/customers" className="text-muted-foreground hover:text-foreground">
                  Clientes
                </Link>
                <Link to="/products" className="text-muted-foreground hover:text-foreground">
                  Estoque
                </Link>
                <Link to="/cash-flow" className="text-muted-foreground hover:text-foreground">
                  Caixa
                </Link>
                <Link to="/reports" className="text-muted-foreground hover:text-foreground">
                  Relatórios
                </Link>
              </div>
            </nav>
            <button
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sair
            </button>
          </div>
        </header>
      )}
      <main className={isLoggedIn ? "mx-auto max-w-6xl p-4" : ""}>
        <Outlet />
      </main>
    </div>
  );
}
