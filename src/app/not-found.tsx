import "./globals.css";

/**
 * 404 for paths outside any locale (e.g. /wp-login.php). The locale layout,
 * and with it translations, doesn't apply here, so it renders its own shell.
 */
export default function RootNotFound() {
  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-white px-4 font-sans text-fg antialiased">
        <main className="w-full max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Halaman tidak ditemukan · Page not found
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            Tautan mungkin salah atau halaman sudah dipindahkan.
            <br />
            The link may be wrong or the page has moved.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-medium text-white"
          >
            Beranda · Home
          </a>
        </main>
      </body>
    </html>
  );
}
