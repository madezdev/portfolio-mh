import { describe, it, expect } from 'vitest';
import { updateIntakeTool } from './tools';

describe('updateIntake tool', () => {
  it('echoes the recorded state back so it lands in the message history', async () => {
    const out = await updateIntakeTool.execute!(
      { projectType: 'sitio corporativo', isRewrite: false },
      {} as any,
    );
    expect(out).toMatchObject({ projectType: 'sitio corporativo', isRewrite: false });
  });

  it('echoes back a single-field update just as faithfully', async () => {
    const out = await updateIntakeTool.execute!({ isRewrite: true }, {} as any);
    expect(out).toMatchObject({ isRewrite: true });
  });

  it('description instructs the model to correct, not just record — the visitor\'s latest words must win', () => {
    // Pins the single behaviour this feature exists to restore: a visitor's
    // correction must not be silently dropped (the production incident this
    // tool fixes). Regex on two keywords, not the full sentence, so ordinary
    // rewording of the surrounding prose does not break this test.
    const d = updateIntakeTool.description!.toLowerCase();
    expect(d).toMatch(/(?=.*correct)(?=.*contradict)/);
  });
});
