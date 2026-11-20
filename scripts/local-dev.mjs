import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
function keychain(service, account) {
    return execFileSync("/usr/bin/security", ["find-generic-password", "-s", service, "-a", account, "-w"], {encoding:"utf8"}).trim();
}
const settings = JSON.parse(Buffer.from(keychain("NexStats Local", "workbook"), "base64").toString("utf8"));
const { spreadsheetId, serviceAccount } = settings;
const port = process.env.PORT || "3000";
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "-H", "127.0.0.1", "-p", port], {
    stdio:"inherit",
    env:{ ...process.env, NEXSTATS_SPREADSHEET_ID: spreadsheetId, NEXSTATS_ARCHIVE_SPREADSHEET_ID: settings.archiveSpreadsheetId, NEXSTATS_LOCAL_IMPERSONATE: serviceAccount, NEXTAUTH_URL: "http://127.0.0.1:" + port, NEXTAUTH_SECRET: keychain("NexStats Session", "local"),
        MONGO_DB_URL:process.env.MONGO_DB_URL || "mongodb://127.0.0.1:27017/nexstats_2" }
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", code => process.exit(code ?? 1));
