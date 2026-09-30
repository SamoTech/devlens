import ast
from pathlib import Path

source = Path("scripts/devlens.py").read_text()
tree = ast.parse(source)
fn = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "score_issue_response")
module = ast.Module(body=[fn], type_ignores=[])
namespace = {}
exec(compile(module, "scripts/devlens.py", "exec"), namespace)

score = namespace["score_issue_response"]
cases = [
    ((0, 0), 100),
    ((0, 10), 100),
    ((10, 0), 0),
    ((5, 5), 50),
    ((1, 9), 90),
]
for args, expected in cases:
    actual = score(*args)
    assert actual == expected, (args, actual, expected)

for args in [(-1, 0), (0, -1)]:
    try:
        score(*args)
    except ValueError:
        pass
    else:
        raise AssertionError(f"negative counts accepted: {args}")

print("Issue-response scoring fixtures passed.")
