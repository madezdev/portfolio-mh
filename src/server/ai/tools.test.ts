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

  it('has no side effect — it only records', async () => {
    const out = await updateIntakeTool.execute!({ isRewrite: true }, {} as any);
    expect(out).toMatchObject({ isRewrite: true });
  });
});
