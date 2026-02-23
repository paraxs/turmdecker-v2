export default async (request: Request, context: any) => {
  const url = new URL(request.url);

  // Spam-Parameter w= -> immer auf Startseite
  if (url.searchParams.has("w")) {
    return Response.redirect(new URL("/", url).toString(), 301);
  }

  const res = await context.next();
  const out = new Response(res.body, res);
  out.headers.set("x-td-edge", "1"); // Debug-Beweis
  return out;
};

export const config = { path: "/*" };