export type MatchStatus = "scheduled" | "finished";

export type Match = {
  id: string;
  stage: string;
  home_team: string;
  away_team: string;
  kickoff_at: string; // ISO UTC
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  graded_at: string | null;
  created_at: string;
};

export type Prediction = {
  id: string;
  match_id: string;
  user_id: string;
  home_pred: number;
  away_pred: number;
  is_correct: boolean | null;
  points: number | null; // tiered: 3 exact, 1 correct result, 0 wrong; null until graded
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
};

export type LeaderboardRow = {
  user_id: string;
  display_name: string;
  points: number;
  graded_predictions: number;
  goal_diff_score: number;
};

// A match joined with the current user's own prediction (if any).
export type MatchWithPrediction = Match & {
  prediction: Prediction | null;
};

// Public results board row (anon-readable view). Finished matches only.
export type PublicResult = {
  match_id: string;
  stage: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  home_score: number;
  away_score: number;
  graded_at: string | null;
  winners_count: number;
  winner_names: string[];
};

// One member's pick for a match (admin breakdown). Picks may be null when a
// member made no prediction for that match (left join).
export type AdminBreakdownRow = {
  match_id: string;
  stage: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  display_name: string | null;
  email: string | null;
  home_pred: number | null;
  away_pred: number | null;
  is_correct: boolean | null;
  predicted_at: string | null;
};
