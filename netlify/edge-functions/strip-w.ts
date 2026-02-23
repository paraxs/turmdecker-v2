export default async (request: Request, context: any) => {
  const url = new URL(request.url);

  if (url.searchParams.has("w")) {
    // alles weg -> sauberste SEO-Variante
    url.search = "";
    return Response.redirect(url.toString(), 301);
  }

  // WICHTIG: NICHT fetch(request)
  return context.next();
};