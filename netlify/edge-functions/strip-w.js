export default async (request: Request) => {
  const url = new URL(request.url);

  // Nur wenn ?w= existiert -> auf gleiche URL ohne Query redirecten
  if (url.searchParams.has("w")) {
    url.searchParams.delete("w");

    // Für maximale SEO-Sauberkeit: alle Query-Parameter wegwerfen
    url.search = "";

    return Response.redirect(url.toString(), 301);
  }

  return fetch(request);
};