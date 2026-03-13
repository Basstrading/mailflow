"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { EmailEditor } from "@/components/email-editor";

interface Entity {
  id: string;
  name: string;
  fromEmail: string;
  fromName: string;
  isVerified: boolean;
}

interface ContactList {
  id: string;
  name: string;
  entityId: string;
  _count: { contacts: number };
}

const VARIABLES = [
  { key: "{{prenom}}", label: "Prénom" },
  { key: "{{nom}}", label: "Nom" },
  { key: "{{email}}", label: "Email" },
];

type RecipientMode = "manual" | "list";

export default function ComposePage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; total: number; failed: number } | null>(null);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("manual");
  const [form, setForm] = useState({
    entityId: "",
    contactListId: "",
    emails: "",
    subject: "",
    html: "",
  });

  useEffect(() => {
    fetch("/api/entities")
      .then((r) => r.json())
      .then((data) => {
        const verified = data.filter((e: Entity) => e.isVerified);
        setEntities(verified);
        if (verified.length === 1) {
          setForm((f) => ({ ...f, entityId: verified[0].id }));
        }
      });
    fetch("/api/lists")
      .then((r) => r.json())
      .then(setLists);
  }, []);

  function insertVariable(variable: string) {
    setForm((f) => ({ ...f, subject: f.subject + variable }));
  }

  const filteredLists = lists.filter(
    (l) => !form.entityId || l.entityId === form.entityId
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    if (!form.entityId || !form.subject || !form.html) {
      toast.error("Veuillez remplir l'expéditeur, l'objet et le contenu");
      return;
    }

    if (recipientMode === "manual" && !form.emails.trim()) {
      toast.error("Veuillez saisir au moins un email");
      return;
    }

    if (recipientMode === "list" && !form.contactListId) {
      toast.error("Veuillez sélectionner une liste");
      return;
    }

    setSending(true);
    setProgress(null);

    try {
      const body: Record<string, unknown> = {
        entityId: form.entityId,
        subject: form.subject,
        html: form.html,
      };

      if (recipientMode === "manual") {
        body.emails = form.emails
          .split(/[\n,;]+/)
          .map((e) => e.trim())
          .filter((e) => e);
      } else {
        body.contactListId = form.contactListId;
      }

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setProgress({ sent: data.sent, total: data.total, failed: data.failed });
        toast.success(`${data.sent} email(s) envoyé(s) sur ${data.total}`);
        if (data.failed > 0) {
          toast.error(`${data.failed} email(s) en erreur`);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSending(false);
  }

  const selectedEntity = entities.find((e) => e.id === form.entityId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Envoyer un email</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nouvel email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-5">
            {/* Expéditeur */}
            <div className="space-y-2">
              <Label>Expéditeur</Label>
              <Select
                value={form.entityId}
                onValueChange={(v: string | null) =>
                  setForm({ ...form, entityId: v ?? "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une entité" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.fromName} &lt;{e.fromEmail}&gt;
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {entities.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucune entité vérifiée. Configurez d&apos;abord un domaine
                  dans Entités.
                </p>
              )}
              {selectedEntity && (
                <p className="text-xs text-muted-foreground">
                  Envoi depuis : {selectedEntity.fromName} &lt;
                  {selectedEntity.fromEmail}&gt;
                </p>
              )}
            </div>

            {/* Destinataires */}
            <div className="space-y-3">
              <Label>Destinataires</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={recipientMode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientMode("manual")}
                >
                  Saisie manuelle
                </Button>
                <Button
                  type="button"
                  variant={recipientMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientMode("list")}
                >
                  Liste de contacts
                </Button>
              </div>

              {recipientMode === "manual" ? (
                <div className="space-y-2">
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.emails}
                    onChange={(e) => setForm({ ...form, emails: e.target.value })}
                    placeholder={"email1@exemple.com\nemail2@exemple.com\nemail3@exemple.com"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Un email par ligne, ou séparés par des virgules.
                    {form.emails.trim() && (
                      <span className="font-medium text-foreground">
                        {" "}
                        {form.emails.split(/[\n,;]+/).filter((e) => e.trim()).length} destinataire(s)
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={form.contactListId}
                    onValueChange={(v: string | null) =>
                      setForm({ ...form, contactListId: v ?? "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une liste" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLists.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} ({l._count.contacts} contacts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filteredLists.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Aucune liste disponible pour cette entité.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Objet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Objet</Label>
                <div className="flex gap-1">
                  {VARIABLES.map((v) => (
                    <Badge
                      key={v.key}
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground"
                      onClick={() => insertVariable(v.key)}
                    >
                      {v.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Ex: Bonjour {{prenom}}, votre devis"
                required
              />
            </div>

            {/* Contenu - Éditeur riche */}
            <div className="space-y-2">
              <Label>Contenu</Label>
              <EmailEditor
                value={form.html}
                onChange={(html) => setForm({ ...form, html })}
                variables={VARIABLES}
              />
            </div>

            {/* Progress */}
            {progress && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Envoyés : <span className="font-bold text-green-600">{progress.sent}</span> / {progress.total}
                  </span>
                  {progress.failed > 0 && (
                    <span className="text-red-600">
                      Erreurs : {progress.failed}
                    </span>
                  )}
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${Math.round((progress.sent / progress.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" disabled={sending}>
              {sending ? "Envoi en cours..." : "Envoyer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
