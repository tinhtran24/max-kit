# mk-dogfood evals

- `evals.json`: consumer cases for `eval_skill.py` from `mk-skill-creator`.
- `routing-cases.json`: positives and adjacent negatives; route each prompt with the
  runtime (or `semantic_routing_eval.py` from `mk-skill-creator`) and count a positive
  only when `mk-dogfood` is selected, a negative only when it is not.
- `fixtures/<case>/`: a synthetic Claude Code transcript (`session.jsonl`) and the
  user-authored skill it used.

Fixture skill files are stored as `SKILL.fixture.md` so catalog generators and
runtimes do not discover them as installed skills. Copy a case folder to a scratch
work directory and rename each `SKILL.fixture.md` to `SKILL.md` before running a
consumer; give the consumer the transcript path in place of `--session latest`.
The env-fault fixture prints a fake token on purpose; a passing report never
repeats it.
