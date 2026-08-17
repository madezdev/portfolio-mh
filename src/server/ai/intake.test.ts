import { describe, it, expect } from 'vitest';
import { intakeInstructions, INTAKE_MODEL, MAX_INPUT_MESSAGES } from './intake';

describe('intake config', () => {
  it('uses a gateway model string and a sane turn cap', () => {
    // `provider/model` is the Gateway's routing format — a bare model id resolves to
    // no provider. The provider itself is free to change (it did, when the account's
    // free tier turned out not to reach Claude Haiku), so pin the shape, not the name.
    expect(INTAKE_MODEL).toMatch(/^[a-z0-9-]+\/[a-z0-9.\-]+$/);
    expect(MAX_INPUT_MESSAGES).toBeGreaterThan(0);
  });
  it('scopes the assistant: madezdev intake, no pricing, reply in user language', () => {
    const p = intakeInstructions().toLowerCase();
    expect(p).toContain('madezdev');
    expect(p).toContain('price'); // must instruct NOT to commit prices
    expect(p).toContain('language'); // must instruct to reply in the user's language
  });

  it('asks whether the visitor has a budget assigned before inviting contact', () => {
    // The prompt used to carry a single rule — "do NOT quote, estimate, or commit to
    // any price, cost, or budget number" — which conflated two opposite things:
    // GIVING a price (forbidden) and ASKING about theirs (required intake data).
    // The model read `budget` inside a prohibition and dropped the subject entirely.
    const p = intakeInstructions().toLowerCase();
    expect(p).toContain('budget');
    // The three states it must offer. No amounts: this studio qualifies on whether
    // the money exists, not on how much, which is also why the no-quoting rule below
    // can survive untouched.
    expect(p).toContain('assigned');
    expect(p).toContain('still being defined');
    expect(p).toContain('exploring');
    // Asked before the close, not after — a lead that leaves at the capture form
    // should already have been asked.
    expect(p).toMatch(/before .*(invit|contact)/);
  });

  it('still forbids the assistant from quoting a price of its own', () => {
    // Guards the other side of the split: someone re-tightening the pricing rule
    // must not switch the budget question back off.
    const p = intakeInstructions().toLowerCase();
    expect(p).toMatch(/never (quote|give)/);
  });

  it('does not let a dodged budget question block the conversation', () => {
    const p = intakeInstructions().toLowerCase();
    expect(p).toMatch(/once more|one more time/);
    expect(p).toMatch(/move on/);
  });

  it('treats the opening message as a hypothesis, not a fact', () => {
    const p = intakeInstructions().toLowerCase();
    // The visitor clicked "Rehacer mi web", said "quiero hacer una web" one turn
    // later, and the summary still said "rehacer". The chip is not their words.
    expect(p).toMatch(/suggestion chip|canned|starter/);
    expect(p).toContain('hypothesis');
  });

  it('requires recording and correcting state through the tool', () => {
    const p = intakeInstructions();
    expect(p).toContain('updateIntake');
    expect(p.toLowerCase()).toMatch(/latest words|most recent words/);
  });

  it('forbids closing the lead before the required fields exist', () => {
    const p = intakeInstructions();
    expect(p).toContain('submitLead');
    // Isolate the actual gating sentence rather than matching across the whole
    // joined prompt — a prompt-wide match (previously using the `s` flag) would
    // still pass even if the gate itself dropped the budget requirement, because
    // "budget" and "name"/"email" both appear elsewhere in the document.
    // `some`, not `find`: more than one paragraph legitimately mentions the tool
    // now, and picking the first would test whichever happens to come earlier.
    // Each candidate is still judged ALONE, which is what keeps a stray "budget"
    // elsewhere in the prompt from rescuing the match.
    const candidates = p.split('\n\n').filter((para) => para.includes('submitLead'));
    expect(candidates.length).toBeGreaterThan(0);
    const gated = candidates.some((para) =>
      /only.*(name|email).*budget|budget.*name.*email/.test(para.toLowerCase()),
    );
    expect(gated, 'no paragraph carries the name+email+budget gate').toBe(true);
  });

  it('forbids recording anything the visitor did not actually say', () => {
    // Live run against the preview: the visitor wrote seven words, and the model
    // called updateIntake with audience, stage, timeline AND budget filled in —
    // none of which they had mentioned. Giving the model a schema of optional
    // fields invites it to complete the set. Invented values then travel into the
    // summary and the lead email as if the visitor had stated them.
    const p = intakeInstructions().toLowerCase();
    expect(p).toMatch(/only.*(actually (said|told)|their own words)/);
    expect(p).toMatch(/leave it (out|absent|unset)|do not guess|never infer/);
  });

  it('will not record isRewrite until the visitor says which it is', () => {
    // Same run: the visitor said "quiero HACER una web" and the model recorded
    // isRewrite: true, then answered "deseas REHACER una web" — the exact
    // production defect this branch exists to fix, reproduced.
    const p = intakeInstructions();
    const rule = p.split('\n\n').find((para) => para.includes('isRewrite'));
    expect(rule, 'no paragraph mentions isRewrite').toBeDefined();
    expect(rule!.toLowerCase()).toMatch(/chip|tapped|clicked/);
    expect(rule!.toLowerCase()).toMatch(/explicit|in their own words|says so/);
  });

  it('does not recite the three budget states as one compound question', () => {
    // Live run: the assistant asked "¿asignado, o todavía definiéndolo o
    // explorando?" and the visitor answered "no", which fits none of the three.
    // It was obeying this prompt — the ONE-question rule forbade compound asks,
    // then the budget rule spelled out a three-branch question a few paragraphs
    // later. The model followed the more specific instruction.
    const p = intakeInstructions();
    const ask = p.split('\n\n').find((para) => /Budget is required/.test(para));
    expect(ask, 'no paragraph opens the budget ask').toBeDefined();
    expect(ask!.toLowerCase()).not.toMatch(/exploring/);
    expect(ask!.toLowerCase()).toMatch(/one question|single question|yes.*no|binary/);
  });

  it('reserves declined for a refusal, not for having no budget', () => {
    // Same run: the visitor said "no" to having a budget assigned and the model
    // recorded `declined`, which means "asked twice and would not answer". The
    // studio would read "Prefiero no decirlo" for someone who answered honestly.
    const p = intakeInstructions();
    const rule = p.split('\n\n').find((para) => para.includes('declined'));
    expect(rule, 'no paragraph mentions declined').toBeDefined();
    expect(rule!.toLowerCase()).toMatch(/refus|will not say|prefer not/);
    expect(rule!.toLowerCase()).toMatch(/not the same as|never.*(mean|record).*no\b|"no" is not/);
    // The prompt must not send the model at a tool that will reject it:
    // updateIntake's schema no longer accepts `declined`, so instructing it to
    // record one there would spend a step on a guaranteed validation failure.
    expect(rule!).toMatch(/submitLead/);
    expect(rule!.toLowerCase()).toMatch(/does not accept|cannot accept|leave budget unset/);
  });

  it('asks one thing per turn with concrete alternatives', () => {
    const p = intakeInstructions().toLowerCase();
    expect(p).toMatch(/one question|a single question/);
    expect(p).toMatch(/yes\/no/);
  });

  it('gives something back rather than only extracting', () => {
    // Both halves must live in the SAME paragraph — a model reading "add one
    // concrete observation" several paragraphs away from "never promise a
    // timeline" is much likelier to let the value-add turn into a commitment.
    const paragraphs = intakeInstructions().split('\n\n');
    const give = paragraphs.find((para) => /observation|give.*back|in return/i.test(para));
    expect(give).toBeDefined();
    expect(give!.toLowerCase()).toMatch(/never promise|no commitment|not a commitment/);
  });

  it('keeps the assistant scoped to madezdev topics and declines off-topic requests', () => {
    // /api/chat is public and unauthenticated. This rule is the only thing
    // stopping it from being used as a free general-purpose LLM — the rate
    // limiter caps HOW FAST it can be called, not WHAT FOR. It was previously
    // unpinned, which is exactly why an earlier edit could drop it silently.
    const p = intakeInstructions().toLowerCase();
    expect(p).toMatch(/off-topic/);
    expect(p).toMatch(/decline/);
    expect(p).toMatch(/steer.*back/);
  });
});
