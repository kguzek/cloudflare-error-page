const ERROR_PAGE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Unavailable</title>
  <style>
    body { text-align: center; font-family: Arial, sans-serif; padding: 50px; }
    h1 { color: red; }
    a { color: blue; text-decoration: none; font-weight: bold; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>🚨 Service Unavailable 🚨</h1>
  <p>We're currently experiencing downtime.</p>
  <p>Check our <a href="https://status.guzek.uk/status/all" target="_blank">status page</a> for real-time updates.</p>
</body>
</html>`.trim();

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    const response = await fetch(request);

    if ([502, 503, 504].includes(response.status)) {
      return new Response(customErrorPage(), {
        status: response.status,
        headers: { "Content-Type": "text/html" },
      });
    }
  } catch (error) {
    return new Response(customErrorPage(), {
      status: 503,
      headers: { "Content-Type": "text/html" },
    });
  }
}

function customErrorPage() {
  return ERROR_PAGE_HTML;
}
