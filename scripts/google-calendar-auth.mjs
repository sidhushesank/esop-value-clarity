import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { google } from "googleapis";

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.events",
];

const credentialsPath =
  process.env.GOOGLE_OAUTH_CREDENTIALS ||
  path.resolve("google-oauth-client.json");

const raw = JSON.parse(await fs.readFile(credentialsPath, "utf8"));
const config = raw.web ?? raw.installed;

if (!config) {
  throw new Error(
    "OAuth JSON must contain a web or installed client configuration."
  );
}

const clientId = config.client_id;
const clientSecret = config.client_secret;

if (!clientId || !clientSecret) {
  throw new Error(
    "OAuth JSON is missing client_id or client_secret."
  );
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  REDIRECT_URI
);

// Generate a fresh OAuth state for THIS authorization attempt.
const state = crypto.randomBytes(32).toString("hex");

console.log(`\nOAuth state generated: ${state}\n`);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
  state,
});

console.log(
  "Open this URL in your browser while signed into esopvalueclarity@gmail.com:\n"
);

console.log(authUrl);

console.log(`\nWaiting for callback on ${REDIRECT_URI} ...\n`);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(
      req.url ?? "/",
      `http://localhost:${PORT}`
    );

    // Ignore unrelated requests.
    if (url.pathname !== "/oauth2callback") {
      res.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
      });

      res.end("Not found.");
      return;
    }

    // Google may return an OAuth error instead of an authorization code.
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      const description =
        url.searchParams.get("error_description") || oauthError;

      console.error("\nGoogle OAuth returned an error:");
      console.error(`Error: ${oauthError}`);
      console.error(`Description: ${description}\n`);

      res.writeHead(400, {
        "Content-Type": "text/html; charset=utf-8",
      });

      res.end(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>EVC Google Calendar</title>
          </head>
          <body style="
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f8fafc;
            color: #07111f;
          ">
            <h2>Google authorization was not completed.</h2>
            <p>${description}</p>
            <p>You can close this tab and return to your terminal.</p>
          </body>
        </html>
      `);

      server.close();
      return;
    }

    // Read the state returned by Google.
    const returnedState = url.searchParams.get("state");

    // A stray visit to /oauth2callback without query parameters should
    // NOT kill the authorization server.
    if (!returnedState) {
      console.log(
        "\nReceived a callback without OAuth parameters."
      );
      console.log(
        "Ignoring it and continuing to wait for the real Google callback.\n"
      );

      res.writeHead(400, {
        "Content-Type": "text/html; charset=utf-8",
      });

      res.end(`
        <!doctype html>
        <html>
          <body style="
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f8fafc;
            color: #07111f;
          ">
            <h2>This is the EVC OAuth callback.</h2>
            <p>
              Please return to the Google authorization page
              and complete the authorization.
            </p>
          </body>
        </html>
      `);

      return;
    }

    // IMPORTANT:
    // The returned state must exactly match the state generated
    // by THIS running script.
    if (returnedState !== state) {
      console.error("\nOAuth state mismatch.");
      console.error(`Expected: ${state}`);
      console.error(`Received: ${returnedState}\n`);

      res.writeHead(400, {
        "Content-Type": "text/html; charset=utf-8",
      });

      res.end(`
        <!doctype html>
        <html>
          <body style="
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f8fafc;
            color: #07111f;
          ">
            <h2>Invalid OAuth state.</h2>
            <p>
              This callback came from an older or different
              authorization attempt.
            </p>
            <p>
              Return to the terminal and use the newest Google
              authorization URL.
            </p>
          </body>
        </html>
      `);

      return;
    }

    // Now get the authorization code.
    const code = url.searchParams.get("code");

    if (!code) {
      console.error("\nAuthorization code is missing.");

      res.writeHead(400, {
        "Content-Type": "text/html; charset=utf-8",
      });

      res.end(`
        <!doctype html>
        <html>
          <body style="
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f8fafc;
            color: #07111f;
          ">
            <h2>Authorization code missing.</h2>
            <p>
              Start the authorization again from the newest
              Google authorization URL.
            </p>
          </body>
        </html>
      `);

      server.close();
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.refresh_token) {
        throw new Error(
          "Google did not return a refresh token. " +
            "The script already uses prompt=consent. " +
            "If Google still does not return one, revoke the existing " +
            "EVC authorization from your Google Account and authorize again."
        );
      }

      console.log(
        "\nSUCCESS. Google Calendar authorization completed.\n"
      );

      console.log(
        "Copy these values into your local .env and later into Vercel Production:\n"
      );

      console.log(`GOOGLE_CLIENT_ID=${clientId}`);
      console.log(`GOOGLE_CLIENT_SECRET=${clientSecret}`);
      console.log(`GOOGLE_REDIRECT_URI=${REDIRECT_URI}`);
      console.log(
        `GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`
      );
      console.log("GOOGLE_CALENDAR_ID=primary");
      console.log("EVC_MEETING_TIME_ZONE=Asia/Kolkata");
      console.log("EVC_MEETING_DURATION_MINUTES=20");
      console.log("EVC_MEETING_START_HOUR=10");
      console.log("EVC_MEETING_END_HOUR=19");
      console.log("EVC_MEETING_SLOT_MINUTES=30");

      console.log(
        "\nIMPORTANT: Keep GOOGLE_CLIENT_SECRET and " +
          "GOOGLE_CALENDAR_REFRESH_TOKEN private.\n"
      );

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
      });

      res.end(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>EVC Google Calendar Connected</title>
          </head>
          <body style="
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f5f7fb;
            font-family: Arial, sans-serif;
            color: #07111f;
          ">
            <div style="
              width: min(560px, calc(100% - 40px));
              padding: 32px;
              border: 1px solid #dbe3ef;
              border-radius: 20px;
              background: white;
              box-shadow: 0 20px 60px rgba(15, 23, 42, 0.10);
            ">
              <div style="
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-radius: 999px;
                background: #ecfdf5;
                color: #047857;
                font-weight: 700;
                font-size: 13px;
              ">
                ✓ Connected
              </div>

              <h2 style="
                margin: 18px 0 10px;
                font-size: 28px;
              ">
                EVC Google Calendar connected.
              </h2>

              <p style="
                margin: 0;
                color: #475569;
                line-height: 1.7;
              ">
                Authorization was successful. You can close this tab
                and return to your VS Code terminal.
              </p>
            </div>
          </body>
        </html>
      `);

      server.close();
    } catch (error) {
      console.error("\nOAuth token exchange failed:\n");
      console.error(error);

      res.writeHead(500, {
        "Content-Type": "text/html; charset=utf-8",
      });

      res.end(`
        <!doctype html>
        <html>
          <body style="
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f8fafc;
            color: #07111f;
          ">
            <h2>OAuth setup failed.</h2>
            <p>
              Check the VS Code terminal for the detailed error.
            </p>
            <p>
              Then start the authorization again.
            </p>
          </body>
        </html>
      `);

      server.close();
    }
  } catch (error) {
    console.error("\nCallback handling failed:\n");
    console.error(error);

    try {
      res.writeHead(500, {
        "Content-Type": "text/plain; charset=utf-8",
      });

      res.end(
        "OAuth callback handling failed. Check the terminal."
      );
    } catch {
      // Ignore response errors after the connection is closed.
    }

    server.close();
  }
});

server.on("error", (error) => {
  console.error("\nOAuth callback server failed:\n");

  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. ` +
        "Stop your Next.js dev server and run this script again."
    );
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});

server.listen(PORT, () => {
  console.log(
    `OAuth callback server listening on ${REDIRECT_URI}\n`
  );
});