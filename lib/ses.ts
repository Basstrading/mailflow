import {
  SESClient,
  SendEmailCommand,
  VerifyDomainDkimCommand,
  GetIdentityVerificationAttributesCommand,
  GetIdentityDkimAttributesCommand,
  DeleteIdentityCommand,
} from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ── Send Email ──

export interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams) {
  const command = new SendEmailCommand({
    Source: params.from,
    Destination: { ToAddresses: [params.to] },
    Message: {
      Subject: { Data: params.subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: params.html, Charset: "UTF-8" },
        ...(params.text && { Text: { Data: params.text, Charset: "UTF-8" } }),
      },
    },
    ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
  });
  return sesClient.send(command);
}

// ── Domain Verification ──

export async function verifyDomain(domain: string) {
  const command = new VerifyDomainDkimCommand({ Domain: domain });
  const result = await sesClient.send(command);
  return result.DkimTokens || [];
}

export async function getDomainVerificationStatus(domain: string) {
  const command = new GetIdentityVerificationAttributesCommand({
    Identities: [domain],
  });
  const result = await sesClient.send(command);
  const attrs = result.VerificationAttributes?.[domain];
  return attrs?.VerificationStatus || "NotStarted";
}

export async function getDkimStatus(domain: string) {
  const command = new GetIdentityDkimAttributesCommand({
    Identities: [domain],
  });
  const result = await sesClient.send(command);
  const attrs = result.DkimAttributes?.[domain];
  return {
    dkimEnabled: attrs?.DkimEnabled || false,
    dkimVerificationStatus: attrs?.DkimVerificationStatus || "NotStarted",
    dkimTokens: attrs?.DkimTokens || [],
  };
}

export async function deleteIdentity(domain: string) {
  const command = new DeleteIdentityCommand({ Identity: domain });
  return sesClient.send(command);
}

export { sesClient };
