"use client";

import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Entity {
  id: string;
  name: string;
}

interface ContactList {
  id: string;
  name: string;
  entityId: string;
  entity: Entity;
  _count: { contacts: number };
}

interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
}

export default function ListsPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [selectedList, setSelectedList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState({ name: "", entityId: "" });
  const [csvData, setCsvData] = useState<{ email: string; firstName?: string; lastName?: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [openAddContact, setOpenAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({ email: "", firstName: "", lastName: "" });
  const [addingContact, setAddingContact] = useState(false);

  async function loadLists() {
    const res = await fetch("/api/lists");
    setLists(await res.json());
  }

  async function loadEntities() {
    const res = await fetch("/api/entities");
    setEntities(await res.json());
  }

  async function loadContacts(listId: string) {
    const res = await fetch(`/api/lists/${listId}/contacts`);
    if (res.ok) setContacts(await res.json());
  }

  useEffect(() => {
    loadLists();
    loadEntities();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Liste créée");
      setOpenCreate(false);
      setForm({ name: "", entityId: "" });
      loadLists();
    } else {
      toast.error("Erreur lors de la création");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette liste et tous ses contacts ?")) return;
    const res = await fetch(`/api/lists?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Liste supprimée");
      if (selectedList?.id === id) {
        setSelectedList(null);
        setContacts([]);
      }
      loadLists();
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: unknown) => {
          const r = row as Record<string, string>;
          return {
            email: r.email || r.Email || r.EMAIL || "",
            firstName: r.firstName || r.first_name || r.prenom || r.Prénom || "",
            lastName: r.lastName || r.last_name || r.nom || r.Nom || "",
          };
        }).filter((c) => c.email);
        setCsvData(parsed);
        toast.success(`${parsed.length} contacts détectés dans le CSV`);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  async function handleImport() {
    if (!selectedList || csvData.length === 0) return;
    setImporting(true);

    const res = await fetch(`/api/lists/${selectedList.id}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts: csvData }),
    });

    if (res.ok) {
      const result = await res.json();
      toast.success(`${result.imported} contacts importés, ${result.skipped} ignorés`);
      setOpenImport(false);
      setCsvData([]);
      loadLists();
      loadContacts(selectedList.id);
    } else {
      toast.error("Erreur lors de l'import");
    }
    setImporting(false);
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedList) return;
    setAddingContact(true);

    const res = await fetch(`/api/lists/${selectedList.id}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts: [contactForm] }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.imported > 0) {
        toast.success("Contact ajouté");
      } else {
        toast.error("Contact ignoré (déjà existant ?)");
      }
      setOpenAddContact(false);
      setContactForm({ email: "", firstName: "", lastName: "" });
      loadLists();
      loadContacts(selectedList.id);
    } else {
      toast.error("Erreur lors de l'ajout");
    }
    setAddingContact(false);
  }

  function selectList(list: ContactList) {
    setSelectedList(list);
    loadContacts(list.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Listes & Contacts</h1>
        <div className="flex gap-2">
          {selectedList && (
            <>
            <Dialog open={openAddContact} onOpenChange={setOpenAddContact}>
              <DialogTrigger render={<Button variant="outline" />}>
                Ajouter un contact
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un contact à &quot;{selectedList.name}&quot;</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="contact@exemple.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Prénom (optionnel)</Label>
                    <Input value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })} placeholder="Jean" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom (optionnel)</Label>
                    <Input value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })} placeholder="Dupont" />
                  </div>
                  <Button type="submit" className="w-full" disabled={addingContact}>
                    {addingContact ? "Ajout..." : "Ajouter"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={openImport} onOpenChange={setOpenImport}>
              <DialogTrigger render={<Button variant="outline" />}>
                Importer CSV
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importer des contacts dans &quot;{selectedList.name}&quot;</DialogTitle>
                </DialogHeader>
                <div
                  {...getRootProps()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted"
                  }`}
                >
                  <input {...getInputProps()} />
                  <p className="text-muted-foreground">
                    {isDragActive
                      ? "Déposez le fichier ici..."
                      : "Glissez un fichier CSV ou cliquez pour sélectionner"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Colonnes attendues : email, firstName, lastName
                  </p>
                </div>
                {csvData.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm">{csvData.length} contacts prêts à importer</p>
                    <div className="max-h-40 overflow-auto rounded border text-xs">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">Prénom</th>
                            <th className="p-2 text-left">Nom</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 5).map((c, i) => (
                            <tr key={i} className="border-b">
                              <td className="p-2">{c.email}</td>
                              <td className="p-2">{c.firstName}</td>
                              <td className="p-2">{c.lastName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button onClick={handleImport} disabled={importing} className="w-full">
                      {importing ? "Import en cours..." : "Importer"}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            </>
          )}
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger render={<Button />}>
              Nouvelle liste
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle liste de contacts</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom de la liste</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Entité</Label>
                  <Select value={form.entityId} onValueChange={(v: string | null) => setForm({ ...form, entityId: v ?? "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une entité" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Créer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground">Listes</h2>
          {lists.map((list) => (
            <Card
              key={list.id}
              className={`cursor-pointer transition-colors ${
                selectedList?.id === list.id ? "border-primary" : ""
              }`}
              onClick={() => selectList(list)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{list.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(list.id); }}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{list.entity.name}</span>
                  <Badge variant="secondary">{list._count.contacts} contacts</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {lists.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune liste</p>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedList ? (
            <div className="space-y-4">
              <h2 className="font-semibold">
                Contacts de &quot;{selectedList.name}&quot;
              </h2>
              <div className="rounded-lg border bg-card">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="p-3">Email</th>
                      <th className="p-3">Prénom</th>
                      <th className="p-3">Nom</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="border-b last:border-0">
                        <td className="p-3 text-sm">{contact.email}</td>
                        <td className="p-3 text-sm">{contact.firstName || "-"}</td>
                        <td className="p-3 text-sm">{contact.lastName || "-"}</td>
                        <td className="p-3">
                          <Badge variant={contact.status === "SUBSCRIBED" ? "default" : "destructive"}>
                            {contact.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {contacts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">
                          Aucun contact. Importez un CSV pour commencer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Sélectionnez une liste pour voir ses contacts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
