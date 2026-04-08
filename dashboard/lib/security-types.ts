// DevLens Mega Security Scanner — TypeScript Types
// Auto-imported by app/api/security/route.ts and app/security/page.tsx

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'UNKNOWN';
export type Grade    = 'A' | 'B' | 'C' | 'D' | 'F';

export interface SeverityCounts {
  CRITICAL?: number;
  HIGH?:     number;
  MEDIUM?:   number;
  LOW?:      number;
  INFO?:     number;
  UNKNOWN?:  number;
}

export interface DependabotFinding {
  id:        string;
  cve:       string;
  package:   string;
  ecosystem: string;
  severity:  Severity;
  summary:   string;
  fixed_in:  string;
  url:       string;
}

export interface SecretFinding {
  type:       string;
  state:      string;
  created_at: string;
  url:        string;
}

export interface CodeScanFinding {
  rule:        string;
  description: string;
  severity:    Severity;
  tool:        string;
  file:        string;
  line:        number | string;
  url:         string;
}

export interface OsvFinding {
  id:        string;
  package:   string;
  version:   string;
  ecosystem: string;
  severity:  Severity;
  summary:   string;
  url:       string;
}

export interface TrufflehogFinding {
  detector: string;
  verified: boolean;
  file:     string;
  commit:   string;
  severity: Severity;
}

export interface SemgrepFinding {
  rule:     string;
  message:  string;
  severity: Severity;
  file:     string;
  line:     number | string;
}

export interface NucleiFinding {
  template:    string;
  name:        string;
  severity:    Severity;
  url:         string;
  description: string;
}

export interface TrivyFinding {
  id:                string;
  package:           string;
  installed_version: string;
  fixed_version:     string;
  severity:          Severity;
  title:             string;
  url:               string;
  target:            string;
}

export interface DependabotModule {
  enabled:  boolean;
  findings: DependabotFinding[];
  counts:   SeverityCounts;
  total:    number;
  error?:   string;
}

export interface SecretsModule {
  enabled:  boolean;
  findings: SecretFinding[];
  total:    number;
  error?:   string;
}

export interface CodeScanModule {
  enabled:  boolean;
  tools:    string[];
  findings: CodeScanFinding[];
  counts:   SeverityCounts;
  total:    number;
  error?:   string;
}

export interface OsvModule {
  packages_checked: number;
  findings:         OsvFinding[];
  counts:           SeverityCounts;
  total:            number;
}

export interface CliModule<T> {
  available: boolean;
  message?:  string;
  findings:  T[];
  counts?:   SeverityCounts;
  total?:    number;
}

export interface LicenseModule {
  found: boolean;
  spdx:  string | null;
  risk:  'low' | 'medium' | 'high' | 'unknown';
  url?:  string;
}

export interface ScoreDeduction {
  points: number;
  reason: string;
}

export interface ScoringResult {
  score:       number;
  grade:       Grade;
  deductions:  ScoreDeduction[];
  max_score:   number;
}

export interface TotalCounts {
  CRITICAL: number;
  HIGH:     number;
  MEDIUM:   number;
  LOW:      number;
  TOTAL:    number;
  SECRETS:  number;
}

export interface MegaScanMeta {
  owner:       string;
  repo:        string;
  target_url:  string | null;
  scanned_at:  string;
  modules:     string[];
}

export interface MegaScanReport {
  meta:            MegaScanMeta;
  dependabot?:     DependabotModule;
  secrets_github?: SecretsModule;
  code_scanning?:  CodeScanModule;
  osv?:            OsvModule;
  trufflehog?:     CliModule<TrufflehogFinding>;
  semgrep?:        CliModule<SemgrepFinding>;
  nuclei?:         CliModule<NucleiFinding> & { target?: string };
  trivy?:          CliModule<TrivyFinding>;
  license?:        LicenseModule;
  has_security_md: boolean;
  totals:          TotalCounts;
  scoring:         ScoringResult;
}
