"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { emailTemplates, templateCategories, type EmailTemplate } from "@/lib/email-templates";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Campaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  status: string;
  entity: { name: string; fromEmail: string };
  contactList: { name: string; _count: { contacts: number } };
}

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCampaign(data);
        setSubject(data.subject);
        setHtmlContent(data.htmlContent);
        setTextContent(data.textContent || "");
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/campaigns", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        subject,
        htmlContent,
        textContent: textContent || null,
      }),
    });
    if (res.ok) {
      toast.success("Campagne sauvegardée");
    } else {
      toast.error("Erreur de sauvegarde");
    }
    setSaving(false);
  }

  async function handleSend() {
    if (!confirm("Envoyer cette campagne maintenant ?")) return;
    await handleSave();

    const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
    if (res.ok) {
      const result = await res.json();
      toast.success(`Envoi démarré : ${result.total} emails`);
      router.push("/campaigns");
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur d'envoi");
    }
  }

  function handleApplyTemplate(template: EmailTemplate) {
    if (htmlContent && htmlContent !== "<html><body><p>Contenu de votre email ici</p><p><a href=\"{{unsubscribe_url}}\">Se désabonner</a></p></body></html>") {
      if (!confirm("Le contenu actuel sera remplacé par le template. Continuer ?")) return;
    }
    setHtmlContent(template.html);
    setTextContent(template.text);
    setTemplateDialogOpen(false);
    toast.success(`Template "${template.name}" appliqué`);
  }

  const filteredTemplates = selectedCategory === "all"
    ? emailTemplates
    : emailTemplates.filter((t) => t.category === selectedCategory);

  if (!campaign) {
    return <div className="flex h-64 items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">
            {campaign.entity.name} → {campaign.contactList.name} ({campaign.contactList._count.contacts} contacts)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/campaigns")}>
            Retour
          </Button>
          <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
            Templates
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
          {campaign.status === "DRAFT" && (
            <Button onClick={handleSend}>Envoyer maintenant</Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Objet</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      <Tabs defaultValue="html" className="space-y-4">
        <TabsList>
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="text">Texte brut</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>

        <TabsContent value="html" className="rounded-lg border">
          <MonacoEditor
            height="500px"
            defaultLanguage="html"
            value={htmlContent}
            onChange={(v) => setHtmlContent(v || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
            }}
          />
        </TabsContent>

        <TabsContent value="text">
          <MonacoEditor
            height="500px"
            defaultLanguage="plaintext"
            value={textContent}
            onChange={(v) => setTextContent(v || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
            }}
          />
        </TabsContent>

        <TabsContent value="preview">
          <div className="rounded-lg border bg-white p-4">
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 rounded bg-muted p-3 text-sm">
                <strong>De :</strong> {campaign.entity.fromEmail}<br />
                <strong>Objet :</strong> {subject}
              </div>
              <iframe
                srcDoc={htmlContent}
                className="h-[500px] w-full rounded border"
                sandbox=""
                title="Email preview"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p><strong>Variables disponibles :</strong></p>
        <p className="mt-1">
          <code className="rounded bg-muted px-1">{"{{unsubscribe_url}}"}</code> — Lien de désabonnement (obligatoire)
        </p>
      </div>

      {/* Template Selection Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choisir un template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              {templateCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group cursor-pointer rounded-lg border hover:border-primary transition-colors"
                  onClick={() => handleApplyTemplate(template)}
                >
                  {/* Preview */}
                  <div className="h-48 overflow-hidden rounded-t-lg bg-white">
                    <iframe
                      srcDoc={template.html}
                      className="h-full w-full pointer-events-none"
                      sandbox=""
                      title={template.name}
                      style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%", height: "200%" }}
                    />
                  </div>
                  {/* Info */}
                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{template.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {templateCategories.find((c) => c.id === template.category)?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
