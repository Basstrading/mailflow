"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle, FontFamily, FontSize } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FONTS = [
  { label: "Sans-serif", value: "Arial, Helvetica, sans-serif" },
  { label: "Serif", value: "Georgia, Times New Roman, serif" },
  { label: "Monospace", value: "Courier New, monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet", value: "Trebuchet MS, sans-serif" },
  { label: "Comic Sans", value: "Comic Sans MS, cursive" },
];

const SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"];

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc", "#ffffff",
  "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6",
  "#1a5276", "#1e8449", "#7d3c98", "#c0392b", "#d35400", "#f39c12",
];

interface EmailEditorProps {
  value: string;
  onChange: (html: string) => void;
  variables?: { key: string; label: string }[];
}

export function EmailEditor({ value, onChange, variables = [] }: EmailEditorProps) {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showButtonDialog, setShowButtonDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showCountdownDialog, setShowCountdownDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageWidth, setImageWidth] = useState("100%");
  const [buttonText, setButtonText] = useState("Cliquer ici");
  const [buttonUrl, setButtonUrl] = useState("https://");
  const [buttonColor, setButtonColor] = useState("#3498db");
  const [linkUrl, setLinkUrl] = useState("https://");
  const [countdownDate, setCountdownDate] = useState("");
  const [countdownLabel, setCountdownLabel] = useState("Offre expire dans");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontSize,
      Color,
      FontFamily,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Composez votre email..." }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor
      .chain()
      .focus()
      .setImage({
        src: imageUrl,
        alt: "Image",
        title: "Image",
      })
      .run();
    // Apply width via raw HTML update after insertion
    setShowImageDialog(false);
    setImageUrl("");
  }, [editor, imageUrl, imageWidth]);

  const insertButton = useCallback(() => {
    if (!editor) return;
    const buttonHtml = `<div style="text-align:center;margin:16px 0"><a href="${buttonUrl}" target="_blank" style="display:inline-block;background-color:${buttonColor};color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">${buttonText}</a></div>`;
    editor.chain().focus().insertContent(buttonHtml).run();
    setShowButtonDialog(false);
    setButtonText("Cliquer ici");
    setButtonUrl("https://");
    setButtonColor("#3498db");
  }, [editor, buttonText, buttonUrl, buttonColor]);

  const insertHr = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setHorizontalRule().run();
  }, [editor]);

  const insertCountdown = useCallback(() => {
    if (!editor || !countdownDate) return;
    const targetDate = new Date(countdownDate).toISOString();
    const countdownHtml = `<div style="text-align:center;margin:24px 0;padding:24px;background:#f8f9fa;border-radius:8px">
      <p style="margin:0 0 12px;font-size:14px;color:#666">${countdownLabel}</p>
      <div style="display:flex;justify-content:center;gap:16px">
        <div style="text-align:center"><div style="font-size:32px;font-weight:bold;color:#e74c3c" data-countdown="${targetDate}" data-unit="days">00</div><div style="font-size:11px;color:#999;text-transform:uppercase">Jours</div></div>
        <div style="font-size:32px;color:#ccc">:</div>
        <div style="text-align:center"><div style="font-size:32px;font-weight:bold;color:#e74c3c" data-countdown="${targetDate}" data-unit="hours">00</div><div style="font-size:11px;color:#999;text-transform:uppercase">Heures</div></div>
        <div style="font-size:32px;color:#ccc">:</div>
        <div style="text-align:center"><div style="font-size:32px;font-weight:bold;color:#e74c3c" data-countdown="${targetDate}" data-unit="minutes">00</div><div style="font-size:11px;color:#999;text-transform:uppercase">Minutes</div></div>
        <div style="font-size:32px;color:#ccc">:</div>
        <div style="text-align:center"><div style="font-size:32px;font-weight:bold;color:#e74c3c" data-countdown="${targetDate}" data-unit="seconds">00</div><div style="font-size:11px;color:#999;text-transform:uppercase">Secondes</div></div>
      </div>
    </div>`;
    editor.chain().focus().insertContent(countdownHtml).run();
    setShowCountdownDialog(false);
    setCountdownDate("");
    setCountdownLabel("Offre expire dans");
  }, [editor, countdownDate, countdownLabel]);

  const insertVariable = useCallback(
    (variable: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(variable).run();
    },
    [editor]
  );

  const setFontSize = useCallback(
    (size: string) => {
      if (!editor) return;
      editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
    },
    [editor]
  );

  const insertColumns = useCallback(
    (cols: number) => {
      if (!editor) return;
      const colWidth = Math.floor(100 / cols);
      const colsHtml = Array.from(
        { length: cols },
        () =>
          `<td style="width:${colWidth}%;padding:8px;vertical-align:top;border:1px dashed #ddd"><p>Contenu</p></td>`
      ).join("");
      const tableHtml = `<table style="width:100%;border-collapse:collapse;margin:16px 0"><tr>${colsHtml}</tr></table>`;
      editor.chain().focus().insertContent(tableHtml).run();
    },
    [editor]
  );

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();
    setShowLinkDialog(false);
    setLinkUrl("https://");
  }, [editor, linkUrl]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-input bg-background">
      {/* Toolbar Row 1 - Text formatting */}
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1.5">
        {/* Font Family */}
        <select
          className="h-8 rounded border bg-background px-1.5 text-xs"
          value={editor.getAttributes("textStyle").fontFamily || ""}
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontFamily(e.target.value).run();
            } else {
              editor.chain().focus().unsetFontFamily().run();
            }
          }}
        >
          <option value="">Police</option>
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          className="h-8 rounded border bg-background px-1.5 text-xs"
          value={editor.getAttributes("textStyle").fontSize || ""}
          onChange={(e) => {
            if (e.target.value) {
              setFontSize(e.target.value);
            }
          }}
        >
          <option value="">Taille</option>
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Bold */}
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras"
        >
          <span className="font-bold">B</span>
        </ToolbarButton>

        {/* Italic */}
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique"
        >
          <span className="italic">I</span>
        </ToolbarButton>

        {/* Underline */}
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Souligné"
        >
          <span className="underline">U</span>
        </ToolbarButton>

        {/* Strikethrough */}
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Barré"
        >
          <span className="line-through">S</span>
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Text Color */}
        <div className="relative">
          <ToolbarButton
            active={showColorPicker}
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowBgColorPicker(false);
            }}
            title="Couleur du texte"
          >
            <span className="flex flex-col items-center">
              <span className="text-xs leading-none">A</span>
              <span
                className="mt-0.5 h-1 w-4 rounded-sm"
                style={{
                  backgroundColor:
                    editor.getAttributes("textStyle").color || "#000",
                }}
              />
            </span>
          </ToolbarButton>
          {showColorPicker && (
            <div className="absolute left-0 top-full z-50 mt-1 grid grid-cols-6 gap-1 rounded-md border bg-popover p-2 shadow-md">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className="h-6 w-6 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    editor.chain().focus().setColor(c).run();
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Headings */}
        <ToolbarButton
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="Titre 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Titre 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Titre 3"
        >
          H3
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Alignment */}
        <ToolbarButton
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Aligner à gauche"
        >
          <AlignLeftIcon />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Centrer"
        >
          <AlignCenterIcon />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Aligner à droite"
        >
          <AlignRightIcon />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Lists */}
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste à puces"
        >
          <BulletListIcon />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Liste numérotée"
        >
          <OrderedListIcon />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Link */}
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            } else {
              setShowLinkDialog(true);
            }
          }}
          title="Lien"
        >
          <LinkIcon />
        </ToolbarButton>

        {/* Undo / Redo */}
        <div className="mx-1 h-6 w-px bg-border" />
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
          title="Annuler"
        >
          <UndoIcon />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
          title="Rétablir"
        >
          <RedoIcon />
        </ToolbarButton>
      </div>

      {/* Toolbar Row 2 - Content blocks & variables */}
      <div className="flex flex-wrap items-center gap-1.5 border-b px-2 py-1.5">
        <span className="text-xs font-medium text-muted-foreground mr-1">Blocs :</span>
        <BlockButton onClick={() => setShowImageDialog(true)}>
          <ImageBlockIcon /> Image
        </BlockButton>
        <BlockButton onClick={() => setShowButtonDialog(true)}>
          <ButtonBlockIcon /> Bouton
        </BlockButton>
        <BlockButton onClick={insertHr}>
          <HrBlockIcon /> Ligne
        </BlockButton>
        <BlockButton onClick={() => setShowCountdownDialog(true)}>
          <TimerIcon /> Countdown
        </BlockButton>

        <div className="mx-1.5 h-6 w-px bg-border" />

        <span className="text-xs font-medium text-muted-foreground mr-1">Colonnes :</span>
        <BlockButton onClick={() => insertColumns(2)}>2 col</BlockButton>
        <BlockButton onClick={() => insertColumns(3)}>3 col</BlockButton>
        <BlockButton onClick={() => insertColumns(4)}>4 col</BlockButton>

        {variables.length > 0 && (
          <>
            <div className="mx-1.5 h-6 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground mr-1">Variables :</span>
            {variables.map((v) => (
              <BlockButton key={v.key} onClick={() => insertVariable(v.key)}>
                {v.label}
              </BlockButton>
            ))}
          </>
        )}
      </div>

      {/* Editor Content */}
      <div className="email-editor-content">
        <EditorContent editor={editor} />
      </div>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insérer une image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL de l&apos;image</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemple.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Largeur</Label>
              <Input
                value={imageWidth}
                onChange={(e) => setImageWidth(e.target.value)}
                placeholder="100% ou 300px"
              />
            </div>
            <Button onClick={insertImage} className="w-full">
              Insérer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Button Dialog */}
      <Dialog open={showButtonDialog} onOpenChange={setShowButtonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insérer un bouton</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Texte du bouton</Label>
              <Input
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Cliquer ici"
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="https://exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border"
                />
                <Input
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="rounded-md bg-muted p-4 text-center">
              <a
                style={{
                  display: "inline-block",
                  backgroundColor: buttonColor,
                  color: "#fff",
                  padding: "12px 32px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                {buttonText}
              </a>
            </div>
            <Button onClick={insertButton} className="w-full">
              Insérer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insérer un lien</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemple.com"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sélectionnez d&apos;abord le texte à transformer en lien.
            </p>
            <Button onClick={addLink} className="w-full">
              Appliquer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Countdown Dialog */}
      <Dialog open={showCountdownDialog} onOpenChange={setShowCountdownDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insérer un countdown</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                value={countdownLabel}
                onChange={(e) => setCountdownLabel(e.target.value)}
                placeholder="Offre expire dans"
              />
            </div>
            <div className="space-y-2">
              <Label>Date et heure limite</Label>
              <Input
                type="datetime-local"
                value={countdownDate}
                onChange={(e) => setCountdownDate(e.target.value)}
              />
            </div>
            <Button onClick={insertCountdown} className="w-full">
              Insérer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .email-editor-content .tiptap {
          min-height: 300px;
          padding: 16px;
          outline: none;
        }
        .email-editor-content .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .email-editor-content .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        .email-editor-content .tiptap a {
          color: #3498db;
          text-decoration: underline;
        }
        .email-editor-content .tiptap hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 16px 0;
        }
        .email-editor-content .tiptap h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        .email-editor-content .tiptap h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .email-editor-content .tiptap h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .email-editor-content .tiptap ul {
          list-style: disc;
          padding-left: 1.5em;
        }
        .email-editor-content .tiptap ol {
          list-style: decimal;
          padding-left: 1.5em;
        }
        .email-editor-content .tiptap table {
          width: 100%;
          border-collapse: collapse;
        }
        .email-editor-content .tiptap td {
          border: 1px dashed #ddd;
          padding: 8px;
          vertical-align: top;
        }
      `}</style>
    </div>
  );
}

// ── Toolbar Button Components ──

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 min-w-[28px] items-center justify-center rounded px-1.5 text-xs transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function BlockButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors"
    >
      {children}
    </button>
  );
}

// ── SVG Icons ──

function AlignLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" /><circle cx="4" cy="12" r="1.5" fill="currentColor" /><circle cx="4" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
      <text x="3" y="8" fontSize="7" fill="currentColor" stroke="none">1</text>
      <text x="3" y="14" fontSize="7" fill="currentColor" stroke="none">2</text>
      <text x="3" y="20" fontSize="7" fill="currentColor" stroke="none">3</text>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  );
}

function ImageBlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function ButtonBlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="18" height="10" x="3" y="7" rx="3" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function HrBlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 1h6" /><path d="M12 1v3" />
    </svg>
  );
}
