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

type Locale = keyof typeof TRANSLATIONS;

const getErrorPageHtml = (locale: Locale) =>
	`
<!doctype html>
<html lang="${locale}">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Service Unavailable</title>
		<style>
			@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap");
			* {
				margin: 0;
				padding: 0;
				box-sizing: border-box;
			}
			body {
				font-family: "Inter", sans-serif;
				background: radial-gradient(circle at center, #1a1a2e, #16213e);
				color: white;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100vh;
				overflow: hidden;
				position: relative;
			}
			/* Blurry Blob Background */
			.blob {
				position: absolute;
				width: 500px;
				height: 500px;
				background: linear-gradient(135deg, rgba(255, 69, 58, 0.6), rgba(255, 159, 10, 0.6));
				border-radius: 50%;
				filter: blur(120px);
				animation: blobAnimation 10s infinite alternate ease-in-out;
			}
			@keyframes blobAnimation {
				from {
					transform: translate(-50px, -50px) scale(1);
				}
				to {
					transform: translate(50px, 50px) scale(1.2);
				}
			}
			/* Glassmorphic Card */
			.container {
				position: relative;
				background: rgba(255, 255, 255, 0.1);
				border-radius: 20px;
				padding: 40px;
				max-width: 400px;
				text-align: center;
				backdrop-filter: blur(15px);
				box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
				border: 1px solid rgba(255, 255, 255, 0.2);
			}
			h1 {
				font-size: 26px;
				margin-bottom: 10px;
			}
			p {
				font-size: 16px;
				color: #dcdcdc;
				margin-bottom: 20px;
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
			}
			.button:hover {
				background: rgba(255, 69, 58, 1);
			}
			.emoji {
				font-size: 50px;
				margin-bottom: 10px;
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
	</body>
</html>`.trim();

function getRequestLocale(request: Request): Locale {
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
			if ([502, 503, 504].includes(response.status)) {
				return customErrorPage(response.status);
			}
			return response;
		} catch (error) {
			return customErrorPage(503);
		}
	},
} satisfies ExportedHandler;
