"use client";

import React from "react";
import { Sparkles, Route, BellRing, AlarmClock } from "lucide-react";
import { Card, SectionHead, AI_ROADMAP_NOTE } from "@/design-system";
import { EcourtFile } from "@/app/organization/types/ecourtTypes";
import { Kv, KvRow, Subhead, Prose, ProseList } from "./parts";

/**
 * AI Summary tab. Rendered only when `file.aiAnalysis` is present (data-gated,
 * per contract §J). Carries the mandated first-release "Preview" label + roadmap
 * note (REVAMP_SPEC §4) — AI is never presented as a shipping feature.
 */
export function AiSummaryTab({ file }: { file: EcourtFile }) {
  const ai = file.aiAnalysis!;
  const insights = ai.intelligent_insights_analytics.order_significance_and_impact_assessment;
  const fm = ai.foundational_metadata;
  const teaser = ai.search_and_user_friendly_teaser.teaser_content;
  const dlc = ai.deep_litigant_substance_context;
  const narrative = dlc?.narrative_of_the_dispute_plain_language;
  const impact = dlc?.potential_impact_on_litigants_involved_inferred;
  const proc = fm.procedural_details_from_order;

  return (
    <>
      {/* AI Executive Summary — Preview-labelled lead card */}
      <div className="ai-card lead">
        <div className="ai-head">
          <span className="spark">
            <Sparkles aria-hidden />
          </span>
          <b>AI Executive Summary</b>
          <span className="soon">
            <Sparkles aria-hidden /> Preview
          </span>
        </div>
        <div className="ai-body">
          {teaser.short_summary_enticing && <p>{teaser.short_summary_enticing}</p>}
          <p>{insights.ai_generated_executive_summary}</p>
        </div>
        <div className="ai-note">
          <Route aria-hidden /> {AI_ROADMAP_NOTE}
        </div>
      </div>

      <Card pad>
        <Subhead>Plain-language summary for litigants</Subhead>
        <Prose>{insights.plain_language_summary_for_litigants_outcome_focused}</Prose>
        {teaser.auto_generated_long_tail_keywords.length > 0 && (
          <>
            <Subhead>Auto-generated search keywords</Subhead>
            <div className="kw">
              {teaser.auto_generated_long_tail_keywords.map((kw, i) => (
                <span key={i}>{kw}</span>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* AI-identified case identifiers */}
      <Card pad>
        <SectionHead icon={Sparkles} title="AI-identified case identifiers" />
        <Kv>
          {Object.entries(fm.core_case_identifiers).map(([k, v]) => {
            if (!v || (Array.isArray(v) && v.length === 0)) return null;
            return <KvRow key={k} k={k.replace(/_/g, " ")} v={Array.isArray(v) ? v.join(", ") : String(v)} />;
          })}
        </Kv>
      </Card>

      {/* Legal representation */}
      <Card pad>
        <SectionHead icon={Sparkles} title="Legal representation" />
        <div className="arg-cols">
          <div className="arg pet">
            <div className="ah">Petitioner counsel</div>
            {fm.legal_representation.counsel_for_petitioner_side.map((c, i) => (
              <p key={i}>
                {c.name} — {c.role}
              </p>
            ))}
          </div>
          <div className="arg res">
            <div className="ah">Respondent counsel</div>
            {fm.legal_representation.counsel_for_respondent_side.map((c, i) => (
              <p key={i}>
                {c.name} — {c.role}
              </p>
            ))}
          </div>
        </div>
      </Card>

      {/* Procedural details */}
      <Card pad>
        <SectionHead icon={Sparkles} title="Procedural details" />
        <Kv>
          <KvRow k="Order Nature" v={proc.order_nature} />
          <KvRow k="Disposition Status" v={proc.disposition_status_indicated} />
          <KvRow k="Disposition Outcome" v={proc.disposition_outcome_if_disposed} />
          {proc.costs_awarded_details.amount && <KvRow k="Costs" v={proc.costs_awarded_details.amount} />}
        </Kv>
        {proc.specific_directions_given_by_court.length > 0 && (
          <>
            <Subhead>Specific directions</Subhead>
            <ProseList items={proc.specific_directions_given_by_court} />
          </>
        )}
      </Card>

      {/* Actionable alerts */}
      {insights.actionable_alerts_for_parties.length > 0 && (
        <Card>
          <div className="ai-head" style={{ padding: "15px 22px" }}>
            <span className="spark">
              <BellRing aria-hidden />
            </span>
            <b>Actionable alerts</b>
          </div>
          {insights.actionable_alerts_for_parties.map((a, i) => (
            <div className="alert" key={i}>
              <span className="ic">
                <AlarmClock aria-hidden />
              </span>
              <div className="m">
                <b>{a.action_required}</b>
                <span className="due">
                  {a.deadline}
                  {a.responsible_party ? ` · ${a.responsible_party}` : ""}
                </span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Litigant context */}
      {dlc && (
        <Card pad>
          <SectionHead icon={Sparkles} title="Litigant context" />
          {narrative?.story_behind_the_case && (
            <>
              <Subhead>Story behind the case</Subhead>
              <Prose>{narrative.story_behind_the_case}</Prose>
            </>
          )}
          {(narrative?.what_each_side_wants_simplified?.petitioner_side_goal_simplified ||
            narrative?.what_each_side_wants_simplified?.respondent_side_goal_simplified) && (
            <>
              <Subhead>What each side wants</Subhead>
              <Kv>
                <KvRow k="Petitioner's Goal" v={narrative.what_each_side_wants_simplified.petitioner_side_goal_simplified} />
                <KvRow k="Respondent's Goal" v={narrative.what_each_side_wants_simplified.respondent_side_goal_simplified} />
              </Kv>
            </>
          )}
          {narrative?.key_events_leading_to_court_simplified?.length > 0 && (
            <>
              <Subhead>Key events leading to court</Subhead>
              <ProseList items={narrative.key_events_leading_to_court_simplified} />
            </>
          )}
          {(impact?.type_of_stress_or_burden_implied_for_parties?.length > 0 || impact?.litigation_duration_impact_note) && (
            <>
              <Subhead>Impact on litigants</Subhead>
              <Kv>
                {impact.type_of_stress_or_burden_implied_for_parties?.length > 0 && (
                  <KvRow k="Stress / Burden" v={impact.type_of_stress_or_burden_implied_for_parties.join(", ")} />
                )}
                <KvRow k="Duration Impact" v={impact.litigation_duration_impact_note} />
              </Kv>
            </>
          )}
        </Card>
      )}
    </>
  );
}
