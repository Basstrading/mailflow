"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalSent: number;
  createdAt: string;
  sentAt: string | null;
  scheduledAt: string | null;
  entity: { name: string };
  contactList: { name: string; _count: { contacts: number } };
}

interface Entity {
  id: string;
  name: string;
}

interface ContactList {
  id: string;
  name: string;
  entityId: string;
  _count: { contacts: number };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SCHEDULED: "bg-yellow-100 text-yellow-700",
  SENDING: "bg-blue-100 text-blue-700",
  SENT: "bg-green-100 text-green-700",
  PAUSED: "bg-orange-100 text-orange-700",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    entityId: "",
    contactListId: "",
  });
  const [sending, setSending] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [sendProgress, setSendProgress] = useState<Record<string, { sent: number; total: number; progress: number }>>({});
  const pollIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const stopPolling = useCallback((campaignId: string) => {
    if (pollIntervals.current[campaignId]) {
      clearInterval(pollIntervals.current[campaignId]);
      delete pollIntervals.current[campaignId];
    }
  }, []);

  const startPolling = useCallback((campaignId: string) => {
    stopPolling(campaignId);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/progress`);
        if (!res.ok) return;
        const data = await res.json();
        setSendProgress((prev) => ({ ...prev, [campaignId]: data }));

        if (data.status === "SENT" || data.status === "PAUSED") {
          stopPolling(campaignId);
          setSending(null);
          load();
          if (data.status === "SENT") {
            toast.success(`${data.sent} emails envoyés sur ${data.total}`);
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 1500);
    pollIntervals.current[campaignId] = interval;
  }, [stopPolling]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(pollIntervals.current).forEach(clearInterval);
    };
  }, []);

  async function load() {
    const [campaignsRes, entitiesRes, listsRes] = await Promise.all([
      fetch("/api/campaigns"),
      fetch("/api/entities"),
      fetch("/api/lists"),
    ]);
    setCampaigns(await campaignsRes.json());
    setEntities(await entitiesRes.json());
    setLists(await listsRes.json());
  }

  useEffect(() => { load(); }, []);

  // Auto-poll for campaigns that are already SENDING
  useEffect(() => {
    campaigns
      .filter((c) => c.status === "SENDING")
      .forEach((c) => {
        if (!pollIntervals.current[c.id]) {
          setSending(c.id);
          startPolling(c.id);
        }
      });
  }, [campaigns, startPolling]);

  const filteredLists = form.entityId
    ? lists.filter((l) => l.entityId === form.entityId)
    : lists;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        htmlContent: "<html><body><p>Contenu de votre email ici</p><p><a href=\"{{unsubscribe_url}}\">Se désabonner</a></p></body></html>",
      }),
    });
    if (res.ok) {
      const campaign = await res.json();
      toast.success("Campagne créée");
      setOpen(false);
      setForm({ name: "", subject: "", entityId: "", contactListId: "" });
      window.location.href = `/campaigns/${campaign.id}/edit`;
    } else {
      toast.error("Erreur lors de la création");
    }
  }

  async function handleSend(id: string) {
    if (!confirm("Envoyer cette campagne maintenant ?")) return;
    setSending(id);
    const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
    if (res.ok) {
      const result = await res.json();
      toast.info(`Envoi démarré : ${result.total} emails`);
      setSendProgress((prev) => ({ ...prev, [id]: { sent: 0, total: result.total, progress: 0 } }));
      startPolling(id);
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur lors de l'envoi");
      setSending(null);
    }
  }

  async function handlePause(id: string) {
    const res = await fetch(`/api/campaigns/${id}/pause`, { method: "POST" });
    if (res.ok) {
      toast.info("Campagne mise en pause");
      stopPolling(id);
      setSending(null);
      load();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur");
    }
  }

  async function handleSchedule(id: string) {
    if (!scheduleDate) {
      toast.error("Veuillez sélectionner une date");
      return;
    }
    const res = await fetch(`/api/campaigns/${id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: scheduleDate }),
    });
    if (res.ok) {
      toast.success("Campagne planifiée");
      setScheduleOpen(null);
      setScheduleDate("");
      load();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur lors de la planification");
    }
  }

  async function handleCancelSchedule(id: string) {
    if (!confirm("Annuler l'envoi programmé ?")) return;
    const res = await fetch(`/api/campaigns/${id}/schedule`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Planification annulée");
      load();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette campagne ?")) return;
    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Campagne supprimée");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campagnes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            Nouvelle campagne
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle campagne</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de la campagne</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Objet de l&apos;email</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Entité</Label>
                <Select value={form.entityId} onValueChange={(v: string | null) => setForm({ ...form, entityId: v ?? "", contactListId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {entities.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Liste de contacts</Label>
                <Select value={form.contactListId} onValueChange={(v: string | null) => setForm({ ...form, contactListId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {filteredLists.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} ({l._count.contacts} contacts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Créer et éditer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="p-4">Nom</th>
              <th className="p-4">Objet</th>
              <th className="p-4">Entité</th>
              <th className="p-4">Liste</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Envoyés</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{c.subject}</td>
                <td className="p-4 text-sm">{c.entity.name}</td>
                <td className="p-4 text-sm">{c.contactList.name}</td>
                <td className="p-4">
                  <Badge className={statusColors[c.status]}>{c.status}</Badge>
                  {c.status === "SCHEDULED" && c.scheduledAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(c.scheduledAt).toLocaleString("fr-FR")}
                    </div>
                  )}
                </td>
                <td className="p-4">{c.totalSent}</td>
                <td className="p-4">
                  <div className="flex flex-col gap-2">
                    {(c.status === "SENDING" || sending === c.id) && sendProgress[c.id] && (
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <Progress value={sendProgress[c.id].progress} className="flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {sendProgress[c.id].sent}/{sendProgress[c.id].total}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {c.status === "DRAFT" && (
                        <>
                          <Link href={`/campaigns/${c.id}/edit`}>
                            <Button variant="outline" size="sm">Éditer</Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => handleSend(c.id)}
                            disabled={sending === c.id}
                          >
                            {sending === c.id ? "Envoi..." : "Envoyer"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setScheduleOpen(c.id); setScheduleDate(""); }}
                          >
                            Planifier
                          </Button>
                        </>
                      )}
                      {c.status === "SCHEDULED" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSchedule(c.id)}
                          >
                            Annuler
                          </Button>
                        </>
                      )}
                      {c.status === "SENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePause(c.id)}
                        >
                          Pause
                        </Button>
                      )}
                      {c.status === "PAUSED" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSend(c.id)}
                            disabled={sending === c.id}
                          >
                            Reprendre
                          </Button>
                        </>
                      )}
                      {(c.status === "SENT" || c.status === "SENDING") && (
                        <Link href={`/stats/${c.id}`}>
                          <Button variant="outline" size="sm">Stats</Button>
                        </Link>
                      )}
                      {c.status !== "SENDING" && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)}>
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Aucune campagne
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={!!scheduleOpen} onOpenChange={(open) => { if (!open) setScheduleOpen(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planifier l&apos;envoi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date et heure d&apos;envoi</Label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => scheduleOpen && handleSchedule(scheduleOpen)}
              disabled={!scheduleDate}
            >
              Confirmer la planification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
