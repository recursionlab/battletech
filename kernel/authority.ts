/**
 * Kernel Write Authority - Enforces I1: Write-through only
 *
 * Only kernel may mutate XiGraph via private token
 */

class _WriteToken {
  private readonly _brand = 'XiKernel_WriteToken';
}

export class KernelAuthority {
  private readonly token = new _WriteToken();

  get _t(): _WriteToken {
    return this.token;
  }
}

export function requireToken(t: unknown): void {
  if (!(t instanceof _WriteToken)) {
    throw new Error("I1 Violation: Write denied - kernel authority required");
  }
}