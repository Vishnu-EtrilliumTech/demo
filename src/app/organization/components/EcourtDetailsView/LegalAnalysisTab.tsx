"use client";

import React from "react";
import { Target, BookMarked, Library, ScrollText } from "lucide-react";
import { Card, SectionHead, Pill, type PillTone } from "@/design-system";
import { EcourtFile } from "@/app/organization/types/ecourtTypes";
import { Subhead, ProseList, SimpleTable } from "./parts";
import type { Column } from "@/design-system";

const TREATMENT_TONE: Record<string, PillTone> = {
  Followed: "ok",
  Applied: "ok",
  Distinguished: "warn",
  Overruled: "danger",
  Referred: "neutral",
};

export function LegalAnalysisTab({ file }: { file: EcourtFile }) {
  const cla = file.aiAnalysis!.deep_legal_substance_context.core_legal_content_analysis;
  const rules = cla.rules_regulations_ordinances_cited as unknown[];
  const foreign = cla.foreign_jurisprudence_cited_details as unknown[];

  return (
    <>
      {(cla.primary_legal_issues_identified.length > 0 || cla.secondary_legal_issues_identified.length > 0) && (
        <Card pad>
          <SectionHead icon={Target} title="Legal issues" />
          {cla.primary_legal_issues_identified.length > 0 && (
            <>
              <Subhead>Primary issues</Subhead>
              <ProseList items={cla.primary_legal_issues_identified} />
            </>
          )}
          {cla.secondary_legal_issues_identified.length > 0 && (
            <>
              <Subhead>Secondary issues</Subhead>
              <ProseList items={cla.secondary_legal_issues_identified} />
            </>
          )}
        </Card>
      )}

      {cla.statutes_cited_and_applied.length > 0 && (
        <Card>
          <SectionHead padded icon={BookMarked} title="Statutes cited & applied" />
          <SimpleTable
            columns={
              [
                { key: "act", header: "Act", render: (s) => <span style={{ fontWeight: 500 }}>{s.act_name}</span> },
                { key: "section", header: "Section / Article / Rule", render: (s) => s.section_article_rule },
                { key: "interpretation", header: "Interpretation / Application", render: (s) => s.interpretation_focus_or_application },
              ] as Column<(typeof cla.statutes_cited_and_applied)[number]>[]
            }
            rows={cla.statutes_cited_and_applied}
          />
        </Card>
      )}

      {cla.case_law_cited_and_analysed.length > 0 && (
        <Card pad>
          <SectionHead icon={Library} title="Case laws cited" />
          <div className="cite-list">
            {cla.case_law_cited_and_analysed.map((c, i) => (
              <div className="cite-item" key={i}>
                <div className="ct">
                  {c.case_name_as_in_text}
                  <Pill tone={TREATMENT_TONE[c.treatment_by_court] ?? "neutral"}>{c.treatment_by_court}</Pill>
                </div>
                <div className="cm">
                  {c.court_as_in_text} · {c.year_as_in_text}
                  {c.key_principle_used_from_citation ? ` — ${c.key_principle_used_from_citation}` : ""}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(rules.length > 0 || foreign.length > 0) && (
        <Card pad>
          <SectionHead icon={ScrollText} title="Rules & foreign jurisprudence" />
          {rules.length > 0 && (
            <>
              <Subhead>Rules / regulations</Subhead>
              <pre style={{ margin: 0, fontSize: 12, overflowX: "auto", color: "var(--text-2)" }}>
                {JSON.stringify(rules, null, 2)}
              </pre>
            </>
          )}
          {foreign.length > 0 && (
            <>
              <Subhead>Foreign jurisprudence</Subhead>
              <pre style={{ margin: 0, fontSize: 12, overflowX: "auto", color: "var(--text-2)" }}>
                {JSON.stringify(foreign, null, 2)}
              </pre>
            </>
          )}
        </Card>
      )}
    </>
  );
}
