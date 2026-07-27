"use client";

import React from "react";
import { MessagesSquare, Scale, User, Landmark } from "lucide-react";
import { Card, SectionHead, Pill } from "@/design-system";
import { EcourtFile } from "@/app/organization/types/ecourtTypes";
import { Subhead, Prose, ConfidenceScore, SimpleTable } from "./parts";
import type { Column } from "@/design-system";

export function ArgumentsTab({ file }: { file: EcourtFile }) {
  const ara = file.aiAnalysis!.deep_legal_substance_context.arguments_and_reasoning_analysis;
  const fmx = file.aiAnalysis!.deep_legal_substance_context.factual_matrix_from_order;

  return (
    <>
      <Card pad>
        <SectionHead icon={MessagesSquare} title="Arguments & reasoning" />
        <div className="arg-cols">
          <div className="arg pet">
            <div className="ah">
              <User aria-hidden /> Petitioner
            </div>
            <p>{ara.summary_of_arguments_petitioner_side}</p>
          </div>
          <div className="arg res">
            <div className="ah">
              <Landmark aria-hidden /> Respondent
            </div>
            <p>{ara.summary_of_arguments_respondent_side}</p>
          </div>
        </div>
        <Subhead>Court&apos;s reasoning</Subhead>
        <Prose>{ara.court_reasoning_for_decision}</Prose>
      </Card>

      <Card pad>
        <SectionHead icon={Scale} title="Ratio & philosophy" />
        <ConfidenceScore label="Ratio decidendi confidence" score={ara.ratio_decidendi_extracted.confidence_score} />
        <Prose>
          <b>Ratio:</b> {ara.ratio_decidendi_extracted.statement}
        </Prose>
        <Subhead>Obiter dicta</Subhead>
        <ConfidenceScore label="Obiter confidence" score={ara.obiter_dicta_significant_remarks.confidence_score} />
        <Prose>{ara.obiter_dicta_significant_remarks.statement}</Prose>
        {ara.statutory_interpretation_method_applied.length > 0 && (
          <>
            <Subhead>Statutory interpretation methods</Subhead>
            <div className="kw">
              {ara.statutory_interpretation_method_applied.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          </>
        )}
        {ara.judicial_philosophy_indicators_observed.length > 0 && (
          <>
            <Subhead>Judicial philosophy</Subhead>
            <div className="kw">
              {ara.judicial_philosophy_indicators_observed.map((p, i) => (
                <span key={i}>{p}</span>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card pad>
        <SectionHead icon={Scale} title="Brief facts" />
        <Prose>{fmx.brief_facts_summary_ai_generated}</Prose>
      </Card>

      {fmx.chronological_events_timeline_from_facts.length > 0 && (
        <Card>
          <SectionHead padded icon={Scale} title="Chronological timeline" />
          <SimpleTable
            columns={
              [
                { key: "date", header: "Date / Period", render: (e) => <span style={{ whiteSpace: "nowrap" }}>{e.date_or_period}</span> },
                { key: "event", header: "Event", render: (e) => e.event_description },
              ] as Column<(typeof fmx.chronological_events_timeline_from_facts)[number]>[]
            }
            rows={fmx.chronological_events_timeline_from_facts}
          />
        </Card>
      )}

      {fmx.key_factual_findings_by_this_court.length > 0 && (
        <Card pad>
          <SectionHead icon={Scale} title="Key factual findings" />
          <div className="cite-list">
            {fmx.key_factual_findings_by_this_court.map((f, i) => (
              <div className="cite-item" key={i}>
                <div className="ct">
                  {f.finding}
                  <Pill tone="neutral">{f.confidence_score}/10</Pill>
                </div>
                <div className="cm">Source: {f.source_of_finding}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
