import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

type MethodPolicy = {
  file: string;
  methodLine: number;
  signature: string;
  decorators: string;
};

function walkControllers(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkControllers(fullPath, files);
      continue;
    }
    if (fullPath.endsWith('.controller.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function findViolations(file: string): MethodPolicy[] {
  const source = readFileSync(file, 'utf8');
  const violations: MethodPolicy[] = [];
  const methodRegex =
    /((?:^[ \t]*@[^\n]+\n)+)[ \t]*(?:public|private|protected)?[ \t]*(?:async[ \t]+)?([A-Za-z_][A-Za-z0-9_]*)[ \t]*\([^)]*\)[ \t]*(?::[^{\n]+)?\{/gm;

  let match: RegExpExecArray | null;
  while ((match = methodRegex.exec(source)) !== null) {
    const decorators = match[1];
    const signature = match[2];
    const hasOptional = decorators.includes('OptionalClerkAuthGuard');
    const hasClerk = decorators.includes('ClerkAuthGuard');
    const hasPermission = decorators.includes('@Permission(');
    if (!hasOptional && hasClerk && !hasPermission) {
      const methodIndex = match.index + decorators.length;
      const methodLine = source.slice(0, methodIndex).split(/\r?\n/).length;
      violations.push({
        file,
        methodLine,
        signature,
        decorators,
      });
    }
  }

  return violations;
}

describe('Authorization Policy', () => {
  it('requires @Permission on every endpoint using ClerkAuthGuard', () => {
    const root = join(process.cwd(), 'apps/api-gateway/src/app/module');
    const controllers = walkControllers(root);
    const violations = controllers.flatMap((file) => findViolations(file));

    const details = violations
      .map(
        (v) =>
          `${v.file}:${v.methodLine} method=${v.signature} decorators=${v.decorators.replace(/\s+/g, ' ').trim()}`
      )
      .join('\n');

    expect(details).toBe('');
  });
});

