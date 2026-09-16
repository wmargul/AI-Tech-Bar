// Ambientowy fallback dla importów CSS Modules (*.module.scss).
// SPFx/heft generuje dokładne typy per-plik (AiTechBar.module.scss.ts), ale w
// trybie watch z pollingiem bywa wyścig, w którym ten plik na chwilę znika i
// kompilacja TS pada z TS2307. Ta deklaracja zapewnia bezpieczny fallback, więc
// build pozostaje zielony (gdy istnieje typ per-plik, TS i tak używa jego).
declare module '*.module.scss' {
  const styles: { [className: string]: string };
  export default styles;
}
