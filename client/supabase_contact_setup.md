# Supabase Edge Function (SMTP) Setup

## Troubleshooting: "Invalid Login" with App Password

If you are 100% sure you are using an App Password and still verify the error, try these steps:

1.  **Use `service: "gmail"`**: This handles all the port/secure settings automatically for Gmail.
2.  **Verify `SMTP_USER`**: Make sure this secret matches the Gmail address exactly.
3.  **Check for Spaces**: Ensure there are no extra spaces in your secrets.

### Updated Code (`supabase/functions/send-contact-email/index.ts`)

This version uses the simplified Gmail setup:

```typescript
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => null);
    const record = payload?.record ?? payload;

    if (!record?.email) throw new Error("Missing email");

    // SIMPLIFIED GMAIL CONFIGURATION
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: Deno.env.get("SMTP_USER"),
        pass: Deno.env.get("SMTP_PASS"),
      },
    });

    // Verify connection configuration
    await new Promise((resolve, reject) => {
        transporter.verify(function (error, success) {
            if (error) {
                console.error("SMTP Connection Error:", error);
                reject(error);
            } else {
                console.log("SMTP Connection verified");
                resolve(success);
            }
        });
    });

    const info = await transporter.sendMail({
      from: `"NxteVia Contact" <${Deno.env.get("SMTP_USER")}>`,
      to: "support@nxtevia.com", // Your support email
      replyTo: record.email,
      subject: `New Contact: ${record.subject || "No Subject"}`,
      html: `
        <h3>Message from ${record.name}</h3>
        <p><strong>Email:</strong> ${record.email}</p>
        <p>${(record.message || "").replace(/\n/g, "<br/>")}</p>
      `,
    });

    console.log("Email sent:", info.messageId);

    return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, 
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### Re-Deploy
```bash
supabase functions deploy send-contact-email
```

### Still Failing?
If it still fails, the issue is likely the secret value itself. Try re-setting them carefully:

```bash
# Make sure to put the password in quotes
supabase secrets set SMTP_USER=your.actual@gmail.com
supabase secrets set SMTP_PASS="xxxx xxxx xxxx xxxx"
```
