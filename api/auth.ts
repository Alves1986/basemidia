import {
  canLogin,
  clearSessionCookie,
  createSessionCookie,
  getAuthenticatedAdmin,
  isAdminConfigured,
  jsonResponse,
} from "./_lib/auth";

export async function GET(request: Request) {
  const admin = getAuthenticatedAdmin(request);
  return jsonResponse({
    configured: isAdminConfigured(),
    authenticated: Boolean(admin),
    user: admin ? { email: admin.email } : null,
  });
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return jsonResponse(
      {
        error:
          "A área administrativa ainda não foi configurada. Defina ADMIN_EMAIL, ADMIN_PASSWORD e SESSION_SECRET no Vercel.",
      },
      { status: 503 }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { error: "Envie e-mail e senha para entrar." },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!canLogin(email, password)) {
    return jsonResponse(
      { error: "E-mail ou senha inválidos." },
      { status: 401 }
    );
  }

  return jsonResponse(
    { authenticated: true, user: { email: email.trim().toLowerCase() } },
    {
      headers: {
        "Set-Cookie": createSessionCookie(request, email.trim().toLowerCase()),
      },
    }
  );
}

export async function DELETE(request: Request) {
  return jsonResponse(
    { success: true },
    { headers: { "Set-Cookie": clearSessionCookie(request) } }
  );
}
