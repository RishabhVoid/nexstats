import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getVercelOidcToken } from "@vercel/oidc";
import { GoogleAuth, IdentityPoolClient, OAuth2Client } from "google-auth-library";
import { sheets_v4 } from "googleapis/build/src/apis/sheets";

const scope = "https://www.googleapis.com/auth/spreadsheets";
const run = promisify(execFile);
let tokenRequest: Promise<OAuth2Client> | undefined;
let expires = 0;

async function localIdentity(account: string) {
    if (!tokenRequest || Date.now() >= expires) {
        expires = Date.now() + 45 * 60_000;
        tokenRequest = run("gcloud", ["auth", "print-access-token",
            "--impersonate-service-account=" + account, "--scopes=" + scope], { timeout: 25_000 })
            .then(({ stdout }) => {
                const auth = new OAuth2Client();
                auth.setCredentials({ access_token: stdout.trim() });
                return auth;
            }).catch(() => {
                tokenRequest = undefined;
                throw new Error("Local Google authorization failed");
            });
    }
    return tokenRequest;
}

export async function workbookClient() {
    const spreadsheetId = process.env.NEXSTATS_SPREADSHEET_ID;
    if (!spreadsheetId) throw new Error("Workbook is not configured");
    const email = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const localAccount = process.env.NEXSTATS_LOCAL_IMPERSONATE;
    const provider = process.env.NEXSTATS_GOOGLE_PROVIDER;
    if (process.env.VERCEL && provider && email) {
        const auth = new IdentityPoolClient({
            audience: provider,
            subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
            token_url: "https://sts.googleapis.com/v1/token",
            service_account_impersonation_url: "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/" + encodeURIComponent(email) + ":generateAccessToken",
            subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
            scopes: [scope],
        });
        return { api: new sheets_v4.Sheets({ auth }).spreadsheets, spreadsheetId };
    }
    const auth = localAccount && !process.env.VERCEL
        ? await localIdentity(localAccount)
        : new GoogleAuth({ scopes: [scope], credentials: email && privateKey
            ? { client_email: email, private_key: privateKey } : undefined });
    return { api: new sheets_v4.Sheets({ auth }).spreadsheets, spreadsheetId };
}
