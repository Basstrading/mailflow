"use client";

import { useEffect, useState, useCallback } from "react";
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

              {/* Warmup Section */}
              {entity.isVerified && <WarmupSection entityId={entity.id} />}

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

// ── Warmup Section Component ──

interface WarmupProgress {
  dailyLimit: number;
  remainingToday: number;
  daysElapsed: number;
  daysRemaining: number;
  progressPercent: number;
  isComplete: boolean;
  totalSent: number;
  targetVolume: number;
  sentToday: number;
}

interface WarmupData {
  enabled: boolean;
  dailyLimit: number;
  targetVolume: number;
  duplicationDays: number;
  maxWarmupDays: number;
  totalSent: number;
  progress: WarmupProgress;
}

function WarmupSection({ entityId }: { entityId: string }) {
  const [warmup, setWarmup] = useState<WarmupData | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    enabled: true,
    dailyLimit: 50,
    targetVolume: 10000,
    duplicationDays: 7,
    maxWarmupDays: 56,
  });

  const loadWarmup = useCallback(async () => {
    try {
      const res = await fetch(`/api/entities/${entityId}/warmup`);
      if (res.ok) {
        const data = await res.json();
        setWarmup(data);
        setForm({
          enabled: data.enabled,
          dailyLimit: data.dailyLimit,
          targetVolume: data.targetVolume,
          duplicationDays: data.duplicationDays,
          maxWarmupDays: data.maxWarmupDays,
        });
      }
    } catch { /* ignore */ }
  }, [entityId]);

  useEffect(() => { loadWarmup(); }, [loadWarmup]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/entities/${entityId}/warmup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setWarmup(data);
        toast.success("Configuration warmup mise à jour");
        setConfigOpen(false);
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (!warmup) return null;

  const p = warmup.progress;

  return (
    <div className="border-t pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Warmup progressif</span>
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogTrigger render={<Button variant="ghost" size="sm" className="h-6 text-xs" />}>
            Configurer
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configuration du warmup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                />
                Activer le warmup progressif
              </label>
              <div className="space-y-2">
                <Label>Limite initiale (emails/jour)</Label>
                <Input type="number" value={form.dailyLimit} onChange={(e) => setForm({ ...form, dailyLimit: parseInt(e.target.value) || 50 })} min="5" />
              </div>
              <div className="space-y-2">
                <Label>Volume cible (emails/jour)</Label>
                <Input type="number" value={form.targetVolume} onChange={(e) => setForm({ ...form, targetVolume: parseInt(e.target.value) || 10000 })} min="100" />
              </div>
              <div className="space-y-2">
                <Label>Doubler tous les N jours</Label>
                <Input type="number" value={form.duplicationDays} onChange={(e) => setForm({ ...form, duplicationDays: parseInt(e.target.value) || 7 })} min="1" max="30" />
                <p className="text-xs text-muted-foreground">
                  Progression : {form.dailyLimit} → {form.dailyLimit * 2} → {form.dailyLimit * 4} → ... → {form.targetVolume}/jour
                </p>
              </div>
              <div className="space-y-2">
                <Label>Durée max (jours)</Label>
                <Input type="number" value={form.maxWarmupDays} onChange={(e) => setForm({ ...form, maxWarmupDays: parseInt(e.target.value) || 56 })} min="7" />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {warmup.enabled ? (
        <>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{p.dailyLimit} / {p.targetVolume} emails/jour</span>
              <span>{Math.round(p.progressPercent)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${p.isComplete ? "bg-green-500" : "bg-blue-500"}`}
                style={{ width: `${p.progressPercent}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Aujourd&apos;hui : {p.sentToday}/{p.dailyLimit}</span>
            <span>Jour {p.daysElapsed} / {p.daysElapsed + p.daysRemaining}</span>
          </div>
          {p.isComplete && (
            <p className="text-xs text-green-600 font-medium">Warmup terminé — volume max atteint</p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Désactivé — aucune limite de volume</p>
      )}
    </div>
  );
}
