"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateHomeTextsAction } from "@/app/actions/admin-home-text-actions";
import { HOME_TEXT_MAX_LENGTH, HOME_TEXT_SECTIONS, type HomeTexts } from "@/lib/home-texts";

interface HomeTextsFormProps {
  initialTexts: HomeTexts;
}

const INPUT_CLASS =
  "mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export function HomeTextsForm({ initialTexts }: HomeTextsFormProps) {
  const router = useRouter();
  const [texts, setTexts] = useState<HomeTexts>(initialTexts);
  const [savedTexts, setSavedTexts] = useState<HomeTexts>(initialTexts);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  const hasChanges = (Object.keys(texts) as (keyof HomeTexts)[]).some((key) => texts[key] !== savedTexts[key]);

  function updateText(key: keyof HomeTexts, value: string) {
    setTexts((current) => ({ ...current, [key]: value }));
    setSuccessMessage(null);
  }

  function handleSave() {
    setErrorMessage(null);
    setSuccessMessage(null);

    startSaveTransition(async () => {
      const result = await updateHomeTextsAction(texts);
      if (result.success) {
        setSavedTexts(texts);
        setSuccessMessage("A főoldal szövegei elmentve!");
        router.refresh();
      } else {
        setErrorMessage(result.error ?? "A mentés nem sikerült.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {HOME_TEXT_SECTIONS.map((section) => (
        <section key={section.title} className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {section.fields.map((field) => {
              const inputId = `home-text-${field.key}`;
              const value = texts[field.key] ?? "";
              const isMultiline = "multiline" in field && field.multiline;
              const isInfoContent = field.key === "infoBanner.content";
              const helpText = "helpText" in field ? (field.helpText as string) : null;
              const allowEmpty = "allowEmpty" in field && field.allowEmpty;

              return (
                <div key={field.key} className={isMultiline ? "md:col-span-2" : undefined}>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={inputId} className="text-xs font-semibold text-foreground">
                      {field.label}
                    </label>
                    {!allowEmpty && value !== field.defaultValue ? (
                      <button
                        type="button"
                        onClick={() => updateText(field.key, field.defaultValue)}
                        className="text-[11px] font-semibold text-accent hover:underline"
                      >
                        Eredeti szöveg visszaállítása
                      </button>
                    ) : null}
                    {allowEmpty && value.trim().length > 0 ? (
                      <button
                        type="button"
                        onClick={() => updateText(field.key, "")}
                        className="text-[11px] font-semibold text-foreground/60 hover:text-red-600 hover:underline"
                      >
                        Mező törlése (üres)
                      </button>
                    ) : null}
                  </div>

                  {isInfoContent ? (
                    <div className="mt-1.5 mb-1.5 flex flex-wrap gap-1.5 text-xs text-foreground/70">
                      <span className="font-medium text-[11px] text-foreground/50 self-center mr-1">Gyors formázó gombok:</span>
                      <button
                        type="button"
                        onClick={() => updateText(field.key, `${value}**félkövér szöveg**`)}
                        className="rounded border border-border bg-muted/60 px-2 py-0.5 font-bold hover:bg-muted"
                        title="Félkövér szöveg beszúrása"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => updateText(field.key, `${value}*dőlt szöveg*`)}
                        className="rounded border border-border bg-muted/60 px-2 py-0.5 italic hover:bg-muted"
                        title="Dőlt szöveg beszúrása"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => updateText(field.key, `${value}{red}kiemelt piros szöveg{/red}`)}
                        className="rounded border border-border bg-accent/10 px-2 py-0.5 font-semibold text-accent hover:bg-accent/20"
                        title="Piros kiemelés beszúrása"
                      >
                        {`{red}...{/red}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateText(field.key, `${value}{gold}kiemelt arany szöveg{/gold}`)}
                        className="rounded border border-border bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 hover:bg-amber-100"
                        title="Arany kiemelés beszúrása"
                      >
                        {`{gold}...{/gold}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateText(field.key, `${value}{badge}FONTOS{/badge}`)}
                        className="rounded border border-border bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent hover:bg-accent/20"
                        title="Címke / Pill beszúrása"
                      >
                        [Badge]
                      </button>
                      <button
                        type="button"
                        onClick={() => updateText(field.key, `${value}[Link szövege](/idopontfoglalas)`)}
                        className="rounded border border-border bg-muted/60 px-2 py-0.5 font-medium underline hover:bg-muted"
                        title="Hivatkozás beszúrása"
                      >
                        [Link](url)
                      </button>
                    </div>
                  ) : null}

                  {isMultiline ? (
                    <textarea
                      id={inputId}
                      value={value}
                      rows={isInfoContent ? 4 : 3}
                      maxLength={HOME_TEXT_MAX_LENGTH}
                      onChange={(event) => updateText(field.key, event.target.value)}
                      className={INPUT_CLASS}
                    />
                  ) : (
                    <input
                      id={inputId}
                      type="text"
                      value={value}
                      maxLength={HOME_TEXT_MAX_LENGTH}
                      onChange={(event) => updateText(field.key, event.target.value)}
                      className={`${INPUT_CLASS} min-h-11`}
                    />
                  )}

                  {helpText ? (
                    <p className="mt-1 text-[11px] text-foreground/50 leading-relaxed">{helpText}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border bg-white/95 p-4 shadow-lg backdrop-blur">
        {errorMessage ? <p className="mr-auto text-sm text-red-600">{errorMessage}</p> : null}
        {successMessage ? <p className="mr-auto text-sm text-emerald-700">{successMessage}</p> : null}
        {hasChanges && !successMessage && !errorMessage ? (
          <p className="mr-auto text-sm text-foreground/60">Mentetlen változtatások vannak.</p>
        ) : null}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="min-h-11 inline-flex items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Főoldal megnyitása ↗
        </a>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="min-h-11 rounded-full bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {isSaving ? "Mentés..." : "Szövegek mentése"}
        </button>
      </div>
    </div>
  );
}
