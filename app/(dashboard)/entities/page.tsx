"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DkimRecord {
  name: string;
  type: string;
  value: string;
}

interface Entity {
  id: string;
  name: string;
  domain: string | null;
  fromEmail: string;
  fromName: string;
  replyTo: string | null;
  isVerified: boolean;
  dkimTokens: DkimRecord[] | null;
  verificationStatus: string | null;
  _count: { campaigns: number; contactLists: number };
}

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [form, setForm] = useState({ name: "", fromEmail: "", fromName: "", replyTo: "" });
  const [dkimDialog, setDkimDialog] = useState<Entity | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);

  async function loadEntities() {
    const res = await fetch("/api/entities");
    setEntities(await res.json());
  }

  useEffect(() => { loadEntities(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", fromEmail: "", fromName: "", replyTo: "" });
    setOpen(true);
  }

  function openEdit(entity: Entity) {
    setEditing(entity);
    setForm({
      name: entity.name,
      fromEmail: entity.fromEmail,
      fromName: entity.fromName,
      replyTo: entity.replyTo || "",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...form } : form;

    const res = await fetch("/api/entities", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(editing ? "Entité mise à jour" : "Entité créée");
      setOpen(false);
      loadEntities();
    } else {
      toast.error("Erreur lors de la sauvegarde");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette entité ?")) return;
    const res = await fetch(`/api/entities?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Entité supprimée");
      loadEntities();
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  async function handleVerifyDomain(entity: Entity) {
    setVerifying(entity.id);
    const res = await fetch(`/api/entities/${entity.id}/verify`, { method: "POST" });

    if (res.ok) {
      toast.success("Domaine enregistré dans SES !");
      await loadEntities();
      // Refresh entity data to show DKIM records
      const updated = await fetch("/api/entities").then(r => r.json());
      const updatedEntity = updated.find((e: Entity) => e.id === entity.id);
      if (updatedEntity) setDkimDialog(updatedEntity);
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur SES");
    }
    setVerifying(null);
  }

  async function handleCheckStatus(entity: Entity) {
    setChecking(entity.id);
    const res = await fetch(`/api/entities/${entity.id}/check-status`, { method: "POST" });

    if (res.ok) {
      const data = await res.json();
      if (data.isVerified) {
        toast.success(`${entity.domain} est vérifié !`);
      } else {
        toast.info(
          `Statut : domaine ${data.verificationStatus}, DKIM ${data.dkimVerificationStatus}. Les DNS peuvent mettre jusqu'à 72h à se propager.`
        );
      }
      loadEntities();
    } else {
      toast.error("Erreur lors de la vérification");
    }
    setChecking(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copié !");
  }

  function getStatusBadge(entity: Entity) {
    if (entity.isVerified) return <Badge className="bg-green-100 text-green-700">Vérifié</Badge>;
    if (entity.verificationStatus === "PENDING") return <Badge className="bg-yellow-100 text-yellow-700">En attente DNS</Badge>;
    if (entity.verificationStatus === "FAILED") return <Badge className="bg-red-100 text-red-700">Échoué</Badge>;
    return <Badge variant="secondary">Non configuré</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Entités</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />} onClick={openCreate}>
            Nouvelle entité
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier l'entité" : "Nouvelle entité"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du client / business</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hub Trading" required />
              </div>
              <div className="space-y-2">
                <Label>Email d&apos;envoi</Label>
                <Input type="email" value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} placeholder="contact@hubtrading.fr" required />
                <p className="text-xs text-muted-foreground">Le domaine sera automatiquement vérifié dans SES</p>
              </div>
              <div className="space-y-2">
                <Label>Nom d&apos;expéditeur</Label>
                <Input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} placeholder="Hub Trading" required />
              </div>
              <div className="space-y-2">
                <Label>Reply-To (optionnel)</Label>
                <Input type="email" value={form.replyTo} onChange={(e) => setForm({ ...form, replyTo: e.target.value })} placeholder="support@hubtrading.fr" />
              </div>
              <Button type="submit" className="w-full">
                {editing ? "Mettre à jour" : "Créer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* DKIM Dialog */}
      <Dialog open={!!dkimDialog} onOpenChange={(open) => !open && setDkimDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration DNS pour {dkimDialog?.domain}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ajoutez ces 3 enregistrements <strong>CNAME</strong> dans la zone DNS de <strong>{dkimDialog?.domain}</strong> (chez votre registrar : OVH, Cloudflare, etc.)
            </p>
            <div className="space-y-3">
              {(dkimDialog?.dkimTokens as DkimRecord[] || []).map((record, i) => (
                <div key={i} className="rounded-lg border bg-muted/50 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">CNAME {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => copyToClipboard(`${record.name}\t${record.value}`)}
                    >
                      Copier
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-xs text-muted-foreground">Nom : </span>
                      <code className="text-xs break-all cursor-pointer" onClick={() => copyToClipboard(record.name)}>
                        {record.name}
                      </code>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Valeur : </span>
                      <code className="text-xs break-all cursor-pointer" onClick={() => copyToClipboard(record.value)}>
                        {record.value}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                Après avoir ajouté les CNAME, la propagation DNS peut prendre entre <strong>5 minutes et 72 heures</strong>.
                Cliquez sur &quot;Vérifier le statut&quot; sur la carte de l&apos;entité pour rafraîchir.
              </p>
            </div>
            <Button className="w-full" onClick={() => setDkimDialog(null)}>
              Compris, j&apos;ai configuré les DNS
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entities.map((entity) => (
          <Card key={entity.id} className={entity.isVerified ? "border-green-200" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{entity.name}</CardTitle>
                {getStatusBadge(entity)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {entity.fromName} &lt;{entity.fromEmail}&gt;
                </p>
                {entity.domain && (
                  <p className="text-xs text-muted-foreground">Domaine : {entity.domain}</p>
                )}
                {entity.replyTo && (
                  <p className="text-xs text-muted-foreground">Reply-To : {entity.replyTo}</p>
                )}
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{entity._count.campaigns} campagnes</span>
                <span>{entity._count.contactLists} listes</span>
              </div>

              {/* SES Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {!entity.domain && (
                  <Button
                    size="sm"
                    onClick={() => handleVerifyDomain(entity)}
                    disabled={verifying === entity.id}
                  >
                    {verifying === entity.id ? "Enregistrement..." : "Configurer SES"}
                  </Button>
                )}

                {entity.domain && !entity.isVerified && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDkimDialog(entity)}
                    >
                      Voir les CNAME
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCheckStatus(entity)}
                      disabled={checking === entity.id}
                    >
                      {checking === entity.id ? "Vérification..." : "Vérifier le statut"}
                    </Button>
                  </>
                )}

                {entity.isVerified && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    Prêt à envoyer
                  </span>
                )}
              </div>

              {/* Edit / Delete */}
              <div className="flex gap-2 border-t pt-3">
                <Button variant="outline" size="sm" onClick={() => openEdit(entity)}>
                  Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(entity.id)}>
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {entities.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">
            Aucune entité. Créez-en une pour commencer.
          </p>
        )}
      </div>
    </div>
  );
}
