"use client";

import React from "react";
import { TrendingUp, ListChecks, ShieldCheck, Network, FileText } from "lucide-react";
import { Card, SectionHead, Pill, type PillTone } from "@/design-system";
import { EcourtFile } from "@/app/organization/types/ecourtTypes";
import { Kv, KvRow, Subhead, Prose, ProseList, ScoreBar, SimpleTable } from "./parts";
import type { Column } from "@/design-system";

function strengthTone(s: string): PillTone {
  if (s === "High") return "ok";
  if (s === "Medium") return "warn";
  return "neutral";
}

export function InsightsTab({ file }: { file: EcourtFile }) {
  const insights = file.aiAnalysis!.intelligent_insights_analytics.order_significance_and_impact_assessment;
  const legalImpact = file.aiAnalysis!.deep_legal_substance_context.order_significance_and_impact_assessment;
  const research = file.aiAnalysis!.actionable_outputs_user_tools.research_and_visualization_support_data;
  const qr = file.aiAnalysis!.quality_review_metadata;
  const pv = legalImpact.precedential_value_assessment;

  return (
    <>
      <Card pad>
        <SectionHead icon={TrendingUp} title="Impact & precedential value" />
        <ScoreBar
          label="Impact on law area"
          valueText={`${legalImpact.potential_impact_score_on_law_area}/10`}
          pct={(legalImpact.potential_impact_score_on_law_area / 10) * 100}
        />
        <ScoreBar
          label={`Precedential value — ${pv.assessment}`}
          valueText={`${pv.precedence_value_score}/10`}
          pct={(pv.precedence_value_score / 10) * 100}
        />
        {pv.justification && <Prose>{pv.justification}</Prose>}
      </Card>

      {legalImpact.practice_points_for_legal_professionals.length > 0 && (
        <Card pad>
          <SectionHead icon={ListChecks} title="Practice points" />
          <div className="suggest">
            {legalImpact.practice_points_for_legal_professionals.map((p, i) => (
              <div className="s" key={i}>
                <span className="si">
                  <ListChecks aria-hidden />
                </span>
                {p}
              </div>
            ))}
          </div>
        </Card>
      )}

      {(insights.compliance_directives_or_risks_for_parties.length > 0 ||
        insights.implications_for_litigants_in_similar_situations.length > 0 ||
        insights.potential_policy_implications_identified ||
        insights.economic_implications_assessment ||
        insights.adr_suitability_inferred) && (
        <Card pad>
          <SectionHead icon={TrendingUp} title="Implications" />
          {insights.compliance_directives_or_risks_for_parties.length > 0 && (
            <>
              <Subhead>Compliance directives & risks</Subhead>
              <ProseList items={insights.compliance_directives_or_risks_for_parties} />
            </>
          )}
          {insights.implications_for_litigants_in_similar_situations.length > 0 && (
            <>
              <Subhead>Implications for similar litigants</Subhead>
              <ProseList items={insights.implications_for_litigants_in_similar_situations} />
            </>
          )}
          {insights.adr_suitability_inferred && (
            <>
              <Subhead>ADR suitability</Subhead>
              <Pill tone={strengthTone(insights.adr_suitability_inferred)}>{insights.adr_suitability_inferred}</Pill>
            </>
          )}
          {insights.potential_policy_implications_identified && (
            <>
              <Subhead>Policy implications</Subhead>
              <Prose>{insights.potential_policy_implications_identified}</Prose>
            </>
          )}
          {insights.economic_implications_assessment && (
            <>
              <Subhead>Economic implications</Subhead>
              <Prose>{insights.economic_implications_assessment}</Prose>
            </>
          )}
        </Card>
      )}

      {research.cited_cases_network_data_outgoing.length > 0 && (
        <Card>
          <SectionHead padded icon={Network} title="Cited cases network" />
          <SimpleTable
            columns={
              [
                { key: "citation", header: "Citation", render: (c) => c.target_citation_as_in_text },
                {
                  key: "strength",
                  header: "Reliance Strength",
                  render: (c) => <Pill tone={strengthTone(c.strength_of_reliance_inferred)}>{c.strength_of_reliance_inferred}</Pill>,
                },
              ] as Column<(typeof research.cited_cases_network_data_outgoing)[number]>[]
            }
            rows={research.cited_cases_network_data_outgoing}
          />
        </Card>
      )}

      {(research.topic_modeling_cluster_suggestions.length > 0 ||
        research.potential_similar_cases_indicators.key_issues_for_similarity_search.length > 0 ||
        research.potential_similar_cases_indicators.key_statutes_for_similarity_search.length > 0) && (
        <Card pad>
          <SectionHead icon={FileText} title="Research support" />
          {research.topic_modeling_cluster_suggestions.length > 0 && (
            <>
              <Subhead>Topic clusters</Subhead>
              <div className="kw">
                {research.topic_modeling_cluster_suggestions.map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </div>
            </>
          )}
          {research.potential_similar_cases_indicators.key_issues_for_similarity_search.length > 0 && (
            <>
              <Subhead>Key issues (similarity search)</Subhead>
              <ProseList items={research.potential_similar_cases_indicators.key_issues_for_similarity_search} />
            </>
          )}
          {research.potential_similar_cases_indicators.key_statutes_for_similarity_search.length > 0 && (
            <>
              <Subhead>Key statutes (similarity search)</Subhead>
              <ProseList items={research.potential_similar_cases_indicators.key_statutes_for_similarity_search} />
            </>
          )}
        </Card>
      )}

      <Card pad>
        <SectionHead icon={ShieldCheck} title="Quality review" />
        <Kv>
          <KvRow k="OCR accuracy" v={`${Math.round(qr.ocr_accuracy_estimate_if_applicable * 100)}%`} />
          <KvRow k="Extraction confidence" v={qr.overall_extraction_confidence} />
          {qr.ambiguity_or_missing_data_flags.length > 0 && (
            <KvRow k="Ambiguity flags" v={JSON.stringify(qr.ambiguity_or_missing_data_flags)} />
          )}
        </Kv>
      </Card>
    </>
  );
}
