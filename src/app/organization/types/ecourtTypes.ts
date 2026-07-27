export interface CourtDataApiResponse {
  data: CourtDataPayload;
  errors: string[];
  meta: { lastUpdated: string; isSaved?: string };
}

export interface CourtDataPayload {
  courtCaseData: CourtCaseData;
  entityInfo: EntityInfo;
  files: EcourtFile[];
  descriptions: EnumDescriptions;
  caseAiAnalysis: unknown | null;
}

export interface CourtCaseData {
  caseNumber: string;
  district: string | null;
  state: string;
  stateCode: string;
  districtCode: string;
  courtCode: number;
  courtName: string;
  courtNo: number;
  firDetails: Record<string, unknown>;
  caseType: string;
  caseTypeRaw: string;
  caseStatus: string;
  filingNumber: string;
  filingDate: string;
  registrationNumber: string;
  registrationDate: string;
  firstHearingDate: string | null;
  nextHearingDate: string | null;
  lastHearingDate: string | null;
  decisionDate: string | null;
  caseDurationDays: number;
  filingToFirstHearingDays: number;
  cnr: string;
  cnrCourtCode: string;
  courtComplexCode: string;
  cnrCaseNumber: string;
  cnrYear: string;
  purpose: string;
  disposalType: string;
  disposalTypeRaw: string;
  contestedStatus: string | null;
  judicialSection: string | null;
  judicialSectionRaw: string | null;
  judges: string[];
  petitioners: string[];
  petitionerAdvocates: string[];
  respondents: string[];
  respondentAdvocates: string[];
  hasOrders: boolean;
  hasJudgments: boolean;
  orderCount: number;
  interimOrderCount: number;
  judgmentCount: number;
  hearingCount: number;
  iaCount: number;
  historyOfCaseHearings: HearingHistory[];
  filedDocuments: FiledDocument[];
  subordinateCourt: Record<string, unknown>;
  linkCases: unknown[];
  interimOrders: InterimOrder[];
  processes: unknown[];
  interlocutoryApplications: InterlocutoryApplication[];
  judgmentOrders: JudgmentOrder[];
  taggedMatters: unknown[];
  earlierCourtDetails: unknown[];
  notices: unknown[];
  caveatDetails: unknown[];
  listingDates: unknown[];
}

export interface EntityInfo {
  cnr: string;
  nextDateOfHearing: string | null;
  lastDateOfHearing: string | null;
  dateCreated: string;
  dateModified: string;
}

export interface FiledDocument {
  srNo: string;
  documentNo: string;
  dateOfReceiving: string;
  filedBy: string;
  documentFiled: string;
  advocateName?: string;
}

export interface HearingHistory {
  judge: string;
  businessOnDate: string;
  hearingDate: string | null;
  purposeOfListing: string;
}

export interface InterimOrder {
  orderDate: string;
  description: string;
  orderUrl: string;
}

export interface JudgmentOrder {
  orderDate: string;
  orderType: string;
  orderUrl: string;
}

export interface InterlocutoryApplication {
  regNo: string;
  remark: string;
  filedBy: string;
  filingDate: string;
  status: string;
}

export interface EcourtFile {
  pdfFile: string;
  markdownFile: string;
  markdownContent: string;
  aiAnalysis: AiAnalysis | null;
}

export interface EnumDescriptions {
  enumFields: string[];
  enumLookup: {
    caseType: Record<string, string>;
    caseStatus: Record<string, string>;
    courtCode: Record<string, string>;
    judicialSection: Record<string, string>;
    caseCategory: Record<string, string>;
    benchType: Record<string, string>;
    stateCode: Record<string, string>;
  };
}

// ── AI Analysis ───────────────────────────────────────────────────────────────

export interface AiAnalysis {
  foundational_metadata: FoundationalMetadata;
  search_and_user_friendly_teaser: SearchAndUserFriendlyTeaser;
  deep_litigant_substance_context: DeepLitigantSubstanceContext;
  deep_legal_substance_context: DeepLegalSubstanceContext;
  intelligent_insights_analytics: IntelligentInsightsAnalytics;
  actionable_outputs_user_tools: ActionableOutputsUserTools;
  quality_review_metadata: QualityReviewMetadata;
}

export interface FoundationalMetadata {
  core_case_identifiers: {
    case_number_primary: string;
    case_numbers_secondary: string[];
    case_type: string;
    case_sub_type: string;
    court_name: string;
    court_type: string;
    bench_composition: string;
    judge_names: string[];
    judge_designations: string[];
    order_date: string;
    hearing_dates_mentioned: string[];
    next_hearing_date_specified: string | null;
    filing_year: number;
  };
  party_information: {
    petitioners_appellants_complainants: Array<{
      name: string;
      type: string;
      role_exact: string;
      is_ors_indicated: boolean;
    }>;
    respondents_accused_defendants: Array<{
      name: string;
      type: string;
      role_exact: string;
      is_ors_indicated: boolean;
    }>;
    other_parties_mentioned: unknown[];
  };
  legal_representation: {
    counsel_for_petitioner_side: Array<{
      name: string;
      role: string;
      status_in_order: string;
    }>;
    counsel_for_respondent_side: Array<{
      name: string;
      role: string;
      status_in_order: string;
    }>;
    advocate_on_record_details: unknown[];
  };
  procedural_details_from_order: {
    order_nature: string;
    disposition_status_indicated: string;
    disposition_outcome_if_disposed: string | null;
    service_of_notice_details_mentioned: unknown[];
    costs_awarded_details: {
      amount: string | null;
      to_whom: string | null;
      by_whom: string | null;
    };
    specific_directions_given_by_court: string[];
  };
  originating_and_connected_case_info: {
    impugned_order_details: unknown | null;
    document_citation_official_for_this_order: unknown | null;
  };
}

export interface SearchAndUserFriendlyTeaser {
  teaser_content: {
    short_summary_enticing: string;
    auto_generated_long_tail_keywords: string[];
  };
}

export interface DeepLitigantSubstanceContext {
  narrative_of_the_dispute_plain_language: {
    story_behind_the_case: string;
    what_each_side_wants_simplified: {
      petitioner_side_goal_simplified: string;
      respondent_side_goal_simplified: string;
    };
    key_events_leading_to_court_simplified: string[];
  };
  potential_impact_on_litigants_involved_inferred: {
    type_of_stress_or_burden_implied_for_parties: string[];
    litigation_duration_impact_note: string;
  };
  human_interest_elements_observed_objectively: {
    dispute_involves_family_or_close_relations: boolean;
    vulnerable_parties_explicitly_mentioned_or_implied_by_role: boolean;
    significant_public_interest_element_for_citizens_at_large: boolean;
  };
}

export interface DeepLegalSubstanceContext {
  core_legal_content_analysis: {
    primary_legal_issues_identified: string[];
    secondary_legal_issues_identified: string[];
    questions_of_law_explicitly_framed_or_answered: string[];
    statutes_cited_and_applied: Array<{
      act_name: string;
      section_article_rule: string;
      interpretation_focus_or_application: string;
    }>;
    rules_regulations_ordinances_cited: unknown[];
    case_law_cited_and_analysed: Array<{
      full_citation_as_in_text: string;
      case_name_as_in_text: string;
      year_as_in_text: string;
      court_as_in_text: string;
      judges_as_in_text: string | null;
      key_principle_used_from_citation: string;
      treatment_by_court: string;
    }>;
    foreign_jurisprudence_cited_details: unknown[];
    law_commission_committee_reports_cited_details: unknown[];
  };
  arguments_and_reasoning_analysis: {
    summary_of_arguments_petitioner_side: string;
    summary_of_arguments_respondent_side: string;
    court_reasoning_for_decision: string;
    ratio_decidendi_extracted: { statement: string; confidence_score: number };
    obiter_dicta_significant_remarks: { statement: string; confidence_score: number };
    statutory_interpretation_method_applied: string[];
    judicial_philosophy_indicators_observed: string[];
  };
  factual_matrix_from_order: {
    brief_facts_summary_ai_generated: string;
    chronological_events_timeline_from_facts: Array<{
      date_or_period: string;
      event_description: string;
    }>;
    key_factual_findings_by_this_court: Array<{
      finding: string;
      source_of_finding: string;
      confidence_score: number;
    }>;
  };
  order_significance_and_impact_assessment: {
    auto_generated_legal_tags: string[];
    precedential_value_assessment: {
      assessment: string;
      justification: string;
      precedence_value_score: number;
    };
    potential_impact_score_on_law_area: number;
    practice_points_for_legal_professionals: string[];
  };
}

export interface IntelligentInsightsAnalytics {
  order_significance_and_impact_assessment: {
    ai_generated_executive_summary: string;
    plain_language_summary_for_litigants_outcome_focused: string;
    actionable_alerts_for_parties: Array<{
      action_required: string;
      deadline: string;
      responsible_party: string;
    }>;
    compliance_directives_or_risks_for_parties: string[];
    implications_for_litigants_in_similar_situations: string[];
    potential_policy_implications_identified: string;
    economic_implications_assessment: string;
    adr_suitability_inferred: string;
  };
}

export interface ActionableOutputsUserTools {
  research_and_visualization_support_data: {
    cited_cases_network_data_outgoing: Array<{
      target_citation_as_in_text: string;
      strength_of_reliance_inferred: string;
    }>;
    potential_similar_cases_indicators: {
      key_issues_for_similarity_search: string[];
      key_statutes_for_similarity_search: string[];
    };
    topic_modeling_cluster_suggestions: string[];
  };
}

export interface QualityReviewMetadata {
  ocr_accuracy_estimate_if_applicable: number;
  overall_extraction_confidence: string;
  ambiguity_or_missing_data_flags: unknown[];
}

// ── Persisted eCourts cases list (dashboard) ──────────────────────────────────

export interface LinkedCaseDetail {
  id: string;
  title: string;
  caseNumber: string;
  cnrNumber: string;
  siteId: string;
  status: string;
  createdDate: string;
}

export interface PersistedEcourtCase {
  cnrNumber: string;
  caseTitle: string;
  courtName: string;
  caseStatus: string;
  linkedCaseDetails: LinkedCaseDetail[];
  referenceCaseCount: number;
  referencedCases: LinkedCaseDetail[];
  remarks: string | null;
  lastRefreshed: string | null;
  canDelete: boolean;
}

export interface PersistedEcourtCasesResponse {
  items: PersistedEcourtCase[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface UnlinkedCase {
  id: string;
  title: string;
  caseNumber: string;
  cnrNumber: string | null;
  description: string;
  siteId: string;
  status: string;
  createdDate: string;
  modifiedDate: string;
}

export interface SearchHistoryItem {
  id: string;
  cnrNumber: string;
  searchedByName: string;
  searchType: string;
  searchedAt: string;
  caseTitle: string | null;
  courtName: string | null;
}

export interface SearchHistoryResponse {
  data: SearchHistoryItem[];
  errors: string[];
  meta: Record<string, unknown>;
}

// US4 filter interfaces for eCourts in-scope lists.
// Source of truth: specs/035-pagination-sorting-filtering/contracts/backend-integration-guide.md §6 Category A.

/** Filters for GET {orgId}/courtdata/persisted */
export interface PersistedEcourtListFilters {
  cnr?: string;
  title?: string;
  linkedCaseId?: string;
  [key: string]: string | undefined;
}

/** Filters for GET {orgId}/ecourts/search (proxy order — UI exposes these as search params) */
export interface EcourtSearchListFilters {
  caseType?: string;
  caseStatus?: string;
  stateCode?: string;
  districtCode?: string;
  filingYear?: string;
  [key: string]: string | undefined;
}
