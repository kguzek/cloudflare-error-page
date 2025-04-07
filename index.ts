const DEFAULT_LOCALE = "en";

const TRANSLATIONS = {
	en: {
		title: "Service Unavailable",
		message: "We're experiencing some downtime. Our engineers are on it!",
		checkStatus: "Check Status",
	},
	pl: {
		title: "Usługa niedostępna",
		message: "Mamy problemy z dostępnością. Nasi inżynierowie pracują nad tym!",
		checkStatus: "Sprawdź status",
	},
	de: {
		title: "Dienst nicht verfügbar",
		message: "Wir haben einige Ausfallzeiten. Unsere Ingenieure sind dran!",
		checkStatus: "Status überprüfen",
	},
};

//https://developers.cloudflare.com/support/troubleshooting/cloudflare-errors/troubleshooting-cloudflare-5xx-errors/
const CLOUDFLARE_ERROR_CODES = [502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 530];

type Locale = keyof typeof TRANSLATIONS;

const getErrorPageHtml = (locale: Locale) =>
	`
<!doctype html>
<html lang="${locale}">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Service Unavailable</title>
		<meta http-equiv="refresh" content="20" />
    <link rel="icon" type="image/x-icon" href="/images/favicon.ico" />
		<style>
			@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap");
			* {
				margin: 0;
				padding: 0;
				box-sizing: border-box;
			}
			html {
				overflow: hidden;
			}
			body {
				font-family: "Inter", sans-serif;
				background: radial-gradient(circle at center, #222222, #141414);
				color: white;
				display: grid;
				place-items: center;
				min-height: 100vh;
				width: 100%;
				overflow: hidden;
				position: relative;
			}
			/* Blurry Blob Background */
			.blob {
				position: absolute;
				width: 500px;
				height: 500px;
				background: linear-gradient(135deg, rgba(255, 69, 58, 0.6), #2596be);
				border-radius: 50%;
				filter: blur(120px);
				animation: blobAnimation 10s alternate ease-in-out 2;
				pointer-events: none;
			}
			@keyframes blobAnimation {
				0% {
					transform: translate(0, 0) scale(1);
				}
				25% {
					transform: translate(40px, -50px) scale(1.2);
				}
				50% {
					transform: translate(0, -60px) scale(1.4);
				}
				75% {
					transform: translate(-50px, -30px) scale(1.2);
				}
				100% {
					transform: translate(-30px, 0) scale(1);
				}
			}
			/* Glassmorphic Card */
			.container {
				position: relative;
				background: rgba(255, 255, 255, 0.1);
				border-radius: 20px;
				padding: 40px;
				width: 400px;
				max-width: calc(100vw - 40px);
				text-align: center;
				backdrop-filter: blur(15px);
				box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				border: 1px solid rgba(255, 255, 255, 0.2);
			}
			h1 {
				font-size: 26px;
				margin-bottom: 10px;
				overflow-wrap: break-word;
				text-wrap: balance;
			}
			p {
				font-size: 16px;
				color: #dcdcdc;
				margin-bottom: 20px;
				overflow-wrap: break-word;
			}
			.button {
				display: inline-block;
				padding: 12px 24px;
				font-size: 16px;
				color: white;
				background: rgba(255, 69, 58, 0.8);
				text-decoration: none;
				border-radius: 8px;
				transition: background 0.3s ease;
				overflow-wrap: break-word;
				max-width: 100%;
			}
			.button:hover {
				background: rgba(255, 69, 58, 1);
			}
			.emoji {
				font-size: 50px;
				margin-bottom: 10px;
			}
			/* Footer */
			footer {
				position: fixed;
				bottom: 10px;
				font-size: 14px;
				color: #dcdcdc;
			}
			footer a {
				color: #dcdcdc;
				text-decoration: none;
				transition: color 0.3s ease;
			}
			footer a:hover {
				color: #fff;
			}

			@media only screen and (max-width: 768px) {
				.blob {
					width: 300px;
					height: 300px;
				}
			}
		</style>
	</head>
	<body>
		<div class="blob"></div>
		<!-- Blurry floating background blob -->
		<div class="container">
			<div class="emoji">⚠️</div>
			<h1>${TRANSLATIONS[locale].title}</h1>
			<p>${TRANSLATIONS[locale].message}</p>
			<a href="https://status.guzek.uk/status/all" class="button">${TRANSLATIONS[locale].checkStatus}</a>
		</div>
		<footer>
			<p>2025 &copy; <a href="https://github.com/kguzek">Konrad Guzek</a></p>
		</footer>
	</body>
</html>
`.trim();

function getRequestLocale(request: Request): Locale {
	const localeSegment = new URL(request.url).pathname.split("/")[1] as Locale;
	if (TRANSLATIONS[localeSegment] != null) {
		return localeSegment;
	}
	const acceptLanguage = request.headers.get("Accept-Language");
	if (!acceptLanguage) {
		return DEFAULT_LOCALE;
	}
	for (const language of acceptLanguage.split(",")) {
		const locale = language.split("-")[0].toLowerCase() as Locale;
		if (TRANSLATIONS[locale] != null) {
			return locale;
		}
	}
	return DEFAULT_LOCALE;
}

export default {
	async fetch(request) {
		const locale = getRequestLocale(request);

		const customErrorPage = (code: number) =>
			new Response(getErrorPageHtml(locale), {
				status: code,
				headers: { "Content-Type": "text/html" },
			});

		try {
			const response = await fetch(request);
			if (CLOUDFLARE_ERROR_CODES.includes(response.status)) {
				return customErrorPage(response.status);
			}
			return response;
		} catch (error) {
			return customErrorPage(503);
		}
	},
} satisfies ExportedHandler;
