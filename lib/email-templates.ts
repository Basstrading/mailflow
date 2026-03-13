export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: "marketing" | "transactional" | "newsletter" | "minimal";
  html: string;
  text: string;
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: "blank",
    name: "Vide",
    description: "Un template vierge pour partir de zéro",
    category: "minimal",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:20px; font-family:Arial, sans-serif;">
  <p>Votre contenu ici</p>
  <p style="margin-top:30px; font-size:12px; color:#999;">
    <a href="{{unsubscribe_url}}" style="color:#999;">Se désabonner</a>
  </p>
</body>
</html>`,
    text: `Votre contenu ici

---
Se désabonner : {{unsubscribe_url}}`,
  },
  {
    id: "newsletter-simple",
    name: "Newsletter simple",
    description: "Layout épuré avec header, contenu et footer",
    category: "newsletter",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b; padding:30px 40px; border-radius:8px 8px 0 0;">
              <h1 style="margin:0; color:#ffffff; font-size:24px;">Votre Newsletter</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff; padding:40px;">
              <h2 style="margin:0 0 15px; color:#18181b; font-size:20px;">Titre de l'article</h2>
              <p style="margin:0 0 20px; color:#3f3f46; font-size:16px; line-height:1.6;">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <a href="#" style="display:inline-block; background-color:#18181b; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:6px; font-size:14px; font-weight:bold;">
                Lire la suite
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa; padding:20px 40px; border-radius:0 0 8px 8px; border-top:1px solid #e4e4e7;">
              <p style="margin:0; font-size:12px; color:#a1a1aa; text-align:center;">
                Vous recevez cet email car vous êtes abonné à notre newsletter.<br>
                <a href="{{unsubscribe_url}}" style="color:#a1a1aa;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `VOTRE NEWSLETTER
================

Titre de l'article

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

---
Se désabonner : {{unsubscribe_url}}`,
  },
  {
    id: "promo",
    name: "Promotion",
    description: "Mise en avant d'une offre ou promotion",
    category: "marketing",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#7c3aed; padding:40px; border-radius:8px 8px 0 0; text-align:center;">
              <h1 style="margin:0 0 10px; color:#ffffff; font-size:28px;">OFFRE SPÉCIALE</h1>
              <p style="margin:0; color:#e9d5ff; font-size:16px;">Durée limitée</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff; padding:40px; text-align:center;">
              <h2 style="margin:0 0 10px; color:#18181b; font-size:48px; font-weight:bold;">-30%</h2>
              <p style="margin:0 0 25px; color:#3f3f46; font-size:16px; line-height:1.6;">
                Profitez de 30% de réduction sur toute notre gamme. Utilisez le code promo ci-dessous lors de votre commande.
              </p>
              <div style="background-color:#f4f4f5; padding:15px 30px; display:inline-block; border-radius:8px; margin-bottom:25px;">
                <span style="font-size:24px; font-weight:bold; color:#7c3aed; letter-spacing:3px;">PROMO30</span>
              </div>
              <br>
              <a href="#" style="display:inline-block; background-color:#7c3aed; color:#ffffff; padding:14px 32px; text-decoration:none; border-radius:6px; font-size:16px; font-weight:bold;">
                J'en profite
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa; padding:20px 40px; border-radius:0 0 8px 8px; border-top:1px solid #e4e4e7;">
              <p style="margin:0; font-size:12px; color:#a1a1aa; text-align:center;">
                <a href="{{unsubscribe_url}}" style="color:#a1a1aa;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `OFFRE SPÉCIALE - Durée limitée
==============================

-30% sur toute notre gamme !

Utilisez le code promo : PROMO30

---
Se désabonner : {{unsubscribe_url}}`,
  },
  {
    id: "newsletter-multi",
    name: "Newsletter multi-articles",
    description: "Plusieurs articles avec images et séparateurs",
    category: "newsletter",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a; padding:30px 40px; border-radius:8px 8px 0 0;">
              <h1 style="margin:0; color:#ffffff; font-size:22px;">📬 La Lettre Hebdo</h1>
            </td>
          </tr>
          <!-- Intro -->
          <tr>
            <td style="background-color:#ffffff; padding:30px 40px 10px;">
              <p style="margin:0; color:#64748b; font-size:15px; line-height:1.6;">
                Bonjour, voici les dernières actualités de la semaine.
              </p>
            </td>
          </tr>
          <!-- Article 1 -->
          <tr>
            <td style="background-color:#ffffff; padding:20px 40px;">
              <h3 style="margin:0 0 10px; color:#0f172a; font-size:18px;">🚀 Article principal</h3>
              <p style="margin:0 0 15px; color:#475569; font-size:14px; line-height:1.6;">
                Description de votre article principal. Expliquez brièvement le sujet et donnez envie au lecteur d'en savoir plus.
              </p>
              <a href="#" style="color:#2563eb; font-size:14px; font-weight:bold; text-decoration:none;">Lire l'article →</a>
            </td>
          </tr>
          <!-- Separator -->
          <tr>
            <td style="background-color:#ffffff; padding:0 40px;">
              <hr style="border:none; border-top:1px solid #e2e8f0; margin:10px 0;">
            </td>
          </tr>
          <!-- Article 2 -->
          <tr>
            <td style="background-color:#ffffff; padding:20px 40px;">
              <h3 style="margin:0 0 10px; color:#0f172a; font-size:18px;">📊 Deuxième article</h3>
              <p style="margin:0 0 15px; color:#475569; font-size:14px; line-height:1.6;">
                Un autre sujet important à partager avec vos lecteurs. Gardez vos paragraphes courts et percutants.
              </p>
              <a href="#" style="color:#2563eb; font-size:14px; font-weight:bold; text-decoration:none;">En savoir plus →</a>
            </td>
          </tr>
          <!-- Separator -->
          <tr>
            <td style="background-color:#ffffff; padding:0 40px;">
              <hr style="border:none; border-top:1px solid #e2e8f0; margin:10px 0;">
            </td>
          </tr>
          <!-- Article 3 -->
          <tr>
            <td style="background-color:#ffffff; padding:20px 40px;">
              <h3 style="margin:0 0 10px; color:#0f172a; font-size:18px;">💡 Troisième article</h3>
              <p style="margin:0 0 15px; color:#475569; font-size:14px; line-height:1.6;">
                Un dernier sujet pour compléter votre newsletter. Variez les formats pour garder l'attention.
              </p>
              <a href="#" style="color:#2563eb; font-size:14px; font-weight:bold; text-decoration:none;">Découvrir →</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:25px 40px; border-radius:0 0 8px 8px; border-top:1px solid #e2e8f0;">
              <p style="margin:0; font-size:12px; color:#94a3b8; text-align:center; line-height:1.8;">
                Vous recevez cet email car vous êtes inscrit à notre newsletter.<br>
                <a href="{{unsubscribe_url}}" style="color:#94a3b8;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `LA LETTRE HEBDO
===============

Bonjour, voici les dernières actualités de la semaine.

---

🚀 ARTICLE PRINCIPAL
Description de votre article principal.

---

📊 DEUXIÈME ARTICLE
Un autre sujet important à partager.

---

💡 TROISIÈME ARTICLE
Un dernier sujet pour compléter votre newsletter.

---
Se désabonner : {{unsubscribe_url}}`,
  },
  {
    id: "welcome",
    name: "Email de bienvenue",
    description: "Accueillir un nouveau contact ou client",
    category: "transactional",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 20px; text-align:center;">
              <h1 style="margin:0; color:#15803d; font-size:32px;">Bienvenue ! 🎉</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff; padding:40px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <p style="margin:0 0 20px; color:#1f2937; font-size:16px; line-height:1.6;">
                Nous sommes ravis de vous compter parmi nous !
              </p>
              <p style="margin:0 0 20px; color:#4b5563; font-size:15px; line-height:1.6;">
                Voici ce que vous pouvez faire pour commencer :
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #f3f4f6;">
                    <strong style="color:#15803d;">1.</strong>
                    <span style="color:#374151; margin-left:8px;">Complétez votre profil</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #f3f4f6;">
                    <strong style="color:#15803d;">2.</strong>
                    <span style="color:#374151; margin-left:8px;">Explorez nos ressources</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <strong style="color:#15803d;">3.</strong>
                    <span style="color:#374151; margin-left:8px;">Rejoignez la communauté</span>
                  </td>
                </tr>
              </table>
              <div style="text-align:center; margin-top:30px;">
                <a href="#" style="display:inline-block; background-color:#16a34a; color:#ffffff; padding:14px 32px; text-decoration:none; border-radius:6px; font-size:16px; font-weight:bold;">
                  Commencer
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:25px 40px;">
              <p style="margin:0; font-size:12px; color:#6b7280; text-align:center;">
                <a href="{{unsubscribe_url}}" style="color:#6b7280;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `BIENVENUE ! 🎉
==============

Nous sommes ravis de vous compter parmi nous !

Voici ce que vous pouvez faire pour commencer :

1. Complétez votre profil
2. Explorez nos ressources
3. Rejoignez la communauté

---
Se désabonner : {{unsubscribe_url}}`,
  },
  {
    id: "announcement",
    name: "Annonce",
    description: "Annoncer une nouveauté, un événement ou un lancement",
    category: "marketing",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#eff6ff; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1d4ed8; padding:50px 40px; border-radius:8px 8px 0 0; text-align:center;">
              <p style="margin:0 0 10px; color:#93c5fd; font-size:14px; text-transform:uppercase; letter-spacing:2px;">Nouveauté</p>
              <h1 style="margin:0; color:#ffffff; font-size:28px; line-height:1.3;">
                Découvrez notre<br>dernière innovation
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff; padding:40px;">
              <p style="margin:0 0 20px; color:#374151; font-size:16px; line-height:1.6;">
                Nous sommes fiers de vous présenter notre dernière nouveauté. Après des mois de développement, nous sommes prêts à partager avec vous quelque chose d'exceptionnel.
              </p>
              <div style="background-color:#eff6ff; padding:20px; border-radius:8px; border-left:4px solid #1d4ed8; margin:20px 0;">
                <p style="margin:0; color:#1e40af; font-size:15px; line-height:1.6;">
                  <strong>Ce qui change pour vous :</strong><br>
                  Une description des bénéfices concrets pour vos utilisateurs.
                </p>
              </div>
              <div style="text-align:center; margin-top:30px;">
                <a href="#" style="display:inline-block; background-color:#1d4ed8; color:#ffffff; padding:14px 32px; text-decoration:none; border-radius:6px; font-size:16px; font-weight:bold;">
                  En savoir plus
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 40px; border-radius:0 0 8px 8px; border-top:1px solid #e2e8f0;">
              <p style="margin:0; font-size:12px; color:#94a3b8; text-align:center;">
                <a href="{{unsubscribe_url}}" style="color:#94a3b8;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `NOUVEAUTÉ
=========

Découvrez notre dernière innovation

Nous sommes fiers de vous présenter notre dernière nouveauté. Après des mois de développement, nous sommes prêts à partager avec vous quelque chose d'exceptionnel.

Ce qui change pour vous :
Une description des bénéfices concrets pour vos utilisateurs.

---
Se désabonner : {{unsubscribe_url}}`,
  },
];

export const templateCategories = [
  { id: "all", label: "Tous" },
  { id: "minimal", label: "Minimal" },
  { id: "newsletter", label: "Newsletter" },
  { id: "marketing", label: "Marketing" },
  { id: "transactional", label: "Transactionnel" },
] as const;
