<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title inertia>{{ config('app.name', 'ScholarOS') }}</title>
    <script>
      (function () {
        try {
          var theme = localStorage.getItem("theme");
          var prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
          ).matches;
          if (theme === "dark" || (!theme && prefersDark) || theme === "system" && prefersDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } catch (e) {}
      })();
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
  </head>
  <body class="antialiased">
    @inertia
  </body>
</html>
