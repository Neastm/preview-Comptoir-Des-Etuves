(function redirectToPreferredLanguage() {
  const pageLanguage = (document.documentElement.lang || "fr").toLowerCase();
  if (!pageLanguage.startsWith("fr")) return;

  const userAgent = navigator.userAgent || "";
  if (/bot|crawler|spider|crawling|google|bing|yandex|baidu/i.test(userAgent)) return;

  const currentUrl = new URL(window.location.href);
  const requestedLanguage = currentUrl.searchParams.get("lang")?.toLowerCase();
  const supportedLanguages = new Set(["fr", "en", "es"]);

  if (requestedLanguage && supportedLanguages.has(requestedLanguage)) {
    try {
      sessionStorage.setItem("preferredSiteLanguage", requestedLanguage);
    } catch (error) {
      // The redirect still works when browser storage is unavailable.
    }
  }

  let preferredLanguage = requestedLanguage;

  if (!preferredLanguage) {
    try {
      preferredLanguage = sessionStorage.getItem("preferredSiteLanguage") || "";
    } catch (error) {
      preferredLanguage = "";
    }
  }

  if (!preferredLanguage) {
    const browserLanguages = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
    const primaryLocale = (browserLanguages.find(Boolean) || "fr").toLowerCase().replace("_", "-");
    const primaryLanguage = primaryLocale.split("-")[0];
    const spanishLanguageFamily = new Set(["es", "ca", "eu", "gl", "ast", "an"]);

    preferredLanguage = primaryLanguage === "fr"
      ? "fr"
      : spanishLanguageFamily.has(primaryLanguage)
        ? "es"
        : "en";

    try {
      sessionStorage.setItem("preferredSiteLanguage", preferredLanguage);
    } catch (error) {
      // Ignore storage errors.
    }
  }

  if (preferredLanguage === "fr") return;

  const pageName = currentUrl.pathname.split("/").filter(Boolean).pop() || "";
  const localizedPage = !pageName || pageName === "index.html" ? "" : pageName;
  const targetUrl = new URL(`/${preferredLanguage}/${localizedPage}`, currentUrl.origin);
  currentUrl.searchParams.delete("lang");
  targetUrl.search = currentUrl.search;
  targetUrl.hash = currentUrl.hash;
  window.location.replace(targetUrl.href);
})();
