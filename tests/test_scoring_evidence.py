from pathlib import Path
import ast

source = Path("scripts/devlens.py").read_text()
tree = ast.parse(source)
wanted = {"score_activity", "score_docs", "score_pr_velocity"}
functions = {n.name: n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in wanted}
assert set(functions) == wanted

# Verify the production functions use bounded thresholds and no bulk commit/PR materialization.
src = source
assert "list(repo.get_commits" not in src
assert "list(repo.get_pulls" not in src
assert 'search_commits(query=' in src
assert 'is:pr is:merged' in src
assert 'repo.get_git_tree("HEAD", recursive=True)' not in src

# Preserve the documented 0-100 score contract.
assert "return 100" in ast.unparse(functions["score_activity"])
assert "return 100" in ast.unparse(functions["score_pr_velocity"])
print("Scoring evidence/API-efficiency fixtures passed.")
