export default async (request: Request, context: any) => {
  const url = new URL(request.url);

  // Spam-Parameter w= -> immer auf Startseite
  if (url.searchParams.has("w")) {
    return Response.redirect(new URL("/", url).toString(), 301);
  }

  // KEIN fetch(request) -> sonst Loop-Risiko
  return context.next();
};